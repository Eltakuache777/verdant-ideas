"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { Leaf, ShoppingBag } from "lucide-react";

import { cartCount, getCart, getServerCart, subscribeCart } from "@/app/lib/cart";

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  const items = useSyncExternalStore(subscribeCart, getCart, getServerCart);
  const count = cartCount(items);

  return (
    <div className="min-h-screen bg-[#f6f7f6]">
      <header className="border-b border-black/[0.06] bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link href="/shop" className="flex items-center gap-2">
            <Leaf className="h-6 w-6 text-brand-700" strokeWidth={2.25} />
            <span className="text-lg font-bold tracking-tight text-ink-900">Verdant Shop</span>
          </Link>

          <div className="flex items-center gap-6">
            <Link href="/" className="text-sm font-medium text-ink-500 hover:text-ink-900">
              Verdant Ideas
            </Link>
            <Link href="/shop/cart" className="relative flex items-center text-ink-700 hover:text-ink-900">
              <ShoppingBag className="h-5 w-5" strokeWidth={2} />
              {count > 0 && (
                <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-semibold text-white">
                  {count}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>

      <footer className="border-t border-black/[0.06] py-8 text-center text-sm text-ink-500">
        © {new Date().getFullYear()} Verdant Ideas. All rights reserved.
      </footer>
    </div>
  );
}
