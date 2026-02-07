-- 新增 status 欄位到 announcements 資料表
-- 執行於 Supabase Dashboard > SQL Editor

-- 新增 status 欄位（如果不存在）
ALTER TABLE announcements 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft';

-- 更新現有公告的狀態
UPDATE announcements 
SET status = 'published' 
WHERE status IS NULL OR status = 'draft';
