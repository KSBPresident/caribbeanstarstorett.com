import { NextResponse } from "next/server";
import { createClient } from "../../../lib/supabase/server";
import { isSupabaseConfigured } from "../../../lib/supabase/configured";
import { getOriginalStoreUrl, getStoreProducts } from "../../../lib/wordpress-store";

async function checkSupabase() {
  if (!isSupabaseConfigured()) return false;
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("organization_public_profiles")
      .select("organization_id")
      .limit(1);
    return !error;
  } catch {
    return false;
  }
}

export async function GET() {
  const [catalog, supabaseAvailable] = await Promise.all([
    getStoreProducts({ perPage: 1 }),
    checkSupabase(),
  ]);
  const wordpressAvailable = catalog.status === "available";

  return NextResponse.json({
    ok: true,
    ready: wordpressAvailable && supabaseAvailable,
    service: "caribbeanstarstorett-kernel",
    layers: ["top", "middle", "back", "kernel", "front"],
    integrations: {
      wordpress: {
        configured: Boolean(getOriginalStoreUrl()),
        available: wordpressAvailable,
        httpStatus: catalog.httpStatus ?? null,
      },
      supabase: {
        configured: isSupabaseConfigured(),
        available: supabaseAvailable,
      },
    },
  });
}
