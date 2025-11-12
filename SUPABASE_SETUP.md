# Supabase 設定指南

## 1. 建立資料庫 Schema

### 方法 A: 使用 Supabase Dashboard (推薦)
1. 登入 [Supabase Dashboard](https://supabase.com/dashboard)
2. 選擇你的專案
3. 左側選單點選 **SQL Editor**
4. 點選 **New query**
5. 複製 `supabase/migrations/001_initial_schema.sql` 的完整內容
6. 貼上並點選 **Run** 執行

### 方法 B: 使用 Supabase CLI
```bash
# 安裝 Supabase CLI (如果還沒安裝)
npm install -g supabase

# 登入
supabase login

# 連結專案
supabase link --project-ref your-project-ref

# 執行 migration
supabase db push
```

---

## 2. 設定 Email Authentication

1. 在 Supabase Dashboard 左側選單選擇 **Authentication** → **Providers**
2. 確認 **Email** provider 已啟用
3. 設定：
   - ✅ Enable Email provider
   - ✅ Confirm email（如果需要 email 驗證）
   - 或取消勾選以允許直接註冊（開發階段建議）

4. **Email Templates** 設定（可選）：
   - 自訂註冊確認信、重設密碼信等範本

---

## 3. 建立第一個管理員帳號

### 選項 A: 透過 SQL 手動設定
```sql
-- 1. 先在前台註冊一個帳號
-- 2. 然後在 SQL Editor 執行以下指令，將該帳號升級為管理員

UPDATE profiles
SET role = 'admin'
WHERE email = 'your-admin-email@example.com';
```

### 選項 B: 直接在 Authentication 建立
1. **Authentication** → **Users** → **Add user**
2. 填入 Email 和密碼
3. 建立後，使用上方 SQL 將 role 改為 admin

---

## 4. 環境變數設定

### 本地開發 (.env.local)
```bash
# 複製範本
cp .env.example .env.local

# 填入以下值（從 Supabase Dashboard → Settings → API 取得）
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Vercel 部署
1. 前往 Vercel 專案設定
2. **Settings** → **Environment Variables**
3. 新增上述三個變數（Production, Preview, Development 都勾選）
4. **Deployments** → 重新部署（Redeploy）

---

## 5. 測試資料庫連線

### 本地測試
```bash
# 啟動開發伺服器
npm run dev

# 測試註冊流程
# 1. 前往 http://localhost:3000/signup
# 2. 註冊新帳號
# 3. 查看 Supabase Dashboard → Authentication → Users 確認

# 測試登入
# 1. 前往 http://localhost:3000/login
# 2. 使用剛註冊的帳號登入
# 3. 嘗試訪問 http://localhost:3000/admin（應被導向登入頁）

# 升級為管理員後再測試
# 1. 執行上方 SQL 升級 role
# 2. 重新登入
# 3. 訪問 /admin 應該成功
```

---

## 6. 資料表說明

### profiles
- 使用者基本資料
- 自動在註冊時建立（透過 trigger）
- `role` 欄位控制權限：`user` 或 `admin`

### events
- 活動資料
- `status`: `draft`（草稿）、`published`（已發布）、`closed`（已關閉）
- 只有 admin 可建立/編輯

### registrations
- 報名記錄
- 每個使用者對每個活動只能報名一次（UNIQUE constraint）
- `status`: `pending`、`confirmed`、`cancelled`

### announcements
- 公告資料
- `published_at` 為 NULL 表示未發布（只有 admin 看得到）

### draw_results
- 抽獎結果
- 只有 admin 可執行抽獎

---

## 7. Row Level Security (RLS) 說明

所有資料表都啟用 RLS，主要規則：

**一般使用者**：
- ✅ 查看已發布的活動、公告
- ✅ 報名活動
- ✅ 查看/修改自己的報名記錄
- ❌ 無法建立/編輯活動
- ❌ 無法查看草稿或其他使用者的資料

**管理員** (`role = 'admin'`)：
- ✅ 查看所有資料（包含草稿）
- ✅ 建立/編輯/刪除活動
- ✅ 管理所有報名記錄
- ✅ 建立/編輯公告
- ✅ 執行抽獎

---

## 8. 實用 SQL 查詢

### 查看所有管理員
```sql
SELECT id, email, full_name, role, created_at
FROM profiles
WHERE role = 'admin';
```

### 查看活動報名統計
```sql
SELECT 
  e.title,
  e.max_participants,
  COUNT(r.id) as current_registrations,
  e.status
FROM events e
LEFT JOIN registrations r ON e.id = r.event_id AND r.status = 'confirmed'
GROUP BY e.id, e.title, e.max_participants, e.status
ORDER BY e.created_at DESC;
```

### 查看特定使用者的報名歷史
```sql
SELECT 
  e.title,
  r.status,
  r.registered_at
FROM registrations r
JOIN events e ON r.event_id = e.id
WHERE r.user_id = 'user-uuid-here'
ORDER BY r.registered_at DESC;
```

### 清空所有測試資料（小心使用！）
```sql
TRUNCATE draw_results, registrations, announcements, events CASCADE;
-- profiles 和 auth.users 手動在 Dashboard 刪除
```

---

## 9. Storage 設定（圖片上傳）

### 建立 Storage Bucket
1. **Storage** → **New bucket**
2. Bucket name: `event-images`
3. Public bucket: ✅（允許公開讀取）
4. **Policies** → New policy:

```sql
-- 允許所有人讀取
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'event-images' );

-- 只有管理員可上傳
CREATE POLICY "Admin can upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'event-images' AND
  auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
);
```

---

## 10. 下一步開發任務

- [ ] 實作 `/signup` 註冊頁面（參考 `/login`）
- [ ] 更新 API Routes 連接 Supabase 資料表
- [ ] 實作管理後台 CRUD 功能
- [ ] 新增圖片上傳功能
- [ ] 實作抽獎邏輯
- [ ] 新增 email 通知（Supabase Edge Functions）
- [ ] 完成前台活動列表與詳情頁

---

## 疑難排解

### 錯誤：「Failed to fetch」
- 檢查環境變數是否正確設定
- 確認 Supabase URL 格式正確
- 重新啟動開發伺服器 `npm run dev`

### 錯誤：「JWT expired」
- 登出後重新登入
- 清除瀏覽器 cookie

### 資料表權限錯誤
- 檢查 RLS policies 是否正確執行
- 確認使用者 role 正確設定
- 在 SQL Editor 測試查詢

### 無法訪問 /admin
- 確認已登入
- 確認該帳號 `role = 'admin'`
- 查看瀏覽器 console 錯誤訊息
