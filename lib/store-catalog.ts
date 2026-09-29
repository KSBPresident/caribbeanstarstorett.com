import type { Product } from "./store-data";

type CatalogStatus = "available" | "unavailable" | "not-found";

export async function getStoreProducts(_options: {
  search?: string;
  category?: string;
  page?: number;
  perPage?: number;
} = {}) {
  return {
    products: [] as Product[],
    status: "unavailable" as CatalogStatus,
    totalProducts: 0,
    totalPages: 1,
  };
}

export async function getStoreProductBySlug(_slug: string) {
  return {
    product: null as Product | null,
    status: "unavailable" as CatalogStatus,
  };
}
