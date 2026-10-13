import { type EmailOtpType } from "@supabase/supabase-js";
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
  const nextPath = safeNextPath(request.nextUrl.searchParams.get("next"));

  if (!isSupabaseConfigured()) {
    const setupUrl = new URL("/sign-in", request.url);
    setupUrl.searchParams.set("notice", "setup");
    setupUrl.searchParams.set("next", nextPath);
    return NextResponse.redirect(setupUrl);
  }

  const params = request.nextUrl.searchParams;
  const code = params.get("code");
  const tokenHash = params.get("token_hash");
  const rawType = params.get("type");
  const isSupportedOtpType = (value: string | null): value is EmailOtpType =>
    value !== null &&
    ["email", "signup", "invite", "magiclink", "recovery", "email_change"].includes(value);

  if (!code && (!tokenHash || !isSupportedOtpType(rawType))) {
    return callbackErrorRedirect(request);
  }

  const supabase = await createClient();
  const authResult = code
    ? await supabase.auth.exchangeCodeForSession(code)
    : await supabase.auth.verifyOtp({
        token_hash: tokenHash!,
        type: rawType as EmailOtpType,
      });

  if (authResult.error) return callbackErrorRedirect(request);

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return callbackErrorRedirect(request);

  const displayName =
    typeof user.user_metadata?.display_name === "string"
      ? user.user_metadata.display_name
      : (user.email || "").split("@")[0];

  await supabase.from("profiles").upsert(
    { user_id: user.id, display_name: displayName },
    { onConflict: "user_id" },
  );

  const isPasswordRecovery =
    rawType === "recovery" || new URL(nextPath, request.url).pathname === "/update-password";
  const isEmailConfirmation =
    !isPasswordRecovery &&
    Boolean(user.email_confirmed_at) &&
    (rawType === "email" ||
      rawType === "signup" ||
      params.get("flow") === "signup");

  if (isEmailConfirmation) {
    const successUrl = new URL("/dashboard", request.url);
    successUrl.searchParams.set("notice", "confirmed");
    if (nextPath !== "/dashboard") {
      successUrl.searchParams.set("continue", nextPath);
    }
    return NextResponse.redirect(successUrl);
  }

  return NextResponse.redirect(new URL(nextPath, request.url));
}
