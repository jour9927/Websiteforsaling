-- =====================================================
-- 020_add_gamification_features.sql
-- 寶可夢網站 V2.0 - 圖鑑與簽到功能資料庫擴充
-- =====================================================

-- 修改 events 表：擴充圖鑑屬性
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS visual_card_url TEXT, -- 專用於圖鑑牆的精美卡面 (直式)
ADD COLUMN IF NOT EXISTS estimated_value INTEGER DEFAULT 0, -- 目前市場估值
ADD COLUMN IF NOT EXISTS series_tag TEXT; -- 系列標籤 (如: 2006電影版)

-- 為 series_tag 建立索引以加速篩選查詢
CREATE INDEX IF NOT EXISTS idx_events_series_tag ON events(series_tag);

-- 修改 profiles 表：擴充簽到屬性
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS last_check_in TIMESTAMP WITH TIME ZONE, -- 上次簽到時間
ADD COLUMN IF NOT EXISTS check_in_streak INTEGER DEFAULT 0, -- 連續簽到天數
ADD COLUMN IF NOT EXISTS fortune_points INTEGER DEFAULT 0; -- 幸運點數 (預留)

-- 修改 user_items 表：建立與 events 的關聯
-- 確保每個使用者擁有的物品能對應回原本的活動 (Event)，以便讀取估值與圖片
ALTER TABLE user_items
ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES events(id);

-- 為 event_id 建立索引
CREATE INDEX IF NOT EXISTS idx_user_items_event_id ON user_items(event_id);

-- =====================================================
-- 說明：
-- 1. visual_card_url: 用於圖鑑牆顯示的高品質卡面圖片
-- 2. estimated_value: 物品的市場估值（整數，單位可自訂）
-- 3. series_tag: 用於分類篩選，如 "2006電影版"、"初代系列" 等
-- 4. last_check_in: 記錄使用者最後一次簽到時間
-- 5. check_in_streak: 連續簽到天數，用於獎勵機制
-- 6. fortune_points: 預留的幸運點數欄位，可用於未來的抽獎加成等功能
-- =====================================================
