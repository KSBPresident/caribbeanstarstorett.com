import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "../../components/site-header";
import { ProductCard } from "../../components/product-card";
import { categories } from "../../lib/store-data";
import { getStoreProducts } from "../../lib/wordpress-store";

export const metadata: Metadata = {
  title: "Marketplace",
  description: "Browse products and discover goods from the Caribbean Star Store TT marketplace.",
  openGraph: {
    type: "website",
    siteName: "Caribbean Star Store TT",
    title: "Marketplace | Caribbean Star Store TT",
    description: "Browse products and discover goods from the Caribbean Star Store TT marketplace.",
  },
  twitter: {
    card: "summary",
    title: "Marketplace | Caribbean Star Store TT",
    description: "Browse products and discover goods from the Caribbean Star Store TT marketplace.",
  },
};

type PageProps = {
  searchParams: Promise<{ q?: string; category?: string; page?: string }>;
};

export default async function Marketplace({ searchParams }: PageProps) {
  const params = await searchParams;
  const query = params.q?.trim().slice(0, 80) || "";
  const category = params.category?.trim() || "";
  const parsedPage = Number(params.page);
  const page = Number.isInteger(parsedPage) && parsedPage > 0 ? Math.min(parsedPage, 9999) : 1;
  const catalog = await getStoreProducts({ search: query || undefined, category: category || undefined, page });
  const totalPages = catalog.totalPages;
  function pageHref(targetPage: number) {
    const next = new URLSearchParams();
    if (query) next.set("q", query);
    if (category) next.set("category", category);
    next.set("page", String(targetPage));
    return `/marketplace?${next.toString()}`;
  }
  const products = catalog.products;
  const heading = category || "All products";

  return (
    <>
      <SiteHeader />
      <main className="market-layout">
        <aside className="category-sidebar">
          <b>Product categories</b>
          <Link href="/marketplace">All products</Link>
          {categories.map((item) => <Link href={`/marketplace?category=${encodeURIComponent(item.name)}`} key={item.name}>{item.icon} {item.name}</Link>)}
        </aside>
        <section className="listing-area">
          <div className="breadcrumbs"><Link href="/">Home</Link> › Marketplace</div>
          <div className="listing-head">
            <div><h1>{heading}</h1><p>{catalog.status === "unavailable" ? "The product catalog is being prepared for launch." : catalog.status === "not-found" && category ? "This category is not available in the marketplace yet." : catalog.totalProducts === 0 ? "0 published products" : `Showing ${(page - 1) * 48 + 1}–${Math.min(page * 48, catalog.totalProducts)} of ${catalog.totalProducts} published products`}</p></div>
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
              <p>{catalog.status === "unavailable" ? "The product catalog is being prepared for launch. You can still explore Caribbean businesses, jobs, and real estate while this section is completed." : catalog.status === "not-found" && category ? "This category is not available in the marketplace yet." : query || category ? "No published products match this search." : "No published products are available yet."}</p>
              {catalog.status === "unavailable" && (
                <div className="cart-empty-actions"><Link className="identity-submit" href="/businesses">Explore businesses</Link><Link className="identity-secondary" href="/opportunities">View jobs &amp; real estate</Link></div>
              )}
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
      </main>
    </>
  );
}
