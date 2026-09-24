"use server";

import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";
import { isSupabaseConfigured } from "../../lib/supabase/configured";

export async function signIn(formData: FormData) {
  if (!isSupabaseConfigured()) {
    redirect("/sign-in?notice=setup");
  }

  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !password) {
    redirect("/sign-in?error=credentials");
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) {
    redirect("/sign-in?error=credentials");
  }

  const displayName =
    typeof data.user.user_metadata?.display_name === "string"
      ? data.user.user_metadata.display_name
      : email.split("@")[0];

  await supabase.from("profiles").upsert(
    { user_id: data.user.id, display_name: displayName },
    { onConflict: "user_id" },
  );

  redirect("/dashboard");
}
