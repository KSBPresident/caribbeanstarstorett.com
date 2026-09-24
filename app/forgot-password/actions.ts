"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";
import { isSupabaseConfigured } from "../../lib/supabase/configured";
import { safeNextPath } from "../../lib/auth/return-path";

async function recoveryRedirectUrl(nextPath: string) {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") || requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") || "https";
  const origin = host ? protocol + "://" + host : "https://caribbeanstarstorett.com";
  const callback = new URL("/auth/callback", origin);
  callback.searchParams.set("next", `/update-password?next=${encodeURIComponent(nextPath)}`);
  return callback.toString();
}

export async function requestPasswordReset(formData: FormData) {
  const nextPath = safeNextPath(formData.get("next"));
  if (!isSupabaseConfigured()) redirect(`/forgot-password?notice=unavailable&next=${encodeURIComponent(nextPath)}`);

  const email = String(formData.get("email") || "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    redirect(`/forgot-password?error=email&next=${encodeURIComponent(nextPath)}`);
  }

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: await recoveryRedirectUrl(nextPath),
  });

  // Keep the response the same whether the address exists or the mail request succeeds.
  redirect(`/forgot-password?notice=sent&next=${encodeURIComponent(nextPath)}`);
}
