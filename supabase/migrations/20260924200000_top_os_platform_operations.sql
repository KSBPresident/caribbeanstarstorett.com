CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = ''
AS $function$
  SELECT COALESCE(
    (((SELECT auth.jwt()) -> 'app_metadata' ->> 'platform_role') = 'admin'),
    false
  );
$function$;

REVOKE ALL ON FUNCTION public.is_platform_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_platform_admin() TO authenticated;

DROP POLICY IF EXISTS platform_admin_read_profiles ON public.profiles;
CREATE POLICY platform_admin_read_profiles ON public.profiles
  FOR SELECT TO authenticated
  USING ((SELECT public.is_platform_admin()));

DROP POLICY IF EXISTS platform_admin_read_organizations ON public.organizations;
CREATE POLICY platform_admin_read_organizations ON public.organizations
  FOR SELECT TO authenticated
  USING ((SELECT public.is_platform_admin()));

DROP POLICY IF EXISTS platform_admin_read_members ON public.organization_members;
CREATE POLICY platform_admin_read_members ON public.organization_members
  FOR SELECT TO authenticated
  USING ((SELECT public.is_platform_admin()));

DROP POLICY IF EXISTS platform_admin_read_seller_applications ON public.seller_applications;
CREATE POLICY platform_admin_read_seller_applications ON public.seller_applications
  FOR SELECT TO authenticated
  USING ((SELECT public.is_platform_admin()));

DROP POLICY IF EXISTS platform_admin_read_purchase_requests ON public.purchase_requests;
CREATE POLICY platform_admin_read_purchase_requests ON public.purchase_requests
  FOR SELECT TO authenticated
  USING ((SELECT public.is_platform_admin()));

DROP POLICY IF EXISTS platform_admin_read_business_profiles ON public.organization_public_profiles;
CREATE POLICY platform_admin_read_business_profiles ON public.organization_public_profiles
  FOR SELECT TO authenticated
  USING ((SELECT public.is_platform_admin()));

DROP POLICY IF EXISTS platform_admin_read_marketplace_listings ON public.organization_marketplace_listings;
CREATE POLICY platform_admin_read_marketplace_listings ON public.organization_marketplace_listings
  FOR SELECT TO authenticated
  USING ((SELECT public.is_platform_admin()));

DROP POLICY IF EXISTS platform_admin_read_audit_log ON public.audit_log;
CREATE POLICY platform_admin_read_audit_log ON public.audit_log
  FOR SELECT TO authenticated
  USING ((SELECT public.is_platform_admin()));

CREATE OR REPLACE FUNCTION public.platform_review_seller_application(
  p_application_id uuid,
  p_status text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  actor_id uuid := (SELECT auth.uid());
  current_status text;
BEGIN
  IF actor_id IS NULL
    OR COALESCE(((SELECT auth.jwt()) -> 'app_metadata' ->> 'platform_role') = 'admin', false) IS NOT TRUE
  THEN
    RAISE EXCEPTION 'platform administrator access required'
      USING ERRCODE = '42501';
  END IF;

  IF p_status NOT IN ('reviewing', 'approved', 'declined') THEN
    RAISE EXCEPTION 'invalid seller application status'
      USING ERRCODE = '22023';
  END IF;

  SELECT application.status
    INTO current_status
    FROM public.seller_applications AS application
    WHERE application.id = p_application_id
    FOR UPDATE;

  IF NOT FOUND OR current_status NOT IN ('submitted', 'reviewing') THEN
    RETURN false;
  END IF;

  UPDATE public.seller_applications
    SET status = p_status
    WHERE id = p_application_id;

  INSERT INTO public.audit_log (
    actor_user_id, organization_id, action, resource_type, resource_id, metadata
  )
  VALUES (
    actor_id,
    NULL,
    'seller_application.reviewed',
    'seller_application',
    p_application_id::text,
    jsonb_build_object('previous_status', current_status, 'status', p_status)
  );

  RETURN true;
END;
$function$;

REVOKE ALL ON FUNCTION public.platform_review_seller_application(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.platform_review_seller_application(uuid, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.platform_update_purchase_request(
  p_request_id uuid,
  p_status text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  actor_id uuid := (SELECT auth.uid());
  current_status text;
  transition_allowed boolean := false;
BEGIN
  IF actor_id IS NULL
    OR COALESCE(((SELECT auth.jwt()) -> 'app_metadata' ->> 'platform_role') = 'admin', false) IS NOT TRUE
  THEN
    RAISE EXCEPTION 'platform administrator access required'
      USING ERRCODE = '42501';
  END IF;

  SELECT request.status
    INTO current_status
    FROM public.purchase_requests AS request
    WHERE request.id = p_request_id
    FOR UPDATE;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  transition_allowed :=
    (current_status = 'open' AND p_status IN ('reviewing', 'cancelled'))
    OR (current_status = 'reviewing' AND p_status IN ('matched', 'completed', 'cancelled'))
    OR (current_status = 'matched' AND p_status IN ('completed', 'cancelled'));

  IF NOT transition_allowed THEN
    RAISE EXCEPTION 'invalid purchase request status transition'
      USING ERRCODE = '22023';
  END IF;

  UPDATE public.purchase_requests
    SET status = p_status
    WHERE id = p_request_id;

  INSERT INTO public.audit_log (
    actor_user_id, organization_id, action, resource_type, resource_id, metadata
  )
  VALUES (
    actor_id,
    NULL,
    'purchase_request.status_changed',
    'purchase_request',
    p_request_id::text,
    jsonb_build_object('previous_status', current_status, 'status', p_status)
  );

  RETURN true;
END;
$function$;

REVOKE ALL ON FUNCTION public.platform_update_purchase_request(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.platform_update_purchase_request(uuid, text) TO authenticated;
