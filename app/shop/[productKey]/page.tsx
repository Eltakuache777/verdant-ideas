import type { Metadata } from "next";

import { adminDb } from "@/app/lib/firebase-admin";
import ProductClient from "./ProductClient";

interface CatalogProduct {
  productLabel: string;
  price: number;
  mockupUrl: string;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ productKey: string }>;
}): Promise<Metadata> {
  const { productKey } = await params;

  const snap = await adminDb
    .collection("catalogProducts")
    .where("productKey", "==", productKey)
    .limit(1)
    .get();

  const product = snap.docs[0]?.data() as CatalogProduct | undefined;

  if (!product) {
    return { title: "Product not found — Verdant Shop" };
  }

  const title = `${product.productLabel} — Verdant Lawn Care Merch`;
  const description = `${product.productLabel} featuring the Verdant Lawn Care logo. From $${product.price.toFixed(2)}, made to order and shipped when you order.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: product.mockupUrl ? [product.mockupUrl] : undefined,
    },
  };
}

export default function ProductDetailPage() {
  return <ProductClient />;
}
