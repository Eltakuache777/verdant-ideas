import { NextRequest, NextResponse } from "next/server";

import { adminAuth } from "@/app/lib/firebase-admin";

export class AuthError extends Error {}

// Verifies the Firebase ID token on the Authorization header and returns the
// real, server-verified uid. Never trust a uid/ownerId supplied in a request
// body — it's client-controlled and can be set to any value.
export async function requireAuth(req: NextRequest): Promise<string> {
  const header = req.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";

  if (!token) {
    throw new AuthError("You must be logged in.");
  }

  try {
    const decoded = await adminAuth.verifyIdToken(token);
    return decoded.uid;
  } catch (err) {
    // Firebase Admin throws a FirebaseAuthError with an "auth/..." code for
    // a genuinely invalid/expired token. Anything else (a transient network
    // blip fetching Google's public keys, etc.) isn't the user's fault and
    // "log in again" wouldn't fix it, so keep those messages distinct.
    const code = (err as { code?: string } | undefined)?.code;
    if (typeof code === "string" && code.startsWith("auth/")) {
      throw new AuthError("Your session has expired. Please log in again.");
    }
    throw new AuthError("Couldn't verify your session right now. Please try again.");
  }
}

// Shared so every route's catch block doesn't repeat the same
// instanceof-check-and-401 three-liner by hand.
export function authErrorResponse(error: unknown): NextResponse | null {
  if (error instanceof AuthError) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
  return null;
}
