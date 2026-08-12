import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-06-24.dahlia",
});

export async function POST(req: Request) {
  try {
    const { email, name } = await req.json();

    const customer = await stripe.customers.create({
      email,
      name,
    });

    return NextResponse.json({
      customerId: customer.id,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "Failed to create customer",
      },
      {
        status: 500,
      }
    );
  }
}