# 报名功能问题诊断

## 问题描述
用户点击参与活动后，在参与纪录里找不到记录

## 可能原因

### 1. RLS 策略未执行 ❌
**最可能的原因**：`010_fix_registrations_rls.sql` 还没有在 Supabase 中执行

### 2. 浏览器控制台错误
需要查看浏览器控制台是否有报名相关错误

## 诊断步骤

### 步骤 1：检查 RLS 策略
去 Supabase Dashboard → SQL Editor，执行以下查询：

```sql
-- 查看 registrations 表的所有 RLS 策略
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'registrations';
```

### 步骤 2：执行 RLS 修复
如果策略不正确或缺失，请在 Supabase Dashboard → SQL Editor 执行：

```sql
-- 来自 supabase/migrations/010_fix_registrations_rls.sql

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
```

### 步骤 3：检查浏览器控制台
1. 打开 Chrome DevTools (F12 或 Cmd+Option+I)
2. 切换到 Console 标签
3. 点击"参与"按钮
4. 查看是否有错误信息，特别是：
   - `報名插入錯誤`
   - `new row violates row-level security policy`
   - 任何红色错误信息

### 步骤 4：手动测试插入
在 Supabase Dashboard → SQL Editor 执行：

```sql
-- 测试插入一笔报名记录（替换为真实的 event_id 和 user_id）
INSERT INTO registrations (event_id, user_id, status)
VALUES (
  '你的活动ID',  -- 从 events 表获取
  '你的用户ID',  -- 从 auth.users 或 profiles 表获取
  'pending'
);

-- 如果失败，错误信息会告诉我们问题所在
```

### 步骤 5：验证数据
```sql
-- 查看所有报名记录
SELECT 
    r.id,
    r.event_id,
    r.user_id,
    r.status,
    r.registered_at,
    e.title as event_title,
    p.email as user_email
FROM registrations r
LEFT JOIN events e ON e.id = r.event_id
LEFT JOIN profiles p ON p.id = r.user_id
ORDER BY r.registered_at DESC
LIMIT 10;
```

## 快速修复

**如果确认是 RLS 问题，立即执行以下步骤：**

1. 登入 Supabase Dashboard: https://supabase.com/dashboard
2. 选择你的项目
3. 左侧菜单选择 SQL Editor
4. 点击 "New query"
5. 复制粘贴上面"步骤 2"中的完整 SQL
6. 点击 "Run" 执行
7. 看到 "Success" 提示后，刷新网站重试

## 调试信息收集

请提供以下信息：

1. **浏览器控制台日志**（点击参与后的完整输出）
   - 开始報名流程
   - 檢查已報名
   - 活動名額
   - 準備插入報名記錄
   - 插入結果

2. **RLS 策略检查结果**（执行步骤 1 的 SQL 查询结果）

3. **报名记录数量**
```sql
SELECT COUNT(*) FROM registrations;
```

4. **用户 ID 和活动 ID**
   - 当前登入用户 ID
   - 尝试报名的活动 ID
