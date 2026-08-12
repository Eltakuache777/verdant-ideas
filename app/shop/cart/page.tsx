"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { AlertCircle, ShoppingBag, Trash2 } from "lucide-react";

import { getCart, getServerCart, removeFromCart, subscribeCart, updateCartItemQuantity } from "@/app/lib/cart";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";

export default function CartPage() {
  const items = useSyncExternalStore(subscribeCart, getCart, getServerCart);
  const [checkingOut, setCheckingOut] = useState(false);
  const [error, setError] = useState("");

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  async function handleCheckout() {
    if (items.length === 0) return;

    setError("");
    setCheckingOut(true);

    try {
      const response = await fetch("/api/shop/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({
            catalogId: i.catalogId,
            printfulSyncVariantId: i.printfulSyncVariantId,
            quantity: i.quantity,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to start checkout.");
      }

      window.location.assign(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to start checkout.");
      setCheckingOut(false);
    }
  }

  if (items.length === 0) {
    return (
      <Card className="flex flex-col items-center gap-3 px-8 py-16 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
          <ShoppingBag className="h-6 w-6" strokeWidth={2} />
        </div>
        <h2 className="text-lg font-semibold text-ink-900">Your cart is empty</h2>
        <Link href="/shop" className="mt-2">
          <Button size="sm">Back to shop</Button>
        </Link>
      </Card>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <div className="space-y-4">
        {items.map((item) => (
          <Card key={item.printfulSyncVariantId} className="flex items-center gap-4 p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.thumbnailUrl}
              alt={item.productLabel}
              className="h-20 w-20 rounded-lg object-cover"
            />
            <div className="flex-1">
              <p className="font-semibold text-ink-900">{item.productLabel}</p>
              <p className="text-sm text-ink-500">
                {item.color} / {item.size}
              </p>
              <p className="mt-1 text-sm font-medium text-ink-700">${item.price.toFixed(2)} each</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => updateCartItemQuantity(item.printfulSyncVariantId, item.quantity - 1)}
                className="h-8 w-8 rounded-lg border border-black/10 text-ink-600"
              >
                −
              </button>
              <span className="w-6 text-center font-medium text-ink-900">{item.quantity}</span>
              <button
                onClick={() => updateCartItemQuantity(item.printfulSyncVariantId, item.quantity + 1)}
                className="h-8 w-8 rounded-lg border border-black/10 text-ink-600"
              >
                +
              </button>
            </div>
            <button
              onClick={() => removeFromCart(item.printfulSyncVariantId)}
              className="text-ink-400 hover:text-red-600"
              aria-label="Remove"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </Card>
        ))}
      </div>

      <div>
        <Card className="p-6">
          <h2 className="text-base font-semibold text-ink-900">Order summary</h2>
          <div className="mt-4 flex justify-between text-sm text-ink-500">
            <span>Items</span>
            <span>{items.reduce((n, i) => n + i.quantity, 0)}</span>
          </div>
          <div className="mt-1 flex justify-between text-base font-semibold text-ink-900">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>

          {error && (
            <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <Button onClick={handleCheckout} disabled={checkingOut} className="mt-6 w-full">
            {checkingOut ? "Redirecting to checkout…" : "Checkout"}
          </Button>

          <Link href="/shop" className="mt-3 block text-center text-sm text-ink-500 hover:text-ink-900">
            Continue shopping
          </Link>
        </Card>
      </div>
    </div>
  );
}
