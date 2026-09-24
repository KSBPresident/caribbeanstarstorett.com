CREATE TABLE IF NOT EXISTS public.organization_marketplace_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  organization_name text NOT NULL CHECK (char_length(trim(organization_name)) BETWEEN 2 AND 100),
  listing_type text NOT NULL CHECK (listing_type IN ('jobs','real-estate')),
  title text NOT NULL CHECK (char_length(trim(title)) BETWEEN 4 AND 140),
  description text NOT NULL CHECK (char_length(trim(description)) BETWEEN 40 AND 3000),
  location text NOT NULL CHECK (char_length(trim(location)) BETWEEN 2 AND 120),
  employment_type text CHECK (employment_type IS NULL OR employment_type IN ('full-time','part-time','contract','temporary','internship')),
  salary_details text CHECK (salary_details IS NULL OR char_length(salary_details) <= 120),
  property_type text CHECK (property_type IS NULL OR property_type IN ('house','apartment','commercial','land','room','other')),
  property_price text CHECK (property_price IS NULL OR char_length(property_price) <= 120),
  contact_email text CHECK (contact_email IS NULL OR (char_length(contact_email) <= 254 AND position('@' in contact_email) > 1)),
  phone text CHECK (phone IS NULL OR char_length(phone) <= 40),
  website_url text CHECK (website_url IS NULL OR (char_length(website_url) <= 300 AND website_url ~ '^https://[^[:space:]]+$')),
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (
    (listing_type = 'jobs' AND property_type IS NULL AND property_price IS NULL)
    OR (listing_type = 'real-estate' AND employment_type IS NULL AND salary_details IS NULL)
  ),
  CHECK (contact_email IS NOT NULL OR phone IS NOT NULL OR website_url IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS organization_marketplace_listings_public_idx
  ON public.organization_marketplace_listings (listing_type, updated_at DESC)
  WHERE is_published = true;
CREATE INDEX IF NOT EXISTS organization_marketplace_listings_workspace_idx
  ON public.organization_marketplace_listings (organization_id, created_at DESC);

ALTER TABLE public.organization_marketplace_listings ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.organization_marketplace_listings TO anon, authenticated;
GRANT INSERT, UPDATE ON public.organization_marketplace_listings TO authenticated;

DROP POLICY IF EXISTS organization_marketplace_listings_read_public ON public.organization_marketplace_listings;
CREATE POLICY organization_marketplace_listings_read_public
  ON public.organization_marketplace_listings FOR SELECT TO anon USING (is_published = true);
DROP POLICY IF EXISTS organization_marketplace_listings_read_member ON public.organization_marketplace_listings;
CREATE POLICY organization_marketplace_listings_read_member
  ON public.organization_marketplace_listings FOR SELECT TO authenticated
  USING (is_published = true OR private.has_organization_permission(organization_id, 'organization.read'));
DROP POLICY IF EXISTS organization_marketplace_listings_manage_insert ON public.organization_marketplace_listings;
CREATE POLICY organization_marketplace_listings_manage_insert
  ON public.organization_marketplace_listings FOR INSERT TO authenticated
  WITH CHECK (private.has_organization_permission(organization_id, 'organization.manage'));
DROP POLICY IF EXISTS organization_marketplace_listings_manage_update ON public.organization_marketplace_listings;
CREATE POLICY organization_marketplace_listings_manage_update
  ON public.organization_marketplace_listings FOR UPDATE TO authenticated
  USING (private.has_organization_permission(organization_id, 'organization.manage'))
  WITH CHECK (private.has_organization_permission(organization_id, 'organization.manage'));

CREATE OR REPLACE FUNCTION public.set_organization_marketplace_listing_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $function$
BEGIN NEW.updated_at := now(); RETURN NEW; END;
$function$;
REVOKE ALL ON FUNCTION public.set_organization_marketplace_listing_updated_at() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS organization_marketplace_listings_set_updated_at ON public.organization_marketplace_listings;
CREATE TRIGGER organization_marketplace_listings_set_updated_at
  BEFORE UPDATE ON public.organization_marketplace_listings
  FOR EACH ROW EXECUTE FUNCTION public.set_organization_marketplace_listing_updated_at();

CREATE OR REPLACE FUNCTION public.audit_organization_marketplace_listing_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $function$
DECLARE action_value text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    action_value := CASE WHEN NEW.is_published THEN 'marketplace_listing.published' ELSE 'marketplace_listing.created' END;
  ELSE
    action_value := CASE
      WHEN NEW.is_published AND NOT OLD.is_published THEN 'marketplace_listing.published'
      WHEN NOT NEW.is_published AND OLD.is_published THEN 'marketplace_listing.unpublished'
      ELSE 'marketplace_listing.updated'
    END;
  END IF;
  INSERT INTO public.audit_log(actor_user_id, organization_id, action, resource_type, resource_id, metadata)
  VALUES ((SELECT auth.uid()), NEW.organization_id, action_value, 'marketplace_listing', NEW.id::text,
    jsonb_build_object('type', NEW.listing_type, 'published', NEW.is_published));
  RETURN NEW;
END;
$function$;
REVOKE ALL ON FUNCTION public.audit_organization_marketplace_listing_change() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS organization_marketplace_listings_audit_changes ON public.organization_marketplace_listings;
CREATE TRIGGER organization_marketplace_listings_audit_changes
  AFTER INSERT OR UPDATE ON public.organization_marketplace_listings
  FOR EACH ROW EXECUTE FUNCTION public.audit_organization_marketplace_listing_change();