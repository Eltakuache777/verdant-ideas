"use client";

import { useEffect, useState } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { sendPasswordResetEmail } from "firebase/auth";
import { Mail, CheckCircle2, AlertCircle } from "lucide-react";

import { auth, db } from "@/app/lib/firebase";
import { Card, PageHeader } from "@/components/ui/Card";
import Button from "@/components/ui/Button";

interface Notifications {
  projectUpdates: boolean;
  productNews: boolean;
}

function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  description: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-4 py-4 text-left"
    >
      <div>
        <p className="text-sm font-medium text-ink-900">{label}</p>
        <p className="mt-0.5 text-sm text-ink-500">{description}</p>
      </div>

      <span
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
          checked ? "bg-brand-600" : "bg-black/15"
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-[22px]" : "translate-x-0.5"
          }`}
        />
      </span>
    </button>
  );
}

export default function SettingsPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notifications>({
    projectUpdates: true,
    productNews: false,
  });
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [notifError, setNotifError] = useState("");
  const [resetError, setResetError] = useState("");

  useEffect(() => {
    async function load() {
      const user = auth.currentUser;
      if (!user) return;

      setEmail(user.email || "");

      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists() && snap.data().notifications) {
          setNotifications({
            projectUpdates: true,
            productNews: false,
            ...snap.data().notifications,
          });
        }
      } catch {
        setLoadError("Couldn't load your settings. Please refresh the page.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  async function updateNotification(key: keyof Notifications, value: boolean) {
    const user = auth.currentUser;
    if (!user) return;

    const previous = notifications;
    const next = { ...notifications, [key]: value };
    setNotifications(next);
    setNotifError("");

    try {
      await setDoc(doc(db, "users", user.uid), { notifications: next }, { merge: true });
    } catch {
      setNotifications(previous);
      setNotifError("Couldn't save that change. Please try again.");
    }
  }

  async function handlePasswordReset() {
    if (!email) return;

    setResetError("");
    setResetLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setResetSent(true);
      setTimeout(() => setResetSent(false), 4000);
    } catch {
      setResetError("Couldn't send the reset email. Please try again.");
    } finally {
      setResetLoading(false);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Account"
        title="Settings"
        description="Manage your account security and notification preferences."
      />

      {loading ? (
        <p className="text-sm text-ink-500">Loading settings…</p>
      ) : loadError ? (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{loadError}</span>
        </div>
      ) : (
        <div className="max-w-2xl space-y-6">
          <Card className="p-8">
            <h2 className="text-base font-semibold text-ink-900">Security</h2>
            <p className="mt-1 text-sm text-ink-500">
              Signed in as <span className="font-medium text-ink-800">{email}</span>
            </p>

            <div className="mt-5 flex items-center gap-3">
              <Button variant="secondary" onClick={handlePasswordReset} disabled={resetLoading}>
                <Mail className="mr-2 h-4 w-4" />
                {resetLoading ? "Sending…" : "Send password reset email"}
              </Button>

              {resetSent && (
                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-700">
                  <CheckCircle2 className="h-4 w-4" />
                  Email sent
                </span>
              )}
            </div>

            {resetError && (
              <p className="mt-3 flex items-center gap-1.5 text-sm text-red-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {resetError}
              </p>
            )}
          </Card>

          <Card className="divide-y divide-black/[0.06] p-8">
            <h2 className="pb-4 text-base font-semibold text-ink-900">Notifications</h2>

            {notifError && (
              <p className="flex items-center gap-1.5 py-3 text-sm text-red-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {notifError}
              </p>
            )}

            <Toggle
              label="Project updates"
              description="Get notified when a project's status or manufacturing order changes."
              checked={notifications.projectUpdates}
              onChange={(v) => updateNotification("projectUpdates", v)}
            />

            <Toggle
              label="Product news"
              description="Occasional emails about new Verdant Ideas features."
              checked={notifications.productNews}
              onChange={(v) => updateNotification("productNews", v)}
            />
          </Card>
        </div>
      )}
    </>
  );
}
