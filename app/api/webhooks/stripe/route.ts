import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { adminDb } from "../../../lib/firebase-admin";
import { createStoreOrder } from "../../../lib/printful";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-06-24.dahlia",
});

interface OrderLineItem {
  catalogId: string;
  printfulSyncVariantId: number;
  quantity: number;
  productLabel: string;
  color: string;
  size: string;
}

export async function POST(req: NextRequest) {
  const body = await req.text();

  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing signature" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error(err);

    return NextResponse.json(
      { error: "Webhook Error" },
      { status: 400 }
    );
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;

      const uid = session.metadata?.uid;
      const plan = session.metadata?.plan;
      const orderId = session.metadata?.orderId;

      if (uid && plan) {
        await adminDb.collection("users").doc(uid).update({
          plan,
        });

        console.log(`✅ Updated ${uid} to ${plan}`);
      } else if (orderId) {
        const orderRef = adminDb.collection("storeOrders").doc(orderId);
        const orderSnap = await orderRef.get();

        if (!orderSnap.exists) {
          console.error(`Webhook received for unknown orderId ${orderId} (session ${session.id})`);
          break;
        }

        const order = orderSnap.data()!;

        // Stripe retries this event on timeout/non-2xx. If a Printful order was
        // already placed for this orderId, don't place a second one.
        if (order.printfulOrderId) {
          console.log(`Order ${orderId} already fulfilled (Printful order ${order.printfulOrderId}) — skipping.`);
          break;
        }

        const orderLineItems = (order.items || []) as OrderLineItem[];

        const shipping = session.collected_information?.shipping_details;
        const address = shipping?.address || session.customer_details?.address;

        await orderRef.update({
          amountTotal: session.amount_total,
          customerEmail: session.customer_details?.email || "",
          stripeSessionId: session.id,
          status: "creating",
          updatedAt: new Date(),
        });

        let printfulOrder;
        try {
          if (!address?.line1 || !shipping?.name) {
            throw new Error("Stripe session had no shipping address.");
          }

          printfulOrder = await createStoreOrder({
            items: orderLineItems.map((i) => ({
              syncVariantId: i.printfulSyncVariantId,
              quantity: i.quantity,
            })),
            confirm: true,
            recipient: {
              name: shipping.name,
              address1: address.line1,
              city: address.city || "",
              state_code: address.state || "",
              country_code: address.country || "US",
              zip: address.postal_code || "",
            },
          });
        } catch (fulfillError) {
          await orderRef.update({
            status: "failed",
            error: fulfillError instanceof Error ? fulfillError.message : "Unknown error",
            updatedAt: new Date(),
          });

          console.error("Fulfillment failed for session", session.id, fulfillError);
          break;
        }

        // The real Printful order now exists — record that fact separately
        // from this status write, so a hiccup here can never make a
        // successfully-placed order look "failed".
        try {
          await orderRef.update({
            printfulOrderId: printfulOrder.id,
            status: printfulOrder.status || "fulfilling",
            updatedAt: new Date(),
          });

          console.log(`✅ Created Printful order ${printfulOrder.id} for Stripe session ${session.id}`);
        } catch (recordError) {
          console.error(
            `Order ${orderId} / Printful order ${printfulOrder.id} was placed successfully but failed to record in Firestore`,
            recordError
          );
        }
      }

      break;
    }

    default:
      console.log(`Unhandled event: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}
