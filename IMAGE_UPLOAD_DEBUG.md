# 圖片上傳除錯指南

## 問題：上傳圖片都失敗（檔案小於 5MB）

### 📋 檢查清單

#### 1. **檢查 Supabase Storage Bucket 是否已建立**
前往 Supabase Dashboard → Storage，確認：
- [ ] `events` bucket 已建立
- [ ] Bucket 設定為 **Public**（公開）
- [ ] File size limit 設定為至少 5MB

#### 2. **檢查 Storage RLS 政策**
前往 Storage → Policies → `events` bucket，確認有以下政策：

```sql
-- 1. 允許所有人讀取
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'events');

-- 2. 允許已登入用戶上傳
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'events');

-- 3. 允許已登入用戶更新
CREATE POLICY "Authenticated users can update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'events');

-- 4. 允許已登入用戶刪除
CREATE POLICY "Authenticated users can delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'events');
```

#### 3. **檢查使用者是否已登入**
- [ ] 確認在上傳圖片前已完成管理員登入
- [ ] 開啟瀏覽器開發者工具 → Application → Cookies，檢查是否有 Supabase session

#### 4. **查看詳細錯誤訊息**

已在程式碼中加入詳細的 console.log，請執行以下步驟：

1. 開啟瀏覽器開發者工具（F12 或 Cmd+Option+I）
2. 切換到 **Console** 標籤
3. 嘗試上傳圖片
4. 查看以下訊息：
   - `上傳檔案資訊:` - 確認檔案資訊
   - `開始上傳到:` - 確認路徑
   - `上傳結果:` - 查看是否有錯誤
   - `上傳錯誤詳情:` - 如果失敗，看具體錯誤

#### 5. **常見錯誤訊息及解決方法**

| 錯誤訊息 | 可能原因 | 解決方法 |
|---------|---------|---------|
| `new row violates row-level security policy` | RLS 政策未設定或設定錯誤 | 檢查步驟 2 的 RLS 政策 |
| `Bucket not found` | Bucket 未建立 | 前往 Dashboard 建立 `events` bucket |
| `Not authenticated` | 用戶未登入 | 確認已完成登入 |
| `File size exceeds limit` | 檔案超過 bucket 限制 | 檢查 bucket 設定的 file size limit |
| `Invalid MIME type` | 檔案類型不允許 | 檢查 bucket 的 allowed MIME types 設定 |

### 🔧 快速修復步驟

如果上述檢查後仍然失敗，執行以下 SQL（在 Supabase SQL Editor）：

```sql
-- 1. 刪除現有的 events bucket 政策（如果有問題）
DROP POLICY IF EXISTS "Public read access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete" ON storage.objects;

-- 2. 重新建立政策
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

### 📝 測試步驟

1. 前往 `http://localhost:3000/admin/events`
2. 以管理員身分登入
3. 點擊「新增活動」
4. 選擇一張小於 5MB 的圖片
5. 開啟瀏覽器 Console 查看詳細日誌
6. 截圖錯誤訊息（如果有）

### 🆘 如果還是失敗

請提供以下資訊：
1. Console 中的完整錯誤訊息
2. Supabase Dashboard → Storage 的截圖
3. 是否已完成管理員登入
4. 嘗試上傳的圖片檔案大小和格式
