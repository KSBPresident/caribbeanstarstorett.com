"use server";

import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";
import { isSupabaseConfigured } from "../../lib/supabase/configured";
import { getSafeExternalWebsite } from "../../lib/external-website";

const sellerTypes = new Set(["individual", "business", "nonprofit", "community"]);
const categories = new Set(["products", "services", "businesses", "jobs", "real-estate", "other"]);

function sellerApplicationUrl(category: string, state: "error=invalid" | "error=submit" | "notice=submitted") {
  const selectedCategory = categories.has(category) ? category : "products";
  return `/sell?category=${encodeURIComponent(selectedCategory)}&${state}`;
}


export async function submitSellerApplication(formData: FormData) {
  if (!isSupabaseConfigured()) redirect("/sign-in?notice=setup");

  const sellerName = String(formData.get("sellerName") || "").trim();
  const sellerType = String(formData.get("sellerType") || "");
  const category = String(formData.get("category") || "");
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const phone = String(formData.get("phone") || "").trim();
  const websiteInput = String(formData.get("website") || "").trim();
  const website = getSafeExternalWebsite(websiteInput)?.href ?? null;
  const description = String(formData.get("description") || "").trim();

  if (
    sellerName.length < 2 || sellerName.length > 100 ||
    !sellerTypes.has(sellerType) || !categories.has(category) ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 ||
    phone.length > 40 || description.length < 30 || description.length > 2000 ||
    (websiteInput && !website)
  ) redirect(sellerApplicationUrl(category, "error=invalid"));

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?notice=signin");

  const { error } = await supabase.from("seller_applications").insert({
    applicant_user_id: user.id,
    seller_name: sellerName,
    seller_type: sellerType,
    category_key: category,
    contact_email: email,
    phone: phone || null,
    website_url: website,
    description,
    status: "submitted",
  });

  redirect(error ? sellerApplicationUrl(category, "error=submit") : sellerApplicationUrl(category, "notice=submitted"));
}
