-- 修改 profile_visits 表，允許虛擬用戶訪問（visitor_id 可以是虛擬用戶）
-- 先刪除舊的外鍵約束，改為允許虛擬用戶 ID

-- 新增 is_virtual 欄位標記是否為虛擬訪客
ALTER TABLE profile_visits
ADD COLUMN IF NOT EXISTS is_virtual BOOLEAN DEFAULT false;

-- 新增 virtual_visitor_id 欄位（用於虛擬用戶訪問時記錄）
ALTER TABLE profile_visits
ADD COLUMN IF NOT EXISTS virtual_visitor_id UUID;

-- 更新約束：允許 visitor_id 為 NULL（當是虛擬訪客時）
-- 先刪除舊的 NOT NULL 約束可能會失敗，所以用 IF EXISTS
ALTER TABLE profile_visits
ALTER COLUMN visitor_id DROP NOT NULL;

-- 新增檢查約束：要麼是真實訪客，要麼是虛擬訪客
ALTER TABLE profile_visits
ADD CONSTRAINT visitor_check CHECK (
  (is_virtual = false AND visitor_id IS NOT NULL) OR
  (is_virtual = true AND virtual_visitor_id IS NOT NULL)
);

-- 更新唯一約束以支援虛擬訪客
DROP INDEX IF EXISTS profile_visits_profile_user_id_visitor_id_visited_at_key;

-- 建立新的唯一索引
CREATE UNIQUE INDEX IF NOT EXISTS idx_profile_visits_unique_real 
  ON profile_visits(profile_user_id, visitor_id, (visited_at::date)) 
  WHERE is_virtual = false;

CREATE UNIQUE INDEX IF NOT EXISTS idx_profile_visits_unique_virtual 
  ON profile_visits(profile_user_id, virtual_visitor_id, (visited_at::date)) 
  WHERE is_virtual = true;
