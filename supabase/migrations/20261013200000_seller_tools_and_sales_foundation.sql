ALTER TABLE public.seller_applications
  ADD COLUMN business_registration_number text
    CHECK (business_registration_number IS NULL OR char_length(trim(business_registration_number)) BETWEEN 2 AND 120),
  ADD COLUMN identity_verification_status text NOT NULL DEFAULT 'not_started'
    CHECK (identity_verification_status IN ('not_started','pending','verified','rejected'));

ALTER TABLE public.organization_public_profiles
  ADD COLUMN seller_verified boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.guard_seller_verified_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  IF NEW.seller_verified IS DISTINCT FROM OLD.seller_verified
    AND NOT COALESCE(((SELECT auth.jwt()) -> 'app_metadata' ->> 'platform_role') = 'admin', false)
  THEN
    RAISE EXCEPTION 'platform administrator access required' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$function$;
REVOKE ALL ON FUNCTION public.guard_seller_verified_status() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS guard_seller_verified_status ON public.organization_public_profiles;
CREATE TRIGGER guard_seller_verified_status
  BEFORE UPDATE ON public.organization_public_profiles
  FOR EACH ROW EXECUTE FUNCTION public.guard_seller_verified_status();

-- A platform administrator records the provider's outcome. The application stores
-- only the status; identity documents and selfies stay with the verification provider.
CREATE OR REPLACE FUNCTION public.platform_set_seller_verification(
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
  org_id uuid;
BEGIN
  IF actor_id IS NULL OR NOT COALESCE((SELECT public.is_platform_admin()), false) THEN
    RAISE EXCEPTION 'platform administrator access required' USING ERRCODE = '42501';
  END IF;
  IF p_status NOT IN ('not_started','pending','verified','rejected') THEN
    RAISE EXCEPTION 'invalid verification status' USING ERRCODE = '22023';
  END IF;

  UPDATE public.seller_applications
    SET identity_verification_status = p_status
    WHERE id = p_application_id
    RETURNING organization_id INTO org_id;
  IF NOT FOUND THEN RETURN false; END IF;

  IF org_id IS NOT NULL THEN
    UPDATE public.organization_public_profiles
      SET seller_verified = (p_status = 'verified')
      WHERE organization_id = org_id;
  END IF;

  INSERT INTO public.audit_log(actor_user_id, organization_id, action, resource_type, resource_id, metadata)
  VALUES (actor_id, org_id, 'seller.identity_verification_changed', 'seller_application',
    p_application_id::text, jsonb_build_object('status', p_status));
  RETURN true;
END;
$function$;

REVOKE ALL ON FUNCTION public.platform_set_seller_verification(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.platform_set_seller_verification(uuid, text) TO authenticated;

CREATE TABLE public.seller_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  seller_organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  inventory_item_id uuid REFERENCES public.inventory_items(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX seller_conversations_buyer_idx ON public.seller_conversations(buyer_user_id, updated_at DESC);
CREATE INDEX seller_conversations_seller_idx ON public.seller_conversations(seller_organization_id, updated_at DESC);

CREATE TABLE public.seller_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.seller_conversations(id) ON DELETE CASCADE,
  sender_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL CHECK (char_length(trim(body)) BETWEEN 1 AND 4000),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX seller_messages_conversation_idx ON public.seller_messages(conversation_id, created_at);

ALTER TABLE public.seller_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_messages ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.seller_conversations, public.seller_messages FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT ON public.seller_conversations TO authenticated;
GRANT SELECT, INSERT ON public.seller_messages TO authenticated;

CREATE POLICY seller_conversations_participant_read
  ON public.seller_conversations FOR SELECT TO authenticated
  USING (
    buyer_user_id = (SELECT auth.uid())
    OR private.has_organization_permission(seller_organization_id, 'organization.read')
  );
CREATE POLICY seller_conversations_buyer_create
  ON public.seller_conversations FOR INSERT TO authenticated
  WITH CHECK (
    buyer_user_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.organizations AS o
      JOIN public.organization_public_profiles AS p ON p.organization_id = o.id
      WHERE o.id = seller_organization_id AND o.status = 'active' AND p.is_published
    )
    AND (inventory_item_id IS NULL OR EXISTS (
      SELECT 1 FROM public.inventory_items AS i
      WHERE i.id = inventory_item_id
        AND i.organization_id = seller_organization_id
        AND i.status = 'published'
    ))
  );

CREATE POLICY seller_messages_participant_read
  ON public.seller_messages FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.seller_conversations AS c
    WHERE c.id = conversation_id
      AND (c.buyer_user_id = (SELECT auth.uid())
        OR private.has_organization_permission(c.seller_organization_id, 'organization.read'))
  ));
CREATE POLICY seller_messages_participant_send
  ON public.seller_messages FOR INSERT TO authenticated
  WITH CHECK (
    sender_user_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.seller_conversations AS c
      WHERE c.id = conversation_id
        AND (c.buyer_user_id = (SELECT auth.uid())
          OR private.has_organization_permission(c.seller_organization_id, 'organization.read'))
    )
  );

CREATE TABLE public.seller_coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  code text NOT NULL CHECK (code ~ '^[A-Z0-9][A-Z0-9_-]{2,39}$'),
  discount_type text NOT NULL CHECK (discount_type IN ('percentage','fixed')),
  discount_value numeric(10,2) NOT NULL CHECK (discount_value > 0),
  currency text NOT NULL DEFAULT 'USD' CHECK (currency ~ '^[A-Z]{3}$'),
  starts_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((discount_type = 'percentage' AND discount_value <= 100)
    OR (discount_type = 'fixed' AND currency = 'USD')),
  CHECK (expires_at IS NULL OR expires_at > starts_at),
  UNIQUE (organization_id, code)
);
ALTER TABLE public.seller_coupons ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.seller_coupons FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.seller_coupons TO anon, authenticated;
GRANT INSERT, UPDATE ON public.seller_coupons TO authenticated;
CREATE POLICY seller_coupons_public_active_read
  ON public.seller_coupons FOR SELECT TO anon
  USING (is_active AND starts_at <= now() AND (expires_at IS NULL OR expires_at > now())
    AND EXISTS (SELECT 1 FROM public.organizations o
      JOIN public.organization_public_profiles p ON p.organization_id = o.id
      WHERE o.id = public.seller_coupons.organization_id AND o.status = 'active' AND p.is_published));
CREATE POLICY seller_coupons_authenticated_read
  ON public.seller_coupons FOR SELECT TO authenticated
  USING ((is_active AND starts_at <= now() AND (expires_at IS NULL OR expires_at > now())
      AND EXISTS (SELECT 1 FROM public.organizations o
        JOIN public.organization_public_profiles p ON p.organization_id = o.id
        WHERE o.id = public.seller_coupons.organization_id AND o.status = 'active' AND p.is_published))
    OR private.has_organization_permission(organization_id, 'organization.read'));
CREATE POLICY seller_coupons_manage_insert
  ON public.seller_coupons FOR INSERT TO authenticated
  WITH CHECK (private.has_organization_permission(organization_id, 'organization.manage'));
CREATE POLICY seller_coupons_manage_update
  ON public.seller_coupons FOR UPDATE TO authenticated
  USING (private.has_organization_permission(organization_id, 'organization.manage'))
  WITH CHECK (private.has_organization_permission(organization_id, 'organization.manage'));

-- Paid sales can only be written by trusted payment/webhook code using the service role.
-- The platform commission is fixed at 12% of the recorded sale amount.
CREATE TABLE public.seller_sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
  inventory_item_id uuid REFERENCES public.inventory_items(id) ON DELETE SET NULL,
  order_reference text NOT NULL CHECK (char_length(trim(order_reference)) BETWEEN 1 AND 160),
  category_key text NOT NULL CHECK (category_key IN (
    'electronics-appliances','groceries-food','home-living','clothing-fashion','beauty-wellness','vehicles-parts'
  )),
  amount numeric(12,2) NOT NULL CHECK (amount >= 0),
  currency text NOT NULL DEFAULT 'USD' CHECK (currency ~ '^[A-Z]{3}$'),
  commission_rate numeric(5,4) NOT NULL DEFAULT 0.12 CHECK (commission_rate = 0.12),
  commission_amount numeric(12,2) GENERATED ALWAYS AS (round(amount * commission_rate, 2)) STORED,
  seller_net_amount numeric(12,2) GENERATED ALWAYS AS (amount - round(amount * commission_rate, 2)) STORED,
  status text NOT NULL CHECK (status IN ('paid','refunded')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (order_reference, inventory_item_id)
);
ALTER TABLE public.seller_sales ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.seller_sales FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.seller_sales TO authenticated;
GRANT INSERT, UPDATE ON public.seller_sales TO service_role;
CREATE INDEX seller_sales_org_date_idx ON public.seller_sales(organization_id, created_at DESC);
CREATE POLICY seller_sales_seller_read
  ON public.seller_sales FOR SELECT TO authenticated
  USING (private.has_organization_permission(organization_id, 'organization.read'));
CREATE POLICY seller_sales_admin_read
  ON public.seller_sales FOR SELECT TO authenticated
  USING ((SELECT public.is_platform_admin()));
