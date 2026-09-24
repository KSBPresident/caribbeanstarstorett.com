import Link from "next/link";
import { SiteHeader } from "../../components/site-header";
import { ProductCard } from "../../components/product-card";
import { categories } from "../../lib/store-data";
import { getStoreProducts } from "../../lib/wordpress-store";

type PageProps = {
  searchParams: Promise<{ q?: string; category?: string }>;
};

export default async function Marketplace({ searchParams }: PageProps) {
  const params = await searchParams;
  const query = params.q?.trim() || "";
  const category = params.category?.trim() || "";
  const catalog = await getStoreProducts({ search: query || undefined });
  const products = category
    ? catalog.products.filter((product) => product.category.toLowerCase().includes(category.toLowerCase()))
    : catalog.products;
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
            <div><h1>{heading}</h1><p>{catalog.status === "unavailable" ? "The live store could not be reached." : `${products.length} published ${products.length === 1 ? "product" : "products"}`}</p></div>
            <form className="catalog-search" action="/marketplace" role="search">
              {category && <input type="hidden" name="category" value={category} />}
              <label className="visually-hidden" htmlFor="marketplace-query">Search products</label>
              <input id="marketplace-query" name="q" defaultValue={query} placeholder="Search products" />
              <button className="identity-submit" type="submit">Search</button>
            </form>
          </div>
          {products.length ? (
            <div className="product-grid listing-grid">{products.map((product) => <ProductCard product={product} key={product.slug} />)}</div>
          ) : (
            <p className="catalog-empty">{catalog.status === "unavailable" ? "The product catalog is temporarily unavailable. Please try again later." : query || category ? "No published products match this search." : "No published products are available yet."}</p>
          )}
        </section>
      </main>
    </>
  );
}
