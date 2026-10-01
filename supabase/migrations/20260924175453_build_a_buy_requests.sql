CREATE TABLE IF NOT EXISTS public.purchase_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (char_length(trim(title)) BETWEEN 4 AND 100),
  details text NOT NULL CHECK (char_length(trim(details)) BETWEEN 20 AND 3000),
  category_key text NOT NULL CHECK (category_key IN ('products','services','businesses','jobs','real-estate','multi-item')),
  budget_amount numeric(12,2) CHECK (budget_amount IS NULL OR budget_amount > 0),
  currency text NOT NULL DEFAULT 'TTD' CHECK (currency ~ '^[A-Z]{3}$'),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','reviewing','matched','completed','cancelled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.purchase_requests ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.purchase_requests TO authenticated;

DROP POLICY IF EXISTS purchase_requests_select_own ON public.purchase_requests;
CREATE POLICY purchase_requests_select_own ON public.purchase_requests FOR SELECT TO authenticated USING (requester_user_id = (SELECT auth.uid()));
DROP POLICY IF EXISTS purchase_requests_insert_own ON public.purchase_requests;
CREATE POLICY purchase_requests_insert_own ON public.purchase_requests FOR INSERT TO authenticated WITH CHECK (requester_user_id = (SELECT auth.uid()) AND status = 'open');
DROP POLICY IF EXISTS purchase_requests_update_open_own ON public.purchase_requests;
CREATE POLICY purchase_requests_update_open_own ON public.purchase_requests FOR UPDATE TO authenticated USING (requester_user_id = (SELECT auth.uid()) AND status = 'open') WITH CHECK (requester_user_id = (SELECT auth.uid()) AND status IN ('open','cancelled'));
DROP POLICY IF EXISTS purchase_requests_delete_open_own ON public.purchase_requests;
CREATE POLICY purchase_requests_delete_open_own ON public.purchase_requests FOR DELETE TO authenticated USING (requester_user_id = (SELECT auth.uid()) AND status = 'open');

CREATE OR REPLACE FUNCTION public.set_purchase_request_updated_at() RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $function$
BEGIN NEW.updated_at := now(); RETURN NEW; END;
$function$;
REVOKE ALL ON FUNCTION public.set_purchase_request_updated_at() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS purchase_requests_set_updated_at ON public.purchase_requests;
CREATE TRIGGER purchase_requests_set_updated_at BEFORE UPDATE ON public.purchase_requests FOR EACH ROW EXECUTE FUNCTION public.set_purchase_request_updated_at();

CREATE OR REPLACE FUNCTION public.audit_purchase_request_change() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $function$
DECLARE
  request_id_value uuid;
  action_value text;
  request_status text;
  request_category text;
BEGIN
  IF TG_OP = 'DELETE' THEN
    request_id_value := OLD.id;
    action_value := 'purchase_request.deleted';
    request_status := OLD.status;
    request_category := OLD.category_key;
  ELSIF TG_OP = 'INSERT' THEN
    request_id_value := NEW.id;
    action_value := 'purchase_request.created';
    request_status := NEW.status;
    request_category := NEW.category_key;
  ELSE
    request_id_value := NEW.id;
    action_value := 'purchase_request.updated';
    request_status := NEW.status;
    request_category := NEW.category_key;
  END IF;
  INSERT INTO public.audit_log(actor_user_id,organization_id,action,resource_type,resource_id,metadata)
  VALUES ((SELECT auth.uid()),NULL,action_value,'purchase_request',request_id_value::text,jsonb_build_object('status',request_status,'category',request_category));
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$function$;
REVOKE ALL ON FUNCTION public.audit_purchase_request_change() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS purchase_requests_audit_changes ON public.purchase_requests;
CREATE TRIGGER purchase_requests_audit_changes AFTER INSERT OR UPDATE OR DELETE ON public.purchase_requests FOR EACH ROW EXECUTE FUNCTION public.audit_purchase_request_change();
