# Migration 004: 新增線下報名人數功能

## 說明

本次 migration 新增了線下報名人數的管理功能，讓管理員可以手動記錄線下報名的參與者。

## 變更內容

### 1. 新增欄位
在 `events` 表新增 `offline_registrations` 欄位：
- 類型：INTEGER
- 預設值：0
- 說明：記錄線下報名人數

### 2. 新增函式

#### `get_total_registration_count(event_id UUID)`
計算總報名人數（線上 + 線下）
- 回傳值：INTEGER
- 說明：將線上報名（registrations 表）和線下報名（offline_registrations 欄位）加總

#### `get_available_slots(event_id UUID)`
計算剩餘可報名名額
- 回傳值：INTEGER 或 NULL（無限制時）
- 說明：max_participants - 總報名人數

## 執行步驟

### 在 Supabase Dashboard：

1. 前往 **SQL Editor**
2. 複製 `supabase/migrations/004_offline_registrations.sql` 的內容
3. 執行 SQL
4. 確認執行成功

### 或使用 Supabase CLI：

```bash
supabase migration up
```

## 使用範例

### 查詢活動的總報名人數：
```sql
SELECT get_total_registration_count('活動ID');
```

### 查詢活動的剩餘名額：
```sql
SELECT get_available_slots('活動ID');
```

### 更新線下報名人數：
```sql
UPDATE events 
SET offline_registrations = 10 
WHERE id = '活動ID';
```

## 前端變更

- ✅ 管理員編輯活動頁面新增「線下報名人數」輸入欄位
- ✅ 新增活動表單新增「線下報名人數」輸入欄位
- ✅ 儲存時會將線下報名人數寫入資料庫

## 注意事項

1. 線下報名人數會計入總報名人數，影響剩餘名額計算
2. 管理員可隨時調整線下報名人數
3. 線下報名人數不會影響 `registrations` 表的資料
