"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, getDocs } from "firebase/firestore";

import { db } from "@/app/lib/firebase";
import { Card } from "@/components/ui/Card";

interface CatalogProduct {
  id: string;
  productKey: string;
  productLabel: string;
  color: string;
  price: number;
  mockupUrl: string;
}

const SWATCH_COLORS: Record<string, string> = {
  "Forest Green": "#1a5c3d",
  Black: "#0b0f0d",
  "Heather Gray": "#9aa1a6",
  White: "#ffffff",
};

interface ProductGroup {
  productKey: string;
  productLabel: string;
  minPrice: number;
  thumbnailUrl: string;
  colors: string[];
}

export default function ShopClient() {
  const [groups, setGroups] = useState<ProductGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const snapshot = await getDocs(collection(db, "catalogProducts"));
      const products = snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<CatalogProduct, "id">) }));

      const byKey = new Map<string, CatalogProduct[]>();
      for (const p of products) {
        if (!byKey.has(p.productKey)) byKey.set(p.productKey, []);
        byKey.get(p.productKey)!.push(p);
      }

      const result: ProductGroup[] = Array.from(byKey.entries()).map(([productKey, items]) => ({
        productKey,
        productLabel: items[0].productLabel,
        minPrice: Math.min(...items.map((i) => i.price)),
        thumbnailUrl: items[0].mockupUrl,
        colors: items.map((i) => i.color),
      }));

      setGroups(result);
      setLoading(false);
    }

    load();
  }, []);

  return (
    <>
      <div className="mb-8">
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-brand-700">
          Verdant Lawn Care
        </p>
        <h1 className="text-2xl font-bold text-ink-900 sm:text-3xl">Shop</h1>
        <p className="mt-2 max-w-2xl text-[15px] text-ink-500">
          Real, made-to-order merch — printed and shipped when you order.
        </p>
      </div>

      {loading && <p className="text-sm text-ink-500">Loading products…</p>}

      {!loading && groups.length === 0 && (
        <Card className="px-8 py-16 text-center text-ink-500">No products available yet.</Card>
      )}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {groups.map((group) => (
          <Link key={group.productKey} href={`/shop/${group.productKey}`}>
            <Card className="overflow-hidden p-0 transition hover:-translate-y-0.5 hover:shadow-lg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={group.thumbnailUrl} alt={group.productLabel} className="h-64 w-full object-cover" />

              <div className="p-5">
                <h2 className="text-base font-semibold text-ink-900">{group.productLabel}</h2>
                <p className="mt-1 text-sm text-ink-500">From ${group.minPrice.toFixed(2)}</p>

                <div className="mt-3 flex gap-1.5">
                  {group.colors.map((color) => (
                    <span
                      key={color}
                      title={color}
                      className="h-4 w-4 rounded-full border border-black/10"
                      style={{ backgroundColor: SWATCH_COLORS[color] || "#ccc" }}
                    />
                  ))}
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </>
  );
}
