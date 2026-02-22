-- 每日簽到系統 SQL 更新腳本 (請在 Supabase SQL Editor 執行)

-- 1. 新增連續簽到天數欄位，預設為 0
ALTER TABLE profiles
ADD COLUMN checkin_streak INTEGER DEFAULT 0;

-- 2. 新增最後登入時間欄位
ALTER TABLE profiles
ADD COLUMN last_checkin TIMESTAMP WITH TIME ZONE;

-- 3. (選用) 更新所有現有會員的初始狀態，確保邏輯不會因為 null 而報錯
UPDATE profiles
SET checkin_streak = 0
WHERE checkin_streak IS NULL;
