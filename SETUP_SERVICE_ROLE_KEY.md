# 设置 Supabase Service Role Key

## 重要提醒 ⚠️

为了让管理员能够成功批准会员报名，你需要在 Vercel 中添加一个环境变量。

## 步骤

### 1. 获取 Service Role Key

1. 登录到你的 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择你的项目
3. 进入 **Settings** > **API**
4. 找到 **Project API keys** 部分
5. 复制 **service_role** key（⚠️ 这个 key 很重要，不要泄露！）

### 2. 在 Vercel 中添加环境变量

1. 登录到 [Vercel Dashboard](https://vercel.com)
2. 选择你的项目 `eventglass`
3. 进入 **Settings** > **Environment Variables**
4. 点击 **Add New**
5. 填写：
   - **Name**: `SUPABASE_SERVICE_ROLE_KEY`
   - **Value**: 粘贴你刚才复制的 service_role key
   - **Environment**: 选择 **Production**, **Preview**, 和 **Development**
6. 点击 **Save**

### 3. 重新部署

添加环境变量后，需要重新部署：

```bash
cd /Users/alan_dingchaoliao/Documents/網站架設
vercel --prod
```

或者在 Vercel Dashboard 中点击 **Deployments** > 最新的部署 > **Redeploy**

## 验证

部署完成后，尝试在管理后台批准一个待审核的报名，应该可以成功更新状态了。

## 为什么需要这个？

- **Anon Key**: 普通的 Supabase key，受到 Row Level Security (RLS) 策略限制
- **Service Role Key**: 管理员级别的 key，可以绕过 RLS 策略，用于管理员操作

之前的代码使用 Anon Key，即使检查了用户是管理员，仍然受到 RLS 限制。现在使用 Service Role Key 后，管理员可以更新任何报名状态。

## 安全性

⚠️ **Service Role Key 非常敏感！**

- ✅ 只在服务器端 API 路由中使用
- ✅ 已经添加了管理员身份验证检查
- ❌ 不要在客户端代码中使用
- ❌ 不要提交到 Git 仓库（已在代码中使用环境变量）
