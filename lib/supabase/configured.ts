const selectedSupabaseUrl = "https://feeotcqalrisfigvjfgg.supabase.co";
const selectedSupabasePublishableKey = "sb_publishable_nM0WeC4p88w22T3RAoj42w_xOBZNUnq";

// Bind the application to the Caribbean Star Store project: caribbeanstarstore's Project. Update these values
// together only when the owner is ready to move to a different Supabase project.
export const supabaseUrl = selectedSupabaseUrl;
export const supabasePublishableKey = selectedSupabasePublishableKey;

export function isSupabaseConfigured() {
  return Boolean(supabaseUrl && supabasePublishableKey);
}
