import Link from "next/link";
import { SiteHeader } from "../../components/site-header";
import { ProductCard } from "../../components/product-card";
import { createClient } from "../../lib/supabase/server";
import { getStoreProducts } from "../../lib/wordpress-store";

type SearchParams = Promise<{ q?: string }>;

function marketplaceSearchFilter(query: string, columns: string[]) {
  const escaped = query
    .replace(/[\\%_]/g, (character) => "\\" + character)
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"');
  const pattern = `"%${escaped}%"`;
  return columns.map((column) => `${column}.ilike.${pattern}`).join(",");
}

export default async function SearchPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const query = (params.q || "").trim().slice(0, 80);
  const canSearch = query.length >= 2;
  const supabase = await createClient();

  const businessFilter = marketplaceSearchFilter(query, ["display_name", "summary", "category_key", "region"]);
  const listingFilter = marketplaceSearchFilter(query, ["title", "description", "organization_name", "location"]);
  const [catalog, businessResult, listingResult] = canSearch
    ? await Promise.all([
        getStoreProducts({ search: query }),
        supabase.from("organization_public_profiles")
          .select("slug, display_name, summary, category_key, region", { count: "exact" })
          .eq("is_published", true)
          .or(businessFilter)
          .order("updated_at", { ascending: false })
          .limit(100),
        supabase.from("organization_marketplace_listings")
          .select("slug, organization_name, listing_type, title, description, location, salary_details, property_price", { count: "exact" })
          .eq("is_published", true)
          .or(listingFilter)
          .order("updated_at", { ascending: false })
          .limit(100),
      ])
    : [null, null, null];

  const businesses = businessResult?.data || [];
  const opportunities = listingResult?.data || [];
  const products = catalog?.products || [];
  const sourcesUnavailable = Boolean(
    catalog?.status === "unavailable" || businessResult?.error || listingResult?.error
  );
  const matchCount =
    (catalog?.totalProducts ?? products.length) +
    (businessResult?.count ?? businesses.length) +
    (listingResult?.count ?? opportunities.length);

  return (
    <>
      <SiteHeader />
      <main className="identity-page directory-page">
        <header className="directory-hero">
          <span className="identity-eyebrow">CARIBBEAN STAR STORE · MARKETPLACE SEARCH</span>
          <h1>Find it across the marketplace.</h1>
          <p>Search products, local businesses and services, jobs, and real estate in one place.</p>
          <form action="/search" className="directory-search" role="search">
            <label className="visually-hidden" htmlFor="site-search">Search the marketplace</label>
            <input id="site-search" name="q" type="search" defaultValue={query} maxLength={80} placeholder="What are you looking for?" />
            <button className="identity-submit" type="submit">Search</button>
          </form>
        </header>

        {!canSearch ? (
          <section className="directory-empty">
            <span aria-hidden="true">⌕</span>
            <h2>{query ? "Enter at least 2 characters to search" : "Search the Caribbean marketplace"}</h2>
            <p>One search looks across products, services, businesses, job openings, and real estate.</p>
            <div className="directory-hero-actions">
              <Link className="identity-submit" href="/marketplace">Browse products</Link>
              <Link className="directory-secondary" href="/businesses">Explore businesses</Link>
              <Link className="directory-secondary" href="/opportunities">View jobs &amp; real estate</Link>
            </div>
          </section>
        ) : (
          <>
            <section className="directory-results">
              <div className="directory-results-heading">
                <div><span className="identity-eyebrow">SEARCH RESULTS</span><h2>Results for “{query}”</h2></div>
                <span>{sourcesUnavailable ? "Some results unavailable" : `${matchCount} matches`}</span>
              </div>
              {catalog?.status === "unavailable" && (
                <div className="catalog-empty">
                  <strong>Product results are not available yet while the catalog is being prepared.</strong>
                  <p>You can still search businesses and opportunities while product listings are added to the marketplace.</p>
                  <div className="cart-empty-actions"><Link className="identity-submit" href="/businesses">Explore businesses</Link><Link className="identity-secondary" href="/opportunities">View opportunities</Link></div>
                </div>
              )}
              {businessResult?.error && <div className="catalog-empty">Business results are temporarily unavailable.</div>}
              {listingResult?.error && <div className="catalog-empty">Job and real-estate results are temporarily unavailable.</div>}
            </section>

            {products.length > 0 && (
              <section className="store-section">
                <div className="section-title"><div><span>PRODUCTS</span><h2>Marketplace listings</h2></div><Link href={`/marketplace?q=${encodeURIComponent(query)}`}>View products →</Link></div>
                <div className="product-grid">{products.slice(0, 8).map((product) => <ProductCard product={product} key={product.slug} />)}</div>
              </section>
            )}

            {businesses.length > 0 && (
              <section className="directory-results">
                <div className="directory-results-heading"><div><span className="identity-eyebrow">BUSINESSES &amp; SERVICES</span><h2>Local and regional businesses</h2></div><Link href={`/businesses?q=${encodeURIComponent(query)}`}>View all →</Link></div>
                <div className="directory-grid">
                  {businesses.slice(0, 8).map((item) => (
                    <article className="directory-card" key={item.slug}>
                      <div className="directory-card-meta"><span>{item.category_key.replaceAll("-", " ")}</span><span>{item.region}</span></div>
                      <h3><Link href={`/businesses/${item.slug}`}>{item.display_name}</Link></h3>
                      <p>{item.summary}</p>
                      <Link className="directory-card-link" href={`/businesses/${item.slug}`}>View business profile →</Link>
                    </article>
                  ))}
                </div>
              </section>
            )}

            {opportunities.length > 0 && (
              <section className="directory-results">
                <div className="directory-results-heading"><div><span className="identity-eyebrow">JOBS &amp; REAL ESTATE</span><h2>Opportunities</h2></div><Link href={`/opportunities?q=${encodeURIComponent(query)}`}>View all →</Link></div>
                <div className="directory-grid">
                  {opportunities.slice(0, 8).map((item) => (
                    <article className="directory-card opportunity-card" key={item.slug}>
                      <div className="directory-card-meta"><span>{item.listing_type === "jobs" ? "Job opening" : "Real estate"}</span><span>{item.location}</span></div>
                      <h3><Link href={`/opportunities/${item.slug}`}>{item.title}</Link></h3>
                      <p>{item.description}</p>
                      <div className="opportunity-publisher">{item.organization_name}</div>
                      {(item.salary_details || item.property_price) && <strong className="opportunity-price">{item.salary_details || item.property_price}</strong>}
                      <Link className="directory-card-link" href={`/opportunities/${item.slug}`}>View listing →</Link>
                    </article>
                  ))}
                </div>
              </section>
            )}

            {!products.length && !businesses.length && !opportunities.length && !businessResult?.error && !listingResult?.error && (
              <section className="directory-empty">
                <span aria-hidden="true">✦</span>
                <h2>{catalog?.status === "unavailable" ? "No matching public listings yet" : `No matches for “${query}”`}</h2>
                <p>{catalog?.status === "unavailable" ? "No published businesses, services, jobs, or real-estate listings matched. Product results will appear when the catalog is ready." : "Try a different word or browse the marketplace sections."}</p>
                <div className="directory-hero-actions"><Link className="identity-submit" href="/marketplace">Browse products</Link><Link className="directory-secondary" href="/businesses">Explore businesses</Link><Link className="directory-secondary" href="/opportunities">View opportunities</Link></div>
              </section>
            )}
          </>
        )}
      </main>
    </>
  );
}
