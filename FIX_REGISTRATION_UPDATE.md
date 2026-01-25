# 修复报名审核的 RLS 策略

## 问题
管理员在批准会员报名时出现"更新状态失败"错误。

## 原因
Supabase 的 Row Level Security (RLS) 策略可能没有正确配置，导致管理员无法更新报名状态。

## 解决方案

### 方法 1：在 Supabase Dashboard 执行 SQL（推荐）

1. 登录到你的 Supabase 项目
2. 进入 **SQL Editor**
3. 复制并执行以下 SQL：

```sql
-- Fix registrations UPDATE policy for admin
-- This ensures admins can update any registration status

-- Drop and recreate the UPDATE policy with proper admin check
DROP POLICY IF EXISTS "Users can update own registrations" ON registrations;
DROP POLICY IF EXISTS "Admin can update registrations" ON registrations;
DROP POLICY IF EXISTS "Admin can update any registration" ON registrations;

-- Policy for users to update their own registrations
CREATE POLICY "Users can update own registrations"
ON registrations
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Separate policy for admins to update any registration
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

4. 点击 **Run** 执行

### 方法 2：使用 Supabase CLI

如果你已经设置了 Supabase CLI：

```bash
cd /Users/alan_dingchaoliao/Documents/網站架設
supabase db push
```

### 验证

执行后，你可以在 Supabase Dashboard 中验证策略：

1. 进入 **Database** > **Policies**
2. 找到 `registrations` 表
3. 确认有以下两个 UPDATE 策略：
   - `Users can update own registrations`
   - `Admin can update any registration`

## 测试

修复后，尝试在管理后台批准一个待审核的报名，应该可以成功更新状态。
