-- 預報名系統：新增手動預報名人數欄位
ALTER TABLE events
ADD COLUMN IF NOT EXISTS pre_registration_count INTEGER DEFAULT 0;
