"use client";

import { useState } from "react";
import type { Product } from "../lib/store-data";
import { useCart } from "./cart-provider";

export function AddToCartButton({ product, className = "add-cart" }: { product: Product; className?: string }) {
  const { addItem, ready } = useCart();
  const [added, setAdded] = useState(false);

  function handleAdd() {
    addItem(product);
    setAdded(true);
  }

  return (
    <button className={className} type="button" onClick={handleAdd} disabled={!ready || !product.inStock} aria-live="polite">
      {!product.inStock ? "Check availability" : added ? "Added to cart" : "Add to cart"}
    </button>
  );
}
