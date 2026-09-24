import Link from "next/link";
import { SiteHeader } from "../../components/site-header";
import { requestPasswordReset } from "./actions";
import { isSupabaseConfigured } from "../../lib/supabase/configured";

type PageProps = { searchParams: Promise<{ error?: string; notice?: string }> };

export default async function ForgotPasswordPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const notice = params.notice === "sent"
    ? "If the address can receive a reset email, instructions will be sent."
    : params.notice === "unavailable"
      ? "Password recovery is temporarily unavailable. Please try again later."
      : null;
  const error = params.error === "email" ? "Enter a valid email address." : null;

  return (
    <>
      <SiteHeader />
      <main className="identity-auth-page">
        <section className="identity-auth-card">
          <span className="identity-eyebrow">MIDDLE OS · IDENTITY</span>
          <h1>Reset your password</h1>
          <p>Enter the email address for your Caribbean Star Store account. We’ll send a secure reset link if it can receive one.</p>
          {!isSupabaseConfigured() && <p className="identity-message" role="status">Account services are not configured yet.</p>}
          {notice && <p className="identity-message" role="status">{notice}</p>}
          {error && <p className="identity-message identity-error" role="alert">{error}</p>}
          <form action={requestPasswordReset} className="identity-form">
            <label>Email<input name="email" type="email" autoComplete="email" required /></label>
            <button className="identity-submit" type="submit">Send reset link</button>
          </form>
          <p className="identity-switch"><Link href="/sign-in">Back to sign in</Link></p>
        </section>
      </main>
    </>
  );
}
