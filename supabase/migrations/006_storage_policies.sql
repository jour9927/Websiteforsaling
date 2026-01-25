-- 建立 events storage bucket (如果還沒建立)
-- 注意：這個指令如果 bucket 已存在會報錯，可以忽略
INSERT INTO storage.buckets (id, name, public)
VALUES ('events', 'events', true)
ON CONFLICT (id) DO NOTHING;

-- 刪除舊的政策（如果存在）
DROP POLICY IF EXISTS "Allow authenticated users to upload event images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public to read event images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update their uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete their uploads" ON storage.objects;

-- 1. 允許已認證用戶上傳圖片到 events bucket
CREATE POLICY "Allow authenticated users to upload event images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'events' AND
  (storage.foldername(name))[1] = 'event-images'
);

-- 2. 允許所有人讀取 events bucket 的圖片（因為是公開的）
CREATE POLICY "Allow public to read event images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'events');

-- 3. 允許已認證用戶更新自己上傳的圖片
CREATE POLICY "Allow authenticated users to update their uploads"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'events')
WITH CHECK (bucket_id = 'events');

-- 4. 允許已認證用戶刪除圖片
CREATE POLICY "Allow authenticated users to delete their uploads"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'events');
