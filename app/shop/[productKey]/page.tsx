"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { collection, getDocs, query, where } from "firebase/firestore";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";

import { db } from "@/app/lib/firebase";
import { addToCart } from "@/app/lib/cart";
import { Card } from "@/components/ui/Card";
import { Label } from "@/components/ui/Input";
import Button from "@/components/ui/Button";

interface Variant {
  size: string;
  printfulSyncVariantId: number;
}

interface CatalogProduct {
  id: string;
  productKey: string;
  productLabel: string;
  color: string;
  price: number;
  mockupUrl: string;
  mockupsByPlacement?: Record<string, string>;
  variants: Variant[];
}

const SWATCH_COLORS: Record<string, string> = {
  "Forest Green": "#1a5c3d",
  Black: "#0b0f0d",
  "Heather Gray": "#9aa1a6",
  White: "#ffffff",
};

const ANGLE_LABELS: Record<string, string> = {
  front: "Front",
  back: "Back",
  sleeve_left: "Left sleeve",
  sleeve_right: "Right sleeve",
  embroidery_front_large: "Front",
};

export default function ProductDetailPage() {
  const params = useParams<{ productKey: string }>();
  const router = useRouter();

  const [colorOptions, setColorOptions] = useState<CatalogProduct[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [previewColor, setPreviewColor] = useState("");
  const [selectedAngle, setSelectedAngle] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [added, setAdded] = useState(0);

  useEffect(() => {
    async function load() {
      const q = query(collection(db, "catalogProducts"), where("productKey", "==", params.productKey));
      const snapshot = await getDocs(q);
      const items = snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<CatalogProduct, "id">) }));

      setColorOptions(items);
      if (items[0]) {
        setSelectedColors([items[0].color]);
        setPreviewColor(items[0].color);
        setSelectedAngle(Object.keys(items[0].mockupsByPlacement || {})[0] || "");
      }
      setLoading(false);
    }

    load();
  }, [params.productKey]);

  const preview = colorOptions.find((c) => c.color === previewColor) || colorOptions[0];
  const angles = preview ? Object.entries(preview.mockupsByPlacement || {}) : [];
  const activeImage = (preview?.mockupsByPlacement || {})[selectedAngle] || preview?.mockupUrl || "";
  const isHat = params.productKey === "hat";

  // Sizes are consistent across colors for a given product, so any color's
  // variant list works as the canonical size set.
  const sizeOptions = colorOptions[0]?.variants.map((v) => v.size) || [];
  const price = colorOptions[0]?.price ?? 0;

  function toggleColor(color: string) {
    setSelectedColors((prev) =>
      prev.includes(color) ? prev.filter((c) => c !== color) : [...prev, color]
    );
    setPreviewColor(color);
  }

  function toggleSize(size: string) {
    setSelectedSizes((prev) => (prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]));
  }

  function handleAddToCart() {
    setError("");

    if (selectedColors.length === 0 || selectedSizes.length === 0) {
      setError("Pick at least one color and one size.");
      return;
    }

    const items = [];
    for (const color of selectedColors) {
      const product = colorOptions.find((c) => c.color === color);
      if (!product) continue;
      for (const size of selectedSizes) {
        const variant = product.variants.find((v) => v.size === size);
        if (!variant) continue;
        items.push({
          catalogId: product.id,
          printfulSyncVariantId: variant.printfulSyncVariantId,
          productLabel: product.productLabel,
          color: product.color,
          size,
          price: product.price,
          thumbnailUrl: product.mockupUrl,
          quantity,
        });
      }
    }

    if (items.length === 0) {
      setError("Those combinations aren't available.");
      return;
    }

    addToCart(items);
    setAdded(items.length);
    setSelectedSizes([]);
  }

  if (loading) {
    return <p className="text-sm text-ink-500">Loading…</p>;
  }

  if (!preview) {
    return <p className="text-sm text-ink-500">Product not found.</p>;
  }

  return (
    <div className="grid gap-10 lg:grid-cols-2">
      <div>
        <Card className="overflow-hidden p-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={activeImage} alt={preview.productLabel} className="w-full object-cover" />
        </Card>

        {angles.length > 1 && (
          <div className="mt-3 flex gap-2">
            {angles.map(([placement, url]) => (
              <button
                key={placement}
                onClick={() => setSelectedAngle(placement)}
                className={`overflow-hidden rounded-lg border-2 transition ${
                  selectedAngle === placement ? "border-brand-600" : "border-black/10"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={ANGLE_LABELS[placement] || placement} className="h-16 w-16 object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div>
        <h1 className="text-2xl font-bold text-ink-900">{preview.productLabel}</h1>
        <p className="mt-2 text-xl font-semibold text-ink-700">${price.toFixed(2)} each</p>

        {isHat && (
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <Info className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              This design is embroidered. The preview color may not exactly match the finished
              product — embroidery thread colors can render slightly differently than shown.
            </span>
          </div>
        )}

        <div className="mt-6">
          <Label>Colors — pick as many as you want</Label>
          <div className="flex flex-wrap gap-2">
            {colorOptions.map((c) => (
              <button
                key={c.color}
                onClick={() => toggleColor(c.color)}
                title={c.color}
                className={`flex h-9 w-9 items-center justify-center rounded-full border-2 transition ${
                  selectedColors.includes(c.color) ? "border-brand-600" : "border-transparent"
                }`}
              >
                <span
                  className="flex h-full w-full items-center justify-center rounded-full border border-black/10"
                  style={{ backgroundColor: SWATCH_COLORS[c.color] || "#ccc" }}
                >
                  {selectedColors.includes(c.color) && (
                    <CheckCircle2
                      className="h-4 w-4"
                      style={{ color: c.color === "White" ? "#111" : "#fff" }}
                      strokeWidth={2.5}
                    />
                  )}
                </span>
              </button>
            ))}
          </div>
          <p className="mt-1.5 text-sm text-ink-500">
            {selectedColors.length > 0 ? selectedColors.join(", ") : "None selected"}
          </p>
        </div>

        <div className="mt-6">
          <Label>Sizes — pick as many as you want</Label>
          <div className="flex flex-wrap gap-2">
            {sizeOptions.map((size) => (
              <button
                key={size}
                onClick={() => toggleSize(size)}
                className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
                  selectedSizes.includes(size)
                    ? "border-brand-600 bg-brand-50 text-brand-700"
                    : "border-black/10 text-ink-600"
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 max-w-[140px]">
          <Label>Quantity (per color/size)</Label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="h-9 w-9 rounded-lg border border-black/10 text-ink-600"
            >
              −
            </button>
            <span className="w-8 text-center font-medium text-ink-900">{quantity}</span>
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.min(10, q + 1))}
              className="h-9 w-9 rounded-lg border border-black/10 text-ink-600"
            >
              +
            </button>
          </div>
        </div>

        {selectedColors.length > 0 && selectedSizes.length > 0 && (
          <p className="mt-4 text-sm text-ink-500">
            Adds {selectedColors.length * selectedSizes.length} combination
            {selectedColors.length * selectedSizes.length === 1 ? "" : "s"} · $
            {(selectedColors.length * selectedSizes.length * quantity * price).toFixed(2)} total
          </p>
        )}

        {error && (
          <div className="mt-6 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {added > 0 && !error && (
          <div className="mt-6 flex items-start gap-2 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-800">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            <span>Added {added} item{added === 1 ? "" : "s"} to your cart.</span>
          </div>
        )}

        <div className="mt-8 flex gap-3">
          <Button onClick={handleAddToCart} className="flex-1">
            Add to cart
          </Button>
          {added > 0 && (
            <Button variant="secondary" onClick={() => router.push("/shop/cart")}>
              View cart
            </Button>
          )}
        </div>

        <p className="mt-4 flex items-center gap-1.5 text-xs text-ink-500">
          <CheckCircle2 className="h-3.5 w-3.5 text-brand-600" />
          Made to order and shipped once your order is placed.
        </p>
      </div>
    </div>
  );
}
