# 报名审核失败问题诊断与修复

## 🔍 诊断步骤

### 第 1 步：检查环境变量

访问以下 URL（需要以管理员身份登录）：

```
https://你的域名/api/admin/check-env
```

**预期结果：**
```json
{
  "status": "ok",
  "environment": {
    "NEXT_PUBLIC_SUPABASE_URL": true,
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": true,
    "SUPABASE_SERVICE_ROLE_KEY": true,  // ← 这个必须是 true
    "NODE_ENV": "production"
  },
  "message": "✅ Service role key is configured"
}
```

**如果 `SUPABASE_SERVICE_ROLE_KEY` 是 `false`，继续下一步。**

---

## 🔧 修复步骤

### 方法 1：添加 Service Role Key（推荐）

这个方法可以让管理员操作绕过 RLS 限制，最可靠。

#### 1.1 获取 Service Role Key

1. 登录 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择你的项目
3. 进入 **Settings** > **API**
4. 找到 **Project API keys** 部分
5. 复制 **service_role** 密钥（⚠️ 保密！）

#### 1.2 添加到 Vercel

1. 登录 [Vercel Dashboard](https://vercel.com)
2. 选择 `eventglass` 项目
3. 进入 **Settings** > **Environment Variables**
4. 点击 **Add New**
5. 填写：
   ```
   Name: SUPABASE_SERVICE_ROLE_KEY
   Value: [粘贴你的 service_role key]
   ```
6. 勾选 **Production**, **Preview**, **Development**
7. 点击 **Save**

#### 1.3 重新部署

```bash
cd /Users/alan_dingchaoliao/Documents/網站架設
vercel --prod
```

或在 Vercel Dashboard 中点击 **Redeploy**。

#### 1.4 验证

重新访问 `/api/admin/check-env`，确认 `SUPABASE_SERVICE_ROLE_KEY: true`。

然后尝试批准报名，应该就能成功了！✅

---

### 方法 2：修复 RLS 策略（备选）

如果你不想使用 service role key，可以修复 Supabase 的 RLS 策略。

#### 2.1 在 Supabase SQL Editor 执行

登录 Supabase Dashboard，进入 **SQL Editor**，执行：

```sql
-- 删除旧策略
DROP POLICY IF EXISTS "Users can update own registrations" ON registrations;
DROP POLICY IF EXISTS "Admin can update registrations" ON registrations;
DROP POLICY IF EXISTS "Admin can update any registration" ON registrations;

-- 用户更新自己的报名
CREATE POLICY "Users can update own registrations"
ON registrations
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 管理员更新任何报名（关键！）
CREATE POLICY "Admin can update any registration"
ON registrations
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);
```

#### 2.2 验证策略

在 Supabase Dashboard 中：

1. 进入 **Database** > **Policies**
2. 找到 `registrations` 表
3. 确认有两个 UPDATE 策略：
   - `Users can update own registrations`
   - `Admin can update any registration`

---

## 🧪 测试

修复后，进入管理后台：

1. 进入 **报名管理**
2. 找到一个 **待確認** 的报名
3. 点击 **批准報名**
4. 应该显示成功消息并刷新状态

---

## ❗ 常见错误信息

### "更新狀態失敗"
- 原因：Service role key 未设置，或 RLS 策略配置错误
- 解决：按照上面的方法 1 或方法 2 修复

### "SUPABASE_SERVICE_ROLE_KEY is not set"
- 原因：环境变量未在 Vercel 中配置
- 解决：按照方法 1 添加环境变量

### "new row violates row-level security policy"
- 原因：RLS 策略不允许该操作
- 解决：使用方法 1（service role key）或方法 2（修复 RLS 策略）

---

## 📊 架构说明

### 认证流程

```
用户请求批准报名
    ↓
检查用户是否登录（使用 Anon Key）
    ↓
检查用户是否为管理员
    ↓
使用 Service Role Key 更新数据库 ✅ （绕过 RLS）
    ↓
返回成功结果
```

### 为什么需要 Service Role Key？

- **Anon Key**: 受 RLS 策略限制，即使是管理员也可能被阻止
- **Service Role Key**: 完全访问权限，绕过所有 RLS 策略

### 安全性

✅ **已实施的安全措施：**
- Service role key 只在服务器端使用
- 每个请求都验证用户身份和管理员角色
- Key 存储在环境变量中，不会提交到 Git

---

## 📞 需要帮助？

如果按照上述步骤仍然无法解决，请检查：

1. Vercel 部署日志中的错误信息
2. 浏览器开发者工具的 Network 标签
3. Supabase Dashboard 的 Logs

部署地址：https://eventglass-gnb6g7zp1-jour9927s-projects.vercel.app
