const PRINTFUL_BASE_URL = "https://api.printful.com";

export function printfulConfigured() {
  return Boolean(process.env.PRINTFUL_API_KEY);
}

export async function printfulFetch(path: string, options: RequestInit = {}) {
  const apiKey = process.env.PRINTFUL_API_KEY;

  if (!apiKey) {
    throw new Error("PRINTFUL_NOT_CONFIGURED");
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (process.env.PRINTFUL_STORE_ID) {
    headers["X-PF-Store-Id"] = process.env.PRINTFUL_STORE_ID;
  }

  const response = await fetch(`${PRINTFUL_BASE_URL}${path}`, { ...options, headers });

  // The body isn't guaranteed to be JSON (a gateway error or outage can
  // return an HTML/empty body) — parse defensively so that case surfaces as
  // a normal error instead of an uncaught JSON-parse exception.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let data: any = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const message = data?.error?.message || (typeof data?.result === "string" ? data.result : null) || `Printful request failed (${response.status}).`;
    throw new Error(message);
  }

  return data?.result;
}

// A small, well-known set of blank products to search the live catalog for.
// Real variant IDs are resolved from Printful's own catalog at request time —
// nothing here is a fabricated ID.
export const CURATED_PRODUCT_SEARCHES = [
  { key: "tshirt", label: "T-Shirt", match: /unisex.*(t-shirt|tee)/i },
  { key: "hoodie", label: "Hoodie", match: /unisex.*hoodie/i },
  { key: "mug", label: "Mug", match: /mug/i },
  { key: "hat", label: "Hat", match: /twill cap|dad hat|snapback/i },
];

// Products offered for the "turn into ready-to-print products" catalog feature.
// Printful catalog IDs and exact color strings were verified live against the
// real catalog — each product only carries whichever colors it actually offers,
// so the canonical label maps to that product's real color name.
export const CATALOG_COLORS = ["Forest Green", "Black", "Heather Gray", "White"];

export interface PrintPosition {
  area_width: number;
  area_height: number;
  width: number;
  height: number;
  top: number;
  left: number;
}

export interface PlacementDefinition {
  placement: string;
  position: PrintPosition;
  // Which uploaded asset to use for this placement: "main" (the full logo the
  // user supplied) or "sleeveText" (a secondary asset, e.g. a rotated wordmark
  // for sleeve prints). Defaults to "main" when omitted.
  asset?: "main" | "sleeveText";
}

export interface CatalogProductDefinition {
  key: string;
  label: string;
  defaultPrice: number;
  printfulProductId: number;
  colorMap: Record<string, string>;
  placements: PlacementDefinition[];
  threadColors?: string[];
}

export const CATALOG_PRODUCT_DEFINITIONS: CatalogProductDefinition[] = [
  {
    key: "tshirt",
    label: "T-Shirt",
    defaultPrice: 28,
    printfulProductId: 71, // Unisex Staple T-Shirt | Bella + Canvas 3001
    colorMap: {
      "Forest Green": "Forest",
      Black: "Black",
      "Heather Gray": "Athletic Heather",
      White: "White",
    } as Record<string, string>,
    placements: [
      {
        placement: "front",
        // Small stacked logo (icon on top, wordmark below) in the upper-right
        // corner (classic left-chest spot) — verified live against the real
        // front printfile (1800x2400).
        position: { area_width: 1800, area_height: 2400, width: 600, height: 600, top: 200, left: 1050 },
      },
      {
        placement: "back",
        // Large centered stacked logo on the back — verified live.
        position: { area_width: 1800, area_height: 2400, width: 1300, height: 1300, top: 350, left: 250 },
      },
    ],
  },
  {
    key: "long-sleeve",
    label: "Long Sleeve Shirt",
    defaultPrice: 34,
    printfulProductId: 356, // Unisex Long Sleeve Tee | Bella + Canvas 3501
    colorMap: {
      "Forest Green": "Heather Forest",
      Black: "Black",
      "Heather Gray": "Athletic Heather",
      White: "White",
    } as Record<string, string>,
    placements: [
      {
        placement: "front",
        // Small stacked logo, same as T-Shirt — verified live.
        position: { area_width: 1800, area_height: 2400, width: 600, height: 600, top: 200, left: 1050 },
      },
      {
        placement: "back",
        // Large centered stacked logo, same as T-Shirt — verified live.
        position: { area_width: 1800, area_height: 2400, width: 1300, height: 1300, top: 350, left: 250 },
      },
      {
        placement: "sleeve_left",
        // Sleeve printfile is 450x1800 — verified live. Vertical wordmark.
        position: { area_width: 450, area_height: 1800, width: 250, height: 1250, top: 300, left: 100 },
        asset: "sleeveText",
      },
      {
        placement: "sleeve_right",
        position: { area_width: 450, area_height: 1800, width: 250, height: 1250, top: 300, left: 100 },
        asset: "sleeveText",
      },
    ],
  },
  {
    key: "hat",
    label: "Hat",
    defaultPrice: 26,
    printfulProductId: 252, // Retro Trucker Hat | Yupoong 6606
    colorMap: {
      "Forest Green": "Evergreen",
      Black: "Black",
      "Heather Gray": "Dark Heather Gray",
      White: "White",
    } as Record<string, string>,
    placements: [
      {
        placement: "embroidery_front_large",
        // Embroidery area is 675x675 — verified live. Stacked logo (icon on
        // top, wordmark below) fits this square area far better than the
        // wide side-by-side layout did.
        position: { area_width: 675, area_height: 675, width: 600, height: 600, top: 37, left: 37 },
      },
    ],
    // Flat-color logo variants only ever use green + gray (dark logo) or
    // green + black (light logo) — list all three as allowed thread colors.
    // Verified accepted by the real order-creation API.
    threadColors: ["#01784E", "#96A1A8", "#000000"],
  },
];

export async function createMockupTask(params: {
  printfulProductId: number;
  variantId: number;
  files: { placement: string; imageUrl: string; position: PrintPosition }[];
}) {
  return printfulFetch(`/mockup-generator/create-task/${params.printfulProductId}`, {
    method: "POST",
    body: JSON.stringify({
      variant_ids: [params.variantId],
      format: "png",
      files: params.files.map((f) => ({
        placement: f.placement,
        image_url: f.imageUrl,
        position: f.position,
      })),
    }),
  });
}

export async function getMockupTask(taskKey: string) {
  return printfulFetch(`/mockup-generator/task?task_key=${encodeURIComponent(taskKey)}`);
}

export interface CatalogVariant {
  id: number;
  name: string;
  size?: string;
  color?: string;
}

export async function getCatalogProductVariants(productId: number): Promise<CatalogVariant[]> {
  const detail = await printfulFetch(`/products/${productId}`);
  return detail.variants || [];
}

export async function createSyncProduct(params: {
  name: string;
  thumbnail?: string;
  threadColors?: string[];
  variants: {
    variantId: number;
    retailPrice: string;
    files: { placement: string; url: string }[];
  }[];
}) {
  // Embroidery placements require an explicit file type matching the placement,
  // plus a thread-color option scoped to that same placement (e.g. placement
  // "embroidery_front_large" -> option id "thread_colors_front_large") —
  // verified live against the real API's error messages.
  const embroideryPlacement = params.variants[0]?.files.find((f) =>
    f.placement.startsWith("embroidery_")
  )?.placement;
  const threadOptionId = embroideryPlacement
    ? `thread_colors_${embroideryPlacement.replace(/^embroidery_/, "")}`
    : undefined;
  const variantOptions =
    params.threadColors && threadOptionId
      ? [{ id: threadOptionId, value: params.threadColors }]
      : undefined;

  return printfulFetch("/store/products", {
    method: "POST",
    body: JSON.stringify({
      sync_product: { name: params.name, thumbnail: params.thumbnail },
      sync_variants: params.variants.map((v) => ({
        variant_id: v.variantId,
        retail_price: v.retailPrice,
        files: v.files.map((f) => ({
          url: f.url,
          type: f.placement,
        })),
        ...(variantOptions ? { options: variantOptions } : {}),
      })),
    }),
  });
}

export async function getSyncProduct(id: number) {
  return printfulFetch(`/store/products/${id}`);
}

export interface PrintfulRecipient {
  name: string;
  address1: string;
  city: string;
  state_code: string;
  country_code: string;
  zip: string;
}

export async function createStoreOrder(params: {
  items: { syncVariantId: number; quantity: number }[];
  recipient: PrintfulRecipient;
  confirm: boolean;
}) {
  return printfulFetch("/orders", {
    method: "POST",
    body: JSON.stringify({
      recipient: params.recipient,
      items: params.items.map((i) => ({
        sync_variant_id: i.syncVariantId,
        quantity: i.quantity,
      })),
      confirm: params.confirm,
    }),
  });
}

export async function createDraftOrder(params: {
  variantId: number;
  quantity: number;
  designImageUrl: string;
  recipient: PrintfulRecipient;
}) {
  return printfulFetch("/orders", {
    method: "POST",
    body: JSON.stringify({
      recipient: params.recipient,
      items: [
        {
          variant_id: params.variantId,
          quantity: params.quantity,
          files: [{ url: params.designImageUrl }],
        },
      ],
      confirm: false, // draft — does not enter production or charge until confirmed
    }),
  });
}
