import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteHeader } from "../../components/site-header";
import { createClient } from "../../lib/supabase/server";
import { isSupabaseConfigured } from "../../lib/supabase/configured";

export default async function Admin() {
  if (!isSupabaseConfigured()) redirect("/sign-in?notice=setup");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?notice=signin");

  return (
    <>
      <SiteHeader />
      <main className="identity-page">
        <header className="identity-heading">
          <div><span className="identity-eyebrow">TOP · EXECUTIVE OS</span><h1>Platform administration</h1><p>Caribbean Star Store TT</p></div>
        </header>
        <section className="identity-panel exec-setup-panel">
          <span className="exec-setup-icon" aria-hidden="true">✦</span>
          <h2>Platform controls are being connected</h2>
          <p>This account is signed in, but the site does not yet have a platform-wide administrator role or a live executive data source. Workspace roles do not grant platform-wide access, so this area stays closed until those controls are provisioned.</p>
          <div className="cart-empty-actions">
            <Link className="identity-submit" href="/business">Open workspaces</Link>
            <Link className="identity-secondary" href="/dashboard">Account settings</Link>
          </div>
        </section>
      </main>
    </>
  );
}
