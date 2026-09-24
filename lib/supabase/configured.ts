const defaultSupabaseUrl = "https://ebibqndafoutvpwhivex.supabase.co";
const defaultSupabasePublishableKey = "sb_publishable_257XANT1c1mApcUB2_5X9A_tK-NHq4w";

export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || defaultSupabaseUrl;
export const supabasePublishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || defaultSupabasePublishableKey;

export function isSupabaseConfigured() {
  return Boolean(supabaseUrl && supabasePublishableKey) &&
    supabasePublishableKey !== "replace-with-supabase-publishable-key";
}
