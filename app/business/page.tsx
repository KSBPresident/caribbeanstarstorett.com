import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteHeader } from "../../components/site-header";
import { PrivacyStatusNote } from "../../components/privacy-status-note";
import { createClient } from "../../lib/supabase/server";
import { isSupabaseConfigured } from "../../lib/supabase/configured";
import { createOrganization } from "./actions";
import { signInUrl } from "../../lib/auth/return-path";

type PageProps = {
  searchParams: Promise<{ error?: string; notice?: string }>;
};

export const metadata = {
  robots: { index: false, follow: false },
};

export default async function OrganizationsPage({ searchParams }: PageProps) {
  if (!isSupabaseConfigured()) {
    redirect("/sign-in?notice=setup");
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return (
      <>
        <SiteHeader />
        <main id="main-content" tabIndex={-1} className="identity-page">
          <header className="identity-heading">
            <div>
              <span className="identity-eyebrow">COMMUNITY &amp; ORGANIZATION SPACES</span>
              <h1>Build a community or nonprofit workspace.</h1>
              <p>Your personal account stays separate. Community and nonprofit groups can create a workspace; seller stores begin with an application and review.</p>
              <div className="directory-hero-actions">
                <Link className="identity-submit" href={"/sign-up?next=" + encodeURIComponent("/business")}>Create a community workspace</Link>
                <Link className="directory-secondary" href="/sell">Apply to sell</Link>
                <Link className="directory-secondary" href={signInUrl("/business")}>Already have an account? Sign in</Link>
              </div>
            </div>
          </header>
          <div className="build-request-grid">
            <section className="identity-panel">
              <h2>Build your business presence</h2>
              <p>Set up your organization workspace, add the information customers need, and publish your business profile when it is ready.</p>
            </section>
            <section className="identity-panel">
              <h2>Reach more customers</h2>
              <p>Help shoppers discover your business across the Caribbean. You control when your public profile is ready to appear in the directory.</p>
              <p><Link className="identity-inline-link" href="/sell">Learn about selling on Caribbean Star Store →</Link></p>
            </section>
          </div>
        </main>
      </>
    );
  }

  const [membershipResult, params] = await Promise.all([
    supabase
      .from("organization_members")
      .select("organization_id, role_id")
      .eq("user_id", user.id)
      .eq("status", "active"),
    searchParams,
  ]);

  const membershipRows = membershipResult.data || [];
  const organizationIds = membershipRows.map((membership) => membership.organization_id);
  const roleIds = membershipRows.map((membership) => membership.role_id);

  const [organizationResult, roleResult] = await Promise.all([
    organizationIds.length
      ? supabase
          .from("organizations")
          .select("id, name, slug, organization_type")
          .in("id", organizationIds)
      : Promise.resolve({ data: [], error: null }),
    roleIds.length
      ? supabase.from("roles").select("id, name").in("id", roleIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  const organizations = organizationResult.data || [];
  const roles = roleResult.data || [];
  const workspaces = membershipRows.flatMap((membership) => {
    const organization = organizations.find((item) => item.id === membership.organization_id);
    const role = roles.find((item) => item.id === membership.role_id);
    return organization ? [{ ...organization, roleName: role?.name || "member" }] : [];
  });
  const workspaceLoadError = Boolean(
    membershipResult.error || organizationResult.error || roleResult.error
  );

  const notice =
    params.notice === "created"
      ? "Your organization was created and you were assigned as its owner."
      : params.error === "seller-review"
        ? "Store-owner workspaces are opened after seller application approval. Start or review your application."
        : params.error === "invalid"
        ? "Enter a valid organization name."
        : params.error === "create"
          ? "We couldn’t create that workspace. Its name may already be in use."
          : null;

  return (
    <>
      <SiteHeader />
      <main id="main-content" tabIndex={-1} className="identity-page">
        <header className="identity-heading">
          <div>
            <span className="identity-eyebrow">WORKSPACES</span>
            <h1>Community and organization workspaces</h1>
            <p>Your personal shopping account stays separate from organization access. Approved seller stores appear in your store-owner space.</p>
          </div>
        </header>

        {notice && (
          <p className={params.error ? "identity-message identity-error" : "identity-message"} role={params.error ? "alert" : "status"}>
            {notice} {params.error === "seller-review" && <Link href="/sell">Open seller applications →</Link>}
          </p>
        )}

        <div className="organization-layout">
          <section className="identity-panel">
            <h2>Create a nonprofit or community workspace</h2>
            <p>Creating a workspace makes you its first owner. Store-owner workspaces are available through the seller application and review process.</p>
            <PrivacyStatusNote submittedData="This form sends the organization name and type to account services and associates the organization with your signed-in account." />
            <form action={createOrganization} className="identity-form">
              <label>
                Organization name
                <input name="name" autoComplete="organization" minLength={2} maxLength={80} required />
              </label>
              <label>
                Organization type
                <select name="organizationType" defaultValue="community">
                  <option value="community">Community group</option>
                  <option value="nonprofit">Nonprofit organization</option>
                </select>
              </label>
              <button className="identity-submit" type="submit">Create workspace</button>
            </form>
          </section>

          <section className="identity-panel">
            <h2>Organizations you belong to</h2>
            {workspaceLoadError ? (
              <p className="organization-empty identity-error" role="alert">Your workspaces could not be loaded. Refresh the page to try again.</p>
            ) : workspaces.length ? (
              <div className="organization-list">
                {workspaces.map((organization) => (
                  <article className="organization-card" key={organization.id}>
                    <div>
                      <h3><Link href={`/business/${organization.slug}`}>{organization.name}</Link></h3>
                      <p>{organization.organization_type} · /{organization.slug}</p>
                    </div>
                    <div className="organization-card-actions"><span className="organization-role">{organization.roleName}</span><Link className="organization-open-link" href={`/business/${organization.slug}`}>Open workspace →</Link></div>
                  </article>
                ))}
              </div>
            ) : (
              <p className="organization-empty">No workspaces are linked to this account yet.</p>
            )}
          </section>
        </div>
      </main>
    </>
  );
}
