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

function isValidUploadedImagePath(path: string, organizationId: string) {
  return /^[0-9a-f-]{36}\/[0-9a-f-]{36}\.(jpg|png|webp)$/i.test(path) &&
    path.split("/")[0].toLowerCase() === organizationId.toLowerCase();
}

async function getSignedInClient() {
  if (!isSupabaseConfigured()) redirect("/sign-in?notice=setup");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?notice=signin");
  return supabase;
}

async function ensurePublishedStorefront(
  supabase: Awaited<ReturnType<typeof createClient>>,
  organizationId: string,
  categoryKey: string,
) {
  const { data: currentProfile, error: profileReadError } = await supabase
    .from("organization_public_profiles")
    .select("organization_id, is_published")
    .eq("organization_id", organizationId)
    .maybeSingle();
  if (profileReadError) return false;
  if (currentProfile?.is_published) return true;

  const { data: organization, error: organizationError } = await supabase
    .from("organizations")
    .select("name, slug")
    .eq("id", organizationId)
    .maybeSingle();
  if (organizationError || !organization || organization.name.trim().length < 2) return false;

  const summary = `Explore products from ${organization.name} on Caribbean Star Store. Message this seller through the marketplace to ask about products, availability, and delivery options.`;
  const profileCategory = new Set(["home", "retail", "professional", "transport", "beauty", "community", "other"]).has(categoryKey)
    ? categoryKey
    : "retail";
  const profile = {
    organization_id: organizationId,
    slug: organization.slug,
    display_name: organization.name,
    summary,
    category_key: profileCategory,
    region: "Not specified",
    is_published: true,
  };
  const { error } = currentProfile
    ? await supabase.from("organization_public_profiles").update({ ...profile, updated_at: new Date().toISOString() }).eq("organization_id", organizationId)
    : await supabase.from("organization_public_profiles").insert(profile);
  return !error;
}

export async function createInventoryItem(formData: FormData) {
  const organizationId = String(formData.get("organizationId") || "");
  const name = String(formData.get("name") || "").trim();
  const categoryKey = String(formData.get("categoryKey") || "");
  const description = String(formData.get("description") || "").trim();
  const imageUrl = String(formData.get("imageUrl") || "").trim();
  const uploadedImagePath = String(formData.get("uploadedImagePath") || "").trim();
  const price = Number(formData.get("price"));
  const sellerShippingFee = Number(formData.get("sellerShippingFee"));
  const sellerInternationalShippingFee = Number(formData.get("sellerInternationalShippingFee"));
  const quantity = Number(formData.get("quantity"));
  const status = String(formData.get("status") || "draft");
  if (
    !/^[0-9a-f-]{36}$/i.test(organizationId) ||
    name.length < 2 || name.length > 140 ||
    !validCategories.has(categoryKey) ||
    description.length < 30 || description.length > 3000 ||
    (uploadedImagePath
      ? !isValidUploadedImagePath(uploadedImagePath, organizationId)
      : !safeImageUrl(imageUrl)) ||
    !Number.isFinite(price) || price <= 0 || price > 9999999999 ||
    !Number.isFinite(sellerShippingFee) || sellerShippingFee < 0 || sellerShippingFee > 9999999999 ||
    !Number.isFinite(sellerInternationalShippingFee) || sellerInternationalShippingFee < 0 || sellerInternationalShippingFee > 9999999999 ||
    !Number.isInteger(quantity) || quantity < 0 || quantity > 1000000 ||
    !validStatuses.has(status)
  ) redirect("/seller/inventory?error=invalid");

  const supabase = await getSignedInClient();
  const uploadedImage = uploadedImagePath
    ? {
        path: uploadedImagePath,
        url: supabase.storage.from("product-images").getPublicUrl(uploadedImagePath).data.publicUrl,
      }
    : null;
  const resolvedImageUrl = uploadedImage?.url || imageUrl;
  if (status === "published" && !(await ensurePublishedStorefront(supabase, organizationId, categoryKey))) {
    if (uploadedImage?.path) await supabase.storage.from("product-images").remove([uploadedImage.path]);
    redirect("/seller/inventory?error=storefront");
  }
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
    seller_shipping_fee: sellerShippingFee,
    seller_international_shipping_fee: sellerInternationalShippingFee,
    currency: "USD",
    quantity_available: quantity,
    image_url: resolvedImageUrl,
    status,
  });
  if (error && uploadedImage?.path) await supabase.storage.from("product-images").remove([uploadedImage.path]);
  redirect(error ? "/seller/inventory?error=save" : "/seller/inventory?notice=created");
}

export async function updateInventoryItem(formData: FormData) {
  const itemId = String(formData.get("itemId") || "");
  const organizationId = String(formData.get("organizationId") || "");
  const name = String(formData.get("name") || "").trim();
  const categoryKey = String(formData.get("categoryKey") || "");
  const description = String(formData.get("description") || "").trim();
  const imageUrl = String(formData.get("imageUrl") || "").trim();
  const uploadedImagePath = String(formData.get("uploadedImagePath") || "").trim();
  const price = Number(formData.get("price"));
  const sellerShippingFee = Number(formData.get("sellerShippingFee"));
  const sellerInternationalShippingFee = Number(formData.get("sellerInternationalShippingFee"));
  const quantity = Number(formData.get("quantity"));
  const status = String(formData.get("status") || "");
  if (
    !/^[0-9a-f-]{36}$/i.test(itemId) || !/^[0-9a-f-]{36}$/i.test(organizationId) ||
    name.length < 2 || name.length > 140 ||
    !validCategories.has(categoryKey) ||
    description.length < 30 || description.length > 3000 ||
    (uploadedImagePath
      ? !isValidUploadedImagePath(uploadedImagePath, organizationId)
      : !safeImageUrl(imageUrl)) ||
    !Number.isFinite(price) || price <= 0 || price > 9999999999 ||
    !Number.isFinite(sellerShippingFee) || sellerShippingFee < 0 || sellerShippingFee > 9999999999 ||
    !Number.isFinite(sellerInternationalShippingFee) || sellerInternationalShippingFee < 0 || sellerInternationalShippingFee > 9999999999 ||
    !Number.isInteger(quantity) || quantity < 0 || quantity > 1000000 ||
    !validStatuses.has(status)
  ) redirect("/seller/inventory?error=invalid");

  const supabase = await getSignedInClient();
  const uploadedImage = uploadedImagePath
    ? {
        path: uploadedImagePath,
        url: supabase.storage.from("product-images").getPublicUrl(uploadedImagePath).data.publicUrl,
      }
    : null;
  const resolvedImageUrl = uploadedImage?.url || imageUrl;
  if (status === "published" && !(await ensurePublishedStorefront(supabase, organizationId, categoryKey))) {
    if (uploadedImage?.path) await supabase.storage.from("product-images").remove([uploadedImage.path]);
    redirect("/seller/inventory?error=storefront");
  }
  const { data, error } = await supabase.from("inventory_items")
    .update({
      name,
      category_key: categoryKey,
      description,
      price,
      seller_shipping_fee: sellerShippingFee,
      seller_international_shipping_fee: sellerInternationalShippingFee,
      quantity_available: quantity,
      image_url: resolvedImageUrl,
      status,
    })
    .eq("id", itemId)
    .eq("organization_id", organizationId)
    .select("id")
    .maybeSingle();
  if ((error || !data) && uploadedImage?.path) await supabase.storage.from("product-images").remove([uploadedImage.path]);
  redirect(error || !data ? "/seller/inventory?error=save" : "/seller/inventory?notice=updated");
}

