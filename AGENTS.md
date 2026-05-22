# Agent Handoff Guide

本檔是 AI agent / Codex / Claude Code / Cursor Agent / Hermes Agent 接手此 repo 的操作入口。開始任何實作前，先讀本檔，再依任務讀相關程式與文件。

## 專案簡介

- 專案名稱：Event Glass。
- 技術棧：Next.js 14 App Router、TypeScript、React 18、Tailwind CSS、Supabase、Vercel。
- 主要用途：活動報名與抽獎、會員管理、競標、委託、商店、付款配送、訊息通知、配布圖鑑與證章/緞帶收藏。
- Package manager：`npm`，lockfile 是 `package-lock.json`。
- Git branch 常態目前是 `master`，remote 是 GitHub repo `jour9927/Websiteforsaling`。

## 必讀文件索引

| 順序 | 文件 | 用途 |
| --- | --- | --- |
| 1 | [README.md](./README.md) | 專案第一入口、快速開始、目錄與常用指令 |
| 2 | [AGENTS.md](./AGENTS.md) | 本檔，agent 操作規範與交接規則 |
| 3 | [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) | 系統架構、資料流、控制流、核心模組與限制 |
| 4 | [CHANGELOG.md](./CHANGELOG.md) | 近期變更、本次文件整理與未完成事項 |
| 5 | 任務相關 docs / code | 例如 `docs/配布點數計算系統.md`、`app/api/*`、`lib/*`、`supabase/migrations/*` |

`README.md` 是人類與 agent 的共同入口；`docs/ARCHITECTURE.md` 是實作前理解架構的主文件；`CHANGELOG.md` 是變更追蹤；本檔是操作規範。

## 常用指令

```bash
npm install
npm run dev
npm run lint
npm run build
npm run start
```

目前沒有偵測到 `npm test` 或 `npm run typecheck` script。TypeScript 驗證主要透過 `npm run build`。若新增或發現測試指令，必須同步更新 `README.md`、本檔與 `docs/ARCHITECTURE.md`。

## 啟動與入口

- App root layout：`app/layout.tsx`
- Home page：`app/page.tsx`
- Global styles：`app/globals.css`
- Browser Supabase client：`lib/supabase.ts`
- Server/admin Supabase helpers：`lib/auth.ts`
- Admin layout：`app/admin/layout.tsx`
- Admin sidebar：`components/admin/AdminSidebar.tsx`
- Main navigation：`components/SiteHeader.tsx`
- Supabase config：`supabase/config.toml`
- Vercel cron config：`vercel.json`

## 修改前必查

1. `git status --short --branch`
2. `git diff --cached --name-status`
3. `git diff --name-status`
4. 任務相關 route/page/component/helper/migration
5. 是否存在使用者既有 dirty files 或 untracked files

不要假設 dirty files 是自己造成的。若不是本輪改動，不能 revert、format、stage 或 commit。

## 環境與 secrets

常見 env names：

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `CRON_SECRET`
- `GEMINI_API_KEY`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `NEXT_PUBLIC_SITE_URL`
- `VERCEL_URL`
- `VERCEL_PROJECT_PRODUCTION_URL`

不要讀取、輸出、提交或暴露 `.env`、`.env.local`、service role key、tokens、private key。`.env.example` 可提交，但只能包含 placeholder。

## Git 操作規範

- 使用 `git status --short --branch` 開始與結束每個任務。
- 只 stage 本輪明確修改的檔案。
- 不要把產品功能、文件整理、migration、deploy config 與大規模格式化混在同一 commit。
- Commit message 使用明確類型，例如 `docs: refresh project documentation`、`chore: expand gitignore`。
- 不要提交 `node_modules/`、`.next/`、`.next_broken_*`、`.vercel/`、`supabase/.temp/`、log、cache 或 secrets。
- direct push、force push、production deploy、production DB write 都是高風險操作；沒有明確授權與驗證前不要執行。

## 不可以做的事

- 不要在未理解 schema 與 migration 前直接改 Supabase production DB。
- 不要把 `.env*`、token 或 Supabase service role key 寫入 git。
- 不要修改 `.github/workflows`、deploy setting、cron、production migration，除非任務明確要求。
- 不要清除或覆蓋使用者既有未提交修改。
- 不要將 `.next_broken_*`、`supabase/.temp` 這類已存在的 generated/local state 視為應自動提交的來源。
- 不要用文件更新掩蓋未驗證的 product 行為。

## 驗證規範

- 文件-only 或 ignore-only 改動：至少重讀修改檔、執行 `git diff --check`，並視情況跑 `npm run lint`。
- App/API/lib 變更：執行 `npm run lint` 與 `npm run build`。
- UI 變更：除 lint/build 外，啟動 `npm run dev` 並用瀏覽器檢查相關頁面。
- Supabase schema/migration 變更：檢查 migration 順序、SQL 風險、RLS 影響與遠端執行方式；不要未授權 push production DB。
- 若驗證失敗，回報實際失敗訊息與是否和本輪修改相關。

## 主要模組提示

- 活動與報名：`app/events/`、`app/admin/events/`、`app/admin/registrations/`、`app/api/events/`
- 競標：`app/auctions/`、`app/admin/auctions/`、`hooks/useSimulatedAuction.ts`、`lib/globalLinkV2VirtualBids.ts`、`docs/AUCTION_SCHEDULING_PRESETS.md`
- 委託：`app/commissions/`、`app/commission-chats/`、`lib/commissions.ts`
- 商店與購物車：`app/store/`、`app/shop/`、`components/CartSidebar.tsx`、`lib/cart.tsx`
- 配布圖鑑與證章：`app/pokedex/page.tsx`、`components/PokedexContent.tsx`、`lib/distributionBadges.ts`、`supabase/migrations/*distribution_badge*`
- 補簽/簽到：`app/check-in/`、`app/api/check-in/route.ts`、`supabase/migrations/*checkin*`
- Cron：`app/api/cron/*`、`vercel.json`
- AI/虛擬互動：`app/api/generate-*`、`lib/*FallbackPool.ts`、`lib/virtualProfiles.ts`

## 交接給下一個 Agent

交接時請留下：

- 任務目標與已完成範圍。
- 修改檔案列表。
- 執行過的驗證指令與結果。
- 未解決 blocker。
- 仍存在但不屬於本輪的 dirty files。
- 是否有需要人類確認的外部操作，例如 Vercel deploy、Supabase db push、production data 修補。
