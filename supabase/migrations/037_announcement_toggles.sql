-- 公告系統優化：新增顯示開關欄位

-- 新增 show_popup 和 show_in_list 欄位
ALTER TABLE announcements 
ADD COLUMN IF NOT EXISTS show_popup BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS show_in_list BOOLEAN DEFAULT true;

-- 允許管理員刪除已讀記錄（用於重新推送）
CREATE POLICY "announcement_reads_delete_admin" ON announcement_reads
    FOR DELETE USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

-- 允許管理員更新公告（用於切換開關）
-- 先檢查是否已存在此 policy
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'announcements' AND policyname = 'announcements_update_admin'
    ) THEN
        CREATE POLICY "announcements_update_admin" ON announcements
            FOR UPDATE USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));
    END IF;
END $$;
