CREATE OR REPLACE FUNCTION public.seller_coupon_is_public(
  p_organization_id uuid,
  p_is_active boolean,
  p_starts_at timestamptz,
  p_expires_at timestamptz
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT COALESCE(p_is_active, false)
    AND p_starts_at <= statement_timestamp()
    AND (p_expires_at IS NULL OR p_expires_at > statement_timestamp())
    AND EXISTS (
      SELECT 1
      FROM public.organizations AS o
      JOIN public.organization_public_profiles AS p ON p.organization_id = o.id
      WHERE o.id = p_organization_id
        AND o.status = 'active'
        AND p.is_published
    );
$function$;

REVOKE ALL ON FUNCTION public.seller_coupon_is_public(uuid, boolean, timestamptz, timestamptz)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.seller_coupon_is_public(uuid, boolean, timestamptz, timestamptz)
  TO anon, authenticated;

DROP POLICY IF EXISTS seller_coupons_public_active_read ON public.seller_coupons;
CREATE POLICY seller_coupons_public_active_read
  ON public.seller_coupons FOR SELECT TO anon
  USING (public.seller_coupon_is_public(organization_id, is_active, starts_at, expires_at));

DROP POLICY IF EXISTS seller_coupons_authenticated_read ON public.seller_coupons;
CREATE POLICY seller_coupons_authenticated_read
  ON public.seller_coupons FOR SELECT TO authenticated
  USING (
    public.seller_coupon_is_public(organization_id, is_active, starts_at, expires_at)
    OR private.has_organization_permission(organization_id, 'organization.read')
  );