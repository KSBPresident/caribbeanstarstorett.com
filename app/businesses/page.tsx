import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "../../components/site-header";
import { createClient } from "../../lib/supabase/server";

export const metadata: Metadata = {
  title: "Business Directory",
  description: "Discover independent businesses and services through Caribbean Star Store.",
  alternates: { canonical: "/businesses" },
  openGraph: {
    type: "website",
    siteName: "Caribbean Star Store",
    title: "Business Directory | Caribbean Star Store",
    description: "Discover independent businesses and services through Caribbean Star Store.",
  
    images: [{ url: "/opengraph-image", alt: "Caribbean Star Store — Connecting communities worldwide" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Business Directory | Caribbean Star Store",
    description: "Discover independent businesses and services through Caribbean Star Store.",
  
    images: ["/twitter-image"],
  },
};

type SearchParams = Promise<{ q?: string; category?: string; page?: string }>;

const PAGE_SIZE = 12;

function marketplaceSearchFilter(query: string, columns: string[]) {
  const escaped = query
    .replace(/[\\%_]/g, (character) => "\\" + character)
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"');
  const pattern = `"%${escaped}%"`;
  return columns.map((column) => `${column}.ilike.${pattern}`).join(",");
}

function directoryUrl(query: string, category: string, page: number) {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (category) params.set("category", category);
  if (page > 1) params.set("page", String(page));
  const search = params.toString();
  return search ? `/businesses?${search}` : "/businesses";
}

const categoryLabels: Record<string, string> = {
  food: "Food & groceries",
  home: "Home & living",
  retail: "Retail",
  professional: "Professional services",
  transport: "Transport",
  beauty: "Beauty & wellness",
  community: "Community",
  other: "Other",
};

const categoryKeys = new Set(Object.keys(categoryLabels));

export default async function BusinessesDirectory({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const query = (params.q || "").trim().slice(0, 80);
  const requestedCategory = params.category || "";
  const parsedPage = Number(params.page);
  const requestedPage = Number.isInteger(parsedPage) && parsedPage > 0 ? Math.min(parsedPage, 9999) : 1;
  const category = categoryKeys.has(requestedCategory) ? requestedCategory : "";
  const supabase = await createClient();
  let directoryQuery = supabase
    .from("organization_public_profiles")
    .select("slug, display_name, summary, category_key, region, updated_at", { count: "exact" })
    .eq("is_published", true);
  if (category) directoryQuery = directoryQuery.eq("category_key", category);
  if (query) directoryQuery = directoryQuery.or(marketplaceSearchFilter(query, ["display_name", "summary", "category_key", "region"]));
  const { data, count, error } = await directoryQuery
    .order("updated_at", { ascending: false })
    .range((requestedPage - 1) * PAGE_SIZE, requestedPage * PAGE_SIZE - 1);

  const profiles = data || [];
  const totalCount = count ?? profiles.length;
  const pageCount = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const siteUrl = "https://www.caribbeanstarstorett.com";
  const pageUrl = siteUrl + "/businesses";
  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
        { "@type": "ListItem", position: 2, name: "Business directory", item: pageUrl },
      ],
    },
    ...(!error && profiles.length ? [{
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "Published Caribbean Star Store businesses",
      numberOfItems: profiles.length,
      itemListElement: profiles.map((profile, index) => {
        const profileUrl = siteUrl + "/businesses/" + encodeURIComponent(profile.slug);
        return {
          "@type": "ListItem",
          position: (requestedPage - 1) * PAGE_SIZE + index + 1,
          url: profileUrl,
          item: {
            "@type": "Organization",
            name: profile.display_name,
            description: profile.summary,
            url: profileUrl,
            areaServed: { "@type": "Place", name: profile.region },
          },
        };
      }),
    }] : []),
  ];
  const serializedStructuredData = JSON.stringify(structuredData).replace(/</g, "\\u003c");

  return (
    <>
      <SiteHeader />
      <main id="main-content" tabIndex={-1} className="identity-page directory-page">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializedStructuredData }}
        />
        <header className="directory-hero">
          <span className="identity-eyebrow">CARIBBEAN STAR STORE · BUSINESS DIRECTORY</span>
          <h1>Discover businesses in your community.</h1>
          <p>Browse public profiles published by businesses and organizations around the world.</p>
          <div className="directory-hero-actions">
            <Link className="identity-submit" href="/sell">Apply to list your business</Link>
            <Link className="directory-secondary" href="/marketplace">Shop products</Link>
          </div>
        </header>

        <section className="directory-toolbar" aria-label="Filter business directory">
          <form action="/businesses" className="directory-search">
            <label className="visually-hidden" htmlFor="business-query">Search business profiles</label>
            <input id="business-query" name="q" type="search" defaultValue={query} maxLength={80} placeholder="Search names, services, and areas" />
            {category && <input type="hidden" name="category" value={category} />}
            <button className="identity-submit" type="submit">Search</button>
          </form>
          <nav className="directory-categories" aria-label="Business categories">
            <Link className={!category ? "selected" : ""} href={directoryUrl(query, "", 1)}>All</Link>
            {Object.entries(categoryLabels).map(([key, label]) => <Link className={category === key ? "selected" : ""} href={directoryUrl(query, key, 1)} key={key}>{label}</Link>)}
          </nav>
        </section>

        <section className="directory-results">
          <div className="directory-results-heading"><div><span className="identity-eyebrow">LOCAL &amp; REGIONAL</span><h2>{category ? categoryLabels[category] : "Public business profiles"}</h2></div><span>{error ? "Count unavailable" : `${totalCount} ${totalCount === 1 ? "listing" : "listings"} · Page ${requestedPage} of ${pageCount}`}</span></div>
          {error ? (
            <div className="catalog-empty"><strong>Directory connection is unavailable.</strong><br />Please try again shortly.</div>
          ) : profiles.length ? (
            <div className="directory-grid">
              {profiles.map((profile) => (
                <article className="directory-card" key={profile.slug}>
                  <div className="directory-card-mark" aria-hidden="true">{profile.display_name.slice(0, 1).toUpperCase()}</div>
                  <div className="directory-card-meta"><span>{categoryLabels[profile.category_key] || "Business"}</span><span>{profile.region}</span></div>
                  <h3><Link href={`/businesses/${profile.slug}`}>{profile.display_name}</Link></h3>
                  <p>{profile.summary}</p>
                  <Link className="directory-card-link" href={`/businesses/${profile.slug}`}>View business profile →</Link>
                </article>
              ))}
            </div>
          ) : totalCount > 0 ? (
            <div className="directory-empty">
              <span aria-hidden="true">✦</span>
              <h3>No businesses on this page</h3>
              <p>There are {totalCount} matching listings across {pageCount} pages.</p>
              <Link className="identity-submit" href={directoryUrl(query, category, pageCount)}>Go to the last page</Link>
            </div>
          ) : (
            <div className="directory-empty">
              <span aria-hidden="true">✦</span>
              <h3>{query || category ? "No matching businesses yet" : "Be one of the first businesses listed"}</h3>
              <p>{query || category ? "Try another search or category. Only published profiles appear here." : "Business owners can apply for a seller workspace, then publish a directory profile. Community and nonprofit groups can create an organization workspace."}</p>
              <Link className="identity-submit" href="/sell">Apply to create a seller workspace</Link>
              <Link className="directory-secondary" href="/business">Create a community or nonprofit workspace</Link>
            </div>
          )}
          {!error && pageCount > 1 && (
            <nav className="catalog-pagination" aria-label="Business directory pages">
              {requestedPage > 1 ? <Link rel="prev" href={directoryUrl(query, category, requestedPage - 1)}>Previous</Link> : <span aria-disabled="true">Previous</span>}
              <span aria-current="page">Page {requestedPage} of {pageCount}</span>
              {requestedPage < pageCount ? <Link rel="next" href={directoryUrl(query, category, requestedPage + 1)}>Next</Link> : <span aria-disabled="true">Next</span>}
            </nav>
          )}
        </section>
      </main>
    </>
  );
}
