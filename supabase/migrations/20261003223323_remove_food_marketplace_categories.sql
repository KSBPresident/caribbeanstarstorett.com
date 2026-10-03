ALTER TABLE public.inventory_items
  DROP CONSTRAINT inventory_items_category_key_check;

ALTER TABLE public.inventory_items
  ADD CONSTRAINT inventory_items_category_key_check
  CHECK (category_key IN (
    'electronics-appliances',
    'home-living',
    'clothing-fashion',
    'beauty-wellness',
    'vehicles-parts'
  ));

ALTER TABLE public.organization_public_profiles
  DROP CONSTRAINT organization_public_profiles_category_key_check;

ALTER TABLE public.organization_public_profiles
  ADD CONSTRAINT organization_public_profiles_category_key_check
  CHECK (category_key IN (
    'home',
    'retail',
    'professional',
    'transport',
    'beauty',
    'community',
    'other'
  ));
