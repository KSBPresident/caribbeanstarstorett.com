import type { Product } from "./store-data";

type CatalogStatus = "available" | "unavailable" | "not-found";

type StoreApiCategory = { id: number; name: string; slug: string; count?: number };

type StoreApiProduct = {
  id: number;
  name: string;
  slug: string;
  permalink: string;
  short_description?: string;
  description?: string;
  categories?: Array<{ name: string }>;
  images?: Array<{ src: string; alt?: string }>;
  prices?: { price?: string; currency_code?: string; currency_minor_unit?: number };
  average_rating?: string;
  review_count?: number;
  is_in_stock?: boolean;
};

const baseUrl = (process.env.WORDPRESS_BASE_URL || "https://caribbeanstarstorett.com").replace(/\/$/, "");
const apiPath = (process.env.WORDPRESS_STORE_API_PATH || "/wp-json/wc/store/v1").replace(/\/$/, "");

export function getOriginalStoreUrl() {
  return baseUrl;
}

function plainText(value: string | undefined) {
  return (value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#039;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function safePermalink(candidate: string | undefined, slug: string) {
  try {
    const base = new URL(baseUrl);
    const link = new URL(candidate || `/product/${slug}/`, base);
    return link.hostname === base.hostname ? link.toString() : new URL(`/product/${slug}/`, base).toString();
  } catch {
    return `${baseUrl}/product/${slug}/`;
  }
}

function mapProduct(raw: StoreApiProduct): Product | null {
  const minorUnit = Math.max(0, Math.min(4, raw.prices?.currency_minor_unit ?? 2));
  const rawPrice = Number(raw.prices?.price);
  if (!raw.id || !raw.slug || !raw.name || !Number.isFinite(rawPrice) || rawPrice < 0) return null;

  return {
    id: raw.id,
    slug: raw.slug,
    name: plainText(raw.name),
    category: plainText(raw.categories?.[0]?.name || "General"),
    price: rawPrice / 10 ** minorUnit,
    currency: raw.prices?.currency_code || "TTD",
    currencyMinorUnit: minorUnit,
    rating: Math.max(0, Number(raw.average_rating) || 0),
    reviews: Math.max(0, Number(raw.review_count) || 0),
    image: raw.images?.[0]?.src || "/product-placeholder.svg",
    permalink: safePermalink(raw.permalink, raw.slug),
    inStock: raw.is_in_stock !== false,
    description: plainText(raw.short_description || raw.description),
  };
}

function normalizeCategory(value: string) {
  return value.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

async function getStoreCategorySlug(name: string): Promise<{ slug: string | null; status: CatalogStatus }> {
  try {
    const url = new URL(`${apiPath}/products/categories`, baseUrl);
    url.searchParams.set("per_page", "100");
    url.searchParams.set("hide_empty", "true");
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(8_000),
    });
    if (response.status === 404) return { slug: null, status: "not-found" };
    if (!response.ok) return { slug: null, status: "unavailable" };
    const data = await response.json();
    if (!Array.isArray(data)) return { slug: null, status: "unavailable" };
    const requested = normalizeCategory(name);
    const match = (data as StoreApiCategory[]).find((item) =>
      normalizeCategory(item.name) === requested || item.slug === requested
    );
    return match?.slug
      ? { slug: match.slug, status: "available" }
      : { slug: null, status: "not-found" };
  } catch {
    return { slug: null, status: "unavailable" };
  }
}

async function requestProducts(path: string): Promise<{ response: Response | null; status: CatalogStatus }> {
  try {
    const response = await fetch(new URL(`${apiPath}/products${path}`, baseUrl), {
      headers: { Accept: "application/json" },
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(8_000),
    });
    if (response.status === 404) return { response, status: "not-found" };
    if (!response.ok) return { response: null, status: "unavailable" };
    return { response, status: "available" };
  } catch {
    return { response: null, status: "unavailable" };
  }
}

export async function getStoreProducts(options: { search?: string; category?: string } = {}) {
  const query = new URLSearchParams({ per_page: "48", orderby: "popularity", order: "desc" });
  if (options.search) query.set("search", options.search.slice(0, 100));
  if (options.category) {
    const category = await getStoreCategorySlug(options.category.slice(0, 100));
    if (!category.slug) return { products: [] as Product[], status: category.status };
    query.set("category", category.slug);
  }
  const { response, status } = await requestProducts(`?${query.toString()}`);
  if (!response) return { products: [] as Product[], status };
  try {
    const data = await response.json();
    if (!Array.isArray(data)) return { products: [] as Product[], status: "unavailable" as const };
    const products = data.flatMap((item: StoreApiProduct) => {
      const product = mapProduct(item);
      return product ? [product] : [];
    });
    return { products, status: "available" as const };
  } catch {
    return { products: [] as Product[], status: "unavailable" as const };
  }
}

export async function getStoreProductBySlug(slug: string): Promise<{ product: Product | null; status: CatalogStatus }> {
  const safeSlug = slug.replace(/[^a-z0-9-]/gi, "").slice(0, 160);
  if (!safeSlug) return { product: null, status: "not-found" };
  const { response, status } = await requestProducts(`/${encodeURIComponent(safeSlug)}`);
  if (status === "not-found") return { product: null, status };
  if (!response) return { product: null, status };
  try {
    const data = await response.json();
    if (!data || typeof data !== "object" || Array.isArray(data)) return { product: null, status: "not-found" };
    return { product: mapProduct(data as StoreApiProduct), status: "available" };
  } catch {
    return { product: null, status: "unavailable" };
  }
}
