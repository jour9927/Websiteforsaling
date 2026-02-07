-- 新增 last_read_announcements_at 欄位到 profiles 表
-- 用於追蹤用戶最後查看公告的時間

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS last_read_announcements_at TIMESTAMPTZ DEFAULT '2020-01-01';
