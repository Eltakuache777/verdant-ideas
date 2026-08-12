import { auth } from "@/app/lib/firebase";

// Attaches the current user's Firebase ID token so protected API routes can
// verify who's actually calling, instead of trusting a client-supplied uid.
export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("You must be logged in.");
  }

  const token = await user.getIdToken();
  const headers = new Headers(options.headers);
  headers.set("Authorization", `Bearer ${token}`);

  return fetch(url, { ...options, headers });
}
