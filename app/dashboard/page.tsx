"use client";

import Link from "next/link";
import {
  Sparkles,
  FolderKanban,
  Wand2,
  Package,
  CreditCard,
  User,
  ArrowUpRight,
} from "lucide-react";

const tiles = [
  {
    href: "/dashboard/new-project",
    icon: Sparkles,
    title: "New Project",
    description: "Start creating a brand-new project.",
  },
  {
    href: "/dashboard/projects",
    icon: FolderKanban,
    title: "My Projects",
    description: "View and manage your saved projects.",
  },
  {
    href: "/dashboard/studio",
    icon: Wand2,
    title: "Verdant Forge",
    description: "AI-powered design studio.",
  },
  {
    href: "/dashboard/orders",
    icon: Package,
    title: "Orders",
    description: "Track manufacturing and printing.",
  },
  {
    href: "/dashboard/billing",
    icon: CreditCard,
    title: "Billing",
    description: "Manage your subscription and plan.",
  },
  {
    href: "/dashboard/profile",
    icon: User,
    title: "Profile",
    description: "Update your account settings.",
  },
];

export default function Dashboard() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {tiles.map(({ href, icon: Icon, title, description }) => (
        <Link
          key={href}
          href={href}
          className="group rounded-2xl border border-black/[0.06] bg-white p-6 shadow-[0_1px_2px_rgba(15,23,18,0.04)] transition hover:-translate-y-0.5 hover:border-brand-600/30 hover:shadow-[0_8px_24px_-12px_rgba(15,23,18,0.15)]"
        >
          <div className="mb-4 flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
              <Icon className="h-5 w-5" strokeWidth={2} />
            </div>
            <ArrowUpRight className="h-4 w-4 text-ink-500/40 transition group-hover:text-brand-600" />
          </div>

          <h2 className="text-base font-semibold text-ink-900">{title}</h2>
          <p className="mt-1 text-sm text-ink-500">{description}</p>
        </Link>
      ))}
    </div>
  );
}
