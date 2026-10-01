import type { Metadata } from "next";
import Link from "next/link";
import { cache } from "react";
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

const getPublishedOpportunity = cache(async (slug: string) => {
  const supabase = await createClient();
  return supabase.from("organization_marketplace_listings")
    .select("slug, organization_name, listing_type, title, description, location, employment_type, salary_details, property_type, property_price, contact_email, phone, website_url, created_at, updated_at")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();
});

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const canonical = `/opportunities/${encodeURIComponent(slug)}`;
  const { data: listing, error } = await getPublishedOpportunity(slug);
  if (error || !listing) {
    return {
      title: "Opportunity listing",
      description: "Explore published jobs and real estate listings on Caribbean Star Store.",
      alternates: { canonical },
    };
  }

  const details = [listing.description, listing.location, listing.organization_name].filter(Boolean).join(" · ");
  const description = details.replace(/\s+/g, " ").slice(0, 160);
  const title = `${listing.title} | Caribbean Star Store`;

  return {
    title: listing.title,
    description,
    alternates: { canonical },
    openGraph: { type: "website", siteName: "Caribbean Star Store", title, description , images: [{ url: "/opengraph-image", alt: "Caribbean Star Store — Connecting the community across the Caribbean" }]},
    twitter: { card: "summary_large_image", title, description , images: ["/twitter-image"]},
  };
}

export default async function OpportunityDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { data: listing, error } = await getPublishedOpportunity(slug);
  if (error) {
    return (
      <>
        <SiteHeader />
        <main id="main-content" tabIndex={-1} className="identity-page opportunity-detail-page">
          <p className="workspace-back"><Link href="/opportunities">← Back to opportunities</Link></p>
          <section className="identity-panel catalog-unavailable" role="alert">
            <span className="identity-eyebrow">CARIBBEAN STAR STORE · LISTING</span>
            <h1>We couldn’t load this listing.</h1>
            <p>The opportunity service is temporarily unavailable. Please try again shortly.</p>
            <Link className="identity-submit" href="/opportunities">Browse jobs &amp; real estate</Link>
          </section>
        </main>
      </>
    );
  }
  if (!listing) notFound();

  const isJob = listing.listing_type === "jobs";
  const siteUrl = "https://www.caribbeanstarstorett.com";
  const pageUrl = siteUrl + "/opportunities/" + encodeURIComponent(listing.slug);
  const listingDescription = [
    listing.description,
    isJob && listing.salary_details ? "Compensation: " + listing.salary_details : null,
    !isJob && listing.property_type ? "Property type: " + (propertyTypes[listing.property_type] || listing.property_type) : null,
    !isJob && listing.property_price ? "Price details: " + listing.property_price : null,
  ].filter(Boolean).join("\\n\\n");
  const publishedEntity = isJob
    ? {
        "@type": "JobPosting",
        title: listing.title,
        description: listingDescription,
        datePosted: listing.created_at,
        hiringOrganization: {
          "@type": "Organization",
          name: listing.organization_name,
          url: listing.website_url || undefined,
        },
        jobLocation: { "@type": "Place", name: listing.location },
        employmentType: listing.employment_type === "full-time" ? "FULL_TIME"
          : listing.employment_type === "part-time" ? "PART_TIME"
          : listing.employment_type === "contract" ? "CONTRACTOR"
          : listing.employment_type === "temporary" ? "TEMPORARY"
          : listing.employment_type === "internship" ? "INTERN"
          : undefined,
      }
    : {
        "@type": "CreativeWork",
        name: listing.title,
        description: listingDescription,
        spatialCoverage: { "@type": "Place", name: listing.location },
        creator: {
          "@type": "Organization",
          name: listing.organization_name,
          url: listing.website_url || undefined,
        },
      };
  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "@id": pageUrl + "#webpage",
      url: pageUrl,
      name: listing.title,
      description: listingDescription,
      dateModified: listing.updated_at,
      mainEntity: publishedEntity,
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
        { "@type": "ListItem", position: 2, name: "Jobs & real estate", item: siteUrl + "/opportunities" },
        { "@type": "ListItem", position: 3, name: listing.title, item: pageUrl },
      ],
    },
  ];
  const serializedStructuredData = JSON.stringify(structuredData).replace(/</g, "\\u003c");

  return (
    <>
      <SiteHeader />
      <main id="main-content" tabIndex={-1} className="identity-page opportunity-detail-page">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializedStructuredData }}
        />
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
