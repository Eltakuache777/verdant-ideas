import { NextRequest, NextResponse } from "next/server";

import { adminDb } from "@/app/lib/firebase-admin";

export async function GET(req: NextRequest) {
  const orderId = req.nextUrl.searchParams.get("order_id");

  if (!orderId) {
    return NextResponse.json({ error: "Missing order_id." }, { status: 400 });
  }

  const snap = await adminDb.collection("storeOrders").doc(orderId).get();

  if (!snap.exists) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  const order = snap.data()!;

  // "pending_payment" means the Stripe session hasn't completed yet; treat it
  // the same as "creating" (webhook received, still fulfilling) so the client
  // just keeps polling.
  const status = order.status === "pending_payment" ? "pending" : order.status;

  return NextResponse.json({
    status,
    items: order.items || [],
    amountTotal: order.amountTotal,
    customerEmail: order.customerEmail,
    error: order.error || null,
  });
}
