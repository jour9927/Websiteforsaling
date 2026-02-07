-- 新增討論串回覆功能欄位

-- 1. 新增 parent_id 欄位（指向父留言，NULL = 頂層留言）
ALTER TABLE profile_comments
ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES profile_comments(id) ON DELETE CASCADE;

-- 2. 新增 has_real_reply 欄位（是否有真實用戶回覆 → 永久保存）
ALTER TABLE profile_comments
ADD COLUMN IF NOT EXISTS has_real_reply BOOLEAN DEFAULT false;

-- 3. 建立索引加速查詢
CREATE INDEX IF NOT EXISTS idx_profile_comments_parent_id 
ON profile_comments(parent_id);

-- 4. 建立函數：當有真實用戶回覆時，更新父留言的 has_real_reply
CREATE OR REPLACE FUNCTION update_parent_has_real_reply()
RETURNS TRIGGER AS $$
BEGIN
    -- 如果是真實用戶回覆（commenter_id 不為 NULL）且有 parent_id
    IF NEW.commenter_id IS NOT NULL AND NEW.parent_id IS NOT NULL THEN
        -- 更新父留言和所有祖先留言的 has_real_reply
        WITH RECURSIVE ancestors AS (
            SELECT id, parent_id FROM profile_comments WHERE id = NEW.parent_id
            UNION ALL
            SELECT pc.id, pc.parent_id FROM profile_comments pc
            INNER JOIN ancestors a ON pc.id = a.parent_id
        )
        UPDATE profile_comments 
        SET has_real_reply = true 
        WHERE id IN (SELECT id FROM ancestors);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. 建立觸發器
DROP TRIGGER IF EXISTS trigger_update_has_real_reply ON profile_comments;
CREATE TRIGGER trigger_update_has_real_reply
AFTER INSERT ON profile_comments
FOR EACH ROW
EXECUTE FUNCTION update_parent_has_real_reply();
