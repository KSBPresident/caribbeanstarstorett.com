import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../lib/supabase/server";
import { isSupabaseConfigured } from "../../../lib/supabase/configured";
import { safeNextPath } from "../../../lib/auth/return-path";

function callbackErrorRedirect(request: NextRequest) {
  const nextPath = safeNextPath(request.nextUrl.searchParams.get("next"));
  const nextUrl = new URL(nextPath, request.url);

  if (nextUrl.pathname === "/update-password") {
    const recoveryDestination = safeNextPath(nextUrl.searchParams.get("next"));
    const retryUrl = new URL("/forgot-password", request.url);
    retryUrl.searchParams.set("notice", "expired");
    retryUrl.searchParams.set("next", recoveryDestination);
    return NextResponse.redirect(retryUrl);
  }

  const signInUrl = new URL("/sign-in", request.url);
  signInUrl.searchParams.set("error", "callback");
  signInUrl.searchParams.set("next", nextPath);
  return NextResponse.redirect(signInUrl);
}


export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    const setupUrl = new URL("/sign-in", request.url);
    setupUrl.searchParams.set("notice", "setup");
    setupUrl.searchParams.set("next", safeNextPath(request.nextUrl.searchParams.get("next")));
    return NextResponse.redirect(setupUrl);
  }

  const code = request.nextUrl.searchParams.get("code");
  if (!code) return callbackErrorRedirect(request);

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return callbackErrorRedirect(request);

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
