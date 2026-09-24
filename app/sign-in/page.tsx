import Link from "next/link";
import { SiteHeader } from "../../components/site-header";
import { signIn } from "./actions";
import { isSupabaseConfigured } from "../../lib/supabase/configured";

type PageProps = {
  searchParams: Promise<{ error?: string; notice?: string }>;
};

export default async function SignInPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const notice =
    params.notice === "signin"
      ? "Please sign in to continue."
      : null;
  const error =
    params.error === "credentials"
      ? "We couldn’t sign you in with those details. Check your email and password."
      : params.error === "callback"
        ? "That confirmation link could not be verified. Request a new one and try again."
        : null;

  return (
    <>
      <SiteHeader />
      <main className="identity-auth-page">
        <section className="identity-auth-card">
          <span className="identity-eyebrow">MIDDLE OS · IDENTITY</span>
          <h1>Sign in</h1>
          <p>Welcome back to Caribbean Star Store.</p>
          {!isSupabaseConfigured() && (
            <p className="identity-message" role="status">
              Account services are not configured yet. The site owner needs to add the Supabase URL and publishable key to Vercel.
            </p>
          )}
          {notice && <p className="identity-message" role="status">{notice}</p>}
          {error && <p className="identity-message identity-error" role="alert">{error}</p>}
          <form action={signIn} className="identity-form">
            <label>
              Email
              <input name="email" type="email" autoComplete="email" required />
            </label>
            <label>
              Password
              <input name="password" type="password" autoComplete="current-password" required />
            </label>
            <button className="identity-submit" type="submit">Sign in</button>
          </form>
          <p className="identity-switch">New to the marketplace? <Link href="/sign-up">Create an account</Link></p>
        </section>
      </main>
    </>
  );
}
