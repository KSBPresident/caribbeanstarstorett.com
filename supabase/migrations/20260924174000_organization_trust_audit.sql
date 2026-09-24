-- Record workspace changes so owners and auditors can review access history.
CREATE OR REPLACE FUNCTION public.log_organization_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  INSERT INTO public.audit_log (
    actor_user_id,
    organization_id,
    action,
    resource_type,
    resource_id,
    metadata
  )
  VALUES (
    NEW.created_by,
    NEW.id,
    'organization.created',
    'organization',
    NEW.id::text,
    jsonb_build_object('organization_type', NEW.organization_type)
  );

  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION public.log_organization_created() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS organizations_audit_created ON public.organizations;
CREATE TRIGGER organizations_audit_created
AFTER INSERT ON public.organizations
FOR EACH ROW
EXECUTE FUNCTION public.log_organization_created();

CREATE OR REPLACE FUNCTION public.log_organization_membership_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  organization_id_value uuid;
  member_user_id uuid;
  action_value text;
  details jsonb;
BEGIN
  IF TG_OP = 'DELETE' THEN
    organization_id_value := OLD.organization_id;
    member_user_id := OLD.user_id;
    action_value := 'organization.member.removed';
    details := jsonb_build_object(
      'old_role_id', OLD.role_id,
      'old_status', OLD.status
    );
  ELSIF TG_OP = 'INSERT' THEN
    organization_id_value := NEW.organization_id;
    member_user_id := NEW.user_id;
    action_value := 'organization.member.added';
    details := jsonb_build_object(
      'new_role_id', NEW.role_id,
      'new_status', NEW.status
    );
  ELSE
    organization_id_value := NEW.organization_id;
    member_user_id := NEW.user_id;
    action_value := 'organization.member.updated';
    details := jsonb_build_object(
      'old_role_id', OLD.role_id,
      'new_role_id', NEW.role_id,
      'old_status', OLD.status,
      'new_status', NEW.status
    );
  END IF;

  INSERT INTO public.audit_log (
    actor_user_id,
    organization_id,
    action,
    resource_type,
    resource_id,
    metadata
  )
  VALUES (
    (SELECT auth.uid()),
    organization_id_value,
    action_value,
    'organization_member',
    member_user_id::text,
    details
  );

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION public.log_organization_membership_change() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS organization_members_audit_changes ON public.organization_members;
CREATE TRIGGER organization_members_audit_changes
AFTER INSERT OR UPDATE OR DELETE ON public.organization_members
FOR EACH ROW
EXECUTE FUNCTION public.log_organization_membership_change();

DROP POLICY IF EXISTS audit_select_own ON public.audit_log;
DROP POLICY IF EXISTS audit_select_actor_or_auditor ON public.audit_log;
CREATE POLICY audit_select_actor_or_auditor
ON public.audit_log
FOR SELECT
TO authenticated
USING (
  actor_user_id = (SELECT auth.uid())
  OR (
    organization_id IS NOT NULL
    AND private.has_organization_permission(organization_id, 'audit.read')
  )
);
