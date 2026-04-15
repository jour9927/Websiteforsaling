# Changelog

## [2026-04-15]

### Added
- 管理員訊息支援「自訂發送時間」
  - 管理員可在發送會員訊息時手動指定時間（例如將 4/16 補發訊息顯示為 4/11）
  - 儲存時會把指定時間寫入 `messages.created_at`，收件者與管理後台看到的訊息時間會一致
  - 未填則維持原本系統當下發送時間

### Changed
- `app/admin/messages/page.tsx`
  - 發送表單新增 `datetime-local` 的自訂發送時間欄位（選填）
  - 發送邏輯改為支援可選的 `created_at` 寫入，並加入時間格式驗證
  - 發送成功後會清空自訂時間欄位

## [2026-04-02]

### Added — 場外委託區（Commission System）
- **完整委託系統**：任何用戶可刊登/接下委託任務，支援抽成協商與押底保護
  - 每日平台上限 5 單，超額自動排隊
  - 抽成上限：poster_fee + executor_fee ≤ base_price × 4/5
  - 首次委託者需押底 ≥ 底價 2/3 的寶可夢，完成 10 天後自動歸還

- **Database Schema**：`supabase/migrations/050_commission_system.sql`
  - 3 張新表：`commissions`、`commission_deposits`、`commission_messages`
  - RLS 策略：公開讀取、authenticated insert、poster/executor update
  - Helper functions：`get_today_active_commission_count()`、`get_next_queue_position()`

- **API Routes（8 個）**：
  - `app/api/commissions/route.ts` — GET 列表 + POST 建立
  - `app/api/commissions/[id]/route.ts` — GET 單筆詳情
  - `app/api/commissions/[id]/accept/route.ts` — 接單
  - `app/api/commissions/[id]/executor-fee/route.ts` — 抽成協商
  - `app/api/admin/commissions/[id]/review/route.ts` — 管理審核（approve/reject + 排隊）
  - `app/api/admin/commissions/[id]/proof-review/route.ts` — 合法性證明審核

- **前端頁面（5 個）**：
  - `app/commissions/page.tsx` — 委託列表（按狀態分組）
  - `app/commissions/create/page.tsx` — 刊登委託（含配布圖鑑搜尋 + 圖片上傳）
  - `app/commissions/[id]/page.tsx` + `CommissionDetailClient.tsx` — 委託詳情 + 互動
  - `app/admin/commissions/page.tsx` — 管理後台（審核 + 排隊管理）
  - `components/CommissionList.tsx` — 委託卡片元件

- **Cron Jobs（2 個）**：
  - `app/api/cron/virtual-commissions/route.ts` — 每日虛擬用戶自動發佈 3-4 則 + 接單 1-2 + 完成 0-1
  - `app/api/cron/commission-maintenance/route.ts` — 每日押底歸還 + 排隊啟用

- **其他**：
  - `lib/commissionFallbackPool.ts` — 虛擬用戶文案池（30+ 條發佈 + 20+ 條接單）
  - `components/SiteHeader.tsx` — 新增「委託」導航連結
  - `components/admin/AdminSidebar.tsx` — 新增「委託管理」管理項目
  - `vercel.json` — 新增 2 個 cron schedule

### Changed — 委託系統增強與修復
- **雙計價支援**：委託底價支援「點數」與「台幣」，新增 `price_type` 欄位
  - `app/commissions/create/page.tsx` — 新增價格類型切換按鈕（🎯 點數 / 💵 台幣）
  - `components/CommissionList.tsx` — 價格顯示加上單位（pts / NT$）
  - `app/commissions/[id]/CommissionDetailClient.tsx` — `priceLabel()` helper
  - `app/api/cron/virtual-commissions/route.ts` — 虛擬委託隨機選擇計價方式

- **雲端連結證明**：合法性證明除圖片上傳外，亦可提供雲端連結（Google Drive、Imgur 等）
  - `app/commissions/create/page.tsx` — 新增 URL 輸入欄位，合併至 `proof_images` 陣列
  - `app/commissions/[id]/CommissionDetailClient.tsx` — 按副檔名區分圖片 vs 連結顯示

- **委託說明簡化**：「委託說明」改為「備註（選填）」，降低刊登門檻

- **虛擬用戶隱藏**：前端與 API 完全隱藏虛擬用戶身份，不可被辨識
  - 5 個檔案新增 sanitization 層，移除 `poster_type`、`poster_virtual` 等敏感欄位
  - 統一輸出 `poster: { id, display_name }` 格式

- **列表分區調整**：從 4 區改為 3 區：「刊登中」「委託進行中」「委託已完成」

### Fixed
- **委託列表空白問題**：`profiles` 表使用 `full_name` 而非 `display_name`，導致 Supabase PostgREST join 靜默失敗
  - 修正 5 個檔案的 profiles 查詢欄位，sanitize 層統一正規化為 `display_name`
  - 涉及：`app/commissions/page.tsx`、`app/commissions/[id]/page.tsx`、`app/api/commissions/route.ts`、`app/api/commissions/[id]/route.ts`、`app/admin/commissions/page.tsx`

### Database Migration（已執行）
- `supabase/migrations/050_commission_rebuild.sql` — 重建委託表（含 `price_type` 欄位）
- Storage bucket `commission-proofs` 已建立

### Technical Details
- Build 驗證：`npm run build` ✅ 通過
- Vercel 部署：commit `4802539` ✅ 成功
- 線上驗證：`/commissions` 正確顯示 3 筆刊登中 + 1 筆已完成
- Git：worktree → master，主資料夾已同步

---

## [2026-03-31]

### Published
- **公告發布**：發布 30 週年守護戰活動截止與獎勵政策公告
  - 內容：活動已於 2026/3/27 23:59:59 截止，獎勵評審延誤說明
  - 發布方式：Supabase 公告系統（service role key REST API）

### Changed
- **30 週年活動關閉**：通過程式碼註解禁用所有前端入口（保留代碼便於恢復）
  - `components/SiteHeader.tsx` — primaryLinks 陣列註解 "30週年" 導航連結
  - `app/page.tsx` — 註解 Anniversary30thBanner import 及兩處使用（未登入 + 已登入區塊）
  - `components/admin/AdminSidebar.tsx` — adminNavItems 陣列註解 30 週年管理項目

- **文檔更新**：
  - `WEBSITE_FEATURES.md` — 新增「限定活動狀態」表記錄活動開閉狀態
  - `WEBSITE_FEATURES.md` — 新增「變更記錄（近期）」section，記錄近期 commit

- **專案規則文檔**：
  - 建立 `CLAUDE.md`（專案級，非全域）
    - 記錄專案路徑、技術棧、必做規則
    - 記錄七項踩過的坑及對應解法
    - 包含 MD 文件索引、環境變數、限定活動現況表

### Technical Details
- Build 驗證：`npm run build` ✅ 通過（無 error，warning 可接受）
- Vercel 部署：commit push → 自動部署 ✅ 成功
- Git branch：所有改動已合併至 master，主資料夾已同步

### Related Commits
- `0bd9223` — chore: 註解關閉 30 週年活動入口（導航、首頁 Banner、管理側欄）
