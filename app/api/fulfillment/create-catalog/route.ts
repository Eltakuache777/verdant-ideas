import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";

import { adminDb } from "@/app/lib/firebase-admin";
import { requireAdmin, authErrorResponse } from "@/app/lib/apiAuth";
import {
  printfulConfigured,
  getCatalogProductVariants,
  createSyncProduct,
  getSyncProduct,
  createMockupTask,
  getMockupTask,
  CATALOG_PRODUCT_DEFINITIONS,
  type CatalogVariant,
  type PrintPosition,
} from "@/app/lib/printful";

interface Selection {
  productKey: string;
  color: string;
  // Simple case: one image used for every placement the product defines.
  designImageUrl?: string;
  // Advanced case: per-asset images, e.g. { main: "...", sleeveText: "..." }.
  images?: { main?: string; sleeveText?: string };
}

interface PrintfulSyncVariant {
  id: number;
  variant_id: number;
  size?: string;
  synced: boolean;
}

interface PrintfulSyncProductDetail {
  sync_variants: PrintfulSyncVariant[];
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForSync(
  syncProductId: number,
  attempts = 6,
  delayMs = 2000
): Promise<PrintfulSyncProductDetail> {
  for (let i = 0; i < attempts; i++) {
    const detail = await getSyncProduct(syncProductId);
    const allSynced = (detail.sync_variants || []).every((v: PrintfulSyncVariant) => v.synced);
    if (allSynced) return detail;
    await sleep(delayMs);
  }
  return getSyncProduct(syncProductId);
}

async function generateMockups(params: {
  printfulProductId: number;
  variantId: number;
  files: { placement: string; imageUrl: string; position: PrintPosition }[];
}): Promise<Record<string, string>> {
  const task = await createMockupTask(params);
  const taskKey = task.task_key;

  for (let i = 0; i < 10; i++) {
    const poll = await getMockupTask(taskKey);
    if (poll.status === "completed") {
      const byPlacement: Record<string, string> = {};
      for (const m of poll.mockups || []) {
        byPlacement[m.placement] = m.mockup_url;
      }
      return byPlacement;
    }
    if (poll.status === "failed") return {};
    await sleep(2500);
  }

  return {};
}

export async function POST(req: NextRequest) {
  if (!printfulConfigured()) {
    return NextResponse.json(
      { error: "Manufacturing isn't connected yet. Add PRINTFUL_API_KEY to enable it.", notConfigured: true },
      { status: 501 }
    );
  }

  try {
    const ownerId = await requireAdmin(req);

    const { projectId, selections } = (await req.json()) as {
      projectId: string;
      selections: Selection[];
    };

    const validSelections =
      selections?.filter((s) => s.designImageUrl || s.images?.main) ?? [];

    if (validSelections.length === 0) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    if (projectId) {
      const projectSnap = await adminDb.collection("projects").doc(projectId).get();
      if (!projectSnap.exists || projectSnap.data()?.ownerId !== ownerId) {
        return NextResponse.json({ error: "Project not found." }, { status: 404 });
      }
    }

    const results: { productKey: string; color: string; catalogId: string; mockupUrl: string }[] = [];
    const errors: { productKey: string; color: string; error: string }[] = [];

    // Cache catalog product variants per productKey so we don't refetch per color.
    const variantCache = new Map<string, CatalogVariant[]>();

    let isFirst = true;
    for (const selection of validSelections) {
      // Printful's API (especially the mockup generator) rate-limits aggressively.
      // Pace requests out instead of firing the whole batch back to back.
      if (!isFirst) await sleep(25000);
      isFirst = false;

      try {
        const definition = CATALOG_PRODUCT_DEFINITIONS.find((p) => p.key === selection.productKey);
        if (!definition) throw new Error(`Unknown product type: ${selection.productKey}`);

        const realColor = definition.colorMap[selection.color];
        if (!realColor) {
          throw new Error(`"${selection.color}" isn't offered for ${definition.label}.`);
        }

        const mainImageUrl = selection.images?.main || selection.designImageUrl!;
        const sleeveTextUrl = selection.images?.sleeveText || mainImageUrl;

        const assetUrls: Record<string, string> = {
          main: mainImageUrl,
          sleeveText: sleeveTextUrl,
        };

        let variants = variantCache.get(selection.productKey);
        if (!variants) {
          variants = await getCatalogProductVariants(definition.printfulProductId);
          variantCache.set(selection.productKey, variants);
        }

        const colorVariants = variants.filter(
          (v) => (v.color || "").toLowerCase() === realColor.toLowerCase()
        );

        if (colorVariants.length === 0) {
          throw new Error(`No "${realColor}" variants found for ${definition.label}.`);
        }

        const retailPrice = definition.defaultPrice.toFixed(2);

        const placementFiles = definition.placements.map((p) => ({
          placement: p.placement,
          url: assetUrls[p.asset || "main"],
        }));

        const created = await createSyncProduct({
          name: `${definition.label} - ${selection.color}`,
          threadColors: definition.threadColors,
          variants: colorVariants.map((v) => ({
            variantId: v.id,
            retailPrice,
            files: placementFiles,
          })),
        });

        const syncProductId = created.id;
        const detail = await waitForSync(syncProductId);

        const sizeVariants = (detail.sync_variants || []).map((v: PrintfulSyncVariant) => ({
          size: v.size || "",
          printfulSyncVariantId: v.id,
          printfulVariantId: v.variant_id,
        }));

        // Generate real mockup images for every placement (representative size).
        const representative = colorVariants.find((v) => v.size === "M") || colorVariants[0];

        const mockupsByPlacement = await generateMockups({
          printfulProductId: definition.printfulProductId,
          variantId: representative.id,
          files: definition.placements.map((p) => ({
            placement: p.placement,
            imageUrl: assetUrls[p.asset || "main"],
            position: p.position,
          })),
        });

        const primaryPlacement = definition.placements[0].placement;
        const mockupUrl = mockupsByPlacement[primaryPlacement] || Object.values(mockupsByPlacement)[0] || "";

        const catalogId = randomUUID();

        await adminDb
          .collection("catalogProducts")
          .doc(catalogId)
          .set({
            id: catalogId,
            ownerId,
            projectId: projectId || "",
            productKey: definition.key,
            productLabel: definition.label,
            color: selection.color,
            price: definition.defaultPrice,
            printfulSyncProductId: syncProductId,
            mockupUrl,
            mockupsByPlacement,
            designImageUrl: mainImageUrl,
            variants: sizeVariants,
            createdAt: new Date(),
          });

        results.push({ productKey: definition.key, color: selection.color, catalogId, mockupUrl });
      } catch (err) {
        console.error(`Catalog creation failed for ${selection.productKey}/${selection.color}:`, err);
        errors.push({
          productKey: selection.productKey,
          color: selection.color,
          error: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }

    return NextResponse.json({ results, errors });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error(error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to create catalog." },
      { status: 500 }
    );
  }
}
