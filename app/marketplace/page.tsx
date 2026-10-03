import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "../../components/site-header";
import { ProductCard } from "../../components/product-card";
import { categories } from "../../lib/store-data";
import { getStoreProducts } from "../../lib/store-catalog";

export const metadata: Metadata = {
  title: "Marketplace",
  description: "Browse products and discover goods from the Caribbean Star Store marketplace.",
  alternates: { canonical: "/marketplace" },
  openGraph: {
    type: "website",
    siteName: "Caribbean Star Store",
    title: "Marketplace | Caribbean Star Store",
    description: "Browse products and discover goods from the Caribbean Star Store marketplace.",
  
    images: [{ url: "/opengraph-image", alt: "Caribbean Star Store — Connecting communities worldwide" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Marketplace | Caribbean Star Store",
    description: "Browse products and discover goods from the Caribbean Star Store marketplace.",
  
    images: ["/twitter-image"],
  },
};

type PageProps = {
  searchParams: Promise<{ q?: string; category?: string; page?: string }>;
};

type MarketplaceResultsProps = {
  query: string;
  category: string;
  page: number;
};

async function MarketplaceResults({ query, category, page }: MarketplaceResultsProps) {
  const catalog = await getStoreProducts({ search: query || undefined, category: category || undefined, page });
  const totalPages = catalog.totalPages;
  function pageHref(targetPage: number) {
    const next = new URLSearchParams();
    if (query) next.set("q", query);
    if (category) next.set("category", category);
    next.set("page", String(targetPage));
    return "/marketplace?" + next.toString();
  }
  const products = catalog.products;
  const heading = category || "All products";

  return (
    <section className="listing-area">
      <div className="breadcrumbs"><Link href="/">Home</Link> › Marketplace</div>
      <div className="listing-head">
        <div><h1>{heading}</h1><p>{catalog.status === "unavailable" ? "Explore product categories while the catalog is being prepared." : catalog.status === "not-found" && category ? "This category is not available in the marketplace yet." : catalog.totalProducts === 0 ? "0 published products" : "Showing " + ((page - 1) * 48 + 1) + "–" + Math.min(page * 48, catalog.totalProducts) + " of " + catalog.totalProducts + " published products"}</p></div>
        <form className="catalog-search" action="/marketplace" role="search">
          {category && <input type="hidden" name="category" value={category} />}
          <label className="visually-hidden" htmlFor="marketplace-query">Search products</label>
          <input id="marketplace-query" name="q" defaultValue={query} maxLength={80} placeholder="Search products" />
          <button className="identity-submit" type="submit">Search</button>
        </form>
      </div>
      {products.length ? (
        <div className="product-grid listing-grid">{products.map((product) => <ProductCard product={product} key={product.slug} />)}</div>
      ) : (
        <div className="catalog-empty">
          <p>{catalog.status === "unavailable" ? "Product listings are temporarily unavailable. Explore other sections while we restore the catalog." : catalog.status === "not-found" && category ? "This category is not available in the marketplace yet." : query || category ? "No published products match this search." : "No product listings have been published yet. Sellers can apply to add the first products to the marketplace."}</p>
          <div className="cart-empty-actions">
            {query || category
              ? <Link className="identity-submit" href="/marketplace">Clear search and filters</Link>
              : <Link className="identity-submit" href="/sell">Start selling products</Link>}
            <Link className="identity-secondary" href="/businesses">Explore businesses</Link>
            <Link className="identity-secondary" href="/opportunities">View jobs &amp; real estate</Link>
          </div>
          <div className="store-section">
            <div className="section-title">
              <div><span>EXPLORE</span><h2>Browse product categories</h2></div>
            </div>
            <div className="category-grid">
              {categories.map((item) => (
                <Link className="category-card" href={"/marketplace?category=" + encodeURIComponent(item.name)} key={item.name}>
                  <img src={item.image} alt="" loading="lazy" decoding="async" />
                  <div><b>{item.name}</b></div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
      {catalog.status === "available" && totalPages > 1 && (
        <nav className="catalog-pagination" aria-label="Product pages">
          {page > 1 ? <Link href={pageHref(page - 1)} rel="prev">Previous</Link> : <span aria-disabled="true">Previous</span>}
          <span aria-current="page">Page {page} of {totalPages}</span>
          {page < totalPages ? <Link href={pageHref(page + 1)} rel="next">Next</Link> : <span aria-disabled="true">Next</span>}
        </nav>
      )}
    </section>
  );
}

function ProductCategoryIcon({ categoryKey }: { categoryKey: string }) {
  const common = {
    width: 18,
    height: 18,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
    focusable: false as const,
  };

  switch (categoryKey) {
    case "electronics-appliances":
      return <svg {...common}><rect x="3" y="4" width="18" height="13" rx="2" /><path d="M8 21h8M12 17v4" /></svg>;
    case "home-living":
      return <svg {...common}><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-6v-7h-4v7H4a1 1 0 0 1-1-1V10Z" /></svg>;
    case "clothing-fashion":
      return <svg {...common}><path d="m8 4 4 2 4-2 4 3-2 5-3-1v9H9v-9l-3 1-2-5 4-3Z" /></svg>;
    case "beauty-wellness":
      return <svg {...common}><path d="M12 3v3m0 12v3M3 12h3m12 0h3M5.6 5.6l2.1 2.1m8.6 8.6 2.1 2.1m0-12.8-2.1 2.1m-8.6 8.6-2.1 2.1" /><circle cx="12" cy="12" r="4" /></svg>;
    case "vehicles-parts":
      return <svg {...common}><path d="m5 11 1.5-4.5A2 2 0 0 1 8.4 5h7.2a2 2 0 0 1 1.9 1.5L19 11l2 2v5h-2v-2H5v2H3v-5l2-2Z" /><path d="M5 11h14M7 13h.01M17 13h.01" /></svg>;
    default:
      return <svg {...common}><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M8 9h8M8 13h8M8 17h5" /></svg>;
  }
}

function MarketplaceFallback({ query, category }: Pick<MarketplaceResultsProps, "query" | "category">) {
  return (
    <section className="listing-area" aria-busy="true">
      <div className="breadcrumbs"><Link href="/">Home</Link> › Marketplace</div>
      <div className="listing-head">
        <div><h1>{category || "All products"}</h1><p>Checking the live store catalog.</p></div>
        <form className="catalog-search" action="/marketplace" role="search">
          {category && <input type="hidden" name="category" value={category} />}
          <label className="visually-hidden" htmlFor="marketplace-query">Search products</label>
          <input id="marketplace-query" name="q" defaultValue={query} maxLength={80} placeholder="Search products" />
          <button className="identity-submit" type="submit">Search</button>
        </form>
      </div>
      <div className="catalog-empty" role="status"><p>Loading published products. You can explore the rest of the marketplace while the catalog responds.</p></div>
    </section>
  );
}

export default async function Marketplace({ searchParams }: PageProps) {
  const params = await searchParams;
  const query = params.q?.trim().slice(0, 80) || "";
  const category = params.category?.trim() || "";
  const parsedPage = Number(params.page);
  const page = Number.isInteger(parsedPage) && parsedPage > 0 ? Math.min(parsedPage, 9999) : 1;

  return (
    <>
      <SiteHeader />
      <main id="main-content" tabIndex={-1} className="market-layout">
        <aside className="category-sidebar">
          <b>Product categories</b>
          <Link href="/marketplace">All products</Link>
          {categories.map((item) => <Link href={"/marketplace?category=" + encodeURIComponent(item.name)} key={item.name} style={{ display: "flex", alignItems: "center", gap: 8 }}><ProductCategoryIcon categoryKey={item.key} />{item.name}</Link>)}
        </aside>
        <Suspense fallback={<MarketplaceFallback query={query} category={category} />}>
          <MarketplaceResults query={query} category={category} page={page} />
        </Suspense>
      </main>
    </>
  );
}
