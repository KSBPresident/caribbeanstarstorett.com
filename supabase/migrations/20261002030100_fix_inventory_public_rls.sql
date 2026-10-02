CREATE OR REPLACE FUNCTION private.is_active_approved_seller_org(p_organization_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.organizations AS organization
    JOIN public.seller_applications AS application
      ON application.organization_id = organization.id
    WHERE organization.id = p_organization_id
      AND organization.status = 'active'
      AND application.status = 'approved'
  );
$function$;

REVOKE ALL ON FUNCTION private.is_active_approved_seller_org(uuid) FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA private TO anon, authenticated;
GRANT EXECUTE ON FUNCTION private.is_active_approved_seller_org(uuid) TO anon, authenticated;

DROP POLICY IF EXISTS inventory_items_read_published ON public.inventory_items;
CREATE POLICY inventory_items_read_published
  ON public.inventory_items FOR SELECT TO anon
  USING (
    status = 'published'
    AND private.is_active_approved_seller_org(organization_id)
  );

DROP POLICY IF EXISTS inventory_items_read_workspace ON public.inventory_items;
CREATE POLICY inventory_items_read_workspace
  ON public.inventory_items FOR SELECT TO authenticated
  USING (
    (
      status = 'published'
      AND private.is_active_approved_seller_org(organization_id)
    )
    OR private.has_organization_permission(organization_id, 'organization.read')
  );

DROP POLICY IF EXISTS inventory_items_manage_insert ON public.inventory_items;
CREATE POLICY inventory_items_manage_insert
  ON public.inventory_items FOR INSERT TO authenticated
  WITH CHECK (
    private.has_organization_permission(organization_id, 'organization.manage')
    AND private.is_active_approved_seller_org(organization_id)
  );

DROP POLICY IF EXISTS inventory_items_manage_update ON public.inventory_items;
CREATE POLICY inventory_items_manage_update
  ON public.inventory_items FOR UPDATE TO authenticated
  USING (private.has_organization_permission(organization_id, 'organization.manage'))
  WITH CHECK (
    private.has_organization_permission(organization_id, 'organization.manage')
    AND private.is_active_approved_seller_org(organization_id)
  );
