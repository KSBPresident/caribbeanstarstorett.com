import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "../../../components/site-header";
import { createClient } from "../../../lib/supabase/server";

const jobTypes: Record<string, string> = {
  "full-time": "Full-time",
  "part-time": "Part-time",
  contract: "Contract",
  temporary: "Temporary",
  internship: "Internship",
};
const propertyTypes: Record<string, string> = {
  house: "House",
  apartment: "Apartment",
  commercial: "Commercial property",
  land: "Land",
  room: "Room",
  other: "Other property",
};

export default async function OpportunityDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: listing } = await supabase.from("organization_marketplace_listings")
    .select("slug, organization_name, listing_type, title, description, location, employment_type, salary_details, property_type, property_price, contact_email, phone, website_url, updated_at")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();
  if (!listing) notFound();

  const isJob = listing.listing_type === "jobs";
  return (
    <>
      <SiteHeader />
      <main className="identity-page opportunity-detail-page">
        <p className="workspace-back"><Link href={isJob ? "/opportunities?type=jobs" : "/opportunities?type=real-estate"}>← Back to {isJob ? "jobs" : "real estate"}</Link></p>
        <section className="opportunity-detail-hero">
          <span className="opportunity-type-mark" aria-hidden="true">{isJob ? "↗" : "⌂"}</span>
          <div><span className="identity-eyebrow">{isJob ? "JOB OPENING" : "REAL ESTATE"} · {listing.location}</span><h1>{listing.title}</h1><p>Posted by {listing.organization_name}</p></div>
        </section>
        <div className="directory-contact-layout opportunity-detail-layout">
          <section className="identity-panel">
            <span className="identity-eyebrow">LISTING DETAILS</span>
            <h2>{isJob ? "About this opportunity" : "About this property"}</h2>
            <p className="directory-description">{listing.description}</p>
            <dl className="identity-details">
              {isJob && listing.employment_type && <div><dt>Employment type</dt><dd>{jobTypes[listing.employment_type] || listing.employment_type}</dd></div>}
              {isJob && listing.salary_details && <div><dt>Compensation</dt><dd>{listing.salary_details}</dd></div>}
              {!isJob && listing.property_type && <div><dt>Property type</dt><dd>{propertyTypes[listing.property_type] || listing.property_type}</dd></div>}
              {!isJob && listing.property_price && <div><dt>Price details</dt><dd>{listing.property_price}</dd></div>}
              <div><dt>Location</dt><dd>{listing.location}</dd></div>
            </dl>
            <p className="directory-transparency">This listing was published by its organization. Confirm availability, terms, and details directly with the publisher.</p>
          </section>
          <aside className="identity-panel directory-contact-card">
            <span className="identity-eyebrow">PUBLISHED BY</span><h2>{listing.organization_name}</h2>
            {listing.phone && <a href={`tel:${listing.phone}`}>Call {listing.phone}</a>}
            {listing.contact_email && <a href={`mailto:${listing.contact_email}`}>Email {listing.contact_email}</a>}
            {listing.website_url && <a href={listing.website_url} target="_blank" rel="noopener noreferrer">Visit publisher website ↗</a>}
          </aside>
        </div>
      </main>
    </>
  );
}
