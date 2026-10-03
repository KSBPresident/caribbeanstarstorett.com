import type { MetadataRoute } from "next";
import { createClient } from "../lib/supabase/server";

const productionSite = "https://www.caribbeanstarstorett.com";
const MAX_ENTRIES_PER_TYPE = 16000;

export const revalidate = 3600;

const publicPages: MetadataRoute.Sitemap = [
  { url: productionSite, changeFrequency: "weekly", priority: 1 },
  { url: `${productionSite}/marketplace`, changeFrequency: "daily", priority: 0.9 },
  { url: `${productionSite}/auctions`, changeFrequency: "weekly", priority: 0.8 },
  { url: `${productionSite}/businesses`, changeFrequency: "daily", priority: 0.8 },
  { url: `${productionSite}/opportunities`, changeFrequency: "daily", priority: 0.8 },
  { url: `${productionSite}/sell`, changeFrequency: "monthly", priority: 0.7 },
  { url: `${productionSite}/about`, changeFrequency: "monthly", priority: 0.6 },
  { url: `${productionSite}/help`, changeFrequency: "monthly", priority: 0.6 },
  { url: `${productionSite}/privacy`, changeFrequency: "yearly", priority: 0.4 },
  { url: `${productionSite}/how-it-works`, changeFrequency: "monthly", priority: 0.6 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (process.env.VERCEL_ENV !== "production") return [];

  try {
    const supabase = await createClient();
    const [products, businesses, opportunities] = await Promise.all([
      supabase.from("inventory_items")
        .select("slug, updated_at")
        .eq("status", "published")
        .order("updated_at", { ascending: false })
        .limit(MAX_ENTRIES_PER_TYPE),
      supabase.from("organization_public_profiles")
        .select("slug, updated_at")
        .eq("is_published", true)
        .order("updated_at", { ascending: false })
        .limit(MAX_ENTRIES_PER_TYPE),
      supabase.from("organization_marketplace_listings")
        .select("slug, updated_at")
        .eq("is_published", true)
        .order("updated_at", { ascending: false })
        .limit(MAX_ENTRIES_PER_TYPE),
    ]);

    return [
      ...publicPages,
      ...(products.error ? [] : (products.data || []).map((product) => ({
        url: `${productionSite}/product/${encodeURIComponent(product.slug)}`,
        lastModified: product.updated_at,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      }))),
      ...(businesses.error ? [] : (businesses.data || []).map((business) => ({
        url: `${productionSite}/businesses/${encodeURIComponent(business.slug)}`,
        lastModified: business.updated_at,
        changeFrequency: "weekly" as const,
        priority: 0.6,
      }))),
      ...(opportunities.error ? [] : (opportunities.data || []).map((listing) => ({
        url: `${productionSite}/opportunities/${encodeURIComponent(listing.slug)}`,
        lastModified: listing.updated_at,
        changeFrequency: "weekly" as const,
        priority: 0.6,
      }))),
    ].slice(0, 50000);
  } catch {
    // Keep static public pages available if account services are temporarily unavailable.
    return publicPages;
  }
}
