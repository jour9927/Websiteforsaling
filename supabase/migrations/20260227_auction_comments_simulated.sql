-- 為 auction_comments 增加模擬留言欄位
-- 讓 LLM 回覆真實用戶的留言可以寫入 DB 持久化

-- 1. 新增 is_simulated 欄位（標記是否為模擬留言）
ALTER TABLE auction_comments
ADD COLUMN IF NOT EXISTS is_simulated BOOLEAN DEFAULT false;

-- 2. 新增 virtual_user_id 欄位（虛擬用戶 ID，用於連結到虛擬用戶頁面）
ALTER TABLE auction_comments
ADD COLUMN IF NOT EXISTS virtual_user_id TEXT;

-- 3. 允許 user_id 為 NULL（模擬留言沒有真實 auth.users ID）
ALTER TABLE auction_comments
ALTER COLUMN user_id DROP NOT NULL;

-- 4. 建立索引加速查詢
CREATE INDEX IF NOT EXISTS idx_auction_comments_is_simulated 
ON auction_comments(is_simulated);
