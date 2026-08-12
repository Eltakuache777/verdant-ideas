import { NextRequest } from "next/server";

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
  } catch {
    throw new AuthError("Your session has expired. Please log in again.");
  }
}
