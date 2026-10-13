ALTER TABLE public.seller_applications
  ADD COLUMN IF NOT EXISTS contact_person_name text
    CHECK (contact_person_name IS NULL OR char_length(trim(contact_person_name)) BETWEEN 2 AND 100);

CREATE TABLE IF NOT EXISTS public.seller_broadcasts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject text NOT NULL CHECK (char_length(trim(subject)) BETWEEN 2 AND 120),
  body text NOT NULL CHECK (char_length(trim(body)) BETWEEN 2 AND 4000),
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS seller_broadcasts_created_at_idx ON public.seller_broadcasts (created_at DESC);
ALTER TABLE public.seller_broadcasts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.seller_broadcasts FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT ON public.seller_broadcasts TO authenticated;
DROP POLICY IF EXISTS seller_broadcasts_admin_read ON public.seller_broadcasts;
CREATE POLICY seller_broadcasts_admin_read ON public.seller_broadcasts FOR SELECT TO authenticated USING ((SELECT public.is_platform_admin()));
DROP POLICY IF EXISTS seller_broadcasts_seller_read ON public.seller_broadcasts;
CREATE POLICY seller_broadcasts_seller_read ON public.seller_broadcasts FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.seller_applications AS a
    WHERE a.applicant_user_id = (SELECT auth.uid()) AND a.status = 'approved' AND a.organization_id IS NOT NULL)
);
DROP POLICY IF EXISTS seller_broadcasts_admin_insert ON public.seller_broadcasts;
CREATE POLICY seller_broadcasts_admin_insert ON public.seller_broadcasts FOR INSERT TO authenticated WITH CHECK (
  created_by = (SELECT auth.uid()) AND (SELECT public.is_platform_admin())
);

ALTER TABLE public.organization_public_profiles
  ADD COLUMN IF NOT EXISTS seller_is_away boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS seller_away_message text
    CHECK (seller_away_message IS NULL OR char_length(trim(seller_away_message)) <= 240);
GRANT UPDATE ON public.organization_public_profiles TO authenticated;
DROP POLICY IF EXISTS seller_public_profile_owner_update ON public.organization_public_profiles;
CREATE POLICY seller_public_profile_owner_update ON public.organization_public_profiles
  FOR UPDATE TO authenticated
  USING (private.has_organization_permission(organization_id, 'organization.manage'))
  WITH CHECK (private.has_organization_permission(organization_id, 'organization.manage'));