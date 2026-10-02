import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteHeader } from "../../components/site-header";
import { createClient } from "../../lib/supabase/server";
import { isSupabaseConfigured } from "../../lib/supabase/configured";
import { signInUrl } from "../../lib/auth/return-path";

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

export default async function SellerWorkspacePage() {
  if (!isSupabaseConfigured()) redirect("/sign-in?notice=setup");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(signInUrl("/seller"));

  const applicationsResult = await supabase
    .from("seller_applications")
    .select("id, seller_name, category_key, status, created_at, organization_id")
    .eq("applicant_user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

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
  const organizationsResult = activeOrganizationIds.length
    ? await supabase
        .from("organizations")
        .select("id, name, slug, organization_type")
        .in("id", activeOrganizationIds)
    : { data: [], error: null };

  const organizationById = new Map(
    (organizationsResult.data || []).map((organization) => [organization.id, organization]),
  );
  const approvedWorkspaces = approvedApplications.flatMap((application) => {
    const organization = application.organization_id
      ? organizationById.get(application.organization_id)
      : null;
    return organization ? [{ application, organization }] : [];
  });
  const applicationError = Boolean(applicationsResult.error);
  const accessError = Boolean(membershipResult.error || organizationsResult.error);
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

        {applicationError && (
          <p className="identity-message identity-error" role="alert">
            We couldn’t load your seller applications. Refresh the page to try again.
          </p>
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
