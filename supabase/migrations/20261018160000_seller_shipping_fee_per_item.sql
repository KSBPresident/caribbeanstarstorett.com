ALTER TABLE public.inventory_items
  ADD COLUMN seller_shipping_fee numeric(12,2) NOT NULL DEFAULT 0.00
  CHECK (seller_shipping_fee >= 0);
