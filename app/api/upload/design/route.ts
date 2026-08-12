import { NextRequest, NextResponse } from "next/server";

import { cloudinaryConfigured, uploadToCloudinary } from "@/app/lib/cloudinary";

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
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const uid = (formData.get("uid") as string | null) || "anonymous";

    if (!file) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    const dataUri = `data:${file.type || "image/png"};base64,${base64}`;

    const url = await uploadToCloudinary(dataUri, `verdant-designs/${uid}`);

    return NextResponse.json({ url });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed." },
      { status: 500 }
    );
  }
}
