import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-06-24.dahlia",
});

export async function POST(req: NextRequest) {
  try {
    const { plan, customerId, uid } = await req.json();

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

      success_url:
        "http://localhost:3000/dashboard/billing?success=true",

      cancel_url:
        "http://localhost:3000/dashboard/billing?canceled=true",
    });

    return NextResponse.json({
      url: session.url,
    });

  } catch (error) {
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