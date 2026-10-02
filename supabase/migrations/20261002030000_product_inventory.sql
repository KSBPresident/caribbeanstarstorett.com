CREATE TABLE public.inventory_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text NOT NULL CHECK (char_length(trim(name)) BETWEEN 2 AND 140),
  category_key text NOT NULL CHECK (category_key IN (
    'electronics-appliances','groceries-food','home-living','clothing-fashion','beauty-wellness','vehicles-parts'
  )),
  description text NOT NULL CHECK (char_length(trim(description)) BETWEEN 30 AND 3000),
  price numeric(12,2) NOT NULL CHECK (price > 0),
  currency text NOT NULL DEFAULT 'USD' CHECK (currency ~ '^[A-Z]{3}$'),
  quantity_available integer NOT NULL DEFAULT 0 CHECK (quantity_available >= 0),
  image_url text NOT NULL CHECK (
    char_length(image_url) BETWEEN 1 AND 2048
    AND (
      image_url ~ '^https://[^[:space:]]+$'
      OR (image_url LIKE '/%' AND image_url NOT LIKE '//%' AND image_url !~ '[[:space:]]')
    )
  ),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX inventory_items_public_category_idx
  ON public.inventory_items(category_key, updated_at DESC)
  WHERE status = 'published';
CREATE INDEX inventory_items_workspace_idx
  ON public.inventory_items(organization_id, created_at DESC);

ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.inventory_items FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.inventory_items TO anon, authenticated;
GRANT INSERT, UPDATE ON TABLE public.inventory_items TO authenticated;

CREATE POLICY inventory_items_read_published
  ON public.inventory_items FOR SELECT TO anon
  USING (
    status = 'published'
    AND EXISTS (
      SELECT 1
      FROM public.organizations AS organization
      JOIN public.seller_applications AS application
        ON application.organization_id = organization.id
      WHERE organization.id = inventory_items.organization_id
        AND organization.status = 'active'
        AND application.status = 'approved'
    )
  );

CREATE POLICY inventory_items_read_workspace
  ON public.inventory_items FOR SELECT TO authenticated
  USING (
    (
      status = 'published'
      AND EXISTS (
        SELECT 1
        FROM public.organizations AS organization
        JOIN public.seller_applications AS application
          ON application.organization_id = organization.id
        WHERE organization.id = inventory_items.organization_id
          AND organization.status = 'active'
          AND application.status = 'approved'
      )
    )
    OR private.has_organization_permission(inventory_items.organization_id, 'organization.read')
  );

CREATE POLICY inventory_items_manage_insert
  ON public.inventory_items FOR INSERT TO authenticated
  WITH CHECK (
    private.has_organization_permission(organization_id, 'organization.manage')
    AND EXISTS (
      SELECT 1
      FROM public.organizations AS organization
      JOIN public.seller_applications AS application
        ON application.organization_id = organization.id
      WHERE organization.id = inventory_items.organization_id
        AND organization.status = 'active'
        AND application.status = 'approved'
    )
  );

CREATE POLICY inventory_items_manage_update
  ON public.inventory_items FOR UPDATE TO authenticated
  USING (private.has_organization_permission(organization_id, 'organization.manage'))
  WITH CHECK (
    private.has_organization_permission(organization_id, 'organization.manage')
    AND EXISTS (
      SELECT 1
      FROM public.organizations AS organization
      JOIN public.seller_applications AS application
        ON application.organization_id = organization.id
      WHERE organization.id = inventory_items.organization_id
        AND organization.status = 'active'
        AND application.status = 'approved'
    )
  );

CREATE OR REPLACE FUNCTION public.set_inventory_item_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $function$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$function$;
REVOKE ALL ON FUNCTION public.set_inventory_item_updated_at() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER inventory_items_set_updated_at
  BEFORE UPDATE ON public.inventory_items
  FOR EACH ROW EXECUTE FUNCTION public.set_inventory_item_updated_at();

CREATE OR REPLACE FUNCTION public.audit_inventory_item_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  action_value text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    action_value := CASE WHEN NEW.status = 'published' THEN 'inventory_item.published' ELSE 'inventory_item.created' END;
  ELSE
    action_value := CASE
      WHEN NEW.status = 'published' AND OLD.status <> 'published' THEN 'inventory_item.published'
      WHEN NEW.status <> 'published' AND OLD.status = 'published' THEN 'inventory_item.unpublished'
      ELSE 'inventory_item.updated'
    END;
  END IF;

  INSERT INTO public.audit_log(actor_user_id, organization_id, action, resource_type, resource_id, metadata)
  VALUES (
    (SELECT auth.uid()),
    NEW.organization_id,
    action_value,
    'inventory_item',
    NEW.id::text,
    jsonb_build_object('status', NEW.status, 'category', NEW.category_key)
  );
  RETURN NEW;
END;
$function$;
REVOKE ALL ON FUNCTION public.audit_inventory_item_change() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER inventory_items_audit_changes
  AFTER INSERT OR UPDATE ON public.inventory_items
  FOR EACH ROW EXECUTE FUNCTION public.audit_inventory_item_change();
