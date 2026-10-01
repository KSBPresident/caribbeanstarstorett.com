import Link from "next/link";
import { SiteHeader } from "../../components/site-header";
import { signUp } from "./actions";
import { isSupabaseConfigured } from "../../lib/supabase/configured";
import { safeNextPath } from "../../lib/auth/return-path";

type PageProps = {
  searchParams: Promise<{ error?: string; notice?: string; next?: string }>;
};

export const metadata = {
  robots: { index: false, follow: false },
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
      <main id="main-content" tabIndex={-1} className="identity-auth-page">
        <section className="identity-auth-card">
          <span className="identity-eyebrow">MIDDLE OS · IDENTITY</span>
          <h1>Create your account</h1>
          <p>Create a standard marketplace account for your profile and requests. Seller and organization capabilities have separate access requirements.</p>
          <section className="identity-panel identity-access-guide" aria-labelledby="account-access-title">
            <h2 id="account-access-title">How account access works</h2>
            <ul>
              <li><strong>Shopper:</strong> Manage your profile and private requests. Shopper accounts cannot publish products or manage an organization workspace.</li>
              <li><strong>Seller / store owner:</strong> Start with a standard account and apply. Seller tools become available only after review; an approved owner can manage their assigned store and its listings.</li>
              <li><strong>Organization member:</strong> Access is limited to the organization and actions allowed by the role assigned by its owner.</li>
              <li><strong>Platform owner:</strong> Trusted site-wide administrator access is provisioned separately. Public sign-up cannot grant it.</li>
            </ul>
            <p className="catalog-meta">Account privileges are assigned through approval and trusted roles; choosing a label or changing profile details cannot raise access. Product publishing and checkout will be enabled as the marketplace services are completed.</p>
          </section>
          <p className="identity-switch"><Link href="/how-it-works">Learn how the marketplace works</Link></p>
          {!isSupabaseConfigured() && (
            <p className="identity-message" role="status">
              Account services are not configured yet. The site owner needs to add the Supabase URL and publishable key to Vercel.
            </p>
          )}
          {notice && <p className="identity-message" role="status">{notice}</p>}
          {error && <p className="identity-message identity-error" role="alert">{error}</p>}
          <p className="identity-message" role="note">
            <strong>Privacy notice in progress.</strong> Creating an account submits the name, email address, and password you enter to account services. The current <Link href="/privacy">privacy notice</Link> advises visitors not to submit personal or sensitive information while the full notice is being prepared. You can wait to register until the complete notice is available.
          </p>
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
              <input name="password" type="password" autoComplete="new-password" minLength={8} required aria-describedby="password-hint" />
              <span id="password-hint" className="catalog-meta">Use at least 8 characters.</span>
            </label>
            <button className="identity-submit" type="submit">Create account</button>
          </form>
          <p className="identity-switch">Already have an account? <Link href={`/sign-in?next=${encodeURIComponent(nextPath)}`}>Sign in</Link></p>
        </section>
      </main>
    </>
  );
}
