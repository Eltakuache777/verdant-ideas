"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { Leaf, AlertCircle } from "lucide-react";

import { auth, db } from "@/app/lib/firebase";
import { authFetch } from "@/app/lib/authFetch";
import Button from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function SignupPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function signup() {
    if (!name.trim() || !email || !password) {
      setError("Please fill in every field.");
      return;
    }

    setError("");

    try {
      setLoading(true);

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      let stripeCustomerId = "";

      try {
        const response = await authFetch("/api/create-customer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, name }),
        });

        if (response.ok) {
          const data = await response.json();
          stripeCustomerId = data.customerId ?? "";
        }
      } catch {
        // Billing setup can be completed later from the billing page.
      }

      await setDoc(doc(db, "users", userCredential.user.uid), {
        name,
        email,
        plan: "free",
        stripeCustomerId,
        createdAt: serverTimestamp(),
      });

      router.push("/dashboard");
    } catch (err) {
      if (!(err instanceof FirebaseError)) {
        setError("Something went wrong. Please try again.");
        return;
      }

      switch (err.code) {
        case "auth/email-already-in-use":
          setError("An account with that email already exists.");
          break;

        case "auth/weak-password":
          setError("Password should be at least 6 characters.");
          break;

        case "auth/invalid-email":
          setError("Please enter a valid email address.");
          break;

        default:
          setError(err.message || "Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-ink-900 px-6 py-12 text-white">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2">
          <Leaf className="h-6 w-6 text-brand-400" strokeWidth={2.25} />
          <span className="text-lg font-bold tracking-tight">Verdant Ideas</span>
        </Link>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8">
          <h1 className="mb-1 text-2xl font-bold">Create your account</h1>
          <p className="mb-7 text-sm text-white/50">Start turning ideas into reality.</p>

          {error && (
            <div className="mb-5 flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              signup();
            }}
          >
            <div>
              <label className="mb-2 block text-sm font-medium text-white/70">Name</label>
              <Input
                placeholder="Jordan Lee"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="border-white/10 bg-white/5 text-white placeholder:text-white/30 focus:border-brand-400"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-white/70">Email</label>
              <Input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border-white/10 bg-white/5 text-white placeholder:text-white/30 focus:border-brand-400"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-white/70">Password</label>
              <Input
                type="password"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border-white/10 bg-white/5 text-white placeholder:text-white/30 focus:border-brand-400"
              />
            </div>

            <Button type="submit" disabled={loading} className="mt-2 w-full">
              {loading ? "Creating account…" : "Create account"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-white/50">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-brand-400 hover:text-brand-300">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
