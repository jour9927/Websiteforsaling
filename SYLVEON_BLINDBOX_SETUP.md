# 仙子伊布盲盒活動設置指南

## 📋 概述

本指南將幫助您設置仙子伊布盲盒活動：
- **活動名稱**：仙子伊布配布盲盒
- **價格**：NT$ 5,990
- **內容物**：2 隻寶可夢（1 隻伊布 + 1 隻仙子伊布 75,000~400,000 點數隨機）
- **總數**：50 盒
- **線下報名**：48 個名額
- **啟動日期**：2026-03-12 10:00

## 🚀 設置步驟

### Step 1: 執行資料庫 Migration

1. 前往 Supabase SQL Editor：
   ```
   https://supabase.com/dashboard/project/_/sql
   ```

2. 建立新查詢（New query）

3. 複製並執行以下檔案的內容：
   ```
   supabase/migrations/038_blind_box_system.sql
   ```

   或者執行此指令顯示 SQL：
   ```bash
   node --env-file=.env.local scripts/run-blindbox-migration.js
   ```

4. 點擊 "Run" 執行 SQL

### Step 2: 插入盲盒獎勵資料

執行設置腳本：

```bash
node --env-file=.env.local scripts/setup-sylveon-blindbox.js
```

這個腳本會：
- ✅ 找到「仙子伊布配布盲盒」活動
- ✅ 插入 50 個伊布獎勵（固定 0 點）
- ✅ 插入 50 個仙子伊布獎勵（75,000~400,000 點數隨機）
- ✅ 驗證資料正確性

### Step 3: 驗證設置

執行驗證指令（可選）：

```bash
node --env-file=.env.local scripts/verify-sylveon-blindbox.js
```

## 📦 盲盒系統架構

### 資料表

**blind_box_rewards**
- 儲存盲盒獎池內容
- 每個活動可設定多種獎勵
- 追蹤剩餘數量
- 支援固定點數或隨機點數範圍（min_points ~ max_points）

**user_items**
- 記錄使用者獲得的物品
- 包含來源活動資訊

**draw_results**
- 記錄抽獎歷史
- 防止重複抽取

### RPC 函數

**draw_blind_box(event_id, user_id, seed)**
- 檢查使用者是否已報名
- 檢查使用者是否已抽過
- 若設定點數範圍（min_points, max_points），則在範圍內隨機生成點數
- 若無範圍設定，使用固定點數
- 隨機抽取獎勵（基於剩餘數量）
- 更新剩餘數量
- 記錄到 user_items 和 draw_results
- 返回抽中的獎勵列表

## 🎯 使用方式

### 管理員建立盲盒活動

1. 登入管理後台：`/admin/events`

2. 建立新活動，填寫：
   - 標題、描述、日期
   - max_participants（總數）
   - offline_registrations（線下報名數）
   - price（價格）
   - is_free（否）

3. 創建後，使用腳本或資料庫手動插入 blind_box_rewards

### 使用者抽取盲盒

前端呼叫 API：
```typescript
const response = await fetch(`/api/events/${eventId}/draw`, {
  method: 'POST'
});

const { draw } = await response.json();
// draw.drawn_rewards: 抽中的獎勵列表 (JSONB array)
// draw.message: 結果訊息
```

### 查詢使用者獲得的物品

```sql
SELECT * FROM user_items
WHERE user_id = 'xxx'
  AND event_id = 'yyy';
```

## 🔧 管理操作

### 查詢盲盒剩餘數量

```sql
SELECT 
  pokemon_name,
  quantity,
  remaining,
  quantity - remaining as drawn
FROM blind_box_rewards
WHERE event_id = 'xxx';
```

### 重置盲盒數量（測試用）

```sql
UPDATE blind_box_rewards
SET remaining = quantity
WHERE event_id = 'xxx';
```

### 清除抽獎記錄（測試用）

```sql
-- 清除抽獎記錄
DELETE FROM draw_results WHERE event_id = 'xxx';

-- 清除獲得物品
DELETE FROM user_items WHERE event_id = 'xxx';
```

## 📊 監控

### 查詢活動統計

```sql
SELECT 
  e.title,
  e.max_participants,
  COUNT(DISTINCT r.user_id) as registered_count,
  COUNT(DISTINCT dr.user_id) as drawn_count,
  e.max_participants - COUNT(DISTINCT dr.user_id) as remaining_boxes
FROM events e
LEFT JOIN registrations r ON r.event_id = e.id
LEFT JOIN draw_results dr ON dr.event_id = e.id
WHERE e.id = 'xxx'
GROUP BY e.id;
```

## 🎉 完成！

設置完成後，活動將在 2026-03-12 10:00 開始，~400,000 點數的仙子伊布（隨機）
1. 在活動頁面完成付款報名（$5,990）
2. 報名成功後可以抽取盲盒
3. 獲得 2 隻寶可夢：1 隻伊布 + 1 隻 75,000 點數的仙子伊布
4. 在個人背包查看獲得的物品

---

**需要協助？**
- 檢查 Supabase logs 查看錯誤
- 驗證環境變數是否正確設置
- 確認資料庫 RLS 政策正常運作
