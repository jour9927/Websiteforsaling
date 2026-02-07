-- 修改 profile_comments 表，支援虛擬用戶留言

-- 新增虛擬留言相關欄位
ALTER TABLE profile_comments
ADD COLUMN IF NOT EXISTS is_virtual BOOLEAN DEFAULT false;

ALTER TABLE profile_comments
ADD COLUMN IF NOT EXISTS virtual_commenter_id UUID;

-- 允許 commenter_id 為 NULL（當是虛擬留言時）
ALTER TABLE profile_comments
ALTER COLUMN commenter_id DROP NOT NULL;

-- 新增 RLS 策略允許 service_role 插入虛擬留言
CREATE POLICY "service_role_insert_virtual_comments" ON profile_comments
FOR INSERT
WITH CHECK (true);
