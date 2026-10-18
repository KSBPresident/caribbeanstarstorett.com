-- Permit buyers to start a conversation from a published product even when
-- the approved seller has not yet published a public business profile.
-- Store-wide inquiries without a product remain gated by a published profile.
CREATE POLICY seller_conversations_buyer_create_for_published_inventory
  ON public.seller_conversations FOR INSERT TO authenticated
  WITH CHECK (
    buyer_user_id = (SELECT auth.uid())
    AND inventory_item_id IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.organizations AS o
      JOIN public.inventory_items AS i ON i.organization_id = o.id
      WHERE o.id = seller_organization_id
        AND o.status = 'active'
        AND i.id = inventory_item_id
        AND i.status = 'published'
        AND private.is_active_approved_seller_org(o.id)
    )
  );
