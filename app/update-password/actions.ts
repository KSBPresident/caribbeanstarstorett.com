"use server";

import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";
import { isSupabaseConfigured } from "../../lib/supabase/configured";

export async function updatePassword(formData: FormData) {
  if (!isSupabaseConfigured()) redirect("/sign-in?notice=setup");

  const password = String(formData.get("password") || "");
  const confirmPassword = String(formData.get("confirmPassword") || "");
  if (password.length < 8 || password.length > 128 || password !== confirmPassword) {
    redirect("/update-password?error=invalid");
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/forgot-password?notice=expired");

  const { error } = await supabase.auth.updateUser({ password });
  redirect(error ? "/update-password?error=save" : "/update-password?notice=updated");
}
