import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { SiteHeader } from "../components/site-header";
import { ProductCard } from "../components/product-card";
import { categories } from "../lib/store-data";
import { getStoreProducts } from "../lib/store-catalog";

export const metadata: Metadata = {
  title: "The Global Marketplace | Caribbean Star Store",
  description:
    "Discover products, services, businesses, jobs, and real estate in one international marketplace.",
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
      "An international marketplace for products, services, businesses, jobs, and real-estate opportunities.",
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
          <p>{catalog.status === "unavailable" ? "Product listings are being prepared. You can explore businesses, jobs, and real estate in the meantime." : "There are no published product listings yet."}</p>
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

const quickLinks = [
  { icon: "products", label: "Products", description: "Browse marketplace products", href: "/marketplace" },
  { icon: "services", label: "Services", description: "Find services", href: "/businesses?category=professional" },
  { icon: "businesses", label: "Businesses", description: "Discover businesses", href: "/businesses" },
  { icon: "jobs", label: "Jobs", description: "Find work or hire", href: "/opportunities?type=jobs" },
  { icon: "property", label: "Real Estate", description: "Buy, rent, invest", href: "/opportunities?type=real-estate" },
  { icon: "more", label: "More", description: "Explore all categories", href: "/marketplace" },
] as const;

type QuickIconName = (typeof quickLinks)[number]["icon"];

function QuickIcon({ name }: { name: QuickIconName }) {
  const common = {
    width: 30,
    height: 30,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
    focusable: false as const,
  };

  switch (name) {
    case "products":
      return <svg {...common}><path d="M3 4h2l2.2 10.8a2 2 0 0 0 2 1.6h8.7a2 2 0 0 0 1.9-1.5L22 8H6" /><circle cx="10" cy="20" r="1.2" /><circle cx="18" cy="20" r="1.2" /></svg>;
    case "services":
      return <svg {...common}><path d="M4 19.5 14.6 8.9" /><path d="m13.3 5.4 2-2a4 4 0 0 0 5.3 5.3l-2 2-4.1.6-5.2 5.2a2.1 2.1 0 0 1-3-3l5.2-5.2.8-2.9Z" /></svg>;
    case "businesses":
      return <svg {...common}><path d="M3 21h18M5 21V8l7-4 7 4v13M9 10h.01M15 10h.01M9 14h.01M15 14h.01M10 21v-3h4v3" /></svg>;
    case "jobs":
      return <svg {...common}><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18M10 12v2h4v-2" /></svg>;
    case "property":
      return <svg {...common}><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-6v-7h-4v7H4a1 1 0 0 1-1-1V10Z" /><path d="M8 9h.01M16 9h.01" /></svg>;
    case "more":
      return <svg {...common}><rect x="3.5" y="3.5" width="6" height="6" rx="1" /><rect x="14.5" y="3.5" width="6" height="6" rx="1" /><rect x="3.5" y="14.5" width="6" height="6" rx="1" /><rect x="14.5" y="14.5" width="6" height="6" rx="1" /></svg>;
  }
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
            <h1>A Global<br />Marketplace</h1>
            <p>Buy · Sell · Work · Grow Together</p>
            <form className="hero-search" role="search" action="/search">
              <input name="q" maxLength={80} placeholder="Search products, services, businesses..." aria-label="Search the marketplace" />
              <button type="submit">Search</button>
            </form>
            <Link href="/how-it-works" className="identity-submit" style={{ display: "inline-block", marginTop: 14 }}>New here? See how it works →</Link>
          </div>
        </section>
        <section className="quick-grid">
          {quickLinks.map(({ icon, label, description, href }) => (
            <Link href={href} className="quick-card" key={label}>
              <QuickIcon name={icon} />
              <b>{label}</b>
              <small>{description}</small>
            </Link>
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
