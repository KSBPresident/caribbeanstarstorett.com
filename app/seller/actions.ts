"use server";

import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";
import { isSupabaseConfigured } from "../../lib/supabase/configured";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function getSellerClient() {
  if (!isSupabaseConfigured()) redirect("/sign-in?notice=setup");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?notice=signin");
  return supabase;
}

export async function setSellerAwayStatus(formData: FormData) {
  const organizationId = String(formData.get("organizationId") || "");
  const isAway = formData.get("isAway") === "true";
  const awayMessage = String(formData.get("awayMessage") || "").trim();
  if (!uuidPattern.test(organizationId) || awayMessage.length > 240) redirect("/seller?error=away");

  const supabase = await getSellerClient();
  const { data, error } = await supabase.from("organization_public_profiles")
    .update({ seller_is_away: isAway, seller_away_message: isAway ? (awayMessage || null) : null })
    .eq("organization_id", organizationId)
    .select("organization_id")
    .maybeSingle();
  redirect(error || !data ? "/seller?error=away" : "/seller?notice=away-updated");
}

export async function createSellerCoupon(formData: FormData) {
  const organizationId = String(formData.get("organizationId") || "");
  const code = String(formData.get("code") || "").trim().toUpperCase();
  const discountType = String(formData.get("discountType") || "");
  const discountValue = Number(formData.get("discountValue"));
  const expiresAtInput = String(formData.get("expiresAt") || "");
  const expiresAt = expiresAtInput ? new Date(expiresAtInput + "T23:59:59.999Z") : null;
  if (
    !uuidPattern.test(organizationId) ||
    !/^[A-Z0-9][A-Z0-9_-]{2,39}$/.test(code) ||
    !["percentage", "fixed"].includes(discountType) ||
    !Number.isFinite(discountValue) || discountValue <= 0 ||
    (discountType === "percentage" && discountValue > 100) ||
    (discountType === "fixed" && discountValue > 100000) ||
    (expiresAt && Number.isNaN(expiresAt.getTime()))
  ) redirect("/seller?error=coupon");

  const supabase = await getSellerClient();
  const { error } = await supabase.from("seller_coupons").insert({
    organization_id: organizationId,
    code,
    discount_type: discountType,
    discount_value: discountValue,
    currency: "USD",
    expires_at: expiresAt?.toISOString() ?? null,
    is_active: true,
  });
  redirect(error ? "/seller?error=coupon" : "/seller?notice=coupon-created");
}

export async function deactivateSellerCoupon(formData: FormData) {
  const organizationId = String(formData.get("organizationId") || "");
  const couponId = String(formData.get("couponId") || "");
  if (!uuidPattern.test(organizationId) || !uuidPattern.test(couponId)) redirect("/seller?error=coupon");

  const supabase = await getSellerClient();
  const { data, error } = await supabase.from("seller_coupons")
    .update({ is_active: false })
    .eq("id", couponId)
    .eq("organization_id", organizationId)
    .select("id")
    .maybeSingle();
  redirect(error || !data ? "/seller?error=coupon" : "/seller?notice=coupon-updated");
}
