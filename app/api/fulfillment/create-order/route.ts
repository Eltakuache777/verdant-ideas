import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";

import { adminDb } from "@/app/lib/firebase-admin";
import { requireAuth, authErrorResponse } from "@/app/lib/apiAuth";
import { printfulConfigured, createDraftOrder } from "@/app/lib/printful";

export async function POST(req: NextRequest) {
  if (!printfulConfigured()) {
    return NextResponse.json(
      { error: "Manufacturing isn't connected yet. Add PRINTFUL_API_KEY to enable it.", notConfigured: true },
      { status: 501 }
    );
  }

  try {
    const ownerId = await requireAuth(req);

    const {
      projectId,
      variantId,
      productName,
      variantName,
      quantity,
      designImageUrl,
      recipient,
    } = await req.json();

    if (!variantId || !designImageUrl || !recipient?.name || !recipient?.address1) {
      return NextResponse.json({ error: "Missing required order details." }, { status: 400 });
    }

    if (projectId) {
      const projectSnap = await adminDb.collection("projects").doc(projectId).get();
      if (!projectSnap.exists || projectSnap.data()?.ownerId !== ownerId) {
        return NextResponse.json({ error: "Project not found." }, { status: 404 });
      }
    }

    const orderId = randomUUID();
    const orderRef = adminDb.collection("orders").doc(orderId);

    await orderRef.set({
      id: orderId,
      ownerId,
      projectId: projectId || "",
      productName: productName || "",
      variantName: variantName || "",
      variantId,
      quantity: quantity || 1,
      designImageUrl,
      recipient,
      status: "creating",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    try {
      const printfulOrder = await createDraftOrder({
        variantId,
        quantity: quantity || 1,
        designImageUrl,
        recipient,
      });

      await orderRef.update({
        printfulOrderId: printfulOrder.id,
        status: printfulOrder.status || "draft",
        updatedAt: new Date(),
      });

      return NextResponse.json({ success: true, orderId, printfulOrderId: printfulOrder.id });
    } catch (printfulError) {
      await orderRef.update({
        status: "failed",
        error: printfulError instanceof Error ? printfulError.message : "Unknown error",
        updatedAt: new Date(),
      });

      throw printfulError;
    }
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error(error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to create order." },
      { status: 500 }
    );
  }
}
