CREATE INDEX IF NOT EXISTS checkout_order_items_inventory_idx
  ON public.checkout_order_items (inventory_item_id)
  WHERE inventory_item_id IS NOT NULL;
