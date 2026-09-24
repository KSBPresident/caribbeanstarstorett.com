-- Keep the RLS permission helper outside the exposed Data API schema.
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA private TO authenticated;

CREATE OR REPLACE FUNCTION private.has_organization_permission(
  p_organization_id uuid,
  p_permission_key text
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members AS om
    JOIN public.role_permissions AS rp ON rp.role_id = om.role_id
    JOIN public.permissions AS p ON p.id = rp.permission_id
    WHERE om.organization_id = p_organization_id
      AND om.user_id = (SELECT auth.uid())
      AND om.status = 'active'
      AND p.key = p_permission_key
  );
$function$;

REVOKE ALL ON FUNCTION private.has_organization_permission(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.has_organization_permission(uuid, text) TO authenticated;

DROP POLICY IF EXISTS organization_members_select_member ON public.organization_members;
DROP POLICY IF EXISTS organization_members_insert_manager ON public.organization_members;
DROP POLICY IF EXISTS organization_members_update_manager ON public.organization_members;
DROP POLICY IF EXISTS organization_members_delete_manager ON public.organization_members;

CREATE POLICY organization_members_select_member
ON public.organization_members
FOR SELECT
TO authenticated
USING (
  user_id = (SELECT auth.uid())
  OR private.has_organization_permission(organization_id, 'organization.read')
);

CREATE POLICY organization_members_insert_manager
ON public.organization_members
FOR INSERT
TO authenticated
WITH CHECK (
  private.has_organization_permission(organization_id, 'member.manage')
  AND (
    role_id = (SELECT r.id FROM public.roles AS r WHERE r.name = 'member' LIMIT 1)
    OR private.has_organization_permission(organization_id, 'role.manage')
  )
);

CREATE POLICY organization_members_update_manager
ON public.organization_members
FOR UPDATE
TO authenticated
USING (
  private.has_organization_permission(organization_id, 'member.manage')
)
WITH CHECK (
  private.has_organization_permission(organization_id, 'member.manage')
  AND (
    role_id = (SELECT r.id FROM public.roles AS r WHERE r.name = 'member' LIMIT 1)
    OR private.has_organization_permission(organization_id, 'role.manage')
  )
);

CREATE POLICY organization_members_delete_manager
ON public.organization_members
FOR DELETE
TO authenticated
USING (
  private.has_organization_permission(organization_id, 'member.manage')
);

DROP FUNCTION IF EXISTS public.has_organization_permission(uuid, text);
