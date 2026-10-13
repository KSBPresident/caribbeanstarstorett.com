import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteHeader } from "../../components/site-header";
import { createClient } from "../../lib/supabase/server";
import { isSupabaseConfigured } from "../../lib/supabase/configured";
import { signInUrl } from "../../lib/auth/return-path";
import { createSellerCoupon, deactivateSellerCoupon, setSellerAwayStatus } from "./actions";
import { SalesPieChart } from "../../components/sales-pie-chart";

export const metadata: Metadata = {
  title: "Your Store Owner Space",
  description: "Manage approved Caribbean Star Store workspaces and check your seller application status.",
  robots: { index: false, follow: false },
};

const statusCopy: Record<string, string> = {
  submitted: "Submitted",
  reviewing: "Under review",
  approved: "Approved",
  declined: "Needs an update",
};

export default async function SellerWorkspacePage({ searchParams }: { searchParams: Promise<{ notice?: string; error?: string }> }) {
  if (!isSupabaseConfigured()) redirect("/sign-in?notice=setup");

  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(signInUrl("/seller"));

  const applicationsResult = await supabase
    .from("seller_applications")
    .select("id, seller_name, category_key, status, created_at, organization_id")
    .eq("applicant_user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  const broadcastsResult = await supabase.from("seller_broadcasts")
    .select("id, subject, body, created_at")
    .order("created_at", { ascending: false }).limit(20);

  const applications = applicationsResult.data || [];
  const approvedApplications = applications.filter(
    (application) => application.status === "approved" && Boolean(application.organization_id),
  );
  const organizationIds = [...new Set(
    approvedApplications
      .map((application) => application.organization_id)
      .filter((id): id is string => Boolean(id)),
  )];

  const membershipResult = organizationIds.length
    ? await supabase
        .from("organization_members")
        .select("organization_id")
        .eq("user_id", user.id)
        .eq("status", "active")
        .in("organization_id", organizationIds)
    : { data: [], error: null };

  const activeOrganizationIds = [...new Set(
    (membershipResult.data || []).map((membership) => membership.organization_id),
  )];

  const salesResult = activeOrganizationIds.length
    ? await supabase.from("seller_sales")
        .select("amount, commission_amount, seller_net_amount, status, currency, category_key, created_at")
        .in("organization_id", activeOrganizationIds)
        .order("created_at", { ascending: false })
        .limit(100)
    : { data: [], error: null };
  const paidSales = (salesResult.data || []).filter((sale) => sale.status === "paid");
  const grossSales = paidSales.reduce((sum, sale) => sum + Number(sale.amount), 0);
  const commissionTotal = paidSales.reduce((sum, sale) => sum + Number(sale.commission_amount), 0);
  const sellerNet = paidSales.reduce((sum, sale) => sum + Number(sale.seller_net_amount), 0);
  const organizationsResult = activeOrganizationIds.length
    ? await supabase
        .from("organizations")
        .select("id, name, slug, organization_type")
        .in("id", activeOrganizationIds)
    : { data: [], error: null };

  const [sellerProfilesResult, couponsResult] = activeOrganizationIds.length
    ? await Promise.all([
        supabase.from("organization_public_profiles")
          .select("organization_id, seller_is_away, seller_away_message, is_published")
          .in("organization_id", activeOrganizationIds),
        supabase.from("seller_coupons")
          .select("id, organization_id, code, discount_type, discount_value, currency, is_active, expires_at, created_at")
          .in("organization_id", activeOrganizationIds)
          .order("created_at", { ascending: false }).limit(100),
      ])
    : [{ data: [], error: null }, { data: [], error: null }];

  const organizationById = new Map(
    (organizationsResult.data || []).map((organization) => [organization.id, organization]),
  );
  const profileByOrganizationId = new Map(
    (sellerProfilesResult.data || []).map((profile) => [profile.organization_id, profile]),
  );
  const couponsByOrganizationId = new Map<string, typeof couponsResult.data>();
  for (const coupon of couponsResult.data || []) {
    const items = couponsByOrganizationId.get(coupon.organization_id) || [];
    items.push(coupon);
    couponsByOrganizationId.set(coupon.organization_id, items);
  }
  const approvedWorkspaces = approvedApplications.flatMap((application) => {
    const organization = application.organization_id
      ? organizationById.get(application.organization_id)
      : null;
    return organization ? [{ application, organization }] : [];
  });
  const applicationError = Boolean(applicationsResult.error);
  const accessError = Boolean(membershipResult.error || organizationsResult.error || sellerProfilesResult.error);
  const hasApprovedApplication = approvedApplications.length > 0;
  const pendingApplications = applications.filter((application) => application.status !== "approved");

  return (
    <>
      <SiteHeader />
      <main id="main-content" tabIndex={-1} className="identity-page">
        <header className="identity-heading account-heading">
          <div>
            <span className="identity-eyebrow">STORE OWNER SPACE</span>
            <h1>Your seller workspaces</h1>
            <p>Store-owner tools are separate from your personal shopping account. Workspace access and controls follow your assigned role.</p>
          </div>
          <Link className="identity-secondary" href="/dashboard">Back to My Account</Link>
        </header>

        {params.notice === "away-updated" && <p className="identity-message" role="status">Your store availability was updated.</p>}
        {params.notice === "coupon-created" && <p className="identity-message" role="status">Coupon created and published to shoppers.</p>}
        {params.notice === "coupon-updated" && <p className="identity-message" role="status">Coupon deactivated.</p>}
        {params.error === "away" && <p className="identity-message identity-error" role="alert">Availability could not be updated. Publish a store profile first, then try again.</p>}
        {params.error === "coupon" && <p className="identity-message identity-error" role="alert">Coupon could not be saved. Check its code, discount amount, expiry date, and whether the code is already in use.</p>}
        {params.error === "coupon-profile" && <p className="identity-message identity-error" role="alert">Publish this store profile before creating customer-visible coupon codes.</p>}
        {applicationError && (
          <p className="identity-message identity-error" role="alert">
            We couldn’t load your seller applications. Refresh the page to try again.
          </p>
        )}
        {approvedApplications.length > 0 && (
          <section className="identity-panel">
            <span className="identity-eyebrow">SELLER UPDATES</span>
            <h2>Announcements from Caribbean Star Store</h2>
            {broadcastsResult.error ? (
              <p className="identity-message identity-error" role="alert">Seller announcements could not be loaded.</p>
            ) : broadcastsResult.data?.length ? (
              <div className="seller-app-list">
                {broadcastsResult.data.map((item) => (
                  <article className="seller-app-card" key={item.id}>
                    <div className="seller-app-heading"><strong>{item.subject}</strong><span className="seller-status">{new Date(item.created_at).toLocaleDateString("en", { day: "numeric", month: "short", year: "numeric" })}</span></div>
                    <p>{item.body}</p>
                  </article>
                ))}
              </div>
            ) : <p className="organization-empty">No new seller announcements.</p>}
          </section>
        )}

        {accessError && (
          <p className="identity-message identity-error" role="alert">
            We couldn’t confirm workspace access. Refresh the page to try again.
          </p>
        )}

        {!applicationError && !hasApprovedApplication && (
          <section className="identity-panel">
            <span className="identity-eyebrow">SELLER ACCESS</span>
            <h2>Apply to open a store workspace</h2>
            <p>Shopper accounts stay personal. Submit a seller application for review; a private workspace becomes available after approval.</p>
            <Link className="identity-submit" href="/sell">Start or review a seller application →</Link>
          </section>
        )}

        {hasApprovedApplication && !approvedWorkspaces.length && !accessError && (
          <section className="identity-panel">
            <span className="identity-eyebrow">APPLICATION APPROVED</span>
            <h2>Your workspace isn’t available yet</h2>
            <p>Your approval is recorded, but an active workspace could not be found for this account. Contact the Caribbean Star Store team so they can review access.</p>
            <Link className="identity-secondary" href="/help#contact">Get help</Link>
          </section>
        )}

        {approvedWorkspaces.length > 0 && (
          <section className="identity-panel">
            <span className="identity-eyebrow">APPROVED STORE WORKSPACES</span>
            <h2>Manage your stores</h2>
            <p>Open a workspace to manage its public profile, marketplace listings, and team access where your role allows.</p>
            <div className="seller-app-list">
              {approvedWorkspaces.map(({ application, organization }) => (
                <article className="seller-app-card" key={application.id}>
                  <div className="seller-app-heading">
                    <strong>{organization.name}</strong>
                    <span className="seller-status seller-status-approved">Approved</span>
                  </div>
                  <p>{application.category_key.replaceAll("-", " ")} · {organization.organization_type} workspace</p>
                  <Link className="directory-card-link" href={`/business/${organization.slug}`}>Open store workspace →</Link>
                  <p><Link className="directory-card-link" href="/seller/inventory">Manage product inventory →</Link></p>
                </article>
              ))}
            </div>
          </section>
        )}

        {approvedWorkspaces.length > 0 && (
          <section className="identity-panel">
            <span className="identity-eyebrow">STORE AVAILABILITY & COUPONS</span>
            <h2>Manage each store</h2>
            <p>Set an away notice for shoppers and publish discount codes. Coupon codes are visible to customers; checkout redemption will be enabled when online checkout is connected.</p>
            <div className="seller-app-list">
              {approvedWorkspaces.map(({ application, organization }) => {
                const profile = profileByOrganizationId.get(organization.id);
                const coupons = couponsByOrganizationId.get(organization.id) || [];
                return (
                  <article className="seller-app-card" key={organization.id}>
                    <h3>{organization.name}</h3>
                    {profile ? (
                      <form action={setSellerAwayStatus} className="identity-form">
                        <input type="hidden" name="organizationId" value={organization.id} />
                        <label><span>Store is away</span><input type="checkbox" name="isAway" value="true" defaultChecked={profile.seller_is_away} /></label>
                        <label>Message to shoppers<textarea name="awayMessage" rows={2} maxLength={240} defaultValue={profile.seller_away_message || ""} placeholder="Optional: tell shoppers when you expect to return" /></label>
                        <button className="identity-submit" type="submit">Save availability</button>
                      </form>
                    ) : <p className="organization-empty">Publish your business profile before setting an away notice.</p>}
                    {profile?.is_published ? <form action={createSellerCoupon} className="identity-form">
                      <input type="hidden" name="organizationId" value={organization.id} />
                      <label>Coupon code<input name="code" minLength={3} maxLength={40} pattern="[A-Za-z0-9][A-Za-z0-9_-]{2,39}" required placeholder="WELCOME10" /></label>
                      <div className="seller-form-row">
                        <label>Discount<select name="discountType" defaultValue="percentage"><option value="percentage">Percentage</option><option value="fixed">Fixed USD amount</option></select></label>
                        <label>Value<input name="discountValue" type="number" min="0.01" max="100000" step="0.01" required /></label>
                      </div>
                      <label>Expiry date (optional)<input name="expiresAt" type="date" /></label>
                      <button className="identity-submit" type="submit">Publish coupon</button>
                    </form> : <p className="organization-empty">Publish your store profile before creating coupons customers can see.</p>}
                    {coupons.length ? <div className="account-activity-list">{coupons.map((coupon) => (
                      <article key={coupon.id}><div><strong>{coupon.code} · {coupon.discount_type === "percentage" ? `${coupon.discount_value}% off` : `${coupon.currency} ${Number(coupon.discount_value).toFixed(2)} off`}</strong><span>{coupon.is_active ? "Active" : "Inactive"}{coupon.expires_at ? ` · Expires ${new Date(coupon.expires_at).toLocaleDateString()}` : ""}</span></div>{coupon.is_active && <form action={deactivateSellerCoupon}><input type="hidden" name="organizationId" value={organization.id} /><input type="hidden" name="couponId" value={coupon.id} /><button className="identity-secondary" type="submit">Deactivate</button></form>}</article>
                    ))}</div> : <p className="organization-empty">No coupons created for this store yet.</p>}
                  </article>
                );
              })}
            </div>
            <Link className="directory-card-link" href="/coupons">View shopper coupon page →</Link>
          </section>
        )}

        {approvedWorkspaces.length > 0 && (
          <section className="identity-panel">
            <span className="identity-eyebrow">SALES & PAYOUTS</span>
            <h2>Your sales progress</h2>
            <p>Caribbean Star Store charges a fixed 12% commission on every completed sale; the remaining 88% is seller proceeds.</p>
            {salesResult.error ? (
              <p className="identity-message identity-error" role="alert">Sales figures could not be loaded. Refresh to try again.</p>
            ) : paidSales.length ? (
              <>
                <SalesPieChart counts={paidSales.reduce<Record<string, number>>((counts, sale) => {
                  counts[sale.category_key] = (counts[sale.category_key] || 0) + 1;
                  return counts;
                }, {})} />
                <div className="account-overview">
                  <article className="account-overview-card"><span>Recorded sales</span><strong>{paidSales.length}</strong></article>
                  <article className="account-overview-card"><span>Gross sales</span><strong>USD {grossSales.toFixed(2)}</strong></article>
                  <article className="account-overview-card"><span>12% commission</span><strong>USD {commissionTotal.toFixed(2)}</strong></article>
                  <article className="account-overview-card"><span>Seller proceeds</span><strong>USD {sellerNet.toFixed(2)}</strong></article>
                </div>
              </>
            ) : (
              <>
                <SalesPieChart counts={{}} />
                <div className="account-overview">
                  <article className="account-overview-card"><span>Recorded sales</span><strong>0</strong></article>
                  <article className="account-overview-card"><span>Gross sales</span><strong>USD 0.00</strong></article>
                  <article className="account-overview-card"><span>12% commission</span><strong>USD 0.00</strong></article>
                  <article className="account-overview-card"><span>Seller proceeds</span><strong>USD 0.00</strong></article>
                </div>
                <p className="organization-empty">No completed sales have been recorded yet. These totals will update from verified paid orders; no sample sales are included.</p>
              </>
            )}
          </section>
        )}

        {pendingApplications.length > 0 && (
          <section className="identity-panel">
            <span className="identity-eyebrow">APPLICATION STATUS</span>
            <h2>Applications under review</h2>
            <div className="seller-app-list">
              {pendingApplications.map((application) => (
                <article className="seller-app-card" key={application.id}>
                  <div className="seller-app-heading">
                    <strong>{application.seller_name}</strong>
                    <span className={`seller-status seller-status-${application.status}`}>
                      {statusCopy[application.status] || "Submitted"}
                    </span>
                  </div>
                  <p>{application.category_key.replaceAll("-", " ")} · Submitted {new Date(application.created_at).toLocaleDateString("en", { day: "numeric", month: "short", year: "numeric" })}</p>
                </article>
              ))}
            </div>
            <Link href="/sell">Review your applications →</Link>
          </section>
        )}

        {!applicationError && applications.length === 0 && (
          <p className="organization-empty">No seller applications have been submitted for this account.</p>
        )}
      </main>
    </>
  );
}
