"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";
import { isSupabaseConfigured } from "../../lib/supabase/configured";

async function confirmationRedirectUrl() {
  const requestHeaders = await headers();
  const host =
    requestHeaders.get("x-forwarded-host") || requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") || "https";
  const origin = host ? protocol + "://" + host : "https://caribbeanstarstorett.com";

  return origin + "/auth/callback?next=%2Fdashboard";
}

export async function signUp(formData: FormData) {
  if (!isSupabaseConfigured()) {
    redirect("/sign-up?notice=setup");
  }

  const displayName = String(formData.get("displayName") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");

  if (
    displayName.length < 2 ||
    displayName.length > 60 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    password.length < 8
  ) {
    redirect("/sign-up?error=invalid");
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: displayName },
      emailRedirectTo: await confirmationRedirectUrl(),
    },
  });

  if (error) {
    redirect("/sign-up?error=signup");
  }

  if (data.session && data.user) {
    await supabase.from("profiles").upsert(
      { user_id: data.user.id, display_name: displayName },
      { onConflict: "user_id" },
    );
    redirect("/dashboard");
  }

  redirect("/sign-up?notice=confirm");
}
