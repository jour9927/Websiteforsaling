-- 為活動表格新增圖片位置欄位

ALTER TABLE events ADD COLUMN IF NOT EXISTS image_position VARCHAR(50) DEFAULT 'center';

COMMENT ON COLUMN events.image_position IS '圖片在縮圖中的顯示位置 (CSS object-position 值)';
