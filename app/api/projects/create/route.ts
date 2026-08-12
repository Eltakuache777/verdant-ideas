import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/app/lib/firebase-admin";
import { requireAuth, AuthError } from "@/app/lib/apiAuth";
import { randomUUID } from "crypto";

export async function POST(req: NextRequest) {
  try {
    const ownerId = await requireAuth(req);

    const { name, type, description, designImageUrl } = await req.json();

    if (!name) {
      return NextResponse.json(
        { error: "Missing required fields." },
        { status: 400 }
      );
    }

    const projectId = randomUUID();

    await adminDb.collection("projects").doc(projectId).set({
      id: projectId,
      name,
      type: type || "",
      description: description || "",
      ownerId,
      status: "Draft",
      thumbnail: designImageUrl || "",
      designImageUrl: designImageUrl || "",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      projectId,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error(error);

    return NextResponse.json(
      { error: "Unable to create project." },
      { status: 500 }
    );
  }
}