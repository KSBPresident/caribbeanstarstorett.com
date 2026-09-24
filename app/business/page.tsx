import { redirect } from "next/navigation";
import { SiteHeader } from "../../components/site-header";
import { createClient } from "../../lib/supabase/server";
import { isSupabaseConfigured } from "../../lib/supabase/configured";
import { createOrganization } from "./actions";

type PageProps = {
  searchParams: Promise<{ error?: string; notice?: string }>;
};

export default async function OrganizationsPage({ searchParams }: PageProps) {
  if (!isSupabaseConfigured()) {
    redirect("/sign-in?notice=setup");
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/sign-in?notice=signin");
  }

  const [{ data: memberships }, params] = await Promise.all([
    supabase
      .from("organization_members")
      .select("organization_id, role_id")
      .eq("user_id", user.id)
      .eq("status", "active"),
    searchParams,
  ]);

  const membershipRows = memberships || [];
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

  const notice =
    params.notice === "created"
      ? "Your organization was created and you were assigned as its owner."
      : params.error === "invalid"
        ? "Enter a valid organization name."
        : params.error === "create"
          ? "We couldn’t create that workspace. Its name may already be in use."
          : null;

  return (
    <>
      <SiteHeader />
      <main className="identity-page">
        <header className="identity-heading">
          <div>
            <span className="identity-eyebrow">MIDDLE OS · ORGANIZATIONS</span>
            <h1>Your workspaces</h1>
            <p>Use one account to work with your businesses, community groups, and other organizations.</p>
          </div>
        </header>

        {notice && (
          <p className={params.error ? "identity-message identity-error" : "identity-message"} role={params.error ? "alert" : "status"}>
            {notice}
          </p>
        )}

        <div className="organization-layout">
          <section className="identity-panel">
            <h2>Create an organization</h2>
            <p>Creating a workspace makes you its first owner. You can invite people when member management is available.</p>
            <form action={createOrganization} className="identity-form">
              <label>
                Organization name
                <input name="name" autoComplete="organization" minLength={2} maxLength={80} required />
              </label>
              <label>
                Organization type
                <select name="organizationType" defaultValue="business">
                  <option value="business">Business</option>
                  <option value="individual">Individual seller</option>
                  <option value="nonprofit">Nonprofit</option>
                  <option value="community">Community group</option>
                </select>
              </label>
              <button className="identity-submit" type="submit">Create workspace</button>
            </form>
          </section>

          <section className="identity-panel">
            <h2>Organizations you belong to</h2>
            {workspaces.length ? (
              <div className="organization-list">
                {workspaces.map((organization) => (
                  <article className="organization-card" key={organization.id}>
                    <div>
                      <h3>{organization.name}</h3>
                      <p>{organization.organization_type} · /{organization.slug}</p>
                    </div>
                    <span className="organization-role">{organization.roleName}</span>
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
