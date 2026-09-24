import Link from "next/link";
import { SiteHeader } from "../components/site-header";
import { ProductCard } from "../components/product-card";
import { categories } from "../lib/store-data";
import { getOriginalStoreUrl, getStoreProducts } from "../lib/wordpress-store";

export default async function Home() {
  const catalog = await getStoreProducts();
  return (
    <>
      <SiteHeader />
      <main>
        <section className="home-hero">
          <div className="hero-overlay">
            <span className="hero-kicker">BUY · SELL · WORK · GROW TOGETHER</span>
            <h1>The Caribbean&apos;s<br />Digital Marketplace</h1>
            <p>Buy · Sell · Work · Grow Together</p>
            <form className="hero-search" role="search" action="/search">
              <input name="q" placeholder="Search products, services, businesses..." aria-label="Search the marketplace" />
              <button type="submit">Search</button>
            </form>
          </div>
        </section>
        <section className="quick-grid">
          {[["🛒","Products","Shop the live store catalog","/marketplace"],["♧","Services","Find local services","/businesses?category=professional"],["▦","Businesses","Support local & regional","/businesses"],["♙","Jobs","Find work or hire","/opportunities?type=jobs"],["⌂","Real Estate","Buy, rent, invest","/opportunities?type=real-estate"],["✦","More","Explore all categories","/marketplace"]].map(([icon,label,description,href]) => (
            <Link href={href} className="quick-card" key={label}><span>{icon}</span><b>{label}</b><small>{description}</small></Link>
          ))}
        </section>
        <section className="store-section">
          <div className="section-title"><div><span>DISCOVER</span><h2>Featured Categories</h2></div><Link href="/marketplace">View all →</Link></div>
          <div className="category-grid">
            {categories.map((category) => <Link href={`/marketplace?category=${encodeURIComponent(category.name)}`} className="category-card" key={category.name}><img src={category.image} alt="" /><div><b>{category.name}</b></div></Link>)}
          </div>
        </section>
        <section className="store-section">
          <div className="section-title"><div><span>FROM THE LIVE STORE</span><h2>Available products</h2></div><Link href="/marketplace">View all →</Link></div>
          {catalog.products.length ? (
            <div className="product-grid">{catalog.products.slice(0, 4).map((product) => <ProductCard product={product} key={product.slug} />)}</div>
          ) : (
            <div className="catalog-empty">
              <p>{catalog.status === "unavailable" ? "The live store catalog could not be reached just now. You can continue to the existing Caribbean Star Store website." : "There are no published products in the store catalog yet."}</p>
              {catalog.status === "unavailable" && (
                <a className="identity-submit" href={getOriginalStoreUrl()} target="_blank" rel="noopener noreferrer">Open the existing store</a>
              )}
            </div>
          )}
        </section>
      </main>
    </>
  );
}
