"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { clearCart } from "@/app/lib/cart";

interface OrderLineItem {
  productLabel: string;
  color: string;
  size: string;
  quantity: number;
}

interface OrderStatus {
  status: string;
  items?: OrderLineItem[];
  amountTotal?: number;
  customerEmail?: string;
  error?: string | null;
}

function ShopSuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order_id");

  const [order, setOrder] = useState<OrderStatus | null>(null);
  const attemptsRef = useRef(0);

  useEffect(() => {
    if (!orderId) return;

    let cancelled = false;

    async function poll() {
      const response = await fetch(`/api/shop/order-status?order_id=${orderId}`);
      const data: OrderStatus = await response.json();
      if (cancelled) return;

      setOrder(data);

      if (data.status && data.status !== "pending") {
        clearCart();
      }

      attemptsRef.current += 1;
      if (data.status === "pending" && attemptsRef.current < 10) {
        setTimeout(poll, 2000);
      }
    }

    poll();

    return () => {
      cancelled = true;
    };
  }, [orderId]);

  const isPending = !order || order.status === "pending" || order.status === "creating";
  const isFailed = order?.status === "failed";

  return (
    <Card className="mx-auto flex max-w-lg flex-col items-center gap-4 px-8 py-16 text-center">
      {isFailed ? (
        <>
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
            <AlertCircle className="h-7 w-7" strokeWidth={2} />
          </div>
          <h1 className="text-2xl font-bold text-ink-900">Payment received, order needs attention</h1>
          <p className="text-sm text-ink-500">
            Your payment went through, but we hit a snag sending the order to production. We&apos;ll
            sort it out and follow up by email — no action needed from you.
          </p>
        </>
      ) : isPending ? (
        <>
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
            <Loader2 className="h-7 w-7 animate-spin" strokeWidth={2} />
          </div>
          <h1 className="text-2xl font-bold text-ink-900">Confirming your order…</h1>
          <p className="text-sm text-ink-500">This only takes a few seconds.</p>
        </>
      ) : (
        <>
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
            <CheckCircle2 className="h-7 w-7" strokeWidth={2} />
          </div>
          <h1 className="text-2xl font-bold text-ink-900">Order confirmed</h1>

          <div className="w-full space-y-2 rounded-xl border border-black/10 bg-black/[0.02] px-5 py-4 text-left text-sm">
            {(order.items || []).map((item, i) => (
              <div key={i} className="flex justify-between">
                <span className="font-medium text-ink-900">
                  {item.productLabel} — {item.color}
                  {item.size ? ` / ${item.size}` : ""}
                </span>
                <span className="text-ink-500">Qty {item.quantity}</span>
              </div>
            ))}
            {typeof order.amountTotal === "number" && (
              <div className="flex justify-between border-t border-black/10 pt-2 font-semibold text-ink-900">
                <span>Total</span>
                <span>${(order.amountTotal / 100).toFixed(2)}</span>
              </div>
            )}
          </div>

          <p className="text-sm text-ink-500">
            {order.customerEmail ? `A confirmation has been sent to ${order.customerEmail}. ` : ""}
            Your items will be printed and shipped together soon.
          </p>
        </>
      )}

      <Link href="/shop" className="mt-2">
        <Button variant="secondary">Back to shop</Button>
      </Link>
    </Card>
  );
}

export default function ShopSuccessPage() {
  return (
    <Suspense
      fallback={
        <Card className="mx-auto flex max-w-lg flex-col items-center gap-4 px-8 py-16 text-center">
          <Loader2 className="h-7 w-7 animate-spin text-brand-700" strokeWidth={2} />
        </Card>
      }
    >
      <ShopSuccessContent />
    </Suspense>
  );
}
