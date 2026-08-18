import { auth } from "@/app/lib/firebase";

// Attaches the current user's Firebase ID token so protected API routes can
// verify who's actually calling, instead of trusting a client-supplied uid.
export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("You must be logged in.");
  }

  let token: string;
  try {
    token = await user.getIdToken();
  } catch {
    throw new Error("Couldn't verify your session. Check your connection and try again.");
  }

  const headers = new Headers(options.headers);
  headers.set("Authorization", `Bearer ${token}`);

  return fetch(url, { ...options, headers });
}
