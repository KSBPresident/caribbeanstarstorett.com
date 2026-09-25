import Link from "next/link";
import { SiteHeader } from "../../components/site-header";
import { createClient } from "../../lib/supabase/server";

type SearchParams = Promise<{ q?: string; type?: string; page?: string }>;

const PAGE_SIZE = 12;

function marketplaceSearchFilter(query: string, columns: string[]) {
  const escaped = query
    .replace(/[\\%_]/g, (character) => "\\" + character)
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"');
  const pattern = `"%${escaped}%"`;
  return columns.map((column) => `${column}.ilike.${pattern}`).join(",");
}

function directoryUrl(query: string, type: string, page: number) {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (type) params.set("type", type);
  if (page > 1) params.set("page", String(page));
  const search = params.toString();
  return search ? `/opportunities?${search}` : "/opportunities";
}

export default async function OpportunitiesPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const query = (params.q || "").trim().slice(0, 80);
  const requestedType = params.type || "";
  const requestedPage = Math.max(1, Number.parseInt(params.page || "1", 10) || 1);
  const type = requestedType === "jobs" || requestedType === "real-estate" ? requestedType : "";
  const supabase = await createClient();
  let listingsQuery = supabase.from("organization_marketplace_listings")
    .select("slug, organization_name, listing_type, title, description, location, employment_type, salary_details, property_type, property_price, updated_at", { count: "exact" })
    .eq("is_published", true);
  if (type) listingsQuery = listingsQuery.eq("listing_type", type);
  if (query) listingsQuery = listingsQuery.or(marketplaceSearchFilter(query, ["title", "description", "organization_name", "location"]));
  const { data, count, error } = await listingsQuery
    .order("updated_at", { ascending: false })
    .range((requestedPage - 1) * PAGE_SIZE, requestedPage * PAGE_SIZE - 1);

  const listings = data || [];
  const totalCount = count ?? listings.length;
  const pageCount = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

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
            <Link className={!type ? "selected" : ""} href={directoryUrl(query, "", 1)}>All opportunities</Link>
            <Link className={type === "jobs" ? "selected" : ""} href={directoryUrl(query, "jobs", 1)}>Jobs</Link>
            <Link className={type === "real-estate" ? "selected" : ""} href={directoryUrl(query, "real-estate", 1)}>Real estate</Link>
          </nav>
        </section>

        <section className="directory-results">
          <div className="directory-results-heading"><div><span className="identity-eyebrow">PUBLISHED LISTINGS</span><h2>{type === "jobs" ? "Jobs" : type === "real-estate" ? "Real estate" : "Jobs & real estate"}</h2></div><span>{error ? "Count unavailable" : `${totalCount} ${totalCount === 1 ? "listing" : "listings"} · Page ${requestedPage} of ${pageCount}`}</span></div>
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
          ) : totalCount > 0 ? (
            <div className="directory-empty">
              <span aria-hidden="true">✦</span>
              <h3>No listings on this page</h3>
              <p>There are {totalCount} matching listings across {pageCount} pages.</p>
              <Link className="identity-submit" href={directoryUrl(query, type, pageCount)}>Go to the last page</Link>
            </div>
          ) : (
            <div className="directory-empty">
              <span aria-hidden="true">✦</span>
              <h3>{query || type ? "No matching listings yet" : "No published listings yet"}</h3>
              <p>{query || type ? "Try another search or category. Only published listings appear here." : "Organizations can publish job openings and property listings from their workspace."}</p>
              <Link className="identity-submit" href="/business">Create an organization listing</Link>
            </div>
          )}
          {!error && pageCount > 1 && (
            <nav className="catalog-pagination" aria-label="Opportunity pages">
              {requestedPage > 1 ? <Link rel="prev" href={directoryUrl(query, type, requestedPage - 1)}>Previous</Link> : <span aria-disabled="true">Previous</span>}
              <span aria-current="page">Page {requestedPage} of {pageCount}</span>
              {requestedPage < pageCount ? <Link rel="next" href={directoryUrl(query, type, requestedPage + 1)}>Next</Link> : <span aria-disabled="true">Next</span>}
            </nav>
          )}
        </section>
      </main>
    </>
  );
}
