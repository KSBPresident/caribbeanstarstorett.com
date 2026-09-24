import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteHeader } from "../../components/site-header";
import { createClient } from "../../lib/supabase/server";
import { isSupabaseConfigured } from "../../lib/supabase/configured";
import { getOriginalStoreUrl } from "../../lib/wordpress-store";
import { updateProfile } from "./actions";
import { signInUrl } from "../../lib/auth/return-path";

type PageProps = {
  searchParams: Promise<{ error?: string; notice?: string }>;
};

export default async function DashboardPage({ searchParams }: PageProps) {
  if (!isSupabaseConfigured()) redirect("/sign-in?notice=setup");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(signInUrl("/dashboard"));

  const [profileResult, params, workspaceCount, requestResult, sellerResult] = await Promise.all([
    supabase.from("profiles").select("display_name, avatar_url").eq("user_id", user.id).maybeSingle(),
    searchParams,
    supabase.from("organization_members").select("user_id", { count: "exact", head: true }).eq("user_id", user.id).eq("status", "active"),
    supabase.from("purchase_requests").select("id, title, category_key, status, created_at").eq("requester_user_id", user.id).order("created_at", { ascending: false }).limit(3),
    supabase.from("seller_applications").select("id, seller_name, category_key, status, created_at").eq("applicant_user_id", user.id).order("created_at", { ascending: false }).limit(3),
  ]);

  const profile = profileResult.data;
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

  const requestCount = requestResult.data?.length || 0;
  const sellerCount = sellerResult.data?.length || 0;
  const workspaceTotal = workspaceCount.count || 0;

  return (
    <>
      <SiteHeader />
      <main className="identity-page">
        <header className="identity-heading account-heading">
          <div>
            <span className="identity-eyebrow">MIDDLE OS · IDENTITY</span>
            <h1>Welcome, {displayName}</h1>
            <p>Your account, workspaces, buying requests, and seller activity in one place.</p>
          </div>
          <form action="/auth/sign-out" method="post">
            <button className="identity-secondary" type="submit">Sign out</button>
          </form>
        </header>

        {notice && <p className="identity-message" role="status">{notice}</p>}

        <section className="account-overview" aria-label="Account activity summary">
          <article className="account-overview-card"><span>Workspaces</span><strong>{workspaceTotal}</strong><Link href="/business">Manage workspaces →</Link></article>
          <article className="account-overview-card"><span>Buying requests</span><strong>{requestCount}{requestCount === 3 ? "+" : ""}</strong><Link href="/build-a-buy">View Build-A-Buy →</Link></article>
          <article className="account-overview-card"><span>Seller applications</span><strong>{sellerCount}{sellerCount === 3 ? "+" : ""}</strong><Link href="/sell">Open seller space →</Link></article>
        </section>

        <div className="identity-dashboard-grid account-dashboard-grid">
          <section className="identity-panel">
            <span className="identity-eyebrow">YOUR PROFILE</span>
            <h2>Profile details</h2>
            <p>These details belong to your Caribbean Star Store account.</p>
            <form action={updateProfile} className="identity-form">
              <label>Display name<input name="displayName" defaultValue={displayName} autoComplete="name" minLength={2} maxLength={60} required /></label>
              <label>Email<input value={user.email || ""} readOnly aria-readonly="true" /></label>
              <button className="identity-submit" type="submit">Save profile</button>
            </form>
          </section>

          <section className="identity-panel">
            <span className="identity-eyebrow">ACCOUNT SECURITY</span>
            <h2>Sign-in details</h2>
            <dl className="identity-details">
              <div><dt>Email status</dt><dd>{user.email_confirmed_at ? "Confirmed" : "Confirmation pending"}</dd></div>
              <div><dt>Signed in as</dt><dd>{user.email}</dd></div>
            </dl>
            <p className="identity-note">Your account activity and records are private to your signed-in account.</p>
          </section>

          <section className="identity-panel">
            <div className="account-panel-title"><div><span className="identity-eyebrow">BUYING</span><h2>Recent Build-A-Buy requests</h2></div><Link href="/build-a-buy">All requests →</Link></div>
            {requestResult.data?.length ? (
              <div className="account-activity-list">{requestResult.data.map((item) => <article key={item.id}><div><strong>{item.title}</strong><span>{item.category_key.replaceAll("-", " ")} · {new Date(item.created_at).toLocaleDateString("en-TT", { day: "numeric", month: "short" })}</span></div><em>{item.status}</em></article>)}</div>
            ) : <p className="organization-empty">No buying requests yet. Describe what you need and we’ll keep the request with your account.</p>}
          </section>

          <section className="identity-panel">
            <div className="account-panel-title"><div><span className="identity-eyebrow">SELLING</span><h2>Seller applications</h2></div><Link href="/sell">Seller space →</Link></div>
            {sellerResult.data?.length ? (
              <div className="account-activity-list">{sellerResult.data.map((item) => <article key={item.id}><div><strong>{item.seller_name}</strong><span>{item.category_key.replaceAll("-", " ")} · {new Date(item.created_at).toLocaleDateString("en-TT", { day: "numeric", month: "short" })}</span></div><em>{item.status}</em></article>)}
              </div>
            ) : <p className="organization-empty">No seller applications yet. Start an application when you’re ready to join the marketplace.</p>}
          </section>

          <section className="identity-panel identity-wide account-workspace-link">
            <div><span className="identity-eyebrow">MIDDLE OS · ORGANIZATIONS</span><h2>Your organizations</h2><p>Manage business and community workspaces, member access, and account roles.</p></div>
            <Link className="identity-submit" href="/business">Open your workspaces →</Link>
          </section>

          <section className="identity-panel identity-wide account-workspace-link">
            <div><span className="identity-eyebrow">ORIGINAL STORE · WOOCOMMERCE</span><h2>Purchases and order history</h2><p>Orders and checkout from the existing store stay in WooCommerce. Open the original store to sign in and manage your purchases.</p></div>
            <a className="identity-submit" href={getOriginalStoreUrl()} target="_blank" rel="noopener noreferrer">Open the existing store →</a>
          </section>
        </div>
      </main>
    </>
  );
}
