-- 新增活動價格欄位
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS price INTEGER DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS is_free BOOLEAN DEFAULT true NOT NULL;

-- 新增註解說明
COMMENT ON COLUMN events.price IS '活動價格（新台幣，0表示免費）';
COMMENT ON COLUMN events.is_free IS '是否為免費活動';

-- 更新現有活動為免費
UPDATE events SET is_free = true, price = 0 WHERE price = 0;
