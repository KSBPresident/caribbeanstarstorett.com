CREATE TABLE IF NOT EXISTS public.seller_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  applicant_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  seller_name text NOT NULL CHECK (char_length(trim(seller_name)) BETWEEN 2 AND 100),
  seller_type text NOT NULL CHECK (seller_type IN ('individual','business','nonprofit','community')),
  category_key text NOT NULL CHECK (category_key IN ('products','services','businesses','jobs','real-estate','other')),
  contact_email text NOT NULL CHECK (char_length(contact_email) BETWEEN 3 AND 254),
  phone text CHECK (phone IS NULL OR char_length(phone) <= 40),
  website_url text CHECK (website_url IS NULL OR char_length(website_url) <= 300),
  description text NOT NULL CHECK (char_length(trim(description)) BETWEEN 30 AND 2000),
  status text NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted','reviewing','approved','declined')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.seller_applications ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT ON public.seller_applications TO authenticated;
DROP POLICY IF EXISTS seller_applications_select_own ON public.seller_applications;
CREATE POLICY seller_applications_select_own ON public.seller_applications
  FOR SELECT TO authenticated USING (applicant_user_id = (SELECT auth.uid()));
DROP POLICY IF EXISTS seller_applications_insert_own ON public.seller_applications;
CREATE POLICY seller_applications_insert_own ON public.seller_applications
  FOR INSERT TO authenticated WITH CHECK (applicant_user_id = (SELECT auth.uid()) AND status = 'submitted');

CREATE OR REPLACE FUNCTION public.set_seller_application_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $function$
BEGIN NEW.updated_at := now(); RETURN NEW; END;
$function$;
REVOKE ALL ON FUNCTION public.set_seller_application_updated_at() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS seller_applications_set_updated_at ON public.seller_applications;
CREATE TRIGGER seller_applications_set_updated_at BEFORE UPDATE ON public.seller_applications
FOR EACH ROW EXECUTE FUNCTION public.set_seller_application_updated_at();

CREATE OR REPLACE FUNCTION public.audit_seller_application_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $function$
BEGIN
  INSERT INTO public.audit_log(actor_user_id, organization_id, action, resource_type, resource_id, metadata)
  VALUES ((SELECT auth.uid()), NULL, 'seller_application.created', 'seller_application', NEW.id::text,
    jsonb_build_object('seller_type', NEW.seller_type, 'category', NEW.category_key, 'status', NEW.status));
  RETURN NEW;
END;
$function$;
REVOKE ALL ON FUNCTION public.audit_seller_application_change() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS seller_applications_audit_insert ON public.seller_applications;
CREATE TRIGGER seller_applications_audit_insert AFTER INSERT ON public.seller_applications
FOR EACH ROW EXECUTE FUNCTION public.audit_seller_application_change();