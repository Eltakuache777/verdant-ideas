import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

import { requireAuth, authErrorResponse } from "@/app/lib/apiAuth";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-06-24.dahlia",
});

export async function POST(req: NextRequest) {
  try {
    await requireAuth(req);

    const { email, name } = await req.json();

    const customer = await stripe.customers.create({
      email,
      name,
    });

    return NextResponse.json({
      customerId: customer.id,
    });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
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
