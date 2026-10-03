"use client";

import { useState } from "react";
import { categories } from "../lib/store-data";

const guidance: Record<string, { title: string; details: string }> = {
  "electronics-appliances": { title: "Help buyers check compatibility", details: "Include brand, model, condition, included accessories, and compatible devices or power requirements where relevant." },
  "groceries-food": { title: "Give clear package and safety details", details: "Include package size, ingredients or materials, allergens where applicable, storage directions, and any printed dates buyers should check." },
  "home-living": { title: "Show fit and setup details", details: "Include dimensions, materials, condition, assembly needs, and what is included in the sale." },
  "clothing-fashion": { title: "Make sizing easy to compare", details: "Include labeled size, measurements when available, material, color, fit, and condition." },
  "beauty-wellness": { title: "Describe the item precisely", details: "Include size or quantity, ingredients where applicable, packaging condition, and only claims supported by the product label." },
  "vehicles-parts": { title: "Confirm fit before buyers order", details: "Include part number, make, model, year, side or position, condition, and known fitment details." },
};

export function ProductCategoryField({ defaultValue }: { defaultValue: string }) {
  const [categoryKey, setCategoryKey] = useState(defaultValue);
  const selected = guidance[categoryKey] ?? guidance["electronics-appliances"];

  return (
    <>
      <label>
        Product category
        <select name="categoryKey" value={categoryKey} onChange={(event) => setCategoryKey(event.target.value)} required>
          {categories.map((category) => <option key={category.key} value={category.key}>{category.name}</option>)}
        </select>
      </label>
      <p className="product-category-guidance" aria-live="polite">
        <strong>{selected.title}</strong>
        {selected.details} Add these details to the description so customers can compare accurately.
      </p>
    </>
  );
}
