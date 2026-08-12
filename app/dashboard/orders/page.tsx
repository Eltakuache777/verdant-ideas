"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { Package } from "lucide-react";

import { auth, db } from "@/app/lib/firebase";
import { Card, PageHeader } from "@/components/ui/Card";

interface Order {
  id: string;
  productName?: string;
  variantName?: string;
  quantity?: number;
  status?: string;
  designImageUrl?: string;
  createdAt?: { toMillis?: () => number };
}

const statusStyles: Record<string, string> = {
  draft: "bg-black/5 text-ink-600",
  creating: "bg-amber-100 text-amber-800",
  failed: "bg-red-100 text-red-700",
  fulfilled: "bg-brand-100 text-brand-800",
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOrders() {
      const user = auth.currentUser;
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const q = query(collection(db, "orders"), where("ownerId", "==", user.uid));
        const snapshot = await getDocs(q);

        const orderList = snapshot.docs
          .map((d) => ({ id: d.id, ...(d.data() as Omit<Order, "id">) }))
          .sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));

        setOrders(orderList);
      } catch (error) {
        console.error("Error loading orders:", error);
      } finally {
        setLoading(false);
      }
    }

    loadOrders();
  }, []);

  return (
    <>
      <PageHeader
        eyebrow="Manufacturing"
        title="Orders"
        description="Track manufacturing and printing orders for your projects."
      />

      {loading && <p className="text-sm text-ink-500">Loading orders…</p>}

      {!loading && orders.length === 0 && (
        <Card className="flex flex-col items-center gap-3 px-8 py-20 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
            <Package className="h-6 w-6" strokeWidth={2} />
          </div>
          <h2 className="text-lg font-semibold text-ink-900">No orders yet</h2>
          <p className="max-w-sm text-sm text-ink-500">
            Send a project with a design attached to manufacturing to see it tracked here.
          </p>
        </Card>
      )}

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {orders.map((order) => (
          <Card key={order.id} className="overflow-hidden p-0">
            {order.designImageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={order.designImageUrl}
                alt={order.productName || "Order"}
                className="h-40 w-full object-cover"
              />
            )}

            <div className="p-6">
              <div className="mb-2 flex items-start justify-between gap-2">
                <h2 className="text-base font-semibold text-ink-900">
                  {order.productName || "Product"}
                </h2>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
                    statusStyles[order.status ?? "draft"] ?? statusStyles.draft
                  }`}
                >
                  {order.status ?? "draft"}
                </span>
              </div>

              {order.variantName && <p className="text-sm text-ink-500">{order.variantName}</p>}
              <p className="mt-1 text-sm text-ink-500">Qty: {order.quantity ?? 1}</p>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
