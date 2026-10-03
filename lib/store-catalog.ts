import type { Product } from "./store-data";
import { categories } from "./store-data";
import { inventoryRowToProduct, type InventoryProductRow } from "./store-product";
import { createClient } from "./supabase/server";

type CatalogStatus = "available" | "unavailable" | "not-found";

type InventoryRow = InventoryProductRow;

function isSafePage(page: number) {
  return Number.isInteger(page) && page > 0 ? Math.min(page, 9999) : 1;
}

export async function getStoreProducts(options: {
  search?: string;
  category?: string;
  page?: number;
  perPage?: number;
} = {}) {
  try {
    const supabase = await createClient();
    const page = isSafePage(options.page || 1);
    const perPage = Math.min(48, Math.max(1, options.perPage || 48));
    const category = options.category?.trim();
    const selectedCategory = category
      ? categories.find((item) => item.name.toLocaleLowerCase() === category.toLocaleLowerCase())
      : null;
    if (category && !selectedCategory) {
      return { products: [] as Product[], status: "not-found" as CatalogStatus, totalProducts: 0, totalPages: 1 };
    }

    let request = supabase
      .from("inventory_items")
      .select("id, slug, name, category_key, price, currency, quantity_available, image_url, description", { count: "exact" })
      .eq("status", "published")
      .order("updated_at", { ascending: false });

    if (selectedCategory) request = request.eq("category_key", selectedCategory.key);
    const search = options.search?.trim().slice(0, 80);
    if (search) request = request.ilike("name", "%" + search.replace(/[\\%_]/g, "\\$&") + "%");

    const { data, count, error } = await request.range((page - 1) * perPage, page * perPage - 1);
    if (error) throw error;
    const totalProducts = count || 0;
    return {
      products: (data || []).map((row) => inventoryRowToProduct(row as InventoryRow)),
      status: "available" as CatalogStatus,
      totalProducts,
      totalPages: Math.max(1, Math.ceil(totalProducts / perPage)),
    };
  } catch {
    return { products: [] as Product[], status: "unavailable" as CatalogStatus, totalProducts: 0, totalPages: 1 };
  }
}

export async function getStoreProductBySlug(slug: string) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("inventory_items")
      .select("id, slug, name, category_key, price, currency, quantity_available, image_url, description")
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle();
    if (error) throw error;
    return {
      product: data ? inventoryRowToProduct(data as InventoryRow) : null,
      status: data ? "available" as CatalogStatus : "not-found" as CatalogStatus,
    };
  } catch {
    return { product: null as Product | null, status: "unavailable" as CatalogStatus };
  }
}
