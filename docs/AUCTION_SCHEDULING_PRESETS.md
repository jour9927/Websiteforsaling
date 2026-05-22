# Auction Scheduling Presets

本檔保存可重用的競標排程方案。這些方案是未來建立競標批次前的操作依據，不代表已經寫入 Supabase，也不代表已經建立實際競標場次。

## Current auction behavior

- 單筆管理後台建立流程在 `app/admin/auctions/page.tsx`，目前 UI 預設起標金額是 `20`、最低加價是 `20`、`current_price` 從 `0` 開始，預設 10 分鐘後結標。
- `auctions` base table 在 `supabase/migrations/024_auction_system.sql` 內建立，資料庫層預設 `starting_price` 是 `100`、`min_increment` 是 `100`。
- `global_link_v2` 自動競標欄位由 `supabase/migrations/20260501123000_add_global_link_auction_v2.sql` 加入，後續 `supabase/migrations/20260501200000_update_global_link_v2_target_range.sql` 將 v2 預設目標調整為 `39000` 到 `45000`。
- 自動結算入口包含 `app/api/cron/auto-auction/route.ts` 與 `app/auctions/[id]/page.tsx` 的 ended-auction finalization。前端模擬主要在 `hooks/useSimulatedAuction.ts`，伺服端最高虛擬出價計算在 `lib/globalLinkV2VirtualBids.ts`。

`global_link_v2` 目前是既有可用的自動競標引擎名稱，不應直接等同於所有未來商品的價格策略。未來若需要獨立命名與不同節奏，應新增新的 `automation_mode` constraint、前端模擬邏輯、伺服端 finalizer 與 migration。

## Saved preset: Kiyu-style rolling auction

狀態：保存 setup，尚未執行。  
保存日期：2026-05-22。  
用途：未來要把其他商品或配布用「連續批次競標」形式上架時，可用此 setup 作為起始模板。

### Pricing

| Field | Value |
| --- | ---: |
| `starting_price` | `500` |
| `min_increment` | `100` |
| `current_price` | `0` |
| `automation_target_min` | `8000` |
| `automation_target_max` | `18000` |
| `automation_stop_seconds` | `1` |

說明：

- 這組價格刻意不沿用 Global Link V2 的 `39000` 到 `45000` 高價目標。
- `automation_target_min` 與 `automation_target_max` 是虛擬追價節奏目標，不是絕對封頂。現有 v2 模擬有快速追價與 sustain bid 行為，長時段競標最後可高於目標區間。
- 若未來需要「最終成交價必須落在目標區間內」，需要同步調整 `hooks/useSimulatedAuction.ts` 與 `lib/globalLinkV2VirtualBids.ts`，不能只改資料。

### Schedule

| Parameter | Value |
| --- | ---: |
| 單場競標時長 | 24 小時 |
| 首批啟動時間 | 排程 anchor 後 10 分鐘 |
| 批次間隔 | 每 10 分鐘 |
| 排程期間 | 10 天 |
| 每批件數 | 3 隻 |
| 總批次數 | 1440 批 |
| 總競標數 | 4320 場 |
| 穩定重疊 active 場次 | 432 場 |

計算方式：

- 10 天等於 240 小時。
- 每小時 6 批，10 天共 `240 * 6 = 1440` 批。
- 每批 3 場，總競標數是 `1440 * 3 = 4320`。
- 每場 24 小時、每 10 分鐘新增 3 場，排滿後同時 active 場次約 `24 * 6 * 3 = 432`。

### Suggested item set from current catalog context

這次討論的原始樣本是 `Kiyu` 的伊布與全進化型：

| Order | Name |
| ---: | --- |
| 1 | Kiyu 的伊布 |
| 2 | Kiyu 的水伊布 |
| 3 | Kiyu 的雷伊布 |
| 4 | Kiyu 的火伊布 |
| 5 | Kiyu 的太陽伊布 |
| 6 | Kiyu 的月亮伊布 |
| 7 | Kiyu 的葉伊布 |
| 8 | Kiyu 的冰伊布 |
| 9 | Kiyu 的仙子伊布 |

未來實際競標「別的」商品時，先替換 item set，再重新確認批次輪替規則。不要直接把這 9 筆視為固定要建立的競標資料。

## Execution checklist before creating rows

1. 確認要排程的商品或配布清單，以及是否要重複輪替。
2. 確認排程 anchor 的時區與開始時間；本 repo 操作預設以 Asia/Taipei 溝通。
3. 確認是否使用現有 `global_link_v2` engine，或先新增新的 `automation_mode`。
4. 確認大量 future active rows 對 `app/auctions/` 查詢與首頁熱門競標是否可接受。
5. 若建立 4320 場，先在本機或 staging 生成 row count、最早 start、最晚 end、每批 3 場的檢查結果。
6. production 寫入前先保留 SQL 或 migration diff，檢查 `auction_id`、`status`、`start_time`、`end_time`、`automation_target_min`、`automation_target_max`。
7. 寫入後用唯讀 query 驗證總數、時間範圍、價格欄位與 automation 欄位。

## Risk notes

- 4320 場不是小批次；若全部以 `active` 建立，列表、首頁熱門競標與管理後台都可能讀到大量 future rows。
- 目前 public auction 頁面有 upcoming 狀態判斷，但仍應驗證大量 future active rows 的排序、分頁與效能。
- 若要避免大量 active rows，可考慮新增 `scheduled` status 或專用排程表，但這會牽涉 route、admin、cron、RLS 與 migration，不屬於單純資料排程。
- 不要在沒有明確授權時直接對 production Supabase 執行大量 insert。
