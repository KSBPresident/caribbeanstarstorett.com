"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { Product } from "../lib/store-data";

export type CartLine = { product: Product; quantity: number };
type CartContextValue = {
  items: CartLine[];
  ready: boolean;
  addItem: (product: Product) => void;
  setQuantity: (slug: string, quantity: number) => void;
  removeItem: (slug: string) => void;
};

const STORAGE_KEY = "caribbean-star-store-cart-v1";
const MAX_QUANTITY = 99;
const CartContext = createContext<CartContextValue | null>(null);

function isProduct(value: unknown): value is Product {
  if (!value || typeof value !== "object") return false;
  const product = value as Partial<Product>;
  const validId = typeof product.id === "string"
    ? /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(product.id)
    : typeof product.id === "number" && Number.isInteger(product.id);
  return validId &&
    typeof product.slug === "string" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(product.slug) &&
    typeof product.name === "string" &&
    typeof product.category === "string" &&
    typeof product.price === "number" && Number.isFinite(product.price) && product.price >= 0 &&
    typeof product.currency === "string" && /^[A-Z]{3}$/.test(product.currency) &&
    typeof product.currencyMinorUnit === "number" && Number.isInteger(product.currencyMinorUnit) && product.currencyMinorUnit >= 0 && product.currencyMinorUnit <= 4 &&
    typeof product.rating === "number" && typeof product.reviews === "number" &&
    typeof product.image === "string" && (product.image.startsWith("/") || product.image.startsWith("https://")) &&
    typeof product.inStock === "boolean" &&
    (product.quantityAvailable === undefined || (Number.isInteger(product.quantityAvailable) && product.quantityAvailable >= 0)) &&
    typeof product.description === "string";
}

function readCart(): CartLine[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value)) return [];
    return value.flatMap((entry: unknown) => {
      if (!entry || typeof entry !== "object") return [];
      const line = entry as Partial<CartLine>;
      if (!isProduct(line.product) || typeof line.quantity !== "number" || !Number.isInteger(line.quantity)) return [];
      const stockLimit = line.product.quantityAvailable ?? MAX_QUANTITY;
      const quantity = Math.min(MAX_QUANTITY, stockLimit, line.quantity);
      return line.product.inStock && quantity > 0 ? [{ product: line.product, quantity }] : [];
    });
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setItems(readCart());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // The cart still works for the current page when browser storage is unavailable.
    }
  }, [items, ready]);

  const value = useMemo<CartContextValue>(() => ({
    items,
    ready,
    addItem(product) {
      if (!ready || !product.inStock) return;
      setItems((current) => {
        const existing = current.find((line) => line.product.slug === product.slug);
        if (existing && existing.quantity >= (product.quantityAvailable ?? MAX_QUANTITY)) return current;
        if (existing) return current.map((line) => line.product.slug === product.slug
          ? { ...line, quantity: Math.min(MAX_QUANTITY, product.quantityAvailable ?? MAX_QUANTITY, line.quantity + 1) }
          : line);
        return [...current, { product, quantity: 1 }];
      });
    },
    setQuantity(slug, quantity) {
      if (!Number.isFinite(quantity)) return;
      const nextQuantity = Math.min(MAX_QUANTITY, Math.floor(quantity));
      setItems((current) => nextQuantity < 1
        ? current.filter((line) => line.product.slug !== slug)
        : current.map((line) => line.product.slug === slug
          ? { ...line, quantity: Math.min(nextQuantity, line.product.quantityAvailable ?? MAX_QUANTITY) }
          : line));
    },
    removeItem(slug) {
      setItems((current) => current.filter((line) => line.product.slug !== slug));
    },
  }), [items, ready]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside CartProvider");
  return context;
}
