import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "../../../lib/supabase/configured";
import { getOriginalStoreUrl } from "../../../lib/wordpress-store";

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "caribbeanstarstorett-kernel",
    layers: ["top", "middle", "back", "kernel", "front"],
    // These flags report usable configuration only; they do not probe external service availability.
    integrations: {
      wordpress: Boolean(getOriginalStoreUrl()),
      supabase: isSupabaseConfigured(),
    },
  });
}
