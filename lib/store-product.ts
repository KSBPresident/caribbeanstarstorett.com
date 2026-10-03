import type { Product } from "./store-data";
import { categories } from "./store-data";

export type InventoryProductRow = {
  id: string;
  slug: string;
  name: string;
  category_key: string;
  price: number | string;
  currency: string;
  quantity_available: number;
  image_url: string;
  description: string;
};

export function inventoryRowToProduct(row: InventoryProductRow): Product {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    category: categories.find((category) => category.key === row.category_key)?.name || "Marketplace",
    price: Number(row.price),
    currency: row.currency,
    currencyMinorUnit: 2,
    rating: 0,
    reviews: 0,
    image: row.image_url,
    inStock: row.quantity_available > 0,
    quantityAvailable: row.quantity_available,
    description: row.description,
  };
}
