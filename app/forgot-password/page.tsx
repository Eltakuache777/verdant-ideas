"use client";

import { useState } from "react";
import Link from "next/link";
import { sendPasswordResetEmail } from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { Leaf, AlertCircle, CheckCircle2 } from "lucide-react";

import { auth } from "@/app/lib/firebase";
import Button from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  async function handleSubmit() {
    if (!email) {
      setError("Please enter your email.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      await sendPasswordResetEmail(auth, email, {
        url: `${window.location.origin}/login`,
      });
      // Show the same confirmation whether or not the account exists, so
      // this can't be used to check which emails have accounts.
      setSent(true);
    } catch (err) {
      if (err instanceof FirebaseError && err.code === "auth/invalid-email") {
        setError("That doesn't look like a valid email address.");
      } else {
        setSent(true);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-ink-900 px-6 text-white">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2">
          <Leaf className="h-6 w-6 text-brand-400" strokeWidth={2.25} />
          <span className="text-lg font-bold tracking-tight">Verdant Ideas</span>
        </Link>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8">
          {sent ? (
            <>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-400">
                <CheckCircle2 className="h-6 w-6" strokeWidth={2} />
              </div>
              <h1 className="mb-1 text-2xl font-bold">Check your email</h1>
              <p className="text-sm text-white/50">
                If an account exists for <span className="text-white/80">{email}</span>, we&apos;ve sent a
                link to reset your password.
              </p>

              <Link href="/login" className="mt-6 block">
                <Button variant="secondary" className="w-full">
                  Back to log in
                </Button>
              </Link>
            </>
          ) : (
            <>
              <h1 className="mb-1 text-2xl font-bold">Reset your password</h1>
              <p className="mb-7 text-sm text-white/50">
                Enter your email and we&apos;ll send you a link to get back in.
              </p>

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
                  handleSubmit();
                }}
              >
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

                <Button type="submit" disabled={loading} className="mt-2 w-full">
                  {loading ? "Sending…" : "Send reset link"}
                </Button>
              </form>

              <p className="mt-6 text-center text-sm text-white/50">
                <Link href="/login" className="font-semibold text-brand-400 hover:text-brand-300">
                  Back to log in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
