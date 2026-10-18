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
      .select("id, organization_id, slug, name, category_key, price, currency, quantity_available, image_url, description", { count: "exact" })
      .eq("status", "published")
      .order("updated_at", { ascending: false });

    if (selectedCategory) request = request.eq("category_key", selectedCategory.key);
    const search = options.search?.trim().slice(0, 80);
    if (search) request = request.ilike("name", "%" + search.replace(/[\\%_]/g, "\\$&") + "%");

    const { data, count, error } = await request.range((page - 1) * perPage, page * perPage - 1);
    if (error) throw error;
    const totalProducts = count || 0;
    const products = (data || []).map((row) => inventoryRowToProduct(row as InventoryRow));
    const organizationIds = [...new Set(products.map((product) => product.organizationId).filter((id): id is string => Boolean(id)))];
    const { data: sellerProfiles } = organizationIds.length
      ? await supabase.from("organization_public_profiles")
          .select("organization_id, slug, display_name")
          .eq("is_published", true)
          .in("organization_id", organizationIds)
      : { data: [] };
    const sellerByOrganization = new Map((sellerProfiles || []).map((profile) => [profile.organization_id, profile]));
    return {
      products: products.map((product) => {
        const seller = product.organizationId ? sellerByOrganization.get(product.organizationId) : null;
        return { ...product, sellerName: seller?.display_name, sellerSlug: seller?.slug };
      }),
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
      .select("id, organization_id, slug, name, category_key, price, currency, quantity_available, image_url, description")
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle();
    if (error) throw error;
    if (!data) return { product: null as Product | null, sellerProfile: null, status: "not-found" as CatalogStatus };
    const product = inventoryRowToProduct(data as InventoryRow);
    const { data: sellerProfile } = await supabase.from("organization_public_profiles")
      .select("organization_id, slug, display_name, summary, category_key, region, contact_email, phone, website_url, seller_is_away, seller_away_message")
      .eq("organization_id", data.organization_id)
      .eq("is_published", true)
      .maybeSingle();
    return {
      product: { ...product, sellerName: sellerProfile?.display_name, sellerSlug: sellerProfile?.slug },
      sellerProfile,
      status: "available" as CatalogStatus,
    };
  } catch {
    return { product: null as Product | null, sellerProfile: null, status: "unavailable" as CatalogStatus };
  }
}
