INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'commission-proofs',
  'commission-proofs',
  false,
  10485760,
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Commission proof uploads are owner-scoped" ON storage.objects;
DROP POLICY IF EXISTS "Commission proof owners can view files" ON storage.objects;
DROP POLICY IF EXISTS "Commission proof owners can update files" ON storage.objects;
DROP POLICY IF EXISTS "Commission proof owners can delete files" ON storage.objects;

CREATE POLICY "Commission proof uploads are owner-scoped"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'commission-proofs'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Commission proof owners can view files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'commission-proofs'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Commission proof owners can update files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'commission-proofs'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'commission-proofs'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Commission proof owners can delete files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'commission-proofs'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
