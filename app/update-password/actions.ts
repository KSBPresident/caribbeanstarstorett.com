"use server";

import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";
import { isSupabaseConfigured } from "../../lib/supabase/configured";
import { safeNextPath } from "../../lib/auth/return-path";

export async function updatePassword(formData: FormData) {
  const nextPath = safeNextPath(formData.get("next"));
  if (!isSupabaseConfigured()) redirect(`/sign-in?notice=setup&next=${encodeURIComponent(nextPath)}`);

  const password = String(formData.get("password") || "");
  const confirmPassword = String(formData.get("confirmPassword") || "");
  if (password.length < 8 || password.length > 128 || password !== confirmPassword) {
    redirect(`/update-password?error=invalid&next=${encodeURIComponent(nextPath)}`);
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/forgot-password?notice=expired&next=${encodeURIComponent(nextPath)}`);

  const { error } = await supabase.auth.updateUser({ password });
  redirect(error
    ? `/update-password?error=save&next=${encodeURIComponent(nextPath)}`
    : `/update-password?notice=updated&next=${encodeURIComponent(nextPath)}`);
}
