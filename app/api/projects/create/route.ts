import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/app/lib/firebase-admin";
import { randomUUID } from "crypto";

export async function POST(req: NextRequest) {
  try {
    const { name, type, description, ownerId, designImageUrl } = await req.json();

    if (!name || !ownerId) {
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
    console.error(error);

    return NextResponse.json(
      { error: "Unable to create project." },
      { status: 500 }
    );
  }
}