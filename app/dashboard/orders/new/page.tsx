"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { AlertCircle, Package } from "lucide-react";

import { auth, db } from "@/app/lib/firebase";
import { Card, PageHeader } from "@/components/ui/Card";
import { Input, Label, Select } from "@/components/ui/Input";
import Button from "@/components/ui/Button";

interface CatalogVariant {
  id: number;
  name: string;
  size?: string;
  color?: string;
}

interface CatalogProduct {
  key: string;
  label: string;
  productId: number;
  productName: string;
  variants: CatalogVariant[];
}

export default function NewOrderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId") || "";

  const [designImageUrl, setDesignImageUrl] = useState("");
  const [projectName, setProjectName] = useState("");

  const [catalog, setCatalog] = useState<CatalogProduct[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [notConfigured, setNotConfigured] = useState(false);

  const [selectedProductKey, setSelectedProductKey] = useState("");
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(1);

  const [name, setName] = useState("");
  const [address1, setAddress1] = useState("");
  const [city, setCity] = useState("");
  const [stateCode, setStateCode] = useState("");
  const [zip, setZip] = useState("");
  const [countryCode, setCountryCode] = useState("US");

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadProject() {
      if (!projectId) return;
      const snap = await getDoc(doc(db, "projects", projectId));
      if (snap.exists()) {
        setDesignImageUrl(snap.data().designImageUrl || "");
        setProjectName(snap.data().name || "");
      }
    }

    async function loadCatalog() {
      try {
        const res = await fetch("/api/fulfillment/catalog");
        const data = await res.json();

        if (!res.ok) {
          if (data.notConfigured) setNotConfigured(true);
          setError(data.error || "Couldn't load products.");
          return;
        }

        setCatalog(data.products);
        if (data.products[0]) {
          setSelectedProductKey(data.products[0].key);
          setSelectedVariantId(data.products[0].variants[0]?.id ?? null);
        }
      } catch {
        setError("Couldn't load products.");
      } finally {
        setCatalogLoading(false);
      }
    }

    loadProject();
    loadCatalog();
  }, [projectId]);

  const selectedProduct = catalog.find((p) => p.key === selectedProductKey);

  async function handleSubmit() {
    const user = auth.currentUser;
    if (!user) return;

    if (!selectedVariantId || !name || !address1 || !city || !zip) {
      setError("Please fill in the product and shipping details.");
      return;
    }

    setError("");
    setSubmitting(true);

    try {
      const response = await fetch("/api/fulfillment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ownerId: user.uid,
          projectId,
          variantId: selectedVariantId,
          productName: selectedProduct?.productName,
          variantName: selectedProduct?.variants.find((v) => v.id === selectedVariantId)?.name,
          quantity,
          designImageUrl,
          recipient: {
            name,
            address1,
            city,
            state_code: stateCode,
            country_code: countryCode,
            zip,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.notConfigured) setNotConfigured(true);
        throw new Error(data.error || "Unable to create order.");
      }

      router.push("/dashboard/orders");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create order.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Manufacturing"
        title="Send to Manufacturing"
        description={projectName ? `Order a real, physical version of "${projectName}."` : "Order a real, physical product."}
      />

      {notConfigured ? (
        <Card className="flex flex-col items-center gap-4 px-8 py-20 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
            <Package className="h-7 w-7" strokeWidth={2} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-ink-900">Manufacturing isn&apos;t connected yet</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-ink-500">
              This needs a <code className="rounded bg-black/5 px-1.5 py-0.5">PRINTFUL_API_KEY</code> in the
              environment. Once that&apos;s added, this page creates real draft orders.
            </p>
          </div>
        </Card>
      ) : (
        <Card className="max-w-2xl p-8">
          <div className="space-y-6">
            {error && (
              <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {designImageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={designImageUrl}
                alt="Design"
                className="h-32 w-32 rounded-xl border border-black/10 object-cover"
              />
            )}

            {catalogLoading ? (
              <p className="text-sm text-ink-500">Loading products…</p>
            ) : (
              <>
                <div>
                  <Label>Product</Label>
                  <Select
                    value={selectedProductKey}
                    onChange={(e) => {
                      setSelectedProductKey(e.target.value);
                      const product = catalog.find((p) => p.key === e.target.value);
                      setSelectedVariantId(product?.variants[0]?.id ?? null);
                    }}
                  >
                    {catalog.map((p) => (
                      <option key={p.key} value={p.key}>
                        {p.label}
                      </option>
                    ))}
                  </Select>
                </div>

                {selectedProduct && (
                  <div>
                    <Label>Variant</Label>
                    <Select
                      value={selectedVariantId ?? ""}
                      onChange={(e) => setSelectedVariantId(Number(e.target.value))}
                    >
                      {selectedProduct.variants.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.name}
                        </option>
                      ))}
                    </Select>
                  </div>
                )}

                <div>
                  <Label>Quantity</Label>
                  <Input
                    type="number"
                    min={1}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                  />
                </div>
              </>
            )}

            <div className="border-t border-black/[0.06] pt-6">
              <h3 className="mb-4 text-sm font-semibold text-ink-900">Shipping to</h3>

              <div className="space-y-4">
                <Input placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} />
                <Input
                  placeholder="Street address"
                  value={address1}
                  onChange={(e) => setAddress1(e.target.value)}
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} />
                  <Input
                    placeholder="State / region code"
                    value={stateCode}
                    onChange={(e) => setStateCode(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input placeholder="ZIP / postal code" value={zip} onChange={(e) => setZip(e.target.value)} />
                  <Input
                    placeholder="Country code (e.g. US)"
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value.toUpperCase())}
                  />
                </div>
              </div>
            </div>

            <Button onClick={handleSubmit} disabled={submitting || catalogLoading} className="w-full">
              {submitting ? "Creating order…" : "Create draft order"}
            </Button>

            <p className="text-center text-xs text-ink-500">
              This creates a draft order — nothing is manufactured or charged until it&apos;s confirmed.
            </p>
          </div>
        </Card>
      )}
    </>
  );
}
