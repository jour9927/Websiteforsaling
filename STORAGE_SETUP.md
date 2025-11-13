# Supabase Storage 設定指南

## 建立 Storage Buckets

在使用圖片上傳功能前，需要在 Supabase Dashboard 建立 Storage buckets。

### 步驟：

1. 前往 [Supabase Dashboard](https://supabase.com/dashboard)
2. 選擇你的專案
3. 點選左側選單的 **Storage**
4. 點選 **New bucket**

### 建立以下 buckets：

#### 1. **events** (活動封面圖)
- Bucket name: `events`
- Public bucket: ✅ 勾選（讓圖片可以公開存取）
- File size limit: 5MB
- Allowed MIME types: `image/*`

#### 2. **announcements** (公告圖片) - 可選
- Bucket name: `announcements`
- Public bucket: ✅ 勾選
- File size limit: 5MB
- Allowed MIME types: `image/*`

---

## 設定 Storage RLS 政策

為了安全性，需要設定 Row Level Security 政策。

### 對於 `events` bucket：

前往 **Storage** → **Policies** → 點選 `events` bucket

#### 1. 允許所有人讀取圖片
```sql
-- Policy name: Public read access
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'events');
```

#### 2. 允許已登入用戶上傳
```sql
-- Policy name: Authenticated users can upload
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'events');
```

#### 3. 允許管理員刪除
```sql
-- Policy name: Admins can delete
CREATE POLICY "Admins can delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'events' 
  AND auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'admin'
  )
);
```

---

## 快速設定（使用 SQL Editor）

你也可以在 **SQL Editor** 執行以下 SQL 一次性建立 buckets 和政策：

```sql
-- 建立 events bucket (如果不存在)
INSERT INTO storage.buckets (id, name, public)
VALUES ('events', 'events', true)
ON CONFLICT (id) DO NOTHING;

-- Public read policy
CREATE POLICY "Public read events"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'events');

-- Authenticated upload policy
CREATE POLICY "Authenticated upload events"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'events');

-- Admin delete policy
CREATE POLICY "Admin delete events"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'events' 
  AND auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'admin'
  )
);
```

---

## 驗證設定

### 測試上傳功能：

1. 前往管理後台 `/admin/events`
2. 建立新活動時，上傳一張圖片
3. 圖片應該：
   - 上傳成功（顯示「圖片上傳成功！」訊息）
   - 在表單中顯示預覽
   - 儲存後在活動列表顯示封面圖

### 檢查 Storage：

在 Supabase Dashboard → Storage → events，你應該能看到上傳的圖片檔案。

---

## 圖片規格

### 限制：
- **最大檔案大小**: 5MB
- **支援格式**: JPEG, PNG, GIF, WebP, SVG
- **建議尺寸**: 1200x630px (16:9 比例)
- **檔名**: 自動生成唯一檔名（避免衝突）

### 儲存路徑：
- 活動圖片: `events/event-images/{random-id}-{timestamp}.{ext}`
- 公告圖片: `announcements/announcement-images/{random-id}-{timestamp}.{ext}`

---

## 故障排除

### 問題：「上傳失敗」錯誤

**可能原因**：
1. Storage bucket 尚未建立
2. RLS 政策未設定
3. 檔案超過 5MB

**解決方法**：
1. 確認 `events` bucket 存在且為 public
2. 確認已設定 upload policy
3. 壓縮圖片或選擇較小的檔案

### 問題：圖片無法顯示

**可能原因**：
- Bucket 未設為 public
- RLS read policy 未設定

**解決方法**：
- 確認 bucket 的 `public` 選項已勾選
- 確認 "Public read access" policy 已建立

---

## 進階設定（可選）

### 圖片自動壓縮

可以使用 Supabase Edge Functions 或第三方服務（如 Cloudinary）來自動壓縮上傳的圖片。

### CDN 加速

Supabase Storage 已自帶 CDN，圖片會自動快取。如需更快速度，可考慮使用 Cloudflare 或 Fastly。

---

完成這些步驟後，圖片上傳功能就能正常運作了！🎉
