-- 检查和修复报名功能的 RLS 策略

-- 1. 确认 registrations 表已启用 RLS
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;

-- 2. 删除旧的 INSERT 策略并重新创建
DROP POLICY IF EXISTS "Users can register for events" ON registrations;

-- 3. 创建新的 INSERT 策略 - 认证用户可以报名
CREATE POLICY "Users can register for events"
ON registrations
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 4. 确保 SELECT 策略正确
DROP POLICY IF EXISTS "Users can view own registrations" ON registrations;
CREATE POLICY "Users can view own registrations"
ON registrations
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id 
  OR EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- 5. 确保 UPDATE 策略正确
DROP POLICY IF EXISTS "Users can update own registrations" ON registrations;
CREATE POLICY "Users can update own registrations"
ON registrations
FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id 
  OR EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
)
WITH CHECK (
  auth.uid() = user_id 
  OR EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- 6. 确保 DELETE 策略正确
DROP POLICY IF EXISTS "Users can cancel own registrations" ON registrations;
CREATE POLICY "Users can cancel own registrations"
ON registrations
FOR DELETE
TO authenticated
USING (
  auth.uid() = user_id 
  OR EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- 7. 查看当前的所有策略（用于确认）
-- SELECT * FROM pg_policies WHERE tablename = 'registrations';
