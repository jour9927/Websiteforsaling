# ⚠️ 緊急修復：建立 Supabase Storage Bucket

## 問題：Bucket not found

你需要在 Supabase Dashboard 手動建立 Storage bucket。

## 🚀 立即修復步驟（5 分鐘）

### 步驟 1️⃣：前往 Supabase Dashboard

1. 開啟瀏覽器前往 [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. 登入你的帳號
3. 選擇你的專案

### 步驟 2️⃣：建立 Storage Bucket

1. 點擊左側選單的 **「Storage」**
2. 點擊右上角的 **「New bucket」** 按鈕
3. 填寫以下資訊：

   ```
   Bucket name: events
   Public bucket: ✅ 勾選這個（非常重要！）
   File size limit: 5242880 (5MB)
   Allowed MIME types: image/*
   ```

4. 點擊 **「Create bucket」**

### 步驟 3️⃣：設定 Bucket 政策（RLS）

建立 bucket 後，需要設定存取權限：

1. 在 Storage 頁面，點擊你剛建立的 `events` bucket
2. 點擊上方的 **「Policies」** 標籤
3. 點擊 **「New policy」**

#### 政策 1：允許所有人讀取圖片

```
Policy name: Public read access
Target roles: public
Policy command: SELECT
Policy definition: true
```

或使用 SQL：
```sql
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'events');
```

#### 政策 2：允許已登入用戶上傳

```
Policy name: Authenticated users can upload
Target roles: authenticated
Policy command: INSERT
WITH CHECK expression: bucket_id = 'events'
```

或使用 SQL：
```sql
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'events');
```

#### 政策 3：允許已登入用戶更新

```sql
CREATE POLICY "Authenticated users can update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'events');
```

#### 政策 4：允許已登入用戶刪除

```sql
CREATE POLICY "Authenticated users can delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'events');
```

### 步驟 4️⃣：完成！測試上傳

1. 回到你的網站 `http://localhost:3000/admin/events`
2. 登入管理員帳號
3. 嘗試新增活動並上傳圖片
4. 應該就可以成功上傳了！ 🎉

---

## 📋 快速檢查清單

完成後請確認：
- [ ] `events` bucket 已建立
- [ ] Bucket 設定為 **Public**（公開）
- [ ] File size limit 設定為 5MB 或更大
- [ ] 至少設定了「Public read」和「Authenticated upload」兩個政策
- [ ] 已用管理員帳號登入
- [ ] 測試上傳圖片成功

---

## 🔧 使用 SQL Editor 一鍵設定政策

如果你想用 SQL 快速設定，可以前往 Supabase Dashboard → **SQL Editor**，執行以下 SQL：

```sql
-- 建立所有必要的 Storage 政策
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'events');

CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'events');

CREATE POLICY "Authenticated users can update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'events');

CREATE POLICY "Authenticated users can delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'events');
```

**注意**：Bucket 本身必須先透過 UI 手動建立，SQL 只能設定政策！

---

## ❓ 如果還是失敗

請檢查：
1. Bucket 名稱是否正確（必須是 `events`，小寫）
2. 是否有勾選「Public bucket」
3. 是否已完成管理員登入
4. 重新整理頁面後再試一次

建立完成後告訴我，我們再測試！ 🚀
