"use server";

import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";
import { isSupabaseConfigured } from "../../lib/supabase/configured";

export async function updateProfile(formData: FormData) {
  if (!isSupabaseConfigured()) {
    redirect("/sign-in?notice=setup");
  }

  const displayName = String(formData.get("displayName") || "").trim();
  if (displayName.length < 2 || displayName.length > 60) {
    redirect("/dashboard?error=profile");
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/sign-in?notice=signin");
  }

  const { error } = await supabase.from("profiles").upsert(
    { user_id: user.id, display_name: displayName },
    { onConflict: "user_id" },
  );

  redirect(error ? "/dashboard?error=save" : "/dashboard?notice=saved");
}
