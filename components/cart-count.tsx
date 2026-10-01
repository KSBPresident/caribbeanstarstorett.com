"use client";

import { useCart } from "./cart-provider";

export function CartCount() {
  const { items, ready } = useCart();
  if (!ready) return null;
  const count = items.reduce((total, line) => total + line.quantity, 0);
  return count ? <span className="cart-count" role="status" aria-live="polite" aria-label={`${count} items in cart`}>{count}</span> : null;
}
