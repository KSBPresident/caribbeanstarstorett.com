"use server";

import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";
import { isSupabaseConfigured } from "../../lib/supabase/configured";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function getPlatformAdminClient() {
  if (!isSupabaseConfigured()) redirect("/sign-in?notice=setup");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?notice=signin");
  if (user.app_metadata?.platform_role !== "admin") redirect("/admin?error=access");
  return supabase;
}

export async function reviewSellerApplication(formData: FormData) {
  const applicationId = String(formData.get("applicationId") || "");
  const status = String(formData.get("status") || "");
  if (!uuidPattern.test(applicationId) || !["reviewing", "approved", "declined"].includes(status)) {
    redirect("/admin?error=seller");
  }

  const supabase = await getPlatformAdminClient();
  const { data, error } = await supabase.rpc("platform_review_seller_application", {
    p_application_id: applicationId,
    p_status: status,
  });
  redirect(error || data !== true ? "/admin?error=seller" : "/admin?notice=seller-reviewed");
}

export async function updatePurchaseRequestStatus(formData: FormData) {
  const requestId = String(formData.get("requestId") || "");
  const status = String(formData.get("status") || "");
  if (!uuidPattern.test(requestId) || !["reviewing", "matched", "completed", "cancelled"].includes(status)) {
    redirect("/admin?error=request");
  }

  const supabase = await getPlatformAdminClient();
  const { data, error } = await supabase.rpc("platform_update_purchase_request", {
    p_request_id: requestId,
    p_status: status,
  });
  redirect(error || data !== true ? "/admin?error=request" : "/admin?notice=request-updated");
}
