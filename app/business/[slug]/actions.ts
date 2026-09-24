"use server";

import { redirect } from "next/navigation";
import { createClient } from "../../../lib/supabase/server";
import { isSupabaseConfigured } from "../../../lib/supabase/configured";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function returnTo(slug: string) {
  return slugPattern.test(slug) ? `/business/${slug}` : "/business";
}

export async function updateOrganizationMemberRole(formData: FormData) {
  const organizationId = String(formData.get("organizationId") || "");
  const memberUserId = String(formData.get("memberUserId") || "");
  const roleId = String(formData.get("roleId") || "");
  const organizationSlug = String(formData.get("organizationSlug") || "");
  const base = returnTo(organizationSlug);

  if (!isSupabaseConfigured()) redirect("/sign-in?notice=setup");
  if (![organizationId, memberUserId, roleId].every((value) => uuidPattern.test(value))) {
    redirect(`${base}?error=invalid`);
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?notice=signin");
  if (memberUserId === user.id) redirect(`${base}?error=self`);

  const { data, error } = await supabase
    .from("organization_members")
    .update({ role_id: roleId })
    .eq("organization_id", organizationId)
    .eq("user_id", memberUserId)
    .select("user_id")
    .maybeSingle();

  redirect(error || !data ? `${base}?error=permission` : `${base}?notice=role-updated`);
}

export async function removeOrganizationMember(formData: FormData) {
  const organizationId = String(formData.get("organizationId") || "");
  const memberUserId = String(formData.get("memberUserId") || "");
  const organizationSlug = String(formData.get("organizationSlug") || "");
  const base = returnTo(organizationSlug);

  if (!isSupabaseConfigured()) redirect("/sign-in?notice=setup");
  if (![organizationId, memberUserId].every((value) => uuidPattern.test(value))) {
    redirect(`${base}?error=invalid`);
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?notice=signin");
  if (memberUserId === user.id) redirect(`${base}?error=self`);

  const { data, error } = await supabase
    .from("organization_members")
    .delete()
    .eq("organization_id", organizationId)
    .eq("user_id", memberUserId)
    .select("user_id")
    .maybeSingle();

  redirect(error || !data ? `${base}?error=permission` : `${base}?notice=member-removed`);
}
