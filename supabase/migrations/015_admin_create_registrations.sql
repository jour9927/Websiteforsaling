-- 允許管理員為會員建立報名記錄

-- 刪除舊的 INSERT 策略
DROP POLICY IF EXISTS "Users can register for events" ON registrations;

-- 創建新的 INSERT 策略 - 認證用戶可以為自己報名，管理員可以為任何人報名
CREATE POLICY "Users can register for events"
ON registrations
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id 
  OR EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);
