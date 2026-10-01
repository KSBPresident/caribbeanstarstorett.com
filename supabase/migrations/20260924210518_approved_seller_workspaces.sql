-- Approved seller applications receive a private organization workspace.
-- The applicant becomes the initial owner through organizations_assign_creator_owner.

ALTER TABLE public.seller_applications
  ADD COLUMN organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX seller_applications_organization_id_key
  ON public.seller_applications (organization_id)
  WHERE organization_id IS NOT NULL;

-- Credit the administrator who provisions a seller workspace while preserving the
-- applicant as the organization's owner (organizations.created_by).
CREATE OR REPLACE FUNCTION public.log_organization_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  actor_id uuid := COALESCE((SELECT auth.uid()), NEW.created_by);
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
    actor_id,
    NEW.id,
    'organization.created',
    'organization',
    NEW.id::text,
    jsonb_build_object(
      'organization_type', NEW.organization_type,
      'created_by', NEW.created_by
    )
  );

  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION public.log_organization_created() FROM PUBLIC, anon, authenticated;

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
  application public.seller_applications%ROWTYPE;
  organization_id_value uuid;
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

  SELECT *
    INTO application
    FROM public.seller_applications
   WHERE id = p_application_id
   FOR UPDATE;

  IF NOT FOUND OR application.status NOT IN ('submitted', 'reviewing') THEN
    RETURN false;
  END IF;

  IF p_status = 'approved' THEN
    organization_id_value := application.organization_id;

    IF organization_id_value IS NULL THEN
      INSERT INTO public.organizations (
        name,
        slug,
        organization_type,
        created_by
      )
      VALUES (
        application.seller_name,
        COALESCE(
          NULLIF(
            trim(both '-' FROM regexp_replace(lower(application.seller_name), '[^a-z0-9]+', '-', 'g')),
            ''
          ),
          'seller'
        ) || '-' || substring(replace(application.id::text, '-', '') FROM 1 FOR 8),
        application.seller_type,
        application.applicant_user_id
      )
      RETURNING id INTO organization_id_value;
    END IF;
  END IF;

  UPDATE public.seller_applications
     SET status = p_status,
         organization_id = CASE
           WHEN p_status = 'approved' THEN organization_id_value
           ELSE application.organization_id
         END
   WHERE id = p_application_id;

  INSERT INTO public.audit_log (
    actor_user_id,
    organization_id,
    action,
    resource_type,
    resource_id,
    metadata
  )
  VALUES (
    actor_id,
    organization_id_value,
    'seller_application.reviewed',
    'seller_application',
    p_application_id::text,
    jsonb_build_object(
      'previous_status', application.status,
      'status', p_status,
      'organization_id', organization_id_value
    )
  );

  RETURN true;
END;
$function$;

REVOKE ALL ON FUNCTION public.platform_review_seller_application(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.platform_review_seller_application(uuid, text) TO authenticated;
