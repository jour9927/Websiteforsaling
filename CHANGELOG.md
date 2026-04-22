# Changelog

## [2026-04-22]

### Added
- 新增「勳章型伊布蒐集控系列護衛活動」完整第一版（活動入口 + 首頁小組件 + API + 資料模型）
  - 活動頁：`app/eevee-guardian/page.tsx`
  - 對戰入口 UI（Gen3 風格 MVP）：`components/EeveeGuardianBattleHub.tsx`
  - 首頁即時戰況小組件：`components/EeveeGuardianWidget.tsx`
  - 全站導航新增活動入口：`components/SiteHeader.tsx`
  - 首頁新增活動小組件掛載（未登入/已登入區塊）：`app/page.tsx`

- 新增伊布護衛活動 API（狀態、即時戰況、開戰、結算）
  - `app/api/eevee-guardian/status/route.ts`
  - `app/api/eevee-guardian/live/route.ts`
  - `app/api/eevee-guardian/battle/start/route.ts`
  - `app/api/eevee-guardian/battle/resolve/route.ts`
  - `app/api/eevee-guardian/_shared.ts`

- 新增活動規則與計算 helper
  - `lib/eeveeGuardian.ts`
  - 規則：9 天活動、每日 1 場、勝場 1 點、敗場 0.5 點、9 勳章解鎖稀有伊布

### Database Migration
- 新增 `supabase/migrations/20260422120000_add_eevee_guardian_event.sql`
  - 建立 `eevee_guardian_campaigns`、`eevee_guardian_players`、`eevee_guardian_battles`
  - 建立索引與 RLS policy
  - 預設寫入活動 seed 資料（slug: `eevee-medal-guardians`）

### Technical Details
- Build 驗證：`npm run build` ✅ 通過
- Lint 驗證：`npm run lint` ✅ 通過（僅既有 hooks dependency warning，非本次新增）

## [2026-04-16]

### Changed
- 自動競標改為只使用伊布配布池
  - `app/api/cron/auto-auction/route.ts` 改為從 `distributions` 只篩選 `pokemon_name` 包含「伊布」或 `pokemon_name_en` 包含 `eevee`
  - 每日自動建立場次維持原時段與間隔，但競標標的固定為伊布相關配布
  - cron 回應訊息同步標示為「伊布自動競標」

### Database Migration
- 新增 Gen5 Global Link 伊布進化型歷史配布補資料（21 筆）
  - `supabase/migrations/20260416110000_add_gen5_global_link_eeveelutions.sql`
  - 補齊 `Global Link：Eeveelution Labyrinth`（7 筆）
  - 補齊 `Global Link：Play to Befriend a Pokemon` 第 1 / 第 2 彈（14 筆）
  - 使用 `NOT EXISTS` 去重條件，避免重複插入

## [2026-04-15]

### Added
- 管理員訊息支援「自訂發送時間」
  - 管理員可在發送會員訊息時手動指定時間（例如將 4/16 補發訊息顯示為 4/11）
  - 儲存時會把指定時間寫入 `messages.created_at`，收件者與管理後台看到的訊息時間會一致
  - 未填則維持原本系統當下發送時間
- 管理員訊息支援「回覆者身分」顯示名稱
  - 後台發送時可選擇：匿名（預設客服團隊）/ 管理員真名 / 自訂名稱
  - 會員端顯示會優先使用 `sender_display_name`
- 新增會員「背包」系統與管理後台
  - 會員新增 `/backpack` 子頁面，可查看管理員發放的背包道具與獲得備註
  - 管理員新增 `/admin/backpack` 頁面，可發放/停用/刪除會員背包道具
  - 支援道具類型：盲盒折抵券 500、盲盒折抵券 1000、競標費用報銷券（30%）、競標費用報銷券（40%）
  - 全站導航新增「我的背包」，管理後台側欄新增「背包管理」
- 新增「背包新道具」全域氣泡提示（不影響原本訊息氣泡）
  - 當管理員發放新道具時，會員端會出現「你有新的道具放入背包」氣泡提示
  - 若未讀新道具達 2 件以上，氣泡左上紅點顯示數字
  - 點擊氣泡或進入背包頁後，會更新讀取時間並清除提示
- 修正背包管理收件名單
  - `/admin/backpack` 發放對象改為包含管理員帳號，管理員可給自己發放道具
  - 成員選單補上管理員角色標示（管理員）
- 背包道具新增時間調整與限時機制
  - 管理員發放時可自訂「發放時間」
  - 管理員可設定「有效期限」，逾期後道具顯示為已到期
  - 會員背包頁對限時/將到期道具顯示紅字閃爍提示
  - 新道具氣泡未讀計算改為忽略已過期道具
- 背包道具視覺強化
  - 每個道具類型新增專屬 icon 與色彩標籤
  - 會員背包頁與管理後台背包清單同步顯示道具 icon
  - 管理員發放道具下拉選單同步顯示 icon
  - 會員背包頁 icon 放大並加入高亮邊框與光點，提升辨識與刺激感
- 背包發放預設有效期限調整
  - 管理員發放道具時，有效期限預設自動帶入「發放時間 + 50 年」
  - 若管理員未手動調整，系統仍會自動套用 50 年期限

### Changed
- `app/admin/messages/page.tsx`
  - 發送表單新增 `datetime-local` 的自訂發送時間欄位（選填）
  - 發送邏輯改為支援可選的 `created_at` 寫入，並加入時間格式驗證
  - 發送成功後會清空自訂時間欄位
  - 發送表單新增回覆者身分欄位與自訂名稱輸入
  - 發送寫入 `sender_display_name`，預設為「客服團隊」
- `app/messages/page.tsx`
  - 訊息「來自」顯示邏輯改為優先使用 `sender_display_name`

### Database Migration
- `supabase/migrations/20260415093000_add_sender_display_name_to_messages.sql`
  - 新增 `messages.sender_display_name` 欄位（可為空，向下相容舊資料）
- `supabase/migrations/20260415102000_create_backpack_items.sql`
  - 新增 `backpack_items` 表與 RLS（會員可讀自己的背包，管理員可全管理）
- `supabase/migrations/20260415113500_add_last_read_backpack_items_at_to_profiles.sql`
  - 新增 `profiles.last_read_backpack_items_at` 欄位，供背包氣泡計算未讀新道具
- `supabase/migrations/20260415121000_add_expiry_to_backpack_items.sql`
  - 新增 `backpack_items.expires_at` 欄位，供道具有效期限與到期提醒使用

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
