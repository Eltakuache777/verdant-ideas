"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { Plus } from "lucide-react";

import { auth, db } from "@/app/lib/firebase";

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  "/dashboard": { title: "Welcome back", subtitle: "Build amazing ideas with Verdant Forge." },
  "/dashboard/projects": { title: "My Projects", subtitle: "All of your saved projects." },
  "/dashboard/new-project": { title: "New Project", subtitle: "Start building your next idea." },
  "/dashboard/studio": { title: "Verdant Forge", subtitle: "Your AI-powered design studio." },
  "/dashboard/orders": { title: "Orders", subtitle: "Track manufacturing and printing." },
  "/dashboard/billing": { title: "Billing", subtitle: "Manage your plan and payment details." },
  "/dashboard/settings": { title: "Settings", subtitle: "Manage your account preferences." },
  "/dashboard/profile": { title: "Profile", subtitle: "Update your personal information." },
};

export default function Topbar() {
  const pathname = usePathname();
  const [displayName, setDisplayName] = useState("");

  useEffect(() => {
    async function loadName() {
      const user = auth.currentUser;
      if (!user) return;

      if (user.displayName) {
        setDisplayName(user.displayName);
        return;
      }

      const snap = await getDoc(doc(db, "users", user.uid));
      if (snap.exists()) {
        setDisplayName(snap.data().name || user.email || "");
      } else {
        setDisplayName(user.email || "");
      }
    }

    loadName();
  }, []);

  const { title, subtitle } = pageTitles[pathname ?? ""] ?? pageTitles["/dashboard"];
  const initial = displayName.trim().charAt(0).toUpperCase() || "?";

  return (
    <header className="flex items-center justify-between border-b border-black/[0.06] bg-white px-8 py-5">
      <div>
        <h1 className="text-xl font-bold text-ink-900 sm:text-2xl">{title}</h1>
        <p className="mt-0.5 text-sm text-ink-500">{subtitle}</p>
      </div>

      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/new-project"
          className="inline-flex items-center gap-1.5 rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-800"
        >
          <Plus className="h-4 w-4" strokeWidth={2.5} />
          New Project
        </Link>

        <div
          title={displayName}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-700 text-sm font-bold text-white"
        >
          {initial}
        </div>
      </div>
    </header>
  );
}
