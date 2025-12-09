-- 修正 registrations 的 SELECT 政策
-- 允許所有人查看已確認的報名記錄（用於計算活動人數）
-- 但個人詳細資料仍受保護

DROP POLICY IF EXISTS "Users can view own registrations" ON registrations;

-- 新政策：允許查看已確認的報名記錄 + 自己的所有報名記錄
CREATE POLICY "Anyone can view confirmed registrations and own registrations"
  ON registrations FOR SELECT
  USING (
    status = 'confirmed' OR
    auth.uid() = user_id OR
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );
