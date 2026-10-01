"use server";

import { redirect } from "next/navigation";
import { createClient } from "../../../lib/supabase/server";
import { isSupabaseConfigured } from "../../../lib/supabase/configured";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const profileCategories = new Set(["food", "home", "retail", "professional", "transport", "beauty", "community", "other"]);

function secureWebsite(value: string) {
  if (!value) return null;
  try {
    const normalized = new URL(value.startsWith("http://") || value.startsWith("https://") ? value : `https://${value}`);
    return normalized.protocol === "https:" ? normalized.toString() : null;
  } catch {
    return null;
  }
}

function returnTo(slug: string) {
  return slugPattern.test(slug) ? `/business/${slug}` : "/business";
}

export async function updateOrganizationMemberRole(formData: FormData) {
  const organizationId = String(formData.get("organizationId") || "");
  const memberUserId = String(formData.get("memberUserId") || "");
  const roleId = String(formData.get("roleId") || "");
  const organizationSlug = String(formData.get("organizationSlug") || "");
  const base = returnTo(organizationSlug);

  if (!isSupabaseConfigured()) redirect("/sign-in?notice=setup");
  if (![organizationId, memberUserId, roleId].every((value) => uuidPattern.test(value))) {
    redirect(`${base}?error=invalid`);
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?notice=signin");
  if (memberUserId === user.id) redirect(`${base}?error=self`);

  const { data, error } = await supabase
    .from("organization_members")
    .update({ role_id: roleId })
    .eq("organization_id", organizationId)
    .eq("user_id", memberUserId)
    .select("user_id")
    .maybeSingle();

  redirect(error || !data ? `${base}?error=permission` : `${base}?notice=role-updated`);
}

export async function removeOrganizationMember(formData: FormData) {
  const organizationId = String(formData.get("organizationId") || "");
  const memberUserId = String(formData.get("memberUserId") || "");
  const organizationSlug = String(formData.get("organizationSlug") || "");
  const base = returnTo(organizationSlug);

  if (!isSupabaseConfigured()) redirect("/sign-in?notice=setup");
  if (![organizationId, memberUserId].every((value) => uuidPattern.test(value))) {
    redirect(`${base}?error=invalid`);
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?notice=signin");
  if (memberUserId === user.id) redirect(`${base}?error=self`);

  const { data, error } = await supabase
    .from("organization_members")
    .delete()
    .eq("organization_id", organizationId)
    .eq("user_id", memberUserId)
    .select("user_id")
    .maybeSingle();

  redirect(error || !data ? `${base}?error=permission` : `${base}?notice=member-removed`);
}


export async function saveOrganizationPublicProfile(formData: FormData) {
  const organizationId = String(formData.get("organizationId") || "");
  const organizationSlug = String(formData.get("organizationSlug") || "");
  const base = returnTo(organizationSlug);

  if (!isSupabaseConfigured()) redirect("/sign-in?notice=setup");
  if (!uuidPattern.test(organizationId)) redirect(`${base}?error=listing-invalid`);

  const displayName = String(formData.get("displayName") || "").trim();
  const listingSlug = String(formData.get("listingSlug") || "").trim().toLowerCase();
  const summary = String(formData.get("summary") || "").trim();
  const category = String(formData.get("category") || "");
  const region = String(formData.get("region") || "").trim();
  const contactEmail = String(formData.get("contactEmail") || "").trim().toLowerCase();
  const phone = String(formData.get("phone") || "").trim();
  const websiteInput = String(formData.get("website") || "").trim();
  const website = secureWebsite(websiteInput);
  const isPublished = String(formData.get("visibility") || "draft") === "published";

  if (
    displayName.length < 2 || displayName.length > 100 ||
    !slugPattern.test(listingSlug) || listingSlug.length > 80 ||
    summary.length < 40 || summary.length > 1200 ||
    !profileCategories.has(category) ||
    region.length < 2 || region.length > 80 ||
    (contactEmail && (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail) || contactEmail.length > 254)) ||
    phone.length > 40 || (websiteInput && !website) ||
    (!contactEmail && !phone && !website)
  ) redirect(`${base}?error=listing-invalid`);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?notice=signin");

  const { error } = await supabase.from("organization_public_profiles").upsert({
    organization_id: organizationId,
    slug: listingSlug,
    display_name: displayName,
    summary,
    category_key: category,
    region,
    contact_email: contactEmail || null,
    phone: phone || null,
    website_url: website,
    is_published: isPublished,
  }, { onConflict: "organization_id" });

  redirect(error ? `${base}?error=listing-save` : `${base}?notice=listing-saved`);
}

const listingTypes = new Set(["jobs", "real-estate"]);
const employmentTypes = new Set(["full-time", "part-time", "contract", "temporary", "internship"]);
const propertyTypes = new Set(["house", "apartment", "commercial", "land", "room", "other"]);

export async function createOrganizationMarketplaceListing(formData: FormData) {
  const organizationId = String(formData.get("organizationId") || "");
  const organizationSlug = String(formData.get("organizationSlug") || "");
  const base = returnTo(organizationSlug);
  if (!isSupabaseConfigured()) redirect("/sign-in?notice=setup");
  if (!uuidPattern.test(organizationId)) redirect(`${base}?error=marketplace-listing`);

  const listingType = String(formData.get("listingType") || "");
  const slug = String(formData.get("listingSlug") || "").trim().toLowerCase();
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const location = String(formData.get("location") || "").trim();
  const employmentType = String(formData.get("employmentType") || "");
  const salaryDetails = String(formData.get("salaryDetails") || "").trim();
  const propertyType = String(formData.get("propertyType") || "");
  const propertyPrice = String(formData.get("propertyPrice") || "").trim();
  const contactEmail = String(formData.get("contactEmail") || "").trim().toLowerCase();
  const phone = String(formData.get("phone") || "").trim();
  const websiteInput = String(formData.get("website") || "").trim();
  const website = secureWebsite(websiteInput);
  const isPublished = String(formData.get("visibility") || "draft") === "published";

  if (
    !listingTypes.has(listingType) || !slugPattern.test(slug) || slug.length > 80 ||
    title.length < 4 || title.length > 140 ||
    description.length < 40 || description.length > 3000 ||
    location.length < 2 || location.length > 120 ||
    (listingType === "jobs" && employmentType && !employmentTypes.has(employmentType)) ||
    (listingType === "real-estate" && propertyType && !propertyTypes.has(propertyType)) ||
    salaryDetails.length > 120 || propertyPrice.length > 120 || phone.length > 40 ||
    (contactEmail && (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail) || contactEmail.length > 254)) ||
    (websiteInput && !website) ||
    (!contactEmail && !phone && !website) ||
    (listingType === "jobs" && propertyPrice) ||
    (listingType === "real-estate" && salaryDetails)
  ) redirect(`${base}?error=marketplace-listing`);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?notice=signin");

  const { data: organization } = await supabase.from("organizations")
    .select("name").eq("id", organizationId).maybeSingle();
  if (!organization) redirect(`${base}?error=marketplace-listing`);

  const { error } = await supabase.from("organization_marketplace_listings").insert({
    organization_id: organizationId,
    organization_name: organization.name,
    slug,
    listing_type: listingType,
    title,
    description,
    location,
    employment_type: listingType === "jobs" ? employmentType || null : null,
    salary_details: listingType === "jobs" ? salaryDetails || null : null,
    property_type: listingType === "real-estate" ? propertyType || null : null,
    property_price: listingType === "real-estate" ? propertyPrice || null : null,
    contact_email: contactEmail || null,
    phone: phone || null,
    website_url: website,
    is_published: isPublished,
  });

  redirect(error ? `${base}?error=marketplace-listing` : `${base}?notice=marketplace-listing-saved`);
}

export async function setOrganizationMarketplaceListingVisibility(formData: FormData) {
  const organizationId = String(formData.get("organizationId") || "");
  const organizationSlug = String(formData.get("organizationSlug") || "");
  const listingId = String(formData.get("listingId") || "");
  const base = returnTo(organizationSlug);
  const isPublished = String(formData.get("visibility") || "") === "published";

  if (!isSupabaseConfigured()) redirect("/sign-in?notice=setup");
  if (![organizationId, listingId].every((value) => uuidPattern.test(value))) {
    redirect(`${base}?error=marketplace-listing`);
  }
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?notice=signin");
  const { data, error } = await supabase.from("organization_marketplace_listings")
    .update({ is_published: isPublished })
    .eq("id", listingId)
    .eq("organization_id", organizationId)
    .select("id")
    .maybeSingle();
  redirect(error || !data ? `${base}?error=marketplace-listing` : `${base}?notice=marketplace-listing-saved`);
}

export async function updateOrganizationMarketplaceListing(formData: FormData) {
  const organizationId = String(formData.get("organizationId") || "");
  const organizationSlug = String(formData.get("organizationSlug") || "");
  const listingId = String(formData.get("listingId") || "");
  const base = returnTo(organizationSlug);
  if (!isSupabaseConfigured()) redirect("/sign-in?notice=setup");
  if (![organizationId, listingId].every((value) => uuidPattern.test(value))) {
    redirect(`${base}?error=marketplace-listing`);
  }

  const slug = String(formData.get("listingSlug") || "").trim().toLowerCase();
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const location = String(formData.get("location") || "").trim();
  const employmentType = String(formData.get("employmentType") || "");
  const salaryDetails = String(formData.get("salaryDetails") || "").trim();
  const propertyType = String(formData.get("propertyType") || "");
  const propertyPrice = String(formData.get("propertyPrice") || "").trim();
  const contactEmail = String(formData.get("contactEmail") || "").trim().toLowerCase();
  const phone = String(formData.get("phone") || "").trim();
  const websiteInput = String(formData.get("website") || "").trim();
  const website = secureWebsite(websiteInput);

  if (
    !slugPattern.test(slug) || slug.length > 80 ||
    title.length < 4 || title.length > 140 ||
    description.length < 40 || description.length > 3000 ||
    location.length < 2 || location.length > 120 ||
    (employmentType && !employmentTypes.has(employmentType)) ||
    (propertyType && !propertyTypes.has(propertyType)) ||
    salaryDetails.length > 120 || propertyPrice.length > 120 || phone.length > 40 ||
    (contactEmail && (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail) || contactEmail.length > 254)) ||
    (websiteInput && !website) || (!contactEmail && !phone && !website)
  ) redirect(`${base}?error=marketplace-listing`);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?notice=signin");
  const { data: existing } = await supabase.from("organization_marketplace_listings")
    .select("listing_type")
    .eq("id", listingId)
    .eq("organization_id", organizationId)
    .maybeSingle();
  if (!existing) redirect(`${base}?error=marketplace-listing`);

  const isJob = existing.listing_type === "jobs";
  const { data, error } = await supabase.from("organization_marketplace_listings").update({
    slug,
    title,
    description,
    location,
    employment_type: isJob ? employmentType || null : null,
    salary_details: isJob ? salaryDetails || null : null,
    property_type: isJob ? null : propertyType || null,
    property_price: isJob ? null : propertyPrice || null,
    contact_email: contactEmail || null,
    phone: phone || null,
    website_url: website,
  }).eq("id", listingId).eq("organization_id", organizationId).select("id").maybeSingle();
  redirect(error || !data ? `${base}?error=marketplace-listing` : `${base}?notice=marketplace-listing-saved`);
}
