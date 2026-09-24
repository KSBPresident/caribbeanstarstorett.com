import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteHeader } from "../../components/site-header";
import { createClient } from "../../lib/supabase/server";
import { isSupabaseConfigured } from "../../lib/supabase/configured";
import { updateProfile } from "./actions";

type PageProps = {
  searchParams: Promise<{ error?: string; notice?: string }>;
};

export default async function DashboardPage({ searchParams }: PageProps) {
  if (!isSupabaseConfigured()) {
    redirect("/sign-in?notice=setup");
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/sign-in?notice=signin");
  }

  const [{ data: profile }, params] = await Promise.all([
    supabase.from("profiles").select("display_name, avatar_url").eq("user_id", user.id).maybeSingle(),
    searchParams,
  ]);

  const displayName =
    profile?.display_name ||
    (typeof user.user_metadata?.display_name === "string" ? user.user_metadata.display_name : "") ||
    (user.email || "").split("@")[0];

  const notice =
    params.notice === "saved"
      ? "Your profile has been updated."
      : params.error === "profile"
        ? "Enter a name between 2 and 60 characters."
        : params.error === "save"
          ? "We couldn’t save that change. Please try again."
          : null;

  return (
    <>
      <SiteHeader />
      <main className="identity-page">
        <header className="identity-heading">
          <div>
            <span className="identity-eyebrow">MIDDLE OS · IDENTITY</span>
            <h1>Your account</h1>
            <p>Manage your profile and account access.</p>
          </div>
          <form action="/auth/sign-out" method="post">
            <button className="identity-secondary" type="submit">Sign out</button>
          </form>
        </header>

        {notice && <p className="identity-message" role="status">{notice}</p>}

        <div className="identity-dashboard-grid">
          <section className="identity-panel">
            <h2>Profile</h2>
            <p>These details belong to your Caribbean Star Store account.</p>
            <form action={updateProfile} className="identity-form">
              <label>
                Display name
                <input name="displayName" defaultValue={displayName} autoComplete="name" minLength={2} maxLength={60} required />
              </label>
              <label>
                Email
                <input value={user.email || ""} readOnly aria-readonly="true" />
              </label>
              <button className="identity-submit" type="submit">Save profile</button>
            </form>
          </section>

          <section className="identity-panel">
            <h2>Account security</h2>
            <dl className="identity-details">
              <div><dt>Email status</dt><dd>{user.email_confirmed_at ? "Confirmed" : "Confirmation pending"}</dd></div>
              <div><dt>Signed in as</dt><dd>{user.email}</dd></div>
            </dl>
            <p className="identity-note">Your session is managed by the secure account service.</p>
          </section>

          <section className="identity-panel identity-wide">
            <h2>Next: organizations and roles</h2>
            <p>Seller and business workspaces will appear here once organization membership and authorization are connected.</p>
            <Link className="identity-inline-link" href="/marketplace">Continue browsing the marketplace →</Link>
          </section>
        </div>
      </main>
    </>
  );
}
