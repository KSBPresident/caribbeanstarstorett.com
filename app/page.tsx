import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { SiteHeader } from "../components/site-header";
import { ProductCard } from "../components/product-card";
import { categories } from "../lib/store-data";
import { getStoreProducts } from "../lib/store-catalog";

export const metadata: Metadata = {
  title: "The Caribbean's Digital Marketplace",
  description:
    "Discover products, services, Caribbean businesses, jobs, and real estate in one marketplace connecting communities across the Caribbean.",
  alternates: { canonical: "/" },
};

const structuredData = [
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Caribbean Star Store",
    url: "https://www.caribbeanstarstorett.com",
    logo: "https://www.caribbeanstarstorett.com/caribbean-star-store-logo.svg",
    description:
      "A Caribbean marketplace for products, services, businesses, jobs, and real-estate opportunities.",
    areaServed: { "@type": "Place", name: "Caribbean" },
  },
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Caribbean Star Store",
    url: "https://www.caribbeanstarstorett.com",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: "https://www.caribbeanstarstorett.com/search?q={search_term_string}",
      },
      "query-input": "required name=search_term_string",
    },
  },
];

async function FeaturedProducts() {
  const catalog = await getStoreProducts({ perPage: 4 });

  return (
    <section className="store-section">
      <div className="section-title"><div><span>PRODUCT MARKETPLACE</span><h2>Available products</h2></div><Link href="/marketplace">View all →</Link></div>
      {catalog.products.length ? (
        <div className="product-grid">{catalog.products.slice(0, 4).map((product) => <ProductCard product={product} key={product.slug} />)}</div>
      ) : (
        <div className="catalog-empty">
          <p>{catalog.status === "unavailable" ? "Product listings are being prepared. You can explore Caribbean businesses, jobs, and real estate in the meantime." : "There are no published product listings yet."}</p>
          {catalog.status === "unavailable" && (
            <div className="cart-empty-actions">
              <Link className="identity-submit" href="/businesses">Explore businesses</Link>
              <Link className="identity-secondary" href="/opportunities">View jobs &amp; real estate</Link>
              <Link className="identity-secondary" href="/sell">Learn how to sell</Link>
              
            </div>
          )}
        </div>
      )}
    </section>
  );
}

export default function Home() {
  return (
    <>
      <SiteHeader />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
        }}
      />
      <main id="main-content" tabIndex={-1}>
        <section className="home-hero">
          <div className="hero-overlay">
            <span className="hero-kicker">BUY · SELL · WORK · GROW TOGETHER</span>
            <h1>The Caribbean&apos;s<br />Digital Marketplace</h1>
            <p>Buy · Sell · Work · Grow Together</p>
            <form className="hero-search" role="search" action="/search">
              <input name="q" maxLength={80} placeholder="Search products, services, businesses..." aria-label="Search the marketplace" />
              <button type="submit">Search</button>
            </form>
            <Link href="/how-it-works" className="identity-submit" style={{ display: "inline-block", marginTop: 14 }}>New here? See how it works →</Link>
          </div>
        </section>
        <section className="quick-grid">
          {[["🛒","Products","Browse marketplace products","/marketplace"],["♧","Services","Find local services","/businesses?category=professional"],["▦","Businesses","Support local & regional","/businesses"],["♙","Jobs","Find work or hire","/opportunities?type=jobs"],["⌂","Real Estate","Buy, rent, invest","/opportunities?type=real-estate"],["✦","More","Explore all categories","/marketplace"]].map(([icon,label,description,href]) => (
            <Link href={href} className="quick-card" key={label}><span aria-hidden="true">{icon}</span><b>{label}</b><small>{description}</small></Link>
          ))}
        </section>
        <section className="store-section">
          <div className="section-title"><div><span>DISCOVER</span><h2>Featured Categories</h2></div><Link href="/marketplace">View all →</Link></div>
          <div className="category-grid">
            {categories.map((category) => <Link href={"/marketplace?category=" + encodeURIComponent(category.name)} className="category-card" key={category.name}><img src={category.image} alt="" loading="lazy" decoding="async" /><div><b>{category.name}</b></div></Link>)}
          </div>
        </section>
        <Suspense fallback={
          <section className="store-section" aria-busy="true">
            <div className="section-title"><div><span>PRODUCT MARKETPLACE</span><h2>Available products</h2></div><Link href="/marketplace">View all →</Link></div>
            <div className="catalog-empty" role="status"><p>Checking the live store catalog. You can explore the rest of the marketplace while it loads.</p></div>
          </section>
        }>
          <FeaturedProducts />
        </Suspense>
      </main>
    </>
  );
}
