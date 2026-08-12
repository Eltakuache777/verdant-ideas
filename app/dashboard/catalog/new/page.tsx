"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { AlertCircle, CheckCircle2, Store } from "lucide-react";

import { auth, db } from "@/app/lib/firebase";
import { Card, PageHeader } from "@/components/ui/Card";
import Button from "@/components/ui/Button";

const PRODUCTS = [
  { key: "tshirt", label: "T-Shirt" },
  { key: "long-sleeve", label: "Long Sleeve Shirt" },
  { key: "hat", label: "Hat" },
];

const COLORS = ["Forest Green", "Black", "Heather Gray", "White"];

export default function NewCatalogPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId") || "";

  const [designImageUrl, setDesignImageUrl] = useState("");
  const [projectName, setProjectName] = useState("");
  const [loadingProject, setLoadingProject] = useState(true);

  const [selectedProducts, setSelectedProducts] = useState<string[]>(["tshirt"]);
  const [selectedColors, setSelectedColors] = useState<string[]>(["Black"]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<{ created: number; failed: number } | null>(null);

  useEffect(() => {
    async function loadProject() {
      if (!projectId) {
        setLoadingProject(false);
        return;
      }
      const snap = await getDoc(doc(db, "projects", projectId));
      if (snap.exists()) {
        setDesignImageUrl(snap.data().designImageUrl || "");
        setProjectName(snap.data().name || "");
      }
      setLoadingProject(false);
    }
    loadProject();
  }, [projectId]);

  function toggle(list: string[], setList: (v: string[]) => void, value: string) {
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  }

  async function handleSubmit() {
    const user = auth.currentUser;
    if (!user || !designImageUrl) return;

    if (selectedProducts.length === 0 || selectedColors.length === 0) {
      setError("Pick at least one product and one color.");
      return;
    }

    setError("");
    setSubmitting(true);
    setDone(null);

    const selections = selectedProducts.flatMap((productKey) =>
      selectedColors.map((color) => ({ productKey, color, designImageUrl }))
    );

    try {
      const response = await fetch("/api/fulfillment/create-catalog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ownerId: user.uid, projectId, selections }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to create catalog.");
      }

      setDone({ created: data.results?.length || 0, failed: data.errors?.length || 0 });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create catalog.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Manufacturing"
        title="Turn Into Ready-to-Print Products"
        description={
          projectName
            ? `Create real, orderable products from "${projectName}."`
            : "Create real, orderable products from your design."
        }
      />

      {loadingProject ? (
        <p className="text-sm text-ink-500">Loading…</p>
      ) : !designImageUrl ? (
        <Card className="px-8 py-16 text-center text-ink-500">
          This project doesn&apos;t have a design image attached yet. Add one from the project first.
        </Card>
      ) : done ? (
        <Card className="flex flex-col items-center gap-4 px-8 py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
            <CheckCircle2 className="h-7 w-7" strokeWidth={2} />
          </div>
          <h2 className="text-lg font-semibold text-ink-900">
            {done.created} product{done.created === 1 ? "" : "s"} created
          </h2>
          {done.failed > 0 && (
            <p className="text-sm text-red-600">{done.failed} combination(s) couldn&apos;t be created.</p>
          )}
          <Button onClick={() => router.push("/shop")} className="mt-2">
            View in shop
          </Button>
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

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={designImageUrl}
              alt="Design"
              className="h-32 w-32 rounded-xl border border-black/10 object-cover"
            />

            <div>
              <p className="mb-2 text-sm font-medium text-ink-800">Products</p>
              <div className="flex flex-wrap gap-2">
                {PRODUCTS.map((p) => (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => toggle(selectedProducts, setSelectedProducts, p.key)}
                    className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                      selectedProducts.includes(p.key)
                        ? "border-brand-600 bg-brand-50 text-brand-700"
                        : "border-black/10 text-ink-600"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm font-medium text-ink-800">Colors</p>
              <div className="flex flex-wrap gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => toggle(selectedColors, setSelectedColors, c)}
                    className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                      selectedColors.includes(c)
                        ? "border-brand-600 bg-brand-50 text-brand-700"
                        : "border-black/10 text-ink-600"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <p className="text-xs text-ink-500">
              This creates {selectedProducts.length * selectedColors.length} real product listing
              {selectedProducts.length * selectedColors.length === 1 ? "" : "s"} and can take a
              few minutes — each one is a real call to the manufacturer.
            </p>

            <Button onClick={handleSubmit} disabled={submitting} className="w-full">
              <Store className="mr-2 h-4 w-4" />
              {submitting ? "Creating products… this takes a few minutes" : "Create products"}
            </Button>
          </div>
        </Card>
      )}
    </>
  );
}
