"use server";

import { redirect } from "next/navigation";
import { createClient } from "../../../lib/supabase/server";
import { isSupabaseConfigured } from "../../../lib/supabase/configured";
import { categories } from "../../../lib/store-data";

const validCategories = new Set(categories.map((category) => category.key));
const validStatuses = new Set(["draft", "published", "archived"]);

function safeImageUrl(value: string) {
  if (!value || value.length > 2048 || /[\s\\]/.test(value)) return false;
  if (value.startsWith("/") && !value.startsWith("//")) return true;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password;
  } catch {
    return false;
  }
}

async function getSignedInClient() {
  if (!isSupabaseConfigured()) redirect("/sign-in?notice=setup");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?notice=signin");
  return supabase;
}

export async function createInventoryItem(formData: FormData) {
  const organizationId = String(formData.get("organizationId") || "");
  const name = String(formData.get("name") || "").trim();
  const categoryKey = String(formData.get("categoryKey") || "");
  const description = String(formData.get("description") || "").trim();
  const imageUrl = String(formData.get("imageUrl") || "").trim();
  const price = Number(formData.get("price"));
  const quantity = Number(formData.get("quantity"));
  const status = String(formData.get("status") || "draft");
  if (
    !/^[0-9a-f-]{36}$/i.test(organizationId) ||
    name.length < 2 || name.length > 140 ||
    !validCategories.has(categoryKey) ||
    description.length < 30 || description.length > 3000 ||
    !safeImageUrl(imageUrl) ||
    !Number.isFinite(price) || price <= 0 || price > 9999999999 ||
    !Number.isInteger(quantity) || quantity < 0 || quantity > 1000000 ||
    !validStatuses.has(status)
  ) redirect("/seller/inventory?error=invalid");

  const supabase = await getSignedInClient();
  const slugBase = name.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80) || "product";
  const slug = slugBase + "-" + crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  const { error } = await supabase.from("inventory_items").insert({
    organization_id: organizationId,
    slug,
    name,
    category_key: categoryKey,
    description,
    price,
    currency: "USD",
    quantity_available: quantity,
    image_url: imageUrl,
    status,
  });
  redirect(error ? "/seller/inventory?error=save" : "/seller/inventory?notice=created");
}

export async function updateInventoryItem(formData: FormData) {
  const itemId = String(formData.get("itemId") || "");
  const organizationId = String(formData.get("organizationId") || "");
  const name = String(formData.get("name") || "").trim();
  const categoryKey = String(formData.get("categoryKey") || "");
  const description = String(formData.get("description") || "").trim();
  const imageUrl = String(formData.get("imageUrl") || "").trim();
  const price = Number(formData.get("price"));
  const quantity = Number(formData.get("quantity"));
  const status = String(formData.get("status") || "");
  if (
    !/^[0-9a-f-]{36}$/i.test(itemId) || !/^[0-9a-f-]{36}$/i.test(organizationId) ||
    name.length < 2 || name.length > 140 ||
    !validCategories.has(categoryKey) ||
    description.length < 30 || description.length > 3000 ||
    !safeImageUrl(imageUrl) ||
    !Number.isFinite(price) || price <= 0 || price > 9999999999 ||
    !Number.isInteger(quantity) || quantity < 0 || quantity > 1000000 ||
    !validStatuses.has(status)
  ) redirect("/seller/inventory?error=invalid");

  const supabase = await getSignedInClient();
  const { data, error } = await supabase.from("inventory_items")
    .update({
      name,
      category_key: categoryKey,
      description,
      price,
      quantity_available: quantity,
      image_url: imageUrl,
      status,
    })
    .eq("id", itemId)
    .eq("organization_id", organizationId)
    .select("id")
    .maybeSingle();
  redirect(error || !data ? "/seller/inventory?error=save" : "/seller/inventory?notice=updated");
}
