import { NextResponse } from "next/server";

import { printfulConfigured, printfulFetch, CURATED_PRODUCT_SEARCHES } from "@/app/lib/printful";

interface CatalogProduct {
  id: number;
  title: string;
}

interface CatalogVariant {
  id: number;
  name: string;
  size?: string;
  color?: string;
}

export async function GET() {
  if (!printfulConfigured()) {
    return NextResponse.json(
      { error: "Manufacturing isn't connected yet. Add PRINTFUL_API_KEY to enable it.", notConfigured: true },
      { status: 501 }
    );
  }

  try {
    const products: CatalogProduct[] = await printfulFetch("/products");

    const results = [];

    for (const search of CURATED_PRODUCT_SEARCHES) {
      const match = products.find((p) => search.match.test(p.title));
      if (!match) continue;

      const detail = await printfulFetch(`/products/${match.id}`);
      const variants: CatalogVariant[] = (detail.variants || []).slice(0, 12);

      results.push({
        key: search.key,
        label: search.label,
        productId: match.id,
        productName: match.title,
        variants: variants.map((v) => ({
          id: v.id,
          name: v.name,
          size: v.size,
          color: v.color,
        })),
      });
    }

    return NextResponse.json({ products: results });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Couldn't load the product catalog." }, { status: 500 });
  }
}
