UPDATE storage.buckets
SET file_size_limit = 10485760
WHERE id = 'product-images';

DROP POLICY IF EXISTS product_images_approved_seller_upload ON storage.objects;
CREATE POLICY product_images_approved_seller_upload
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'product-images'
  AND (storage.foldername(name))[1] IS NOT NULL
  AND name ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}[.](jpg|png|webp)$'
  AND EXISTS (
    SELECT 1
    FROM public.organizations AS organization
    JOIN public.seller_applications AS application
      ON application.organization_id = organization.id
    WHERE organization.id::text = (storage.foldername(storage.objects.name))[1]
      AND organization.status = 'active'
      AND application.applicant_user_id = (SELECT auth.uid())
      AND application.status = 'approved'
      AND private.has_organization_permission(organization.id, 'organization.manage')
  )
);

DROP POLICY IF EXISTS product_images_approved_seller_delete ON storage.objects;
CREATE POLICY product_images_approved_seller_delete
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'product-images'
  AND (storage.foldername(name))[1] IS NOT NULL
  AND name ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}[.](jpg|png|webp)$'
  AND EXISTS (
    SELECT 1
    FROM public.organizations AS organization
    JOIN public.seller_applications AS application
      ON application.organization_id = organization.id
    WHERE organization.id::text = (storage.foldername(storage.objects.name))[1]
      AND organization.status = 'active'
      AND application.applicant_user_id = (SELECT auth.uid())
      AND application.status = 'approved'
      AND private.has_organization_permission(organization.id, 'organization.manage')
  )
);
