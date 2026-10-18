ALTER TABLE public.checkout_order_items
  ADD COLUMN coupon_discount numeric(12,2) NOT NULL DEFAULT 0
    CHECK (coupon_discount >= 0),
  ADD COLUMN discounted_subtotal numeric(12,2)
    GENERATED ALWAYS AS (line_subtotal - coupon_discount) STORED;

ALTER TABLE public.checkout_order_items
  DROP COLUMN commission_amount,
  DROP COLUMN seller_net_amount,
  ADD COLUMN commission_amount numeric(12,2)
    GENERATED ALWAYS AS (round(discounted_subtotal * commission_rate, 2)) STORED,
  ADD COLUMN seller_net_amount numeric(12,2)
    GENERATED ALWAYS AS (discounted_subtotal - round(discounted_subtotal * commission_rate, 2)) STORED;

ALTER TABLE public.checkout_orders
  ADD COLUMN coupon_code text,
  ADD COLUMN coupon_organization_id uuid REFERENCES public.organizations(id) ON DELETE RESTRICT,
  ADD COLUMN coupon_discount_total numeric(12,2) NOT NULL DEFAULT 0
    CHECK (coupon_discount_total >= 0 AND coupon_discount_total <= item_subtotal),
  ADD CONSTRAINT checkout_orders_coupon_code_check
    CHECK (coupon_code IS NULL OR coupon_code ~ '^[A-Z0-9][A-Z0-9_-]{2,39}$'),
  ADD CONSTRAINT checkout_orders_coupon_snapshot_check
    CHECK (
      (coupon_code IS NULL AND coupon_organization_id IS NULL AND coupon_discount_total = 0)
      OR
      (coupon_code IS NOT NULL AND coupon_organization_id IS NOT NULL AND coupon_discount_total > 0)
    );

ALTER TABLE public.checkout_orders
  DROP COLUMN total,
  ADD COLUMN total numeric(12,2)
    GENERATED ALWAYS AS (item_subtotal + seller_shipping_total + platform_shipping_total - coupon_discount_total) STORED;

DROP FUNCTION IF EXISTS public.create_checkout_order(uuid, text, text, jsonb, jsonb);

CREATE FUNCTION public.create_checkout_order(
  p_buyer_user_id uuid,
  p_buyer_email text,
  p_destination_country text,
  p_shipping_address jsonb,
  p_items jsonb,
  p_coupon_code text DEFAULT NULL
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
  v_coupon_code text := nullif(pg_catalog.upper(pg_catalog.btrim(p_coupon_code)), '');
  v_coupon public.seller_coupons%ROWTYPE;
  v_eligible_subtotal numeric(12,2) := 0;
  v_eligible_count integer := 0;
  v_discount_total numeric(12,2) := 0;
  v_remaining_discount numeric(12,2) := 0;
  v_remaining_subtotal numeric(12,2) := 0;
  v_allocated integer := 0;
  v_line record;
  v_line_discount numeric(12,2);
BEGIN
  IF p_buyer_user_id IS NULL
     OR p_buyer_email IS NULL
     OR char_length(pg_catalog.btrim(p_buyer_email)) NOT BETWEEN 3 AND 254
     OR p_destination_country !~ '^[A-Z]{2}$'
     OR jsonb_typeof(p_shipping_address) <> 'object'
     OR jsonb_typeof(p_items) <> 'array'
     OR jsonb_array_length(p_items) < 1
     OR jsonb_array_length(p_items) > 50
     OR (v_coupon_code IS NOT NULL AND v_coupon_code !~ '^[A-Z0-9][A-Z0-9_-]{2,39}$') THEN
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
  END LOOP;

  IF v_coupon_code IS NOT NULL THEN
    SELECT c.* INTO v_coupon
      FROM public.seller_coupons c
     WHERE c.code = v_coupon_code
       AND c.is_active
       AND c.starts_at <= now()
       AND (c.expires_at IS NULL OR c.expires_at > now())
       AND EXISTS (
         SELECT 1
           FROM public.organizations o
           JOIN public.organization_public_profiles p ON p.organization_id = o.id
          WHERE o.id = c.organization_id
            AND o.status = 'active'
            AND p.is_published
       )
     FOR UPDATE OF c;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Coupon is invalid, inactive, expired, or unpublished';
    END IF;

    SELECT coalesce(sum(i.line_subtotal), 0), count(*)
      INTO v_eligible_subtotal, v_eligible_count
      FROM public.checkout_order_items i
     WHERE i.order_id = v_order_id
       AND i.organization_id = v_coupon.organization_id;
    IF v_eligible_subtotal <= 0 OR v_eligible_count = 0 THEN
      RAISE EXCEPTION 'Coupon does not apply to items in this cart';
    END IF;

    v_discount_total := CASE
      WHEN v_coupon.discount_type = 'percentage'
        THEN round(v_eligible_subtotal * v_coupon.discount_value / 100, 2)
      ELSE least(v_coupon.discount_value, v_eligible_subtotal)
    END;
    IF v_discount_total <= 0 THEN
      RAISE EXCEPTION 'Coupon has no applicable discount';
    END IF;

    v_remaining_discount := v_discount_total;
    v_remaining_subtotal := v_eligible_subtotal;
    FOR v_line IN
      SELECT i.id, i.line_subtotal
        FROM public.checkout_order_items i
       WHERE i.order_id = v_order_id
         AND i.organization_id = v_coupon.organization_id
       ORDER BY i.id
    LOOP
      v_allocated := v_allocated + 1;
      IF v_allocated = v_eligible_count THEN
        v_line_discount := v_remaining_discount;
      ELSE
        v_line_discount := least(
          v_line.line_subtotal,
          v_remaining_discount,
          round(v_remaining_discount * v_line.line_subtotal / v_remaining_subtotal, 2)
        );
      END IF;
      UPDATE public.checkout_order_items
         SET coupon_discount = v_line_discount
       WHERE id = v_line.id;
      v_remaining_discount := v_remaining_discount - v_line_discount;
      v_remaining_subtotal := v_remaining_subtotal - v_line.line_subtotal;
    END LOOP;

    IF v_remaining_discount <> 0 THEN
      RAISE EXCEPTION 'Coupon discount allocation failed';
    END IF;
  END IF;

  UPDATE public.checkout_orders o
     SET item_subtotal = v_item_subtotal,
         seller_shipping_total = v_seller_shipping,
         platform_shipping_total = v_platform_shipping,
         coupon_code = CASE WHEN v_coupon_code IS NULL THEN NULL ELSE v_coupon.code END,
         coupon_organization_id = CASE WHEN v_coupon_code IS NULL THEN NULL ELSE v_coupon.organization_id END,
         coupon_discount_total = v_discount_total
   WHERE o.id = v_order_id;

  RETURN QUERY SELECT v_order_id, v_reference,
    (v_item_subtotal + v_seller_shipping + v_platform_shipping - v_discount_total)::numeric;
END;
$function$;
REVOKE ALL ON FUNCTION public.create_checkout_order(uuid, text, text, jsonb, jsonb, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_checkout_order(uuid, text, text, jsonb, jsonb, text) TO service_role;

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
         i.discounted_subtotal,
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