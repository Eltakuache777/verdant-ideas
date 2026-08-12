"use client";

import { useEffect, useState } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { CheckCircle2 } from "lucide-react";

import { auth, db } from "@/app/lib/firebase";
import { Card, PageHeader } from "@/components/ui/Card";
import { Input, Label } from "@/components/ui/Input";
import Button from "@/components/ui/Button";

export default function ProfilePage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [plan, setPlan] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      const user = auth.currentUser;
      if (!user) return;

      const snap = await getDoc(doc(db, "users", user.uid));

      if (snap.exists()) {
        const data = snap.data();
        setName(data.name || "");
        setEmail(data.email || user.email || "");
        setPlan(data.plan || "free");
      } else {
        setEmail(user.email || "");
      }

      setLoading(false);
    }

    loadProfile();
  }, []);

  async function handleSave() {
    const user = auth.currentUser;
    if (!user) return;

    setSaving(true);
    setSaved(false);

    try {
      await updateDoc(doc(db, "users", user.uid), { name });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Account"
        title="Profile"
        description="Update the name shown across your Verdant Ideas workspace."
      />

      <Card className="max-w-xl p-8">
        {loading ? (
          <p className="text-sm text-ink-500">Loading profile…</p>
        ) : (
          <div className="space-y-5">
            <div>
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
            </div>

            <div>
              <Label>Email</Label>
              <Input value={email} disabled />
            </div>

            <div>
              <Label>Plan</Label>
              <div className="inline-flex items-center rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold capitalize text-brand-700">
                {plan}
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Saving…" : "Save changes"}
              </Button>

              {saved && (
                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-700">
                  <CheckCircle2 className="h-4 w-4" />
                  Saved
                </span>
              )}
            </div>
          </div>
        )}
      </Card>
    </>
  );
}
