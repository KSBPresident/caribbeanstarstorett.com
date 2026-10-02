const selectedSupabaseUrl = "https://rbmzggvzmniapsmfnpwk.supabase.co";
const selectedSupabasePublishableKey = "sb_publishable_nXeorBrGY_dHjDuTbcgTfg_shsKFDHl";

// Bind the application to the Caribbean Star Store project. Update these values
// together only when the owner is ready to move to a different Supabase project.
export const supabaseUrl = selectedSupabaseUrl;
export const supabasePublishableKey = selectedSupabasePublishableKey;

export function isSupabaseConfigured() {
  return Boolean(supabaseUrl && supabasePublishableKey) &&
    supabasePublishableKey !== "replace-with-supabase-publishable-key";
}
