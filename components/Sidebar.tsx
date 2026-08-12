"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import {
  LayoutDashboard,
  FolderKanban,
  Sparkles,
  Wand2,
  Package,
  CreditCard,
  Settings,
  User,
  Leaf,
  LogOut,
} from "lucide-react";

import { auth } from "@/app/lib/firebase";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/projects", label: "My Projects", icon: FolderKanban },
  { href: "/dashboard/new-project", label: "New Project", icon: Sparkles },
  { href: "/dashboard/studio", label: "Verdant Forge", icon: Wand2 },
  { href: "/dashboard/orders", label: "Orders", icon: Package },
  { href: "/dashboard/billing", label: "Billing", icon: CreditCard },
];

const secondaryItems = [
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
  { href: "/dashboard/profile", label: "Profile", icon: User },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname === href || pathname?.startsWith(`${href}/`);
  }

  async function handleLogout() {
    await signOut(auth);
    router.push("/login");
  }

  function NavLink({ href, label, icon: Icon }: (typeof navItems)[number]) {
    const active = isActive(href);
    return (
      <Link
        href={href}
        className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors ${
          active
            ? "bg-brand-600/15 text-brand-300"
            : "text-white/60 hover:bg-white/5 hover:text-white"
        }`}
      >
        <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
        {label}
      </Link>
    );
  }

  return (
    <aside className="flex min-h-screen w-64 shrink-0 flex-col bg-ink-900 p-5 text-white">
      <Link href="/dashboard" className="mb-8 flex items-center gap-2 px-1">
        <Leaf className="h-6 w-6 text-brand-400" strokeWidth={2.25} />
        <span className="text-lg font-bold tracking-tight">Verdant Ideas</span>
      </Link>

      <nav className="flex flex-1 flex-col gap-1">
        {navItems.map((item) => (
          <NavLink key={item.href} {...item} />
        ))}

        <div className="my-3 h-px bg-white/10" />

        {secondaryItems.map((item) => (
          <NavLink key={item.href} {...item} />
        ))}
      </nav>

      <button
        onClick={handleLogout}
        className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-white/50 transition-colors hover:bg-white/5 hover:text-white"
      >
        <LogOut className="h-[18px] w-[18px]" strokeWidth={2} />
        Log out
      </button>
    </aside>
  );
}
