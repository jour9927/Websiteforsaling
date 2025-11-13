-- 新增圖片 URL 欄位到公告表格
ALTER TABLE announcements 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 如果 events 表格還沒有 image_url（從 001 遷移可能沒有），這裡確保它存在
-- 如果已存在會被忽略
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 建立 Storage bucket 的 RLS 政策註解
-- 需要在 Supabase Dashboard 手動建立以下 Storage buckets:
-- 1. events (用於活動封面圖)
-- 2. announcements (用於公告圖片)
-- 
-- Storage RLS 政策設定：
-- - SELECT: 允許所有人讀取
-- - INSERT: 只允許已驗證用戶上傳
-- - UPDATE/DELETE: 只允許管理員操作
