import { NextRequest, NextResponse } from "next/server";

import { adminAuth } from "@/app/lib/firebase-admin";

export class AuthError extends Error {}

function bearerToken(req: NextRequest): string {
  const header = req.headers.get("authorization") || "";
  return header.startsWith("Bearer ") ? header.slice(7) : "";
}

// Verifies the Firebase ID token on the Authorization header and returns the
// real, server-verified uid. Never trust a uid/ownerId supplied in a request
// body — it's client-controlled and can be set to any value.
//
// checkRevoked is on so a disabled/deleted account's still-unexpired token
// stops working immediately instead of staying valid for up to an hour.
export async function requireAuth(req: NextRequest): Promise<string> {
  const token = bearerToken(req);

  if (!token) {
    throw new AuthError("You must be logged in.");
  }

  try {
    const decoded = await adminAuth.verifyIdToken(token, true);
    return decoded.uid;
  } catch {
    throw new AuthError("Your session has expired. Please log in again.");
  }
}

// Same as requireAuth, but also requires the token's email to match
// ADMIN_EMAIL — for routes that create real, publicly-visible side effects
// (e.g. listing a product in the shop) that must stay owner-only.
export async function requireAdmin(req: NextRequest): Promise<string> {
  const token = bearerToken(req);

  if (!token) {
    throw new AuthError("You must be logged in.");
  }

  const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase();

  try {
    const decoded = await adminAuth.verifyIdToken(token, true);
    if (!adminEmail || decoded.email?.toLowerCase() !== adminEmail) {
      throw new AuthError("You don't have permission to do this.");
    }
    return decoded.uid;
  } catch (err) {
    if (err instanceof AuthError) throw err;
    throw new AuthError("Your session has expired. Please log in again.");
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
