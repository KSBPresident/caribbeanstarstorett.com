import Link from "next/link";
import { SiteHeader } from "../../components/site-header";
import { createClient } from "../../lib/supabase/server";

type SearchParams = Promise<{ q?: string; type?: string }>;

export default async function OpportunitiesPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const query = (params.q || "").trim().slice(0, 80);
  const requestedType = params.type || "";
  const type = requestedType === "jobs" || requestedType === "real-estate" ? requestedType : "";
  const supabase = await createClient();
  const { data, error } = await supabase.from("organization_marketplace_listings")
    .select("slug, organization_name, listing_type, title, description, location, employment_type, salary_details, property_type, property_price, updated_at")
    .eq("is_published", true)
    .order("updated_at", { ascending: false })
    .limit(100);

  const listings = (data || []).filter((item) => {
    const matchesType = !type || item.listing_type === type;
    const haystack = `${item.title} ${item.description} ${item.organization_name} ${item.location}`.toLowerCase();
    return matchesType && (!query || haystack.includes(query.toLowerCase()));
  });

  return (
    <>
      <SiteHeader />
      <main className="identity-page opportunities-page">
        <header className="directory-hero">
          <span className="identity-eyebrow">CARIBBEAN STAR STORE · OPPORTUNITIES</span>
          <h1>Find work and places to call home.</h1>
          <p>Explore jobs and real estate posted by Caribbean organizations. Contact each publisher directly for current details.</p>
          <div className="directory-hero-actions"><Link className="identity-submit" href="/build-a-buy?category=jobs">Request what you need</Link><Link className="directory-secondary" href="/business">Post a listing</Link></div>
        </header>

        <section className="directory-toolbar">
          <form action="/opportunities" className="directory-search">
            <label className="visually-hidden" htmlFor="opportunity-search">Search jobs and real estate</label>
            <input id="opportunity-search" name="q" type="search" defaultValue={query} placeholder="Search titles, organizations, and areas" />
            {type && <input type="hidden" name="type" value={type} />}
            <button className="identity-submit" type="submit">Search</button>
          </form>
          <nav className="directory-categories" aria-label="Opportunity categories">
            <Link className={!type ? "selected" : ""} href="/opportunities">All opportunities</Link>
            <Link className={type === "jobs" ? "selected" : ""} href="/opportunities?type=jobs">Jobs</Link>
            <Link className={type === "real-estate" ? "selected" : ""} href="/opportunities?type=real-estate">Real estate</Link>
          </nav>
        </section>

        <section className="directory-results">
          <div className="directory-results-heading"><div><span className="identity-eyebrow">PUBLISHED LISTINGS</span><h2>{type === "jobs" ? "Jobs" : type === "real-estate" ? "Real estate" : "Jobs & real estate"}</h2></div><span>{error ? "Count unavailable" : `${listings.length} ${listings.length === 1 ? "listing" : "listings"}`}</span></div>
          {error ? (
            <div className="catalog-empty"><strong>Listings are temporarily unavailable.</strong><br />Please try again shortly.</div>
          ) : listings.length ? (
            <div className="directory-grid">
              {listings.map((item) => (
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
          ) : (
            <div className="directory-empty">
              <span aria-hidden="true">✦</span>
              <h3>{query || type ? "No matching listings yet" : "No published listings yet"}</h3>
              <p>{query || type ? "Try another search or category. Only published listings appear here." : "Organizations can publish job openings and property listings from their workspace."}</p>
              <Link className="identity-submit" href="/business">Create an organization listing</Link>
            </div>
          )}
        </section>
      </main>
    </>
  );
}
