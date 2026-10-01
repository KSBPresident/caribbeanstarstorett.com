import "server-only";

import { createClient } from "./supabase/server";

export async function canManageOrganizationMember(
  organizationId: string,
  actorUserId: string,
  targetUserId: string,
): Promise<boolean> {
  const supabase = await createClient();
  const { data: actorMembership, error: actorMembershipError } = await supabase
    .from("organization_members")
    .select("role_id")
    .eq("organization_id", organizationId)
    .eq("user_id", actorUserId)
    .eq("status", "active")
    .maybeSingle();
  const { data: targetMembership, error: targetMembershipError } = await supabase
    .from("organization_members")
    .select("role_id")
    .eq("organization_id", organizationId)
    .eq("user_id", targetUserId)
    .eq("status", "active")
    .maybeSingle();

  if (actorMembershipError || targetMembershipError || !actorMembership || !targetMembership) return false;

  const { data: roleLinks, error: roleLinksError } = await supabase
    .from("role_permissions")
    .select("permission_id")
    .eq("role_id", actorMembership.role_id);
  if (roleLinksError) return false;

  const permissionIds = (roleLinks || []).map((link) => link.permission_id);
  const keys = new Set<string>();
  if (permissionIds.length) {
    const { data: permissions, error: permissionsError } = await supabase
      .from("permissions")
      .select("key")
      .in("id", permissionIds);
    if (permissionsError) return false;
    for (const permission of permissions || []) keys.add(permission.key);
  }

  if (!keys.has("member.manage")) return false;
  if (keys.has("role.manage")) return true;

  const { data: memberRole, error: memberRoleError } = await supabase
    .from("roles")
    .select("id")
    .eq("name", "member")
    .maybeSingle();

  return !memberRoleError && Boolean(memberRole) && targetMembership.role_id === memberRole.id;
}
