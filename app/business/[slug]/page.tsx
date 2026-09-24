import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { SiteHeader } from "../../../components/site-header";
import { createClient } from "../../../lib/supabase/server";
import { isSupabaseConfigured } from "../../../lib/supabase/configured";
import { removeOrganizationMember, updateOrganizationMemberRole, saveOrganizationPublicProfile, createOrganizationMarketplaceListing, setOrganizationMarketplaceListingVisibility, updateOrganizationMarketplaceListing } from "./actions";

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

  const [memberResult, roleResult, ownRolePermissionResult, publicProfileResult, marketplaceListingsResult] = await Promise.all([
    supabase.from("organization_members")
      .select("user_id, role_id, status, created_at")
      .eq("organization_id", organization.id)
      .order("created_at", { ascending: true }),
    supabase.from("roles").select("id, name, description").order("name"),
    supabase.from("role_permissions").select("permission_id").eq("role_id", ownMembership.role_id),
    supabase.from("organization_public_profiles")
      .select("slug, display_name, summary, category_key, region, contact_email, phone, website_url, is_published")
      .eq("organization_id", organization.id)
      .maybeSingle(),
    supabase.from("organization_marketplace_listings")
      .select("id, slug, listing_type, title, description, location, employment_type, salary_details, property_type, property_price, contact_email, phone, website_url, is_published, created_at")
      .eq("organization_id", organization.id)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);
  const publicProfile = publicProfileResult.data;
  const marketplaceListings = marketplaceListingsResult.data || [];
  const memberships = memberResult.data || [];
  const roles = roleResult.data || [];
  const roleLinks = ownRolePermissionResult.data || [];
  const permissionIds = roleLinks.map((row) => row.permission_id);
  const { data: ownPermissions } = permissionIds.length
    ? await supabase.from("permissions").select("key").in("id", permissionIds)
    : { data: [] };
  const permissionKeys = new Set((ownPermissions || []).map((permission) => permission.key));
  const canManageOrganization = permissionKeys.has("organization.manage");
  const canManageMembers = permissionKeys.has("member.manage");
  const canManageRoles = permissionKeys.has("role.manage");
  const canReadAudit = permissionKeys.has("audit.read");
  const { data: auditEntries } = canReadAudit
    ? await supabase.from("audit_log")
        .select("actor_user_id, action, resource_type, resource_id, created_at")
        .eq("organization_id", organization.id)
        .order("created_at", { ascending: false })
        .limit(25)
    : { data: [] };
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

  const message = query.notice === "marketplace-listing-saved"
    ? "Your job or property listing was saved."
    : query.error === "marketplace-listing"
      ? "Check the listing details and include a public contact email."
      : query.notice === "role-updated"
    ? "Member access was updated."
    : query.notice === "member-removed"
      ? "The member was removed from this workspace."
      : query.error === "permission"
        ? "You don’t have permission to make that change, or the member has already left."
        : query.error === "self"
          ? "Use an organization owner to change your own access."
          : query.notice === "listing-saved"
        ? "Your business profile was saved."
        : query.error === "listing-invalid"
          ? "Check the profile details and include at least one public contact method."
          : query.error === "listing-save"
            ? "We couldn’t save that profile. The listing address may already be in use."
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
          <section className="identity-panel workspace-listing-panel">
            <span className="identity-eyebrow">FRONT OS · BUSINESS DIRECTORY</span>
            <h2>Public business profile</h2>
            <p>Share an organization profile in the public directory. Only published profiles are visible to visitors.</p>
            {publicProfile && (
              <div className="workspace-listing-current">
                <div><strong>{publicProfile.is_published ? "Published" : "Saved as draft"}</strong><p>{publicProfile.is_published ? "Visitors can find your profile in the directory." : "Only workspace members can see this draft."}</p></div>
                {publicProfile.is_published && <Link href={`/businesses/${publicProfile.slug}`}>View public profile →</Link>}
              </div>
            )}
            {canManageOrganization ? (
              <form action={saveOrganizationPublicProfile} className="identity-form">
                <input type="hidden" name="organizationId" value={organization.id} />
                <input type="hidden" name="organizationSlug" value={organization.slug} />
                <label>Public business name<input name="displayName" defaultValue={publicProfile?.display_name || organization.name} minLength={2} maxLength={100} required /></label>
                <label>Directory address<input name="listingSlug" defaultValue={publicProfile?.slug || organization.slug} pattern="[a-z0-9]+(-[a-z0-9]+)*" maxLength={80} required /><small>Use lowercase letters, numbers, and hyphens.</small></label>
                <div className="seller-form-row">
                  <label>Category<select name="category" defaultValue={publicProfile?.category_key || "other"}><option value="food">Food &amp; groceries</option><option value="home">Home &amp; living</option><option value="retail">Retail</option><option value="professional">Professional services</option><option value="transport">Transport</option><option value="beauty">Beauty &amp; wellness</option><option value="community">Community</option><option value="other">Other</option></select></label>
                  <label>Area or region<input name="region" defaultValue={publicProfile?.region || "Trinidad and Tobago"} minLength={2} maxLength={80} required /></label>
                </div>
                <label>About the business<textarea name="summary" defaultValue={publicProfile?.summary || ""} minLength={40} maxLength={1200} rows={5} required /></label>
                <div className="seller-form-row">
                  <label>Public contact email<input name="contactEmail" type="email" defaultValue={publicProfile?.contact_email || ""} maxLength={254} /></label>
                  <label>Public phone<input name="phone" type="tel" defaultValue={publicProfile?.phone || ""} maxLength={40} /></label>
                </div>
                <label>Website<input name="website" type="url" defaultValue={publicProfile?.website_url || ""} placeholder="https://example.com" maxLength={300} /></label>
                <label>Visibility<select name="visibility" defaultValue={publicProfile?.is_published ? "published" : "draft"}><option value="draft">Save as draft</option><option value="published">Publish in directory</option></select></label>
                <p className="catalog-meta">Add at least one public contact method: email, phone, or website. Published details will be visible to everyone.</p>
                <button className="identity-submit" type="submit">Save business profile</button>
              </form>
            ) : (
              <p className="organization-empty">An organization owner manages this public profile. You can view the directory at <Link className="identity-inline-link" href="/businesses">Businesses →</Link></p>
            )}
          </section>

          <section className="identity-panel">
            <div className="workspace-section-heading">
              <div><span className="identity-eyebrow">FRONT OS · JOBS &amp; REAL ESTATE</span><h2>Marketplace listings</h2></div>
              <span className="workspace-count">{marketplaceListings.length} {marketplaceListings.length === 1 ? "listing" : "listings"}</span>
            </div>
            <p>Job openings and property listings managed by this organization.</p>
            {marketplaceListings.length ? (
              <div className="workspace-marketplace-list">
                {marketplaceListings.map((item) => (
                  <article className="workspace-marketplace-item" key={item.id}>
                    <div className="workspace-marketplace-info">
                      <span>{item.listing_type === "jobs" ? "Job" : "Real estate"} · {item.location}</span>
                      <strong>{item.title}</strong>
                      <em>{item.is_published ? "Published" : "Draft"}</em>
                    </div>
                    <div className="workspace-marketplace-actions">
                      {item.is_published && <Link href={`/opportunities/${item.slug}`}>View listing →</Link>}
                      {canManageOrganization && (
                        <details className="workspace-listing-edit">
                          <summary>Edit listing details</summary>
                          <form action={updateOrganizationMarketplaceListing} className="identity-form">
                            <input type="hidden" name="organizationId" value={organization.id} />
                            <input type="hidden" name="organizationSlug" value={organization.slug} />
                            <input type="hidden" name="listingId" value={item.id} />
                            <label>Listing address<input name="listingSlug" defaultValue={item.slug} pattern="[a-z0-9]+(-[a-z0-9]+)*" maxLength={80} required /></label>
                            <label>Title<input name="title" defaultValue={item.title} minLength={4} maxLength={140} required /></label>
                            <label>Description<textarea name="description" defaultValue={item.description} minLength={40} maxLength={3000} rows={5} required /></label>
                            <label>Area or region<input name="location" defaultValue={item.location} minLength={2} maxLength={120} required /></label>
                            {item.listing_type === "jobs" ? (
                              <div className="seller-form-row">
                                <label>Employment type<select name="employmentType" defaultValue={item.employment_type || ""}><option value="">Not specified</option><option value="full-time">Full-time</option><option value="part-time">Part-time</option><option value="contract">Contract</option><option value="temporary">Temporary</option><option value="internship">Internship</option></select></label>
                                <label>Salary details<input name="salaryDetails" defaultValue={item.salary_details || ""} maxLength={120} /></label>
                              </div>
                            ) : (
                              <div className="seller-form-row">
                                <label>Property type<select name="propertyType" defaultValue={item.property_type || ""}><option value="">Not specified</option><option value="house">House</option><option value="apartment">Apartment</option><option value="commercial">Commercial</option><option value="land">Land</option><option value="room">Room</option><option value="other">Other</option></select></label>
                                <label>Price details<input name="propertyPrice" defaultValue={item.property_price || ""} maxLength={120} /></label>
                              </div>
                            )}
                            <label>Public contact email<input name="contactEmail" type="email" defaultValue={item.contact_email || ""} maxLength={254} /></label>
                            <div className="seller-form-row">
                              <label>Phone<input name="phone" type="tel" defaultValue={item.phone || ""} maxLength={40} /></label>
                              <label>Website<input name="website" type="url" defaultValue={item.website_url || ""} maxLength={300} /></label>
                            </div>
                            <button type="submit" className="identity-submit">Save listing changes</button>
                          </form>
                        </details>
                      )}
                      {canManageOrganization && (
                        <form action={setOrganizationMarketplaceListingVisibility}>
                          <input type="hidden" name="organizationId" value={organization.id} />
                          <input type="hidden" name="organizationSlug" value={organization.slug} />
                          <input type="hidden" name="listingId" value={item.id} />
                          <input type="hidden" name="visibility" value={item.is_published ? "draft" : "published"} />
                          <button type="submit" className="identity-secondary">{item.is_published ? "Unpublish" : "Publish"}</button>
                        </form>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            ) : <p className="organization-empty">No job or property listings in this workspace yet.</p>}
            {canManageOrganization && (
              <div className="workspace-new-listing">
                <h3>Post a job opening</h3>
                <p className="catalog-meta">New listings start as drafts. Add a public contact email before publishing.</p>
                <form action={createOrganizationMarketplaceListing} className="identity-form">
                  <input type="hidden" name="organizationId" value={organization.id} />
                  <input type="hidden" name="organizationSlug" value={organization.slug} />
                  <input type="hidden" name="listingType" value="jobs" />
                  <input type="hidden" name="visibility" value="draft" />
                  <label>Job title<input name="title" minLength={4} maxLength={140} required /></label>
                  <label>Listing address<input name="listingSlug" pattern="[a-z0-9]+(-[a-z0-9]+)*" maxLength={80} required /><small>Lowercase letters, numbers, and hyphens.</small></label>
                  <label>Job description<textarea name="description" minLength={40} maxLength={3000} rows={5} required /></label>
                  <div className="seller-form-row">
                    <label>Area or region<input name="location" minLength={2} maxLength={120} required /></label>
                    <label>Employment type<select name="employmentType"><option value="">Not specified</option><option value="full-time">Full-time</option><option value="part-time">Part-time</option><option value="contract">Contract</option><option value="temporary">Temporary</option><option value="internship">Internship</option></select></label>
                  </div>
                  <label>Salary details<input name="salaryDetails" maxLength={120} /></label>
                  <label>Public contact email<input name="contactEmail" type="email" maxLength={254} required /></label>
                  <div className="seller-form-row">
                    <label>Phone (optional)<input name="phone" type="tel" maxLength={40} /></label>
                    <label>Website (optional)<input name="website" type="url" maxLength={300} /></label>
                  </div>
                  <button className="identity-submit" type="submit">Save job as draft</button>
                </form>
                <h3>Post a property listing</h3>
                <form action={createOrganizationMarketplaceListing} className="identity-form">
                  <input type="hidden" name="organizationId" value={organization.id} />
                  <input type="hidden" name="organizationSlug" value={organization.slug} />
                  <input type="hidden" name="listingType" value="real-estate" />
                  <input type="hidden" name="visibility" value="draft" />
                  <label>Property title<input name="title" minLength={4} maxLength={140} required /></label>
                  <label>Listing address<input name="listingSlug" pattern="[a-z0-9]+(-[a-z0-9]+)*" maxLength={80} required /><small>Lowercase letters, numbers, and hyphens.</small></label>
                  <label>Property description<textarea name="description" minLength={40} maxLength={3000} rows={5} required /></label>
                  <div className="seller-form-row">
                    <label>Area or region<input name="location" minLength={2} maxLength={120} required /></label>
                    <label>Property type<select name="propertyType"><option value="">Not specified</option><option value="house">House</option><option value="apartment">Apartment</option><option value="commercial">Commercial</option><option value="land">Land</option><option value="room">Room</option><option value="other">Other</option></select></label>
                  </div>
                  <label>Price details<input name="propertyPrice" maxLength={120} /></label>
                  <label>Public contact email<input name="contactEmail" type="email" maxLength={254} required /></label>
                  <div className="seller-form-row">
                    <label>Phone (optional)<input name="phone" type="tel" maxLength={40} /></label>
                    <label>Website (optional)<input name="website" type="url" maxLength={300} /></label>
                  </div>
                  <button className="identity-submit" type="submit">Save property as draft</button>
                </form>
              </div>
            )}
          </section>

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

          {canReadAudit && (
            <section className="identity-panel workspace-audit-panel">
              <div className="workspace-section-heading">
                <div><span className="identity-eyebrow">TRUST AND ACCOUNTABILITY</span><h2>Recent activity</h2></div>
                <span className="workspace-count">Last 25 events</span>
              </div>
              <p>Changes to this workspace and its member access are recorded here.</p>
              {auditEntries?.length ? (
                <div className="workspace-audit-list">
                  {auditEntries.map((entry, index) => (
                    <article className="workspace-audit-row" key={`${entry.created_at}-${index}`}>
                      <span className="workspace-audit-dot" aria-hidden="true">•</span>
                      <div>
                        <strong>{entry.action.replaceAll(".", " ").replaceAll("_", " ")}</strong>
                        <span>{entry.actor_user_id ? (entry.actor_user_id === user.id ? "You" : `Account · ${entry.actor_user_id.slice(-6)}`) : "System"} · {new Date(entry.created_at).toLocaleString("en-TT", { dateStyle: "medium", timeStyle: "short" })}</span>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="organization-empty">No workspace activity has been recorded yet.</p>
              )}
            </section>
          )}

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
