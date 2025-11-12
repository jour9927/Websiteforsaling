# 資料庫遷移指南

## 新增欄位: 主辦類別、地點、參與資格

### 步驟 1: 執行資料庫遷移

1. 前往 [Supabase Dashboard](https://supabase.com/dashboard)
2. 選擇你的專案
3. 點選左側選單的 **SQL Editor**
4. 複製 `supabase/migrations/002_add_event_fields.sql` 的內容
5. 貼上並執行 SQL

或者直接在 SQL Editor 中執行以下 SQL:

```sql
-- Add new columns to events table
ALTER TABLE events 
  ADD COLUMN organizer_category TEXT DEFAULT 'admin' CHECK (organizer_category IN ('admin', 'vip')),
  ADD COLUMN eligibility_requirements TEXT,
  ADD COLUMN location TEXT;

-- Create function to get registration count
CREATE OR REPLACE FUNCTION get_registration_count(event_id UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER
  FROM registrations
  WHERE registrations.event_id = $1;
$$ LANGUAGE SQL STABLE;
```

### 步驟 2: 驗證遷移

在 SQL Editor 執行:

```sql
-- 檢查新欄位是否存在
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'events' 
  AND column_name IN ('organizer_category', 'eligibility_requirements', 'location');

-- 檢查函數是否建立成功
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name = 'get_registration_count';
```

### 步驟 3: 測試新功能

1. 前往管理後台: `/admin/events`
2. 建立新活動時會看到:
   - **主辦類別** 下拉選單 (管理員/大佬)
   - **活動地點** 輸入框
   - **參與資格** 文字區域
3. 活動清單會顯示:
   - 主辦類別標籤 (藍色=管理員, 黃色=大佬)
   - 活動地點
   - 已報名人數 / 名額上限

### 新增的欄位說明

| 欄位 | 類型 | 說明 | 必填 |
|-----|------|------|------|
| `organizer_category` | TEXT | 主辦類別 ('admin' 或 'vip') | 是 (預設: 'admin') |
| `eligibility_requirements` | TEXT | 參與資格說明 | 否 |
| `location` | TEXT | 活動地點 | 否 |

### 報名人數功能

- 後台活動清單現在會即時顯示每個活動的報名人數
- 當報名人數達到上限時，數字會以紅色顯示
- 使用 `registrations` 表格的 COUNT 查詢計算

---

## 完成後

部署到 Vercel:
```bash
git add .
git commit -m "Add organizer category, location, eligibility fields to events"
git push origin master
```

Vercel 會自動重新部署。✅
