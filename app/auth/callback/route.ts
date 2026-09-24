import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../lib/supabase/server";
import { isSupabaseConfigured } from "../../../lib/supabase/configured";
import { safeNextPath } from "../../../lib/auth/return-path";

export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.redirect(new URL("/sign-in?notice=setup", request.url));
  }

  const code = request.nextUrl.searchParams.get("code");
  if (!code) {
    return NextResponse.redirect(new URL("/sign-in?error=callback", request.url));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(new URL("/sign-in?error=callback", request.url));
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const displayName =
      typeof user.user_metadata?.display_name === "string"
        ? user.user_metadata.display_name
        : (user.email || "").split("@")[0];

    await supabase.from("profiles").upsert(
      { user_id: user.id, display_name: displayName },
      { onConflict: "user_id" },
    );
  }

  return NextResponse.redirect(
    new URL(safeNextPath(request.nextUrl.searchParams.get("next")), request.url),
  );
}
