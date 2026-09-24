import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { SiteHeader } from "../../../components/site-header";
import { createClient } from "../../../lib/supabase/server";
import { isSupabaseConfigured } from "../../../lib/supabase/configured";
import { removeOrganizationMember, updateOrganizationMemberRole } from "./actions";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ error?: string; notice?: string }>;
};

export default async function OrganizationWorkspacePage({ params, searchParams }: PageProps) {
  if (!isSupabaseConfigured()) redirect("/sign-in?notice=setup");
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?notice=signin");

  const { data: organization } = await supabase
    .from("organizations")
    .select("id, name, slug, organization_type")
    .eq("slug", slug)
    .maybeSingle();
  if (!organization) notFound();

  const { data: ownMembership } = await supabase
    .from("organization_members")
    .select("role_id")
    .eq("organization_id", organization.id)
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();
  if (!ownMembership) redirect("/business?error=workspace");

  const [memberResult, roleResult, ownRolePermissionResult] = await Promise.all([
    supabase.from("organization_members")
      .select("user_id, role_id, status, created_at")
      .eq("organization_id", organization.id)
      .order("created_at", { ascending: true }),
    supabase.from("roles").select("id, name, description").order("name"),
    supabase.from("role_permissions").select("permission_id").eq("role_id", ownMembership.role_id),
  ]);
  const memberships = memberResult.data || [];
  const roles = roleResult.data || [];
  const roleLinks = ownRolePermissionResult.data || [];
  const permissionIds = roleLinks.map((row) => row.permission_id);
  const { data: ownPermissions } = permissionIds.length
    ? await supabase.from("permissions").select("key").in("id", permissionIds)
    : { data: [] };
  const permissionKeys = new Set((ownPermissions || []).map((permission) => permission.key));
  const canManageMembers = permissionKeys.has("member.manage");
  const canManageRoles = permissionKeys.has("role.manage");
  const roleIds = roles.map((role) => role.id);
  const { data: allRoleLinks } = roleIds.length
    ? await supabase.from("role_permissions").select("role_id, permission_id").in("role_id", roleIds)
    : { data: [] };
  const permissionMap = new Map<string, string>();
  const permissionIdsForRoles = [...new Set((allRoleLinks || []).map((row) => row.permission_id))];
  const { data: permissionRows } = permissionIdsForRoles.length
    ? await supabase.from("permissions").select("id, key").in("id", permissionIdsForRoles)
    : { data: [] };
  for (const permission of permissionRows || []) permissionMap.set(permission.id, permission.key);
  const linksByRole = new Map<string, string[]>();
  for (const link of allRoleLinks || []) {
    linksByRole.set(link.role_id, [...(linksByRole.get(link.role_id) || []), permissionMap.get(link.permission_id) || ""]);
  }
  const roleById = new Map(roles.map((role) => [role.id, role]));
  const memberRole = roles.find((role) => role.name === "member");
  const assignableRoles = canManageRoles ? roles : roles.filter((role) => role.name === "member");

  const message = query.notice === "role-updated"
    ? "Member access was updated."
    : query.notice === "member-removed"
      ? "The member was removed from this workspace."
      : query.error === "permission"
        ? "You don’t have permission to make that change, or the member has already left."
        : query.error === "self"
          ? "Use an organization owner to change your own access."
          : query.error === "invalid"
            ? "That member or role could not be identified."
            : null;

  return (
    <>
      <SiteHeader />
      <main className="identity-page">
        <p className="workspace-back"><Link href="/business">← All workspaces</Link></p>
        <header className="identity-heading">
          <div>
            <span className="identity-eyebrow">MIDDLE OS · ORGANIZATIONS</span>
            <h1>{organization.name}</h1>
            <p>{organization.organization_type} workspace · Member access and roles</p>
          </div>
          <span className="organization-role">{roleById.get(ownMembership.role_id)?.name || "member"}</span>
        </header>

        {message && <p className={query.error ? "identity-message identity-error" : "identity-message"} role={query.error ? "alert" : "status"}>{message}</p>}

        <div className="workspace-grid">
          <section className="identity-panel">
            <div className="workspace-section-heading">
              <div><span className="identity-eyebrow">WORKSPACE ACCESS</span><h2>Members</h2></div>
              <span className="workspace-count">{memberships.length} {memberships.length === 1 ? "member" : "members"}</span>
            </div>
            <p>Review each person’s current role. Owners can assign any available role; administrators can manage standard members.</p>
            {canManageMembers && memberships.length ? (
              <div className="workspace-members">
                {memberships.map((membership) => {
                  const role = roleById.get(membership.role_id);
                  const isSelf = membership.user_id === user.id;
                  return (
                    <article className="workspace-member" key={membership.user_id}>
                      <div className="workspace-member-person">
                        <span className="workspace-avatar" aria-hidden="true">{isSelf ? "Y" : "•"}</span>
                        <div>
                          <strong>{isSelf ? "You" : `Member · ${membership.user_id.slice(-6)}`}</strong>
                          <span>Joined {new Date(membership.created_at).toLocaleDateString("en-TT", { day: "numeric", month: "short", year: "numeric" })}</span>
                        </div>
                      </div>
                      <div className="workspace-member-controls">
                        <span className="organization-role">{role?.name || "member"}</span>
                        {canManageMembers && !isSelf && assignableRoles.length > 0 && (
                          <form action={updateOrganizationMemberRole} className="workspace-role-form">
                            <input type="hidden" name="organizationId" value={organization.id} />
                            <input type="hidden" name="organizationSlug" value={organization.slug} />
                            <input type="hidden" name="memberUserId" value={membership.user_id} />
                            <label className="visually-hidden" htmlFor={`role-${membership.user_id}`}>Change role</label>
                            <select id={`role-${membership.user_id}`} name="roleId" defaultValue={canManageRoles ? membership.role_id : (memberRole?.id || membership.role_id)}>
                              {!canManageRoles && role?.name !== "member" && <option value={membership.role_id} disabled>{role?.name} · current</option>}
                              {assignableRoles.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}
                            </select>
                            <button type="submit" className="identity-secondary">Save role</button>
                          </form>
                        )}
                        {canManageMembers && !isSelf && (
                          <form action={removeOrganizationMember}>
                            <input type="hidden" name="organizationId" value={organization.id} />
                            <input type="hidden" name="organizationSlug" value={organization.slug} />
                            <input type="hidden" name="memberUserId" value={membership.user_id} />
                            <button type="submit" className="workspace-remove">Remove</button>
                          </form>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <p className="organization-empty">You can view workspace access, but your role cannot manage members.</p>
            )}
          </section>

          <section className="identity-panel">
            <span className="identity-eyebrow">ROLE GUIDE</span>
            <h2>Roles and permissions</h2>
            <p>Each role grants a defined set of actions throughout the workspace.</p>
            <div className="role-guide">
              {roles.map((role) => (
                <article className="role-guide-card" key={role.id}>
                  <div><h3>{role.name}</h3><p>{role.description || "Workspace access role"}</p></div>
                  <ul>{(linksByRole.get(role.id) || []).filter(Boolean).map((key) => <li key={key}>{key.replaceAll(".", " ")}</li>)}</ul>
                </article>
              ))}
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
