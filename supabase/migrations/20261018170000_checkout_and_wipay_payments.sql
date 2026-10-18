ALTER TABLE public.inventory_items
  ADD COLUMN seller_international_shipping_fee numeric(12,2) NOT NULL DEFAULT 0.00
  CHECK (seller_international_shipping_fee >= 0);

CREATE TABLE public.checkout_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_reference text NOT NULL UNIQUE
    CHECK (payment_reference ~ '^CSS[A-Za-z0-9_-]{10,13}$'),
  buyer_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  buyer_email text NOT NULL CHECK (char_length(btrim(buyer_email)) BETWEEN 3 AND 254),
  status text NOT NULL DEFAULT 'pending_payment'
    CHECK (status IN ('pending_payment', 'paid', 'payment_failed', 'expired')),
  destination_country text NOT NULL CHECK (destination_country ~ '^[A-Z]{2}$'),
  shipping_address jsonb NOT NULL DEFAULT '{}'::jsonb
    CHECK (jsonb_typeof(shipping_address) = 'object'),
  currency text NOT NULL DEFAULT 'USD' CHECK (currency = 'USD'),
  item_subtotal numeric(12,2) NOT NULL DEFAULT 0 CHECK (item_subtotal >= 0),
  seller_shipping_total numeric(12,2) NOT NULL DEFAULT 0 CHECK (seller_shipping_total >= 0),
  platform_shipping_total numeric(12,2) NOT NULL DEFAULT 0 CHECK (platform_shipping_total >= 0),
  total numeric(12,2) GENERATED ALWAYS AS
    (item_subtotal + seller_shipping_total + platform_shipping_total) STORED,
  wipay_transaction_id text UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  paid_at timestamptz,
  CHECK ((status = 'paid') = (paid_at IS NOT NULL))
);

CREATE TABLE public.checkout_order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.checkout_orders(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
  inventory_item_id uuid REFERENCES public.inventory_items(id) ON DELETE SET NULL,
  product_name text NOT NULL CHECK (char_length(btrim(product_name)) BETWEEN 2 AND 140),
  category_key text NOT NULL,
  quantity integer NOT NULL CHECK (quantity BETWEEN 1 AND 99),
  unit_price numeric(12,2) NOT NULL CHECK (unit_price > 0),
  seller_shipping_fee numeric(12,2) NOT NULL CHECK (seller_shipping_fee >= 0),
  platform_shipping_fee numeric(12,2) NOT NULL DEFAULT 5.00 CHECK (platform_shipping_fee = 5.00),
  commission_rate numeric(5,4) NOT NULL DEFAULT 0.12 CHECK (commission_rate = 0.12),
  line_subtotal numeric(12,2) GENERATED ALWAYS AS (unit_price * quantity) STORED,
  seller_shipping_total numeric(12,2) GENERATED ALWAYS AS (seller_shipping_fee * quantity) STORED,
  platform_shipping_total numeric(12,2) GENERATED ALWAYS AS (platform_shipping_fee * quantity) STORED,
  commission_amount numeric(12,2) GENERATED ALWAYS AS (round(unit_price * quantity * commission_rate, 2)) STORED,
  seller_net_amount numeric(12,2) GENERATED ALWAYS AS (unit_price * quantity - round(unit_price * quantity * commission_rate, 2)) STORED,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX checkout_orders_buyer_created_idx
  ON public.checkout_orders (buyer_user_id, created_at DESC);
CREATE INDEX checkout_orders_status_created_idx
  ON public.checkout_orders (status, created_at);
CREATE INDEX checkout_order_items_order_idx
  ON public.checkout_order_items (order_id);
CREATE INDEX checkout_order_items_seller_idx
  ON public.checkout_order_items (organization_id, created_at DESC);

ALTER TABLE public.checkout_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkout_order_items ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.checkout_orders, public.checkout_order_items TO authenticated;

CREATE POLICY checkout_orders_buyer_select
  ON public.checkout_orders FOR SELECT TO authenticated
  USING (buyer_user_id = (SELECT auth.uid()));

CREATE POLICY checkout_order_items_buyer_select
  ON public.checkout_order_items FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.checkout_orders o
    WHERE o.id = checkout_order_items.order_id
      AND o.buyer_user_id = (SELECT auth.uid())
  ));

CREATE OR REPLACE FUNCTION public.create_checkout_order(
  p_buyer_user_id uuid,
  p_buyer_email text,
  p_destination_country text,
  p_shipping_address jsonb,
  p_items jsonb
) RETURNS TABLE(order_id uuid, payment_reference text, order_total numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_order_id uuid;
  v_reference text := 'CSS' || pg_catalog.substr(pg_catalog.replace(gen_random_uuid()::text, '-', ''), 1, 12);
  v_item jsonb;
  v_product record;
  v_quantity integer;
  v_seller_fee numeric(12,2);
  v_item_subtotal numeric(12,2) := 0;
  v_seller_shipping numeric(12,2) := 0;
  v_platform_shipping numeric(12,2) := 0;
  v_count integer := 0;
BEGIN
  IF p_buyer_user_id IS NULL
     OR p_buyer_email IS NULL
     OR char_length(btrim(p_buyer_email)) NOT BETWEEN 3 AND 254
     OR p_destination_country !~ '^[A-Z]{2}$'
     OR jsonb_typeof(p_shipping_address) <> 'object'
     OR jsonb_typeof(p_items) <> 'array'
     OR jsonb_array_length(p_items) < 1
     OR jsonb_array_length(p_items) > 50 THEN
    RAISE EXCEPTION 'Invalid checkout details';
  END IF;

  INSERT INTO public.checkout_orders (
    payment_reference, buyer_user_id, buyer_email, destination_country, shipping_address
  ) VALUES (
    v_reference, p_buyer_user_id, p_buyer_email, p_destination_country, p_shipping_address
  ) RETURNING id INTO v_order_id;

  FOR v_item IN SELECT value FROM jsonb_array_elements(p_items) LOOP
    IF (v_item->>'product_id') IS NULL
       OR (v_item->>'quantity') !~ '^[0-9]{1,2}$' THEN
      RAISE EXCEPTION 'Invalid checkout item';
    END IF;
    v_quantity := (v_item->>'quantity')::integer;
    IF v_quantity < 1 OR v_quantity > 99 THEN
      RAISE EXCEPTION 'Invalid checkout quantity';
    END IF;

    SELECT i.id, i.organization_id, i.name, i.category_key, i.price, i.quantity_available,
           i.seller_shipping_fee, i.seller_international_shipping_fee
      INTO v_product
      FROM public.inventory_items i
     WHERE i.id = (v_item->>'product_id')::uuid
       AND i.status = 'published'
     FOR UPDATE;
    IF NOT FOUND OR v_product.quantity_available < v_quantity THEN
      RAISE EXCEPTION 'A product is unavailable or no longer has enough stock';
    END IF;

    v_seller_fee := CASE WHEN p_destination_country = 'TT'
      THEN v_product.seller_shipping_fee
      ELSE v_product.seller_international_shipping_fee
    END;

    UPDATE public.inventory_items
       SET quantity_available = quantity_available - v_quantity,
           updated_at = now()
     WHERE id = v_product.id;

    INSERT INTO public.checkout_order_items (
      order_id, organization_id, inventory_item_id, product_name, category_key,
      quantity, unit_price, seller_shipping_fee, platform_shipping_fee
    ) VALUES (
      v_order_id, v_product.organization_id, v_product.id, v_product.name, v_product.category_key,
      v_quantity, v_product.price, v_seller_fee, 5.00
    );

    v_item_subtotal := v_item_subtotal + v_product.price * v_quantity;
    v_seller_shipping := v_seller_shipping + v_seller_fee * v_quantity;
    v_platform_shipping := v_platform_shipping + 5.00 * v_quantity;
    v_count := v_count + 1;
  END LOOP;

  UPDATE public.checkout_orders o
     SET item_subtotal = v_item_subtotal,
         seller_shipping_total = v_seller_shipping,
         platform_shipping_total = v_platform_shipping
   WHERE o.id = v_order_id;

  RETURN QUERY SELECT v_order_id, v_reference,
    (v_item_subtotal + v_seller_shipping + v_platform_shipping)::numeric;
END;
$function$;
REVOKE ALL ON FUNCTION public.create_checkout_order(uuid, text, text, jsonb, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_checkout_order(uuid, text, text, jsonb, jsonb) TO service_role;

CREATE OR REPLACE FUNCTION public.complete_checkout_order(
  p_order_id uuid,
  p_transaction_id text,
  p_verified_total numeric
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_order public.checkout_orders%ROWTYPE;
BEGIN
  UPDATE public.checkout_orders
     SET status = 'paid', paid_at = now()
   WHERE id = p_order_id
     AND status = 'pending_payment'
     AND wipay_transaction_id = p_transaction_id
     AND total = p_verified_total
   RETURNING * INTO v_order;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  INSERT INTO public.seller_sales (
    organization_id, inventory_item_id, order_reference, category_key,
    amount, currency, commission_rate, status
  )
  SELECT i.organization_id,
         i.inventory_item_id,
         v_order.payment_reference || '-' || pg_catalog.left(i.id::text, 8),
         i.category_key,
         i.line_subtotal,
         v_order.currency,
         0.12,
         'paid'
    FROM public.checkout_order_items i
   WHERE i.order_id = v_order.id;

  RETURN true;
END;
$function$;
REVOKE ALL ON FUNCTION public.complete_checkout_order(uuid, text, numeric) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.complete_checkout_order(uuid, text, numeric) TO service_role;

CREATE OR REPLACE FUNCTION public.release_checkout_order(
  p_order_id uuid,
  p_failed boolean DEFAULT false
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_order_id uuid;
BEGIN
  UPDATE public.checkout_orders
     SET status = CASE WHEN p_failed THEN 'payment_failed' ELSE 'expired' END
   WHERE id = p_order_id AND status = 'pending_payment'
   RETURNING id INTO v_order_id;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  UPDATE public.inventory_items i
     SET quantity_available = i.quantity_available + items.quantity,
         updated_at = now()
    FROM (
      SELECT inventory_item_id, sum(quantity)::integer AS quantity
        FROM public.checkout_order_items
       WHERE order_id = v_order_id AND inventory_item_id IS NOT NULL
       GROUP BY inventory_item_id
    ) items
   WHERE i.id = items.inventory_item_id;

  RETURN true;
END;
$function$;
REVOKE ALL ON FUNCTION public.release_checkout_order(uuid, boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.release_checkout_order(uuid, boolean) TO service_role;

CREATE OR REPLACE FUNCTION public.expire_checkout_orders()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_order record;
  v_released integer := 0;
BEGIN
  FOR v_order IN
    SELECT id FROM public.checkout_orders
     WHERE status = 'pending_payment'
       AND created_at < now() - interval '30 minutes'
     FOR UPDATE SKIP LOCKED
  LOOP
    IF public.release_checkout_order(v_order.id, false) THEN
      v_released := v_released + 1;
    END IF;
  END LOOP;
  RETURN v_released;
END;
$function$;
REVOKE ALL ON FUNCTION public.expire_checkout_orders() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.expire_checkout_orders() TO service_role;
