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

type ServerSupabaseClient = Awaited<ReturnType<typeof createClient>>;
const MAX_PRODUCT_IMAGE_BYTES = 3 * 1024 * 1024;

function isImageFile(value: FormDataEntryValue | null): value is File {
  return typeof File !== "undefined" && value instanceof File && value.size > 0;
}

async function uploadProductImage(
  supabase: ServerSupabaseClient,
  organizationId: string,
  file: File,
): Promise<{ url: string; path: string } | null> {
  if (file.size > MAX_PRODUCT_IMAGE_BYTES) return null;

  const extensionByType: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
  };
  const extension = extensionByType[file.type];
  if (!extension) return null;

  const signature = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const isJpeg = file.type === "image/jpeg" &&
    signature[0] === 0xff && signature[1] === 0xd8 && signature[2] === 0xff;
  const isPng = file.type === "image/png" &&
    signature[0] === 0x89 && signature[1] === 0x50 && signature[2] === 0x4e &&
    signature[3] === 0x47 && signature[4] === 0x0d && signature[5] === 0x0a &&
    signature[6] === 0x1a && signature[7] === 0x0a;
  const isWebp = file.type === "image/webp" &&
    String.fromCharCode(...signature.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...signature.slice(8, 12)) === "WEBP";
  if (!isJpeg && !isPng && !isWebp) return null;

  const path = organizationId + "/" + crypto.randomUUID() + "." + extension;
  const { error } = await supabase.storage.from("product-images").upload(path, file, {
    cacheControl: "31536000",
    contentType: file.type,
    upsert: false,
  });
  if (error) return null;

  const { data } = supabase.storage.from("product-images").getPublicUrl(path);
  return { url: data.publicUrl, path };
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
  const imageFile = formData.get("imageFile");
  const hasImageFile = isImageFile(imageFile);
  const price = Number(formData.get("price"));
  const quantity = Number(formData.get("quantity"));
  const status = String(formData.get("status") || "draft");
  if (
    !/^[0-9a-f-]{36}$/i.test(organizationId) ||
    name.length < 2 || name.length > 140 ||
    !validCategories.has(categoryKey) ||
    description.length < 30 || description.length > 3000 ||
    (!hasImageFile && !safeImageUrl(imageUrl)) ||
    !Number.isFinite(price) || price <= 0 || price > 9999999999 ||
    !Number.isInteger(quantity) || quantity < 0 || quantity > 1000000 ||
    !validStatuses.has(status)
  ) redirect("/seller/inventory?error=invalid");

  const supabase = await getSignedInClient();
  const uploadedImage = hasImageFile ? await uploadProductImage(supabase, organizationId, imageFile) : null;
  if (hasImageFile && !uploadedImage) redirect("/seller/inventory?error=image");
  const resolvedImageUrl = uploadedImage?.url || imageUrl;
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
  const imageFile = formData.get("imageFile");
  const hasImageFile = isImageFile(imageFile);
  const price = Number(formData.get("price"));
  const quantity = Number(formData.get("quantity"));
  const status = String(formData.get("status") || "");
  if (
    !/^[0-9a-f-]{36}$/i.test(itemId) || !/^[0-9a-f-]{36}$/i.test(organizationId) ||
    name.length < 2 || name.length > 140 ||
    !validCategories.has(categoryKey) ||
    description.length < 30 || description.length > 3000 ||
    (!hasImageFile && !safeImageUrl(imageUrl)) ||
    !Number.isFinite(price) || price <= 0 || price > 9999999999 ||
    !Number.isInteger(quantity) || quantity < 0 || quantity > 1000000 ||
    !validStatuses.has(status)
  ) redirect("/seller/inventory?error=invalid");

  const supabase = await getSignedInClient();
  const uploadedImage = hasImageFile ? await uploadProductImage(supabase, organizationId, imageFile) : null;
  if (hasImageFile && !uploadedImage) redirect("/seller/inventory?error=image");
  const resolvedImageUrl = uploadedImage?.url || imageUrl;
  const { data, error } = await supabase.from("inventory_items")
    .update({
      name,
      category_key: categoryKey,
      description,
      price,
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
