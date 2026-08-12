import { NextRequest, NextResponse } from "next/server";

import { cloudinaryConfigured, uploadToCloudinary } from "@/app/lib/cloudinary";
import { requireAuth, AuthError } from "@/app/lib/apiAuth";

export async function POST(req: NextRequest) {
  if (!cloudinaryConfigured()) {
    return NextResponse.json(
      {
        error: "Image hosting isn't connected yet. Add Cloudinary credentials to enable it.",
        notConfigured: true,
      },
      { status: 501 }
    );
  }

  try {
    const uid = await requireAuth(req);

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    const dataUri = `data:${file.type || "image/png"};base64,${base64}`;

    const url = await uploadToCloudinary(dataUri, `verdant-designs/${uid}`);

    return NextResponse.json({ url });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error(error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed." },
      { status: 500 }
    );
  }
}
