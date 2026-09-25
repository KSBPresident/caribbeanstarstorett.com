import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "../../../components/site-header";
import { createClient } from "../../../lib/supabase/server";

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

export default async function BusinessProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: profile, error } = await supabase
    .from("organization_public_profiles")
    .select("slug, display_name, summary, category_key, region, contact_email, phone, website_url")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();

  if (error) {
    return (
      <>
        <SiteHeader />
        <main id="main-content" tabIndex={-1} className="identity-page directory-detail-page">
          <p className="workspace-back"><Link href="/businesses">← Business directory</Link></p>
          <section className="catalog-empty" role="alert">
            <strong>This business profile is temporarily unavailable.</strong>
            <p>Please refresh the page to try again.</p>
          </section>
        </main>
      </>
    );
  }

  if (!profile) notFound();

  return (
    <>
      <SiteHeader />
      <main id="main-content" tabIndex={-1} className="identity-page directory-detail-page">
        <p className="workspace-back"><Link href="/businesses">← Business directory</Link></p>
        <section className="directory-detail-hero">
          <div className="directory-card-mark directory-detail-mark" aria-hidden="true">{profile.display_name.slice(0, 1).toUpperCase()}</div>
          <div><span className="identity-eyebrow">{categoryLabels[profile.category_key] || "Business"} · {profile.region}</span><h1>{profile.display_name}</h1><p>{profile.summary}</p></div>
        </section>
        <div className="directory-contact-layout">
          <section className="identity-panel">
            <span className="identity-eyebrow">ABOUT THIS BUSINESS</span>
            <h2>What they offer</h2>
            <p className="directory-description">{profile.summary}</p>
            <p className="directory-transparency">This profile was published by its organization. Contact details are provided by the business.</p>
          </section>
          <aside className="identity-panel directory-contact-card">
            <span className="identity-eyebrow">GET IN TOUCH</span>
            <h2>Contact the business</h2>
            {profile.phone && <a href={`tel:${profile.phone}`}>Call {profile.phone}</a>}
            {profile.contact_email && <a href={`mailto:${profile.contact_email}`}>Email {profile.contact_email}</a>}
            {profile.website_url && <a href={profile.website_url} target="_blank" rel="noopener noreferrer">Visit business website ↗</a>}
            <p>Confirm availability and terms directly with the business.</p>
          </aside>
        </div>
      </main>
    </>
  );
}
