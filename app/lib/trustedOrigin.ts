import { NextRequest } from "next/server";

// Resolves a safe origin to build post-payment redirect URLs from. A raw
// `Origin` header is attacker-controlled on direct API calls (not just
// browser fetches), so it's only trusted when it's localhost (dev) or
// matches the app's own configured URL — anything else falls back to the
// configured origin instead of being used verbatim.
export function resolveTrustedOrigin(req: NextRequest): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const origin = req.headers.get("origin");

  if (origin) {
    try {
      const { hostname } = new URL(origin);
      const isLocalhost = hostname === "localhost" || hostname === "127.0.0.1";
      if (isLocalhost || origin === configured) {
        return origin;
      }
    } catch {
      // malformed Origin header — ignore and fall through to the configured default
    }
  }

  return configured;
}
