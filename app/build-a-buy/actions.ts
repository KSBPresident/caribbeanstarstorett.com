"use server";

import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";
import { isSupabaseConfigured } from "../../lib/supabase/configured";

const categories = new Set(["products", "services", "businesses", "jobs", "real-estate", "multi-item"]);
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function categoryReturnParam(category: string) {
  return categories.has(category) ? `&category=${encodeURIComponent(category)}` : "";
}

export async function createPurchaseRequest(formData: FormData) {
  if (!isSupabaseConfigured()) redirect("/sign-in?notice=setup");

  const title = String(formData.get("title") || "").trim();
  const details = String(formData.get("details") || "").trim();
  const categoryKey = String(formData.get("category") || "");
  const budgetInput = String(formData.get("budget") || "").trim();
  const budget = budgetInput ? Number(budgetInput) : null;
  const returnParam = categoryReturnParam(categoryKey);

  if (
    title.length < 4 || title.length > 100 ||
    details.length < 20 || details.length > 3000 ||
    !categories.has(categoryKey) ||
    (budget !== null && (!Number.isFinite(budget) || budget <= 0 || budget > 1_000_000_000))
  ) redirect(`/build-a-buy?error=invalid${returnParam}`);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?notice=signin");

  const { error } = await supabase.from("purchase_requests").insert({
    requester_user_id: user.id,
    title,
    details,
    category_key: categoryKey,
    budget_amount: budget,
    currency: "TTD",
    status: "open",
  });

  redirect(error ? `/build-a-buy?error=save${returnParam}` : "/build-a-buy?notice=created");
}

export async function cancelPurchaseRequest(formData: FormData) {
  if (!isSupabaseConfigured()) redirect("/sign-in?notice=setup");

  const id = String(formData.get("requestId") || "");
  if (!uuidPattern.test(id)) redirect("/build-a-buy?error=invalid");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?notice=signin");

  const { data, error } = await supabase
    .from("purchase_requests")
    .update({ status: "cancelled" })
    .eq("id", id)
    .eq("requester_user_id", user.id)
    .eq("status", "open")
    .select("id")
    .maybeSingle();

  redirect(error || !data ? "/build-a-buy?error=cancel" : "/build-a-buy?notice=cancelled");
}
