import Link from "next/link";
import { SiteHeader } from "../../components/site-header";
import { createClient } from "../../lib/supabase/server";

type SearchParams = Promise<{ q?: string; category?: string }>;

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
  const category = categoryKeys.has(requestedCategory) ? requestedCategory : "";
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("organization_public_profiles")
    .select("slug, display_name, summary, category_key, region, updated_at")
    .eq("is_published", true)
    .order("updated_at", { ascending: false })
    .limit(100);

  const records = data || [];
  const filtered = records.filter((profile) => {
    const matchesCategory = !category || profile.category_key === category;
    const haystack = `${profile.display_name} ${profile.summary} ${profile.region}`.toLowerCase();
    return matchesCategory && (!query || haystack.includes(query.toLowerCase()));
  });

  return (
    <>
      <SiteHeader />
      <main className="identity-page directory-page">
        <header className="directory-hero">
          <span className="identity-eyebrow">CARIBBEAN STAR STORE · BUSINESS DIRECTORY</span>
          <h1>Discover businesses in your community.</h1>
          <p>Browse public profiles published by local businesses and organizations across Trinidad &amp; Tobago.</p>
          <div className="directory-hero-actions">
            <Link className="identity-submit" href="/business">List your business</Link>
            <Link className="directory-secondary" href="/marketplace">Shop products</Link>
          </div>
        </header>

        <section className="directory-toolbar" aria-label="Filter business directory">
          <form action="/businesses" className="directory-search">
            <label className="visually-hidden" htmlFor="business-query">Search business profiles</label>
            <input id="business-query" name="q" type="search" defaultValue={query} placeholder="Search names, services, and areas" />
            {category && <input type="hidden" name="category" value={category} />}
            <button className="identity-submit" type="submit">Search</button>
          </form>
          <nav className="directory-categories" aria-label="Business categories">
            <Link className={!category ? "selected" : ""} href="/businesses">All</Link>
            {Object.entries(categoryLabels).map(([key, label]) => <Link className={category === key ? "selected" : ""} href={`/businesses?category=${key}`} key={key}>{label}</Link>)}
          </nav>
        </section>

        <section className="directory-results">
          <div className="directory-results-heading"><div><span className="identity-eyebrow">LOCAL &amp; REGIONAL</span><h2>{category ? categoryLabels[category] : "Public business profiles"}</h2></div><span>{filtered.length} {filtered.length === 1 ? "listing" : "listings"}</span></div>
          {error ? (
            <div className="catalog-empty"><strong>Directory connection is unavailable.</strong><br />Please try again shortly.</div>
          ) : filtered.length ? (
            <div className="directory-grid">
              {filtered.map((profile) => (
                <article className="directory-card" key={profile.slug}>
                  <div className="directory-card-mark" aria-hidden="true">{profile.display_name.slice(0, 1).toUpperCase()}</div>
                  <div className="directory-card-meta"><span>{categoryLabels[profile.category_key] || "Business"}</span><span>{profile.region}</span></div>
                  <h3><Link href={`/businesses/${profile.slug}`}>{profile.display_name}</Link></h3>
                  <p>{profile.summary}</p>
                  <Link className="directory-card-link" href={`/businesses/${profile.slug}`}>View business profile →</Link>
                </article>
              ))}
            </div>
          ) : (
            <div className="directory-empty">
              <span aria-hidden="true">✦</span>
              <h3>{query || category ? "No matching businesses yet" : "Be one of the first businesses listed"}</h3>
              <p>{query || category ? "Try another search or category. Only published profiles appear here." : "Create an organization workspace, then publish a profile when you are ready."}</p>
              <Link className="identity-submit" href="/business">Start a business profile</Link>
            </div>
          )}
        </section>
      </main>
    </>
  );
}
