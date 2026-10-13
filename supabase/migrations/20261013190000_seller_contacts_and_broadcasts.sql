ALTER TABLE public.seller_applications
  ADD COLUMN contact_person_name text
  CHECK (contact_person_name IS NULL OR char_length(trim(contact_person_name)) BETWEEN 2 AND 100);

CREATE TABLE public.seller_broadcasts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject text NOT NULL CHECK (char_length(trim(subject)) BETWEEN 2 AND 120),
  body text NOT NULL CHECK (char_length(trim(body)) BETWEEN 2 AND 4000),
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  CHECK (expires_at IS NULL OR expires_at > created_at)
);

CREATE INDEX seller_broadcasts_created_at_idx
  ON public.seller_broadcasts (created_at DESC);

ALTER TABLE public.seller_broadcasts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.seller_broadcasts FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT ON public.seller_broadcasts TO authenticated;

CREATE POLICY seller_broadcasts_admin_create
  ON public.seller_broadcasts FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.is_platform_admin()) AND created_by = (SELECT auth.uid()));

CREATE POLICY seller_broadcasts_seller_read
  ON public.seller_broadcasts FOR SELECT TO authenticated
  USING (
    (SELECT public.is_platform_admin())
    OR (
      (expires_at IS NULL OR expires_at > now())
      AND EXISTS (
        SELECT 1
        FROM public.seller_applications AS application
        JOIN public.organization_members AS membership
          ON membership.organization_id = application.organization_id
        WHERE application.applicant_user_id = (SELECT auth.uid())
          AND application.status = 'approved'
          AND membership.user_id = (SELECT auth.uid())
          AND membership.status = 'active'
      )
    )
  );