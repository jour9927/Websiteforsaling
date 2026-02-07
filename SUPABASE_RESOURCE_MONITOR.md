# Supabase 資源監控與過載預防

## 當前方案：Free Tier

| 資源 | 免費上限 | 警告閾值 | 危險閾值 |
|------|----------|----------|----------|
| 資料庫容量 | 500 MB | 400 MB | 475 MB |
| API 請求 | 500K/月 | 400K/月 | 475K/月 |
| Realtime 連線 | 200 同時 | 150 同時 | 180 同時 |
| Storage | 1 GB | 800 MB | 950 MB |
| 頻寬 | 2 GB/月 | 1.5 GB | 1.9 GB |

---

## 功能資源消耗分析

### 1. 即時留言系統 (`AuctionComments`)

| 操作 | 資源消耗 |
|------|----------|
| 開啟競標頁 | +1 Realtime 連線 |
| 發送留言 | +1 API 請求 + 少量資料庫寫入 |
| 即時接收 | Realtime 推送（不消耗 API 額度） |

**風險評估**：⚠️ 中風險
- 如果同時 200 人在競標頁，Realtime 達到上限
- 建議：確保 `supabase.removeChannel()` 在離開頁面時執行

---

### 2. 出價系統 (`BidHistoryWithSimulation`)

| 操作 | 資源消耗 |
|------|----------|
| 載入出價紀錄 | 1 API 請求 |
| 出價 | 1 RPC 請求 |

**風險評估**：✅ 低風險
- 模擬出價在 client-side 生成，不消耗資源
- 真實出價頻率低

---

### 3. 公告系統 (`Announcements`)

| 操作 | 資源消耗 |
|------|----------|
| 列表頁 | 1 API 請求 |
| 詳情頁 | 1 API 請求 |
| 管理編輯 | 2-3 API 請求 |

**風險評估**：✅ 低風險
- 讀取頻率低
- 可加入 `revalidate` 快取

---

### 4. 模擬活動系統 (`SimulatedActivity`)

| 操作 | 資源消耗 |
|------|----------|
| 模擬在線人數 | 0（純 client-side） |
| 模擬出價 Toast | 0（純 client-side） |
| 模擬留言 | 0（純 client-side） |

**風險評估**：✅ 無風險
- 所有模擬都在瀏覽器生成，不消耗 Supabase 資源

---

## 每日流量估算

假設每日 **500 活躍用戶**：

| 場景 | API 請求/日 | 月度累計 |
|------|-------------|----------|
| 頁面載入 | 500 × 5 = 2,500 | 75,000 |
| 登入認證 | 500 × 2 = 1,000 | 30,000 |
| 留言發送 | 100 × 1 = 100 | 3,000 |
| 出價操作 | 50 × 1 = 50 | 1,500 |
| **總計** | **~3,650/日** | **~110,000/月** |

**結論**：500K 額度充足，使用率約 22%

---

## 監控方法

### 1. Supabase Dashboard
https://supabase.com/dashboard/project/[PROJECT_ID]/reports

查看：
- Database Size
- API Requests
- Realtime Connections
- Storage Usage

### 2. 本地查詢資料庫大小
```sql
SELECT 
    pg_size_pretty(pg_database_size(current_database())) as db_size;
```

### 3. 查詢各表大小
```sql
SELECT 
    relname as table_name,
    pg_size_pretty(pg_total_relation_size(relid)) as total_size
FROM pg_catalog.pg_statio_user_tables
ORDER BY pg_total_relation_size(relid) DESC;
```

---

## 過載預防措施

### 已實施 ✅

| 措施 | 說明 |
|------|------|
| 模擬系統 client-side | SimulatedViewers、SimulatedBidToast 不走資料庫 |
| Realtime 清理 | 組件卸載時 `supabase.removeChannel()` |
| 留言限制 | 每則留言 100 字元上限 |
| 顯示限制 | 留言只顯示最新 25 則 |

### 建議追加 📋

| 措施 | 效果 | 優先級 |
|------|------|--------|
| 公告快取 | 減少重複讀取 | 中 |
| 出價紀錄分頁 | 減少單次查詢量 | 低 |
| 圖片壓縮 | 減少 Storage 使用 | 低 |
| Rate Limiting | 防止惡意請求 | 高（需後端） |

---

## 升級建議

當達到以下條件時，建議升級到 **Pro 方案**（$25/月）：

- [ ] 同時在線用戶經常超過 150 人
- [ ] 月度 API 請求超過 400K
- [ ] 資料庫超過 400 MB
- [ ] 需要更長的日誌保留期

### Pro 方案優勢
- 8 GB 資料庫
- 無限 API 請求（合理使用）
- 500 Realtime 連線
- 100 GB Storage
- 250 GB 頻寬

---

## 文件資訊

- **建立日期**: 2026-02-08
- **專案**: Event Glass
- **Supabase Project ID**: `fcusmxoozjddhqecvcji`
