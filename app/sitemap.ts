import type { MetadataRoute } from "next";

import { adminDb } from "@/app/lib/firebase-admin";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// New products are added live through the app, not through a redeploy, so
// refresh this hourly rather than freezing it at build time.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: baseUrl, changeFrequency: "monthly", priority: 1 },
    { url: `${baseUrl}/shop`, changeFrequency: "daily", priority: 0.9 },
  ];

  const snapshot = await adminDb.collection("catalogProducts").select("productKey").get();
  const productKeys = [
    ...new Set(snapshot.docs.map((d) => d.data().productKey).filter((key): key is string => Boolean(key))),
  ];

  const productRoutes: MetadataRoute.Sitemap = productKeys.map((productKey) => ({
    url: `${baseUrl}/shop/${productKey}`,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...staticRoutes, ...productRoutes];
}
