import Link from "next/link";
import { SiteHeader } from "../../components/site-header";
import { signUp } from "./actions";
import { isSupabaseConfigured } from "../../lib/supabase/configured";
import { getOriginalStoreUrl } from "../../lib/wordpress-store";
import { safeNextPath } from "../../lib/auth/return-path";

type PageProps = {
  searchParams: Promise<{ error?: string; notice?: string; next?: string }>;
};

export default async function SignUpPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const nextPath = safeNextPath(params.next);
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
          <p>Use your Caribbean Star Store account for marketplace features. Purchases and order history remain managed by the existing WooCommerce store.</p>
          <p className="identity-switch">Already shopping in the original store? <a href={getOriginalStoreUrl()} target="_blank" rel="noopener noreferrer">Open the existing store</a></p>
          {!isSupabaseConfigured() && (
            <p className="identity-message" role="status">
              Account services are not configured yet. The site owner needs to add the Supabase URL and publishable key to Vercel.
            </p>
          )}
          {notice && <p className="identity-message" role="status">{notice}</p>}
          {error && <p className="identity-message identity-error" role="alert">{error}</p>}
          <form action={signUp} className="identity-form">
            <input type="hidden" name="next" value={nextPath} />
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
          <p className="identity-switch">Already have an account? <Link href={`/sign-in?next=${encodeURIComponent(nextPath)}`}>Sign in</Link></p>
        </section>
      </main>
    </>
  );
}
