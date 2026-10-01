import { createBrowserClient } from "@supabase/ssr";
import { supabasePublishableKey, supabaseUrl } from "./configured";

export function createClient() {
  return createBrowserClient(supabaseUrl, supabasePublishableKey);
}
