"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { Leaf, AlertCircle } from "lucide-react";

import { auth } from "@/app/lib/firebase";
import Button from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function login() {
    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setError("");

    try {
      setLoading(true);

      await signInWithEmailAndPassword(auth, email, password);

      router.push("/dashboard");
    } catch (err) {
      if (!(err instanceof FirebaseError)) {
        setError("Something went wrong. Please try again.");
        return;
      }

      switch (err.code) {
        case "auth/user-not-found":
          setError("No account exists with that email.");
          break;

        case "auth/wrong-password":
        case "auth/invalid-credential":
          setError("Incorrect email or password.");
          break;

        default:
          setError(err.message || "Something went wrong. Please try again.");
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
          <h1 className="mb-1 text-2xl font-bold">Welcome back</h1>
          <p className="mb-7 text-sm text-white/50">Log in to continue building.</p>

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
              login();
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

            <div>
              <label className="mb-2 block text-sm font-medium text-white/70">Password</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border-white/10 bg-white/5 text-white placeholder:text-white/30 focus:border-brand-400"
              />
            </div>

            <Button type="submit" disabled={loading} className="mt-2 w-full">
              {loading ? "Logging in…" : "Log in"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-white/50">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="font-semibold text-brand-400 hover:text-brand-300">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
