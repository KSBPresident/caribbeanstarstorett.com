-- Keep stock reserved after an uncertain WiPay attempt until its final outcome is reconciled.
ALTER TABLE public.checkout_orders
  DROP CONSTRAINT IF EXISTS checkout_orders_status_check;

ALTER TABLE public.checkout_orders
  ADD CONSTRAINT checkout_orders_status_check
  CHECK (status IN ('pending_payment', 'payment_review', 'paid', 'payment_failed', 'expired'));

CREATE OR REPLACE FUNCTION public.mark_checkout_order_for_review(
  p_order_id uuid
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_order_id uuid;
BEGIN
  UPDATE public.checkout_orders
     SET status = 'payment_review'
   WHERE id = p_order_id
     AND status = 'pending_payment'
   RETURNING id INTO v_order_id;
  RETURN FOUND;
END;
$function$;
REVOKE ALL ON FUNCTION public.mark_checkout_order_for_review(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mark_checkout_order_for_review(uuid) TO service_role;

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
     AND status IN ('pending_payment', 'payment_review')
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
   WHERE id = p_order_id
     AND status IN ('pending_payment', 'payment_review')
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

-- Age unresolved attempts into a review state, never back into sellable stock.
CREATE OR REPLACE FUNCTION public.expire_checkout_orders()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_reviewed integer := 0;
BEGIN
  UPDATE public.checkout_orders
     SET status = 'payment_review'
   WHERE status = 'pending_payment'
     AND created_at < now() - interval '30 minutes';
  GET DIAGNOSTICS v_reviewed = ROW_COUNT;
  RETURN v_reviewed;
END;
$function$;
REVOKE ALL ON FUNCTION public.expire_checkout_orders() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.expire_checkout_orders() TO service_role;
