"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";
import { isSupabaseConfigured } from "../../lib/supabase/configured";

async function recoveryRedirectUrl() {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") || requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") || "https";
  const origin = host ? protocol + "://" + host : "https://caribbeanstarstorett.com";
  return origin + "/auth/callback?next=%2Fupdate-password";
}

export async function requestPasswordReset(formData: FormData) {
  if (!isSupabaseConfigured()) redirect("/forgot-password?notice=unavailable");

  const email = String(formData.get("email") || "").trim().toLowerCase();
  if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email)) {
    redirect("/forgot-password?error=email");
  }

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: await recoveryRedirectUrl(),
  });

  // Keep the response the same whether the address exists or the mail request succeeds.
  redirect("/forgot-password?notice=sent");
}
