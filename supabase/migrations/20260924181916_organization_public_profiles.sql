CREATE TABLE IF NOT EXISTS public.organization_public_profiles (
  organization_id uuid PRIMARY KEY REFERENCES public.organizations(id) ON DELETE CASCADE,
  slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  display_name text NOT NULL CHECK (char_length(trim(display_name)) BETWEEN 2 AND 100),
  summary text NOT NULL CHECK (char_length(trim(summary)) BETWEEN 40 AND 1200),
  category_key text NOT NULL CHECK (category_key IN ('food','home','retail','professional','transport','beauty','community','other')),
  region text NOT NULL CHECK (char_length(trim(region)) BETWEEN 2 AND 80),
  contact_email text CHECK (contact_email IS NULL OR (char_length(contact_email) <= 254 AND position('@' in contact_email) > 1)),
  phone text CHECK (phone IS NULL OR char_length(phone) <= 40),
  website_url text CHECK (website_url IS NULL OR (char_length(website_url) <= 300 AND website_url ~ '^https://[^[:space:]]+$')),
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS organization_public_profiles_directory_idx
  ON public.organization_public_profiles (category_key, updated_at DESC)
  WHERE is_published = true;

ALTER TABLE public.organization_public_profiles ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.organization_public_profiles TO anon, authenticated;
GRANT INSERT, UPDATE ON public.organization_public_profiles TO authenticated;

DROP POLICY IF EXISTS organization_public_profiles_read_published ON public.organization_public_profiles;
CREATE POLICY organization_public_profiles_read_published
  ON public.organization_public_profiles FOR SELECT TO anon USING (is_published = true);
DROP POLICY IF EXISTS organization_public_profiles_read_member ON public.organization_public_profiles;
CREATE POLICY organization_public_profiles_read_member
  ON public.organization_public_profiles FOR SELECT TO authenticated
  USING (is_published = true OR private.has_organization_permission(organization_id, 'organization.read'));
DROP POLICY IF EXISTS organization_public_profiles_manage_insert ON public.organization_public_profiles;
CREATE POLICY organization_public_profiles_manage_insert
  ON public.organization_public_profiles FOR INSERT TO authenticated
  WITH CHECK (private.has_organization_permission(organization_id, 'organization.manage'));
DROP POLICY IF EXISTS organization_public_profiles_manage_update ON public.organization_public_profiles;
CREATE POLICY organization_public_profiles_manage_update
  ON public.organization_public_profiles FOR UPDATE TO authenticated
  USING (private.has_organization_permission(organization_id, 'organization.manage'))
  WITH CHECK (private.has_organization_permission(organization_id, 'organization.manage'));

CREATE OR REPLACE FUNCTION public.set_organization_public_profile_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $function$
BEGIN NEW.updated_at := now(); RETURN NEW; END;
$function$;
REVOKE ALL ON FUNCTION public.set_organization_public_profile_updated_at() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS organization_public_profiles_set_updated_at ON public.organization_public_profiles;
CREATE TRIGGER organization_public_profiles_set_updated_at
  BEFORE UPDATE ON public.organization_public_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_organization_public_profile_updated_at();

CREATE OR REPLACE FUNCTION public.audit_organization_public_profile_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $function$
DECLARE action_value text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    action_value := CASE WHEN NEW.is_published THEN 'organization_profile.published' ELSE 'organization_profile.created' END;
  ELSE
    action_value := CASE
      WHEN NEW.is_published AND NOT OLD.is_published THEN 'organization_profile.published'
      WHEN NOT NEW.is_published AND OLD.is_published THEN 'organization_profile.unpublished'
      ELSE 'organization_profile.updated'
    END;
  END IF;
  INSERT INTO public.audit_log(actor_user_id, organization_id, action, resource_type, resource_id, metadata)
  VALUES ((SELECT auth.uid()), NEW.organization_id, action_value, 'organization_public_profile', NEW.slug,
    jsonb_build_object('category', NEW.category_key, 'published', NEW.is_published));
  RETURN NEW;
END;
$function$;
REVOKE ALL ON FUNCTION public.audit_organization_public_profile_change() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS organization_public_profiles_audit_changes ON public.organization_public_profiles;
CREATE TRIGGER organization_public_profiles_audit_changes
  AFTER INSERT OR UPDATE ON public.organization_public_profiles
  FOR EACH ROW EXECUTE FUNCTION public.audit_organization_public_profile_change();