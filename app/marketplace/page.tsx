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
          {categories.map((item) => <Link href={"/marketplace?category=" + encodeURIComponent(item.name)} key={item.name}>{item.icon} {item.name}</Link>)}
        </aside>
        <Suspense fallback={<MarketplaceFallback query={query} category={category} />}>
          <MarketplaceResults query={query} category={category} page={page} />
        </Suspense>
      </main>
    </>
  );
}
