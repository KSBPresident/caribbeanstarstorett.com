import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteHeader } from "../../components/site-header";
import { createClient } from "../../lib/supabase/server";
import { isSupabaseConfigured } from "../../lib/supabase/configured";
import { reviewSellerApplication, updatePurchaseRequestStatus } from "./actions";
import { signInUrl } from "../../lib/auth/return-path";

type PageProps = { searchParams: Promise<{ error?: string; notice?: string }> };

function dateLabel(value: string) {
  return new Date(value).toLocaleDateString("en-TT", { day: "numeric", month: "short", year: "numeric" });
}

export default async function Admin({ searchParams }: PageProps) {
  if (!isSupabaseConfigured()) redirect("/sign-in?notice=setup");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(signInUrl("/admin"));

  if (user.app_metadata?.platform_role !== "admin") {
    return (
      <>
        <SiteHeader />
        <main className="identity-page">
          <header className="identity-heading">
            <div><span className="identity-eyebrow">TOP · EXECUTIVE OS</span><h1>Platform administration</h1><p>Caribbean Star Store TT</p></div>
          </header>
          <section className="identity-panel exec-setup-panel">
            <span className="exec-setup-icon" aria-hidden="true">✦</span>
            <h2>Platform administrator access is not enabled</h2>
            <p>Executive controls use a separate, trusted platform role. Organization owners and workspace roles do not grant site-wide access. A project owner can provision the first administrator after an account is registered.</p>
            <div className="cart-empty-actions">
              <Link className="identity-submit" href="/dashboard">Account settings</Link>
              <Link className="identity-secondary" href="/business">Open workspaces</Link>
            </div>
          </section>
        </main>
      </>
    );
  }

  const [params, profileCount, organizationCount, memberCount, sellerCount, requestCount, businessCount, opportunityCount, sellers, requests, audit] = await Promise.all([
    searchParams,
    supabase.from("profiles").select("user_id", { count: "exact", head: true }),
    supabase.from("organizations").select("id", { count: "exact", head: true }),
    supabase.from("organization_members").select("user_id", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("seller_applications").select("id", { count: "exact", head: true }).in("status", ["submitted", "reviewing"]),
    supabase.from("purchase_requests").select("id", { count: "exact", head: true }).in("status", ["open", "reviewing", "matched"]),
    supabase.from("organization_public_profiles").select("organization_id", { count: "exact", head: true }).eq("is_published", true),
    supabase.from("organization_marketplace_listings").select("id", { count: "exact", head: true }).eq("is_published", true),
    supabase.from("seller_applications")
      .select("id, seller_name, seller_type, category_key, contact_email, phone, website_url, description, status, created_at")
      .in("status", ["submitted", "reviewing"]).order("created_at", { ascending: false }).limit(20),
    supabase.from("purchase_requests")
      .select("id, title, details, category_key, budget_amount, currency, status, created_at")
      .in("status", ["open", "reviewing", "matched"]).order("created_at", { ascending: false }).limit(20),
    supabase.from("audit_log")
      .select("id, action, resource_type, resource_id, metadata, created_at")
      .order("created_at", { ascending: false }).limit(20),
  ]);

  const queryError = profileCount.error || organizationCount.error || memberCount.error || sellerCount.error ||
    requestCount.error || businessCount.error || opportunityCount.error || sellers.error || requests.error || audit.error;
  const notice = params.notice === "seller-reviewed"
    ? "Seller application status updated and recorded in the audit log."
    : params.notice === "request-updated"
      ? "Build-A-Buy request status updated and recorded in the audit log."
      : null;
  const errorMessage = params.error === "access"
    ? "Your platform administrator access is no longer active."
    : params.error === "seller"
      ? "The seller application could not be updated. It may already have been reviewed."
      : params.error === "request"
        ? "The request could not be updated. Check its current status and allowed next step."
        : null;

  const metrics = [
    ["Accounts", profileCount.count],
    ["Organizations", organizationCount.count],
    ["Active memberships", memberCount.count],
    ["Seller applications to review", sellerCount.count],
    ["Active Build-A-Buy requests", requestCount.count],
    ["Published business profiles", businessCount.count],
    ["Published jobs & properties", opportunityCount.count],
  ];

  return (
    <>
      <SiteHeader />
      <main className="identity-page">
        <header className="identity-heading account-heading">
          <div><span className="identity-eyebrow">TOP · EXECUTIVE OS</span><h1>Platform administration</h1><p>Platform activity, seller onboarding, and marketplace requests.</p></div>
          <span className="organization-role">Platform administrator</span>
        </header>
        {notice && <p className="identity-message" role="status">{notice}</p>}
        {errorMessage && <p className="identity-message identity-error" role="alert">{errorMessage}</p>}
        {queryError && <p className="identity-message identity-error" role="alert">Some platform data could not be loaded. Refresh to try again.</p>}

        <section className="account-overview" aria-label="Platform activity">
          {metrics.map(([label, value]) => <article className="account-overview-card" key={label}><span>{label}</span><strong>{value ?? "—"}</strong></article>)}
        </section>

        <div className="identity-dashboard-grid">
          <section className="identity-panel">
            <div className="account-panel-title"><div><span className="identity-eyebrow">TRUST · SELLER ONBOARDING</span><h2>Applications to review</h2></div><span>{sellers.data?.length || 0}</span></div>
            {sellers.error ? <p className="organization-empty">Seller applications are temporarily unavailable.</p> : sellers.data?.length ? (
              <div className="admin-review-list">
                {sellers.data.map((application) => (
                  <article className="seller-app-card" key={application.id}>
                    <div className="seller-app-heading"><strong>{application.seller_name}</strong><span className={`seller-status seller-status-${application.status}`}>{application.status}</span></div>
                    <p>{application.seller_type} · {application.category_key.replaceAll("-", " ")} · Received {dateLabel(application.created_at)}</p>
                    <p>{application.description}</p>
                    <div className="admin-contact-details"><a href={`mailto:${application.contact_email}`}>{application.contact_email}</a>{application.phone && <a href={`tel:${application.phone}`}>{application.phone}</a>}{application.website_url && <a href={application.website_url} target="_blank" rel="noopener noreferrer">Website ↗</a>}</div>
                    <form action={reviewSellerApplication} className="identity-form">
                      <input type="hidden" name="applicationId" value={application.id} />
                      <label>Review status<select name="status" defaultValue={application.status}><option value="reviewing">Under review</option><option value="approved">Approve</option><option value="declined">Needs an update</option></select></label>
                      <button className="identity-submit" type="submit">Save review</button>
                    </form>
                  </article>
                ))}
              </div>
            ) : <p className="organization-empty">No seller applications need review.</p>}
          </section>

          <section className="identity-panel">
            <div className="account-panel-title"><div><span className="identity-eyebrow">FRONT OS · BUILD-A-BUY</span><h2>Active buying requests</h2></div><span>{requests.data?.length || 0}</span></div>
            {requests.error ? <p className="organization-empty">Buying requests are temporarily unavailable.</p> : requests.data?.length ? (
              <div className="admin-review-list">
                {requests.data.map((request) => (
                  <article className="seller-app-card" key={request.id}>
                    <div className="seller-app-heading"><strong>{request.title}</strong><span className="seller-status">{request.status}</span></div>
                    <p>{request.category_key.replaceAll("-", " ")} · Received {dateLabel(request.created_at)}{request.budget_amount ? ` · ${request.currency} ${Number(request.budget_amount).toLocaleString("en-TT", { minimumFractionDigits: 2 })}` : ""}</p>
                    <p>{request.details}</p>
                    <form action={updatePurchaseRequestStatus} className="identity-form">
                      <input type="hidden" name="requestId" value={request.id} />
                      <label>Next status<select name="status" defaultValue={request.status === "open" ? "reviewing" : request.status === "reviewing" ? "matched" : "completed"}>
                        {request.status === "open" && <option value="reviewing">Under review</option>}
                        {request.status === "reviewing" && <option value="matched">Matched</option>}
                        {request.status === "matched" && <option value="completed">Completed</option>}
                        <option value="cancelled">Cancelled</option>
                      </select></label>
                      <button className="identity-submit" type="submit">Update request</button>
                    </form>
                  </article>
                ))}
              </div>
            ) : <p className="organization-empty">No active Build-A-Buy requests.</p>}
          </section>

          <section className="identity-panel identity-wide">
            <div className="account-panel-title"><div><span className="identity-eyebrow">BACK OS · TRUST</span><h2>Recent platform audit</h2></div><span>{audit.data?.length || 0} events</span></div>
            {audit.error ? <p className="organization-empty">Audit events are temporarily unavailable.</p> : audit.data?.length ? (
              <div className="account-activity-list">
                {audit.data.map((entry) => <article key={entry.id}><div><strong>{entry.action.replaceAll("_", " ").replaceAll(".", " ")}</strong><span>{entry.resource_type || "platform"} · {entry.resource_id || "—"} · {dateLabel(entry.created_at)}</span></div></article>)}
              </div>
            ) : <p className="organization-empty">No platform events have been recorded yet.</p>}
          </section>
        </div>
      </main>
    </>
  );
}
