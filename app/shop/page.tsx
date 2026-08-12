import type { Metadata } from "next";

import ShopClient from "./ShopClient";

export const metadata: Metadata = {
  title: "Shop — Verdant Lawn Care Merch",
  description:
    "Real, made-to-order Verdant Lawn Care merch — T-shirts, long sleeves, and hats printed and shipped when you order.",
  openGraph: {
    title: "Shop — Verdant Lawn Care Merch",
    description:
      "Real, made-to-order Verdant Lawn Care merch — T-shirts, long sleeves, and hats printed and shipped when you order.",
  },
};

export default function ShopPage() {
  return <ShopClient />;
}
