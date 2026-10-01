import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteHeader } from "../../components/site-header";
import { createClient } from "../../lib/supabase/server";
import { isSupabaseConfigured } from "../../lib/supabase/configured";
import { updatePassword } from "./actions";
import { safeNextPath } from "../../lib/auth/return-path";

type PageProps = { searchParams: Promise<{ error?: string; notice?: string; next?: string }> };

export default async function UpdatePasswordPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const nextPath = safeNextPath(params.next);
  if (!isSupabaseConfigured()) redirect(`/sign-in?notice=setup&next=${encodeURIComponent(nextPath)}`);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/forgot-password?notice=expired&next=${encodeURIComponent(nextPath)}`);
  const notice = params.notice === "updated" ? "Your password has been updated." : null;
  const error = params.error === "invalid"
    ? "Choose a password of at least 8 characters and enter it the same way twice."
    : params.error === "save"
      ? "We couldn’t update your password. Please try again."
      : null;

  return (
    <>
      <SiteHeader />
      <main id="main-content" tabIndex={-1} className="identity-auth-page">
        <section className="identity-auth-card">
          <span className="identity-eyebrow">MIDDLE OS · IDENTITY</span>
          <h1>Choose a new password</h1>
          <p>Enter a new password for your Caribbean Star Store account.</p>
          {notice && <p className="identity-message" role="status">{notice}</p>}
          {error && <p className="identity-message identity-error" role="alert">{error}</p>}
          {!notice && (
            <form action={updatePassword} className="identity-form">
              <input type="hidden" name="next" value={nextPath} />
              <label>New password<input name="password" type="password" autoComplete="new-password" minLength={8} maxLength={128} required /></label>
              <label>Confirm new password<input name="confirmPassword" type="password" autoComplete="new-password" minLength={8} maxLength={128} required /></label>
              <button className="identity-submit" type="submit">Update password</button>
            </form>
          )}
          <p className="identity-switch"><Link href={notice ? nextPath : `/sign-in?next=${encodeURIComponent(nextPath)}`}>{notice ? "Continue" : "Back to sign in"}</Link></p>
        </section>
      </main>
    </>
  );
}
