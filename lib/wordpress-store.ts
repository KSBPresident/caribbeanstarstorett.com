import type { Product } from "./store-data";

type CatalogStatus = "available" | "unavailable" | "not-found";

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

function logStoreApiFailure(operation: string, details: { status?: number; error?: unknown }) {
  console.warn("[wordpress-store] public Store API request failed", {
    operation,
    ...(details.status ? { httpStatus: details.status } : {}),
    ...(details.error
      ? { errorType: details.error instanceof Error ? details.error.name : "unknown" }
      : {}),
  });
}

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

async function requestProducts(path: string): Promise<{ response: Response | null; status: CatalogStatus }> {
  try {
    const response = await fetch(new URL(`${apiPath}/products${path}`, baseUrl), {
      headers: { Accept: "application/json" },
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(8_000),
    });
    if (response.status === 404) {
      if (path.startsWith("?")) logStoreApiFailure("product-collection", { status: response.status });
      return { response, status: "not-found" };
    }
    if (!response.ok) {
      logStoreApiFailure(path.startsWith("?") ? "product-collection" : "product-detail", { status: response.status });
      return { response: null, status: "unavailable" };
    }
    return { response, status: "available" };
  } catch (error) {
    logStoreApiFailure(path.startsWith("?") ? "product-collection" : "product-detail", { error });
    return { response: null, status: "unavailable" };
  }
}

export async function getStoreProducts(options: { search?: string; category?: string; page?: number } = {}) {
  const page = Number.isInteger(options.page) && (options.page || 0) > 0 ? options.page! : 1;
  const query = new URLSearchParams({ per_page: "48", orderby: "popularity", order: "desc", page: String(page) });
  if (options.search) query.set("search", options.search.slice(0, 100));
  if (options.category) {
    const categorySlug = normalizeCategory(options.category.slice(0, 100));
    if (!categorySlug) return { products: [] as Product[], status: "not-found" as const, totalPages: 1 };
    query.set("category", categorySlug);
  }
  const { response, status } = await requestProducts(`?${query.toString()}`);
  if (!response) return { products: [] as Product[], status, totalPages: 1 };
  const totalPages = Math.max(1, Number(response.headers.get("X-WP-TotalPages")) || 1);
  try {
    const data = await response.json();
    if (!Array.isArray(data)) {
      logStoreApiFailure("product-collection", { error: new TypeError("Unexpected response shape") });
      return { products: [] as Product[], status: "unavailable" as const, totalPages: 1 };
    }
    const products = data.flatMap((item: StoreApiProduct) => {
      const product = mapProduct(item);
      return product ? [product] : [];
    });
    return { products, status: "available" as const, totalPages };
  } catch (error) {
    logStoreApiFailure("product-collection-json", { error });
    return { products: [] as Product[], status: "unavailable" as const, totalPages: 1 };
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
  } catch (error) {
    logStoreApiFailure("product-detail-json", { error });
    return { product: null, status: "unavailable" };
  }
}
