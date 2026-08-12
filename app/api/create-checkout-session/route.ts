import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

import { adminDb } from "@/app/lib/firebase-admin";
import { requireAuth, AuthError } from "@/app/lib/apiAuth";
import { resolveTrustedOrigin } from "@/app/lib/trustedOrigin";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-06-24.dahlia",
});

export async function POST(req: NextRequest) {
  try {
    const uid = await requireAuth(req);

    const { plan } = await req.json();

    // Never trust a customerId from the client — look up the caller's own
    // Stripe customer record server-side so a request can't attach a
    // checkout session to someone else's billing account.
    const userSnap = await adminDb.collection("users").doc(uid).get();
    const customerId = userSnap.data()?.stripeCustomerId;

    if (!customerId) {
      return NextResponse.json(
        { error: "Billing isn't set up for your account yet." },
        { status: 400 }
      );
    }

    let priceId = "";

    switch (plan) {
      case "pro":
        priceId = process.env.STRIPE_PRO_PRICE_ID!;
        break;

      case "elite":
        priceId = process.env.STRIPE_ELITE_PRICE_ID!;
        break;

      case "daypass":
        priceId = process.env.STRIPE_DAYPASS_PRICE_ID!;
        break;

      default:
        return NextResponse.json(
          { error: "Invalid plan." },
          { status: 400 }
        );
    }

    const origin = resolveTrustedOrigin(req);

    const session = await stripe.checkout.sessions.create({
      mode: plan === "daypass" ? "payment" : "subscription",

      customer: customerId,

      payment_method_types: ["card"],

      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],

      metadata: {
        uid,
        plan,
      },

      success_url: `${origin}/dashboard/billing?success=true`,

      cancel_url: `${origin}/dashboard/billing?canceled=true`,
    });

    return NextResponse.json({
      url: session.url,
    });

  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error(error);

    return NextResponse.json(
      {
        error: "Something went wrong.",
      },
      {
        status: 500,
      }
    );
  }
}
