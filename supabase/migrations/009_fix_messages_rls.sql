-- 修复消息表的 RLS 政策，确保可以正常发送消息

-- 删除旧的 INSERT 政策
DROP POLICY IF EXISTS "Authenticated users can send messages" ON messages;

-- 创建新的 INSERT 政策 - 认证用户可以以自己的身份发送消息
CREATE POLICY "Authenticated users can send messages"
ON messages
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = sender_id);

-- 添加管理员可以查看所有消息的政策（可选）
DROP POLICY IF EXISTS "Admins can view all messages" ON messages;
CREATE POLICY "Admins can view all messages"
ON messages
FOR SELECT
TO authenticated
USING (
  auth.uid() = sender_id 
  OR auth.uid() = recipient_id
  OR EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- 删除旧的通用查看政策（因为我们现在有更好的管理员政策）
DROP POLICY IF EXISTS "Users can view their messages" ON messages;
