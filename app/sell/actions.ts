"use server";

import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";
import { isSupabaseConfigured } from "../../lib/supabase/configured";

const sellerTypes = new Set(["individual", "business", "nonprofit", "community"]);
const categories = new Set(["products", "services", "businesses", "jobs", "real-estate", "other"]);

function safeWebsite(value: string) {
  if (!value) return null;
  try {
    const url = new URL(value.startsWith("http://") || value.startsWith("https://") ? value : `https://${value}`);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export async function submitSellerApplication(formData: FormData) {
  if (!isSupabaseConfigured()) redirect("/sign-in?notice=setup");

  const sellerName = String(formData.get("sellerName") || "").trim();
  const sellerType = String(formData.get("sellerType") || "");
  const category = String(formData.get("category") || "");
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const phone = String(formData.get("phone") || "").trim();
  const websiteInput = String(formData.get("website") || "").trim();
  const website = safeWebsite(websiteInput);
  const description = String(formData.get("description") || "").trim();

  if (
    sellerName.length < 2 || sellerName.length > 100 ||
    !sellerTypes.has(sellerType) || !categories.has(category) ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 ||
    phone.length > 40 || description.length < 30 || description.length > 2000 ||
    (websiteInput && !website)
  ) redirect("/sell?error=invalid");

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

  redirect(error ? "/sell?error=submit" : "/sell?notice=submitted");
}
