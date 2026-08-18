"use client";

import { useEffect, useState } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { AlertCircle, CheckCircle2 } from "lucide-react";

import { auth, db } from "@/app/lib/firebase";
import { authFetch } from "@/app/lib/authFetch";
import { Card, PageHeader } from "@/components/ui/Card";
import Button from "@/components/ui/Button";

type PlanId = "pro" | "elite" | "daypass";

interface PlanCard {
  id: PlanId;
  name: string;
  price: string;
  cadence: string;
  featured?: boolean;
  perks: string[];
}

const plans: PlanCard[] = [
  {
    id: "pro",
    name: "Pro",
    price: "$20",
    cadence: "per month",
    perks: [
      "Unlimited projects",
      "Unlimited AI generations & 3D models",
      "Standard rendering speed",
      "Standard export formats",
      "Community templates",
    ],
  },
  {
    id: "elite",
    name: "Elite",
    price: "$30",
    cadence: "per month",
    featured: true,
    perks: [
      "Everything in Pro",
      "Priority rendering — jump the queue",
      "Premium templates & advanced business tools",
      "Expanded cloud storage",
      "Direct manufacturing order support",
      "Early access to new AI tools",
    ],
  },
  {
    id: "daypass",
    name: "Day Pass",
    price: "$15.99",
    cadence: "24 hours of full Elite access",
    perks: [
      "Everything in Elite for a day",
      "No recurring commitment",
      "Perfect for a one-off project",
    ],
  },
];

export default function BillingPage() {
  const [customerId, setCustomerId] = useState("");
  const [plan, setPlan] = useState("free");
  const [loading, setLoading] = useState(true);
  const [checkoutPlan, setCheckoutPlan] = useState<PlanId | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadUser() {
      const user = auth.currentUser;
      if (!user) {
        setLoading(false);
        return;
      }

      const userRef = doc(db, "users", user.uid);
      const snap = await getDoc(userRef);

      if (snap.exists()) {
        const data = snap.data();
        setCustomerId(data.stripeCustomerId || "");

        // Day Pass grants 24 hours of access, not permanent access — once
        // planExpiresAt has passed, treat it as expired here and revert it
        // in Firestore so the stale plan doesn't linger.
        const expiresAt = data.planExpiresAt?.toDate?.() as Date | undefined;
        const isExpiredDayPass =
          data.plan === "daypass" && expiresAt !== undefined && expiresAt.getTime() <= Date.now();

        if (isExpiredDayPass) {
          setPlan("free");
          updateDoc(userRef, { plan: "free", planExpiresAt: null }).catch(() => {});
        } else {
          setPlan(data.plan || "free");
        }
      }

      setLoading(false);
    }

    loadUser();
  }, []);

  async function checkout(selectedPlan: PlanId) {
    setError("");

    if (!customerId) {
      setError("Billing isn't set up for your account yet. Try logging out and back in.");
      return;
    }

    setCheckoutPlan(selectedPlan);

    try {
      const response = await authFetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: selectedPlan }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.assign(data.url);
      } else {
        setError(data.error || "Unable to start checkout.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to start checkout.");
    } finally {
      setCheckoutPlan(null);
    }
  }

  return (
    <>
      <PageHeader eyebrow="Account" title="Billing" description="Manage your plan and payment details." />

      {loading ? (
        <p className="text-sm text-ink-500">Loading billing information…</p>
      ) : (
        <>
          <Card className="mb-8 flex items-center justify-between p-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
                Current plan
              </p>
              <p className="mt-1 text-xl font-bold capitalize text-ink-900">{plan}</p>
            </div>
            <CheckCircle2 className="h-6 w-6 text-brand-600" />
          </Card>

          {error && (
            <div className="mb-6 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid gap-6 md:grid-cols-3">
            {plans.map((p) => {
              const isCurrent = plan === p.id;
              return (
                <Card
                  key={p.id}
                  className={`flex flex-col p-8 ${
                    p.featured ? "border-2 border-brand-600 shadow-lg" : ""
                  }`}
                >
                  {p.featured && (
                    <span className="mb-4 inline-flex w-fit items-center rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700">
                      Most popular
                    </span>
                  )}

                  <h3 className="text-lg font-bold text-ink-900">{p.name}</h3>

                  <div className="mt-4 flex items-baseline gap-1.5">
                    <span className="text-4xl font-bold text-ink-900">{p.price}</span>
                  </div>
                  <p className="text-sm text-ink-500">{p.cadence}</p>

                  <ul className="mt-6 flex-1 space-y-2.5">
                    {p.perks.map((perk) => (
                      <li key={perk} className="flex items-start gap-2 text-sm text-ink-600">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                        {perk}
                      </li>
                    ))}
                  </ul>

                  <Button
                    onClick={() => checkout(p.id)}
                    disabled={checkoutPlan !== null || isCurrent}
                    variant={p.featured ? "primary" : "secondary"}
                    className="mt-8 w-full"
                  >
                    {isCurrent
                      ? "Current plan"
                      : checkoutPlan === p.id
                        ? "Redirecting…"
                        : p.id === "daypass"
                          ? "Buy day pass"
                          : `Upgrade to ${p.name}`}
                  </Button>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </>
  );
}
