# 报名记录问题修复总结

## 问题
用户点击参与活动后，在参与纪录页面找不到记录

## 根本原因

### 1. ✅ 字段名不匹配（已修复）
- **问题**：`registrations` 表使用的是 `registered_at` 字段
- **错误**：`history/page.tsx` 查询使用的是 `created_at` 字段
- **影响**：查询失败，无法显示任何报名记录
- **修复**：已将所有 `created_at` 改为 `registered_at`

### 2. ⚠️ RLS 策略未执行（需要手动执行）
- **问题**：`010_fix_registrations_rls.sql` 可能还没在 Supabase 执行
- **影响**：可能导致报名插入失败
- **解决方案**：见下方"立即执行"部分

## 已修复的代码

### app/history/page.tsx
```typescript
// 修改前
type RegistrationData = {
  id: string;
  status: string;
  created_at: string;  // ❌ 错误字段名
  event: Event | Event[] | null;
};

const { data: registrations } = await supabase
  .from('registrations')
  .select(`
    id,
    status,
    created_at,  // ❌ 错误字段名
    ...
  `)
  .order('created_at', { ascending: false });  // ❌ 错误字段名

// 修改后
type RegistrationData = {
  id: string;
  status: string;
  registered_at: string;  // ✅ 正确字段名
  event: Event | Event[] | null;
};

const { data: registrations, error } = await supabase
  .from('registrations')
  .select(`
    id,
    status,
    registered_at,  // ✅ 正确字段名
    ...
  `)
  .order('registered_at', { ascending: false });  // ✅ 正确字段名
```

## 立即执行：修复 RLS 策略

### 步骤 1：登入 Supabase
1. 访问 https://supabase.com/dashboard
2. 选择你的项目

### 步骤 2：执行 SQL
1. 左侧菜单选择 **SQL Editor**
2. 点击 **New query**
3. 复制粘贴以下 SQL：

```sql
-- 修复 registrations 表的 RLS 策略

-- 1. 确认启用 RLS
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;

-- 2. 创建 INSERT 策略（允许用户报名）
DROP POLICY IF EXISTS "Users can register for events" ON registrations;
CREATE POLICY "Users can register for events"
ON registrations
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 3. 创建 SELECT 策略（用户可以查看自己的报名）
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

-- 4. 创建 UPDATE 策略
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

-- 5. 创建 DELETE 策略
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

4. 点击 **Run** 执行
5. 看到 "Success. No rows returned" 提示即为成功

### 步骤 3：验证修复
1. 刷新网站（Cmd+Shift+R 硬刷新）
2. 等待 2-3 分钟让 Vercel 部署完成（提交 `627ae00`）
3. 登入会员账号
4. 前往活动页面，点击"立即报名"
5. 前往"參與紀錄"页面，应该能看到刚才的报名记录

## 测试清单

- [ ] 用户可以成功报名活动
- [ ] 报名后在"參與紀錄"页面能看到记录
- [ ] 管理员可以在后台看到所有报名记录
- [ ] 浏览器控制台没有错误信息

## 调试工具

### 查看浏览器控制台日志
1. 按 F12 或 Cmd+Option+I 打开开发者工具
2. 切换到 Console 标签
3. 报名时会看到以下日志：
   ```
   開始報名流程，當前用戶: xxx
   檢查已報名: {...}
   活動名額: {...}
   準備插入報名記錄: {...}
   插入結果: {...}
   報名成功！重新整理頁面...
   ```

### 查看参与纪录页面日志
1. 前往 `/history` 页面
2. 在控制台查看：
   ```
   History page - User ID: xxx
   History page - Registrations: [...]
   History page - Error: null
   ```

### 在 Supabase 中查询
```sql
-- 查看所有报名记录
SELECT 
    r.id,
    r.status,
    r.registered_at,
    e.title as event_title,
    p.email as user_email
FROM registrations r
LEFT JOIN events e ON e.id = r.event_id
LEFT JOIN profiles p ON p.id = r.user_id
ORDER BY r.registered_at DESC
LIMIT 20;

-- 查看特定用户的报名记录
SELECT * FROM registrations 
WHERE user_id = 'YOUR_USER_ID_HERE'
ORDER BY registered_at DESC;
```

## 部署状态
- ✅ 代码已提交：`627ae00`
- ✅ 已推送到 GitHub
- ⏳ Vercel 正在部署（预计 2-3 分钟）
- ⏳ 需要手动执行 RLS 策略 SQL

## 相关文件
- `app/history/page.tsx` - 参与纪录页面（已修复）
- `app/events/[id]/RegisterButton.tsx` - 报名按钮（已有详细日志）
- `supabase/migrations/010_fix_registrations_rls.sql` - RLS 策略修复
- `REGISTRATION_DEBUG.md` - 详细调试指南
