export interface CartItem {
  catalogId: string;
  printfulSyncVariantId: number;
  productLabel: string;
  color: string;
  size: string;
  price: number;
  thumbnailUrl: string;
  quantity: number;
}

const STORAGE_KEY = "verdant-cart";
const CART_EVENT = "verdant-cart-changed";
const EMPTY_CART: CartItem[] = [];
const MAX_QUANTITY_PER_ITEM = 10;

function clampQuantity(quantity: number): number {
  return Math.max(1, Math.min(MAX_QUANTITY_PER_ITEM, quantity));
}

function read(): CartItem[] {
  if (typeof window === "undefined") return EMPTY_CART;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CartItem[]) : EMPTY_CART;
  } catch {
    return EMPTY_CART;
  }
}

// useSyncExternalStore requires getSnapshot to return a stable reference when
// nothing has changed, so we cache the parsed array and only refresh it when
// the underlying storage is actually written to (by us or another tab).
let cache: CartItem[] = read();

function write(items: CartItem[]) {
  cache = items;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent(CART_EVENT));
}

export function getCart(): CartItem[] {
  return cache;
}

export function getServerCart(): CartItem[] {
  return EMPTY_CART;
}

export function subscribeCart(callback: () => void) {
  const onExternalChange = () => {
    cache = read();
    callback();
  };
  window.addEventListener(CART_EVENT, onExternalChange);
  window.addEventListener("storage", onExternalChange);
  return () => {
    window.removeEventListener(CART_EVENT, onExternalChange);
    window.removeEventListener("storage", onExternalChange);
  };
}

export function addToCart(newItems: CartItem[]) {
  const cart = [...read()];

  for (const item of newItems) {
    const existingIndex = cart.findIndex(
      (c) => c.catalogId === item.catalogId && c.printfulSyncVariantId === item.printfulSyncVariantId
    );
    if (existingIndex >= 0) {
      const merged = cart[existingIndex].quantity + item.quantity;
      cart[existingIndex] = { ...cart[existingIndex], quantity: clampQuantity(merged) };
    } else {
      cart.push({ ...item, quantity: clampQuantity(item.quantity) });
    }
  }

  write(cart);
}

export function updateCartItemQuantity(printfulSyncVariantId: number, quantity: number) {
  const cart = read().map((c) =>
    c.printfulSyncVariantId === printfulSyncVariantId ? { ...c, quantity: clampQuantity(quantity) } : c
  );
  write(cart);
}

export function removeFromCart(printfulSyncVariantId: number) {
  write(read().filter((c) => c.printfulSyncVariantId !== printfulSyncVariantId));
}

export function clearCart() {
  write([]);
}

export function cartCount(items: CartItem[]): number {
  return items.reduce((sum, i) => sum + i.quantity, 0);
}
