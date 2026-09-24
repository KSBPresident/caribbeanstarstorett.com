-- Secure organization membership and automatically grant the creator the owner role.

CREATE OR REPLACE FUNCTION public.has_organization_permission(
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

REVOKE ALL ON FUNCTION public.has_organization_permission(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_organization_permission(uuid, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.assign_organization_creator_owner()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  owner_role_id uuid;
BEGIN
  SELECT r.id
    INTO owner_role_id
    FROM public.roles AS r
   WHERE r.name = 'owner'
   LIMIT 1;

  IF owner_role_id IS NULL THEN
    RAISE EXCEPTION 'The owner role is not configured';
  END IF;

  INSERT INTO public.organization_members (
    organization_id,
    user_id,
    role_id,
    status
  )
  VALUES (
    NEW.id,
    NEW.created_by,
    owner_role_id,
    'active'
  );

  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION public.assign_organization_creator_owner() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS organizations_assign_creator_owner ON public.organizations;
CREATE TRIGGER organizations_assign_creator_owner
AFTER INSERT ON public.organizations
FOR EACH ROW
EXECUTE FUNCTION public.assign_organization_creator_owner();

CREATE OR REPLACE FUNCTION public.guard_organization_membership_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  owner_role_id uuid;
  remaining_owners bigint;
  owner_is_leaving boolean := false;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF NEW.organization_id IS DISTINCT FROM OLD.organization_id
       OR NEW.user_id IS DISTINCT FROM OLD.user_id THEN
      RAISE EXCEPTION 'Organization and user cannot be changed on a membership';
    END IF;
  END IF;

  SELECT r.id
    INTO owner_role_id
    FROM public.roles AS r
   WHERE r.name = 'owner'
   LIMIT 1;

  IF OLD.role_id = owner_role_id THEN
    IF TG_OP = 'DELETE' THEN
      owner_is_leaving := true;
    ELSIF NEW.role_id IS DISTINCT FROM owner_role_id OR NEW.status <> 'active' THEN
      owner_is_leaving := true;
    END IF;
  END IF;

  IF owner_is_leaving THEN
    SELECT count(*)
      INTO remaining_owners
      FROM public.organization_members AS om
     WHERE om.organization_id = OLD.organization_id
       AND om.role_id = owner_role_id
       AND om.status = 'active'
       AND om.user_id <> OLD.user_id;

    IF remaining_owners = 0 THEN
      RAISE EXCEPTION 'An organization must keep at least one active owner';
    END IF;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;

  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION public.guard_organization_membership_changes() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS organization_members_guard_changes ON public.organization_members;
CREATE TRIGGER organization_members_guard_changes
BEFORE UPDATE OR DELETE ON public.organization_members
FOR EACH ROW
EXECUTE FUNCTION public.guard_organization_membership_changes();

DROP POLICY IF EXISTS members_select_self ON public.organization_members;
DROP POLICY IF EXISTS members_insert_self ON public.organization_members;
DROP POLICY IF EXISTS members_update_self ON public.organization_members;
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
  OR public.has_organization_permission(organization_id, 'organization.read')
);

CREATE POLICY organization_members_insert_manager
ON public.organization_members
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_organization_permission(organization_id, 'member.manage')
  AND (
    role_id = (SELECT r.id FROM public.roles AS r WHERE r.name = 'member' LIMIT 1)
    OR public.has_organization_permission(organization_id, 'role.manage')
  )
);

CREATE POLICY organization_members_update_manager
ON public.organization_members
FOR UPDATE
TO authenticated
USING (
  public.has_organization_permission(organization_id, 'member.manage')
)
WITH CHECK (
  public.has_organization_permission(organization_id, 'member.manage')
  AND (
    role_id = (SELECT r.id FROM public.roles AS r WHERE r.name = 'member' LIMIT 1)
    OR public.has_organization_permission(organization_id, 'role.manage')
  )
);

CREATE POLICY organization_members_delete_manager
ON public.organization_members
FOR DELETE
TO authenticated
USING (
  public.has_organization_permission(organization_id, 'member.manage')
);
