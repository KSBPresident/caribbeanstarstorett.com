import Link from "next/link";
import { SiteHeader } from "../../components/site-header";
import { signUp } from "./actions";
import { isSupabaseConfigured } from "../../lib/supabase/configured";

type PageProps = {
  searchParams: Promise<{ error?: string; notice?: string }>;
};

export default async function SignUpPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const notice =
    params.notice === "setup"
      ? "Account services are not configured yet. The site owner needs to add the Supabase URL and publishable key to Vercel."
      : params.notice === "confirm"
        ? "If the address can be registered, you’ll receive an email with a confirmation link."
        : null;
  const error =
    params.error === "invalid"
      ? "Enter your name, a valid email address, and a password with at least 8 characters."
      : params.error === "signup"
        ? "We couldn’t create the account. Check the details and try again."
        : null;

  return (
    <>
      <SiteHeader />
      <main className="identity-auth-page">
        <section className="identity-auth-card">
          <span className="identity-eyebrow">MIDDLE OS · IDENTITY</span>
          <h1>Create your account</h1>
          <p>Use one secure account to shop, sell, and take part in Caribbean Star Store.</p>
          {!isSupabaseConfigured() && (
            <p className="identity-message" role="status">
              Account services are not configured yet. The site owner needs to add the Supabase URL and publishable key to Vercel.
            </p>
          )}
          {notice && <p className="identity-message" role="status">{notice}</p>}
          {error && <p className="identity-message identity-error" role="alert">{error}</p>}
          <form action={signUp} className="identity-form">
            <label>
              Name
              <input name="displayName" autoComplete="name" required minLength={2} maxLength={60} />
            </label>
            <label>
              Email
              <input name="email" type="email" autoComplete="email" required />
            </label>
            <label>
              Password
              <input name="password" type="password" autoComplete="new-password" minLength={8} required />
            </label>
            <button className="identity-submit" type="submit">Create account</button>
          </form>
          <p className="identity-switch">Already have an account? <Link href="/sign-in">Sign in</Link></p>
        </section>
      </main>
    </>
  );
}
