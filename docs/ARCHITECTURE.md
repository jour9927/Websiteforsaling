# Architecture

本文件記錄 2026-05-21 掃描到的 Event Glass 架構。若與舊文件衝突，請以實際程式、Supabase migration、本文件與 [README.md](../README.md) 為準。

## 系統總覽

Event Glass 是一個 Next.js 14 App Router 應用，使用 Supabase 作為 Auth、PostgreSQL、Storage 與管理資料來源，部署目標是 Vercel。前端頁面、server actions 類型的 route handlers、cron endpoint 與管理後台都在同一個 Next.js app 中。

核心流程：

1. 使用者進入 `app/layout.tsx`，layout 以 server Supabase client 解析 session/profile。
2. 全站 provider 與通知元件包覆頁面，例如 maintenance、cart、global announcements、message/backpack toast、check-in reminder。
3. Pages 從 Supabase 讀資料，client components 透過 `lib/supabase.ts` 做互動。
4. API routes 位於 `app/api/*/route.ts`，需要管理權限的流程透過 `lib/auth.ts` 或 service role client 處理。
5. Vercel cron 由 `vercel.json` 呼叫 `app/api/cron/*` endpoint。
6. Supabase schema 與資料修補以 `supabase/migrations/` 和 `scripts/` 管理。

## Runtime Stack

- Next.js `^14.2.13`
- React `^18.3.1`
- TypeScript `^5`
- Tailwind CSS `^3.4.1`
- Supabase JS / SSR helpers
- Vercel deployment and cron
- Resend email API for notification delivery
- Gemini API for selected AI content generation
- `lucide-react` icons
- `@dnd-kit/*` for drag/drop interactions

## 目錄結構

| 路徑 | 角色 |
| --- | --- |
| `app/` | App Router routes、layouts、API route handlers、domain pages |
| `components/` | 共用 client/server UI components |
| `components/admin/` | 管理後台 form/list/sidebar components |
| `components/games/` | 小遊戲 UI 與互動 |
| `lib/` | Supabase clients、auth helpers、domain helpers、fallback pools、資料計算 |
| `hooks/` | React hooks |
| `scripts/` | 手動資料修補、migration helper、點數重算與 setup scripts |
| `supabase/migrations/` | Supabase SQL migrations，目前約 114 個 migration 檔 |
| `supabase/sql_analytics/` | 查詢分析 SQL |
| `supabase/sql_recovery/` | 回復或修補 SQL |
| `supabase/sql_updates/` | 一次性更新 SQL |
| `public/` | 靜態活動圖、guide 圖、placeholder assets |
| `docs/` | 架構與專題文件 |

大型或產物目錄如 `.git/`、`node_modules/`、`.next/`、`.next_broken_*`、`.vercel/`、`supabase/.temp/` 不應作為一般掃描或提交對象。

## 啟動流程

### Web request

- `app/layout.tsx` 設定 metadata、全站 CSS、dynamic rendering 與主要 providers。
- `createServerSupabaseClient()` 從 cookies 建立 server Supabase client。
- Layout 查詢目前使用者與 `profiles.role`，傳給 `SiteHeader` 與全站 UI。
- `app/page.tsx` 組合首頁內容，包含個人空間、熱門競標、委託、配布活動 widget 等。

### Client interaction

- Client components 使用 `lib/supabase.ts` 的 browser client。
- 購物車 state 由 `lib/cart.tsx` 與 `CartProvider` 管理，搭配 `components/CartSidebar.tsx`。
- 圖鑑收藏與證章互動在 `components/PokedexContent.tsx`，資料由 `app/pokedex/page.tsx` server 端載入。

### Admin flow

- `app/admin/layout.tsx` 先檢查 session，再查 `profiles.role` 是否為 `admin`。
- 非登入者 redirect 到 `/login`，非 admin redirect 到首頁。
- 管理選單集中在 `components/admin/AdminSidebar.tsx`。

### API and cron flow

- 一般 API route 在 `app/api/*/route.ts`。
- Cron route 在 `app/api/cron/*/route.ts`，多數使用 `CRON_SECRET` 驗證。
- `vercel.json` 目前排程：
  - `/api/cron/auto-auction`
  - `/api/cron/update-points`
  - `/api/cron/virtual-commissions`
  - `/api/cron/commission-maintenance`

## 主要模組

### Auth and Supabase

- `lib/supabase.ts`：browser client，使用 `NEXT_PUBLIC_SUPABASE_URL` 與 `NEXT_PUBLIC_SUPABASE_ANON_KEY`。
- `lib/auth.ts`：server client、admin client 與 user helper。`SUPABASE_SERVICE_ROLE_KEY` 缺失時會 fallback 到 anon key 並警告，admin 操作可能受 RLS 影響。
- `supabase/config.toml`：目前 project id 是 `wlomyjuuqovdatrxrfpu`。

### Events and registrations

活動、報名、抽獎與歷史頁面分散在 `app/events/`、`app/history/`、`app/admin/events/`、`app/admin/registrations/` 與 `app/api/events/`。舊文件 `WEBSITE_FEATURES.md` 和多份 registration fix docs 可作歷史參考，但需與實際 routes/migrations 比對。

### Auctions

競標主要在 `app/auctions/` 與 `app/admin/auctions/`。相關 helper 包含 `hooks/useSimulatedAuction.ts`、`lib/globalLinkV2VirtualBids.ts`、`lib/auctionFallbackPool.ts`。多個 2026-05 migration 處理 Global Link V2、auto-follow、anti-snipe 與 increment 規則。

### Commissions

委託頁面與聊天室在 `app/commissions/`、`app/commission-chats/`、`app/api/commissions/`、`app/api/commission-chats/`，共用邏輯在 `lib/commissions.ts` 與 fallback pool。

### Store, cart, payments, deliveries, backpack

商店頁面在 `app/store/` 與 `app/shop/`。Client cart provider 在 `lib/cart.tsx`。付款、配送、背包和道具頁面分布在 `app/payments/`、`app/deliveries/`、`app/backpack/`、`app/items/` 與對應 admin pages。

### Pokedex, distributions, badges

配布圖鑑入口是 `app/pokedex/page.tsx`，client UI 是 `components/PokedexContent.tsx`。配布證章/緞帶 helper 在 `lib/distributionBadges.ts`。

資料設計重點：

- `distribution_badges` 是獨立證章/緞帶目錄。
- `user_distribution_badges` 將 badge 附加到使用者持有的 `user_distributions`。
- Badge 以 generation、min/max generation、release year、rarity、base points 排序與加權。
- `isBadgeCompatibleWithDistribution()` 以世代區間判斷可否附加。
- `sumBadgePoints()` 將附加 badge 加到配布顯示價值。

相關 migration：

- `20260514103000_distribution_badges.sql`
- `20260514193000_add_distribution_badge_icons.sql`
- `20260514194500_expand_distribution_badge_catalog.sql`
- `20260514205500_fix_distribution_badge_icon_urls.sql`
- `20260515093000_rescale_distribution_badge_points.sql`
- `20260515094000_raise_once_in_a_lifetime_ribbon_points.sql`

### Check-in

簽到/補簽相關 route 在 `app/check-in/` 與 `app/api/check-in/route.ts`。`20260514090000_reset_check_in_debt.sql` 是補簽債務歸零相關 migration。此流程涉及使用者點數與歷史資料，修改前必須讀 route 與 migration。

### AI, virtual users, social interactions

AI 內容產生 route 包含 `app/api/generate-homepage-comment/route.ts`、`app/api/generate-reply/route.ts`、`app/api/generate-spontaneous/route.ts`。虛擬留言、人氣與 fallback pools 位於 `lib/commentFallbackPool.ts`、`lib/commissionFallbackPool.ts`、`lib/virtualProfiles.ts`、`app/api/popularity/route.ts` 等。

### Games and campaign pages

小遊戲在 `app/games/` 與 `components/games/`。期間活動包含 `app/anniversary-30th/`、`app/eevee-day/`、`app/random-distribution/`；部分 banner 或入口在首頁/header 中可能被註解或依活動狀態隱藏。

## 設定檔

| 檔案 | 說明 |
| --- | --- |
| `package.json` | npm scripts 與 dependencies |
| `package-lock.json` | npm lockfile |
| `next.config.mjs` | Next strict mode、typedRoutes、image remote patterns、安全 header |
| `tailwind.config.ts` | Tailwind content paths、色票、glass shadow |
| `tsconfig.json` | strict TypeScript、path alias、Next generated types |
| `vercel.json` | cron schedule |
| `.env.example` | 公開 Supabase env placeholder |
| `.gitignore` | local/generated/secrets ignore rules |
| `supabase/config.toml` | Supabase project config |

## 外部依賴與資料來源

- Supabase Auth/PostgreSQL/Storage。
- Vercel hosting and cron。
- Resend email API。
- Gemini API。
- Supabase Storage 與 `*.supabase.co` remote images。
- `raw.githubusercontent.com` 與 Bulbagarden redirect URLs 用於部分圖片或 badge icon。

## Scripts and migrations

`scripts/` 內有多個一次性或管理用腳本，常見需求是 `NEXT_PUBLIC_SUPABASE_URL` 與 `SUPABASE_SERVICE_ROLE_KEY`。部分腳本是歷史用途或硬編 migration 檔名，例如 `exec-sql.js` / `execute-sql-api.js` 參照 `038_table_only.sql`。執行任何 script 前，必須先讀腳本內容、確認目標資料表、確認使用的是 local 還是 production credentials。

`supabase/migrations/` 混有早期序號 migration、時間戳 migration 與少量未標準命名 SQL。套用 migration 前要確認遠端 DB 狀態，不要只依檔名假設已執行。

## 核心設計決策

- 使用 App Router，把頁面、API 與 cron route 放在同一 Next app。
- 重要頁面偏向 dynamic rendering，避免會員與即時資料被靜態快取。
- Supabase service role 僅應在 server/admin/cron/script 使用。
- 管理後台以 route-level auth gate 保護。
- 配布證章是獨立收藏軸，可附加在使用者配布收藏上，不覆蓋原配布收藏。
- 全站 UI 維持 glassmorphism 與深色視覺。

## 不應輕易改動的核心區域

- `lib/auth.ts`：auth、service role fallback、server client cookies。
- `app/layout.tsx`：全站 provider、session/profile 查詢與共用 overlay。
- `app/admin/layout.tsx`：admin gate。
- `components/SiteHeader.tsx` 與 `components/admin/AdminSidebar.tsx`：主要導航與權限入口。
- `app/api/cron/*` 與 `vercel.json`：排程與 production side effects。
- `supabase/migrations/*`：schema/data migration 歷史。
- `lib/distributionBadges.ts` 與 `app/pokedex/page.tsx`：配布證章資料契約。
- `.env*` 與 Supabase/Vercel credentials：不可提交。

## 可擴充或可重構區域

- Legacy docs 可逐步清理並連回 README/ARCHITECTURE。
- `scripts/` 可整理成明確的 local-only、production-safe、manual-only 分類。
- 可以新增正式 test/typecheck script，並建立最低限度 API/helper 測試。
- 配布點數與 badge point tier 可抽出更明確的資料設定與測試。
- 大型活動頁面可在活動結束後封存入口，但保留資料與歷史頁。

## 目前限制與風險

- `package.json` 沒有正式 test script。
- `.env.example` 沒列出所有 server env；新增前需避免暴露 secrets。
- 部分舊文件與目前程式/migration 不一致，例如舊 setup、deployment、project context 與配布點數文件。
- `.next_broken_1773844706` 與 `supabase/.temp` 目前已有檔案被 git 追蹤；這是版本控制 hygiene 風險，建議另開獨立 commit 安全 untrack。
- 部分 script 會直接使用 service role key 修改資料，不能未審查執行。
- Supabase migration 是否已全部套用到遠端 DB 需要用 Supabase CLI 或 dashboard 另外驗證。

## Handoff checklist

接手任務時：

1. 讀 `README.md`、`AGENTS.md`、`CHANGELOG.md` 與本文件。
2. 執行 `git status --short --branch`。
3. 確認 dirty files 是否與本輪任務相關。
4. 只讀取任務需要的 code/docs/migrations。
5. 做最小可驗證修改。
6. 跑 `npm run lint` 與必要的 `npm run build`。
7. 更新相關文件與 changelog。
8. 只 stage/commit 本輪檔案，留下清楚交接。

