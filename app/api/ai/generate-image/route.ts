import { NextRequest, NextResponse } from "next/server";

import { requireAuth, authErrorResponse } from "@/app/lib/apiAuth";

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "AI generation isn't connected yet. Add OPENAI_API_KEY to enable it.", notConfigured: true },
      { status: 501 }
    );
  }

  try {
    await requireAuth(req);

    const { prompt } = await req.json();

    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return NextResponse.json({ error: "Please describe what you want to create." }, { status: 400 });
    }

    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-image-1",
        prompt,
        size: "1024x1024",
        n: 1,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("OpenAI image generation error:", data);
      return NextResponse.json(
        { error: data.error?.message || "Image generation failed." },
        { status: response.status }
      );
    }

    const imageBase64 = data.data?.[0]?.b64_json;

    if (!imageBase64) {
      return NextResponse.json({ error: "No image was returned." }, { status: 502 });
    }

    return NextResponse.json({ imageBase64 });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error(error);
    return NextResponse.json({ error: "Image generation failed." }, { status: 500 });
  }
}
