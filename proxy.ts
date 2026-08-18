import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { adminAuth } from "@/app/lib/firebase-admin";

// Central safety net for private API routes: a route matched here is
// rejected before it even runs if the caller has no valid Firebase ID
// token. This exists because per-route auth checks are opt-in — one route
// (create-customer) shipped with none at all because nothing forced it to
// have one. Routes still call requireAuth() themselves too (defense in
// depth, per Next's own proxy docs — a matcher edit here shouldn't be the
// only thing standing between an endpoint and the internet).
export async function proxy(request: NextRequest) {
  const header = request.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";

  if (!token) {
    return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
  }

  try {
    await adminAuth.verifyIdToken(token);
  } catch {
    return NextResponse.json(
      { error: "Your session has expired. Please log in again." },
      { status: 401 }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/api/ai/:path*",
    "/api/upload/:path*",
    "/api/projects/:path*",
    "/api/fulfillment/create-order",
    "/api/fulfillment/create-catalog",
    "/api/create-checkout-session",
    "/api/create-customer",
  ],
};
