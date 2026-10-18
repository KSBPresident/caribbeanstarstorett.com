import type { Product } from "./store-data";
import { categories } from "./store-data";

export type InventoryProductRow = {
  id: string;
  organization_id: string;
  slug: string;
  name: string;
  category_key: string;
  price: number | string;
  seller_shipping_fee?: number | string;
  currency: string;
  quantity_available: number;
  image_url: string;
  description: string;
};

export function inventoryRowToProduct(row: InventoryProductRow): Product {
  return {
    id: row.id,
    organizationId: row.organization_id,
    slug: row.slug,
    name: row.name,
    category: categories.find((category) => category.key === row.category_key)?.name || "Marketplace",
    price: Number(row.price),
    sellerShippingFee: Number(row.seller_shipping_fee || 0),
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
