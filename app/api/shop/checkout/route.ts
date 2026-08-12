import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { randomUUID } from "crypto";

import { adminDb } from "@/app/lib/firebase-admin";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-06-24.dahlia",
});

const MAX_QUANTITY_PER_ITEM = 10;

interface CatalogVariant {
  size: string;
  printfulSyncVariantId: number;
}

interface CatalogProduct {
  productLabel: string;
  color: string;
  price: number;
  variants: CatalogVariant[];
}

interface RequestedItem {
  catalogId: string;
  printfulSyncVariantId: number;
  quantity: number;
}

export async function POST(req: NextRequest) {
  try {
    const { items } = (await req.json()) as { items: RequestedItem[] };

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Your cart is empty." }, { status: 400 });
    }
    if (items.length > 20) {
      return NextResponse.json({ error: "Too many items in one order." }, { status: 400 });
    }

    // Look up every product server-side — never trust price/label from the client,
    // since a tampered request could otherwise buy real merchandise for any price.
    // Merge by variant so a request can't repeat the same line to bypass the
    // per-item quantity cap.
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
    const orderLineItems: {
      catalogId: string;
      printfulSyncVariantId: number;
      quantity: number;
      productLabel: string;
      color: string;
      size: string;
    }[] = [];

    for (const requested of items) {
      if (!requested.catalogId || !requested.printfulSyncVariantId) {
        return NextResponse.json({ error: "Malformed cart item." }, { status: 400 });
      }

      const variantId = Number(requested.printfulSyncVariantId);
      const existing = orderLineItems.find(
        (i) => i.catalogId === requested.catalogId && i.printfulSyncVariantId === variantId
      );

      const requestedQty = Math.max(1, Number(requested.quantity) || 1);
      const qty = Math.min(MAX_QUANTITY_PER_ITEM, (existing?.quantity || 0) + requestedQty);

      if (existing) {
        existing.quantity = qty;
        const line = lineItems[orderLineItems.indexOf(existing)];
        if (line) line.quantity = qty;
        continue;
      }

      const snap = await adminDb.collection("catalogProducts").doc(requested.catalogId).get();
      if (!snap.exists) {
        return NextResponse.json({ error: "One of the items in your cart no longer exists." }, { status: 404 });
      }

      const product = snap.data() as CatalogProduct;
      const variant = product.variants.find((v) => v.printfulSyncVariantId === variantId);

      if (!variant) {
        return NextResponse.json({ error: "One of the items in your cart isn't available." }, { status: 400 });
      }

      lineItems.push({
        price_data: {
          currency: "usd",
          product_data: {
            name: `${product.productLabel} — ${product.color}${variant.size ? ` / ${variant.size}` : ""}`,
          },
          unit_amount: Math.round(product.price * 100),
        },
        quantity: qty,
      });

      orderLineItems.push({
        catalogId: requested.catalogId,
        printfulSyncVariantId: variantId,
        quantity: qty,
        productLabel: product.productLabel,
        color: product.color,
        size: variant.size || "",
      });
    }

    // Snapshot the resolved order BEFORE creating the Stripe session. Stripe
    // metadata values are capped at 500 characters, which a serialized cart
    // can easily exceed — so we pass a short orderId instead and let the
    // webhook read the already-validated snapshot back out of Firestore.
    const orderId = randomUUID();
    const orderRef = adminDb.collection("storeOrders").doc(orderId);

    await orderRef.set({
      id: orderId,
      items: orderLineItems,
      status: "pending_payment",
      createdAt: new Date(),
    });

    const origin =
      req.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",

      payment_method_types: ["card"],

      shipping_address_collection: {
        allowed_countries: ["US"],
      },

      line_items: lineItems,

      metadata: { orderId },

      success_url: `${origin}/shop/success?order_id=${orderId}`,
      cancel_url: `${origin}/shop/cart`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Unable to start checkout." }, { status: 500 });
  }
}
