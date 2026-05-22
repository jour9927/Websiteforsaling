# Event Glass

Event Glass 是一個以 Next.js 14 App Router、TypeScript、Tailwind CSS 與 Supabase 建置的活動、會員、競標、委託、商店與寶可夢配布收藏網站。專案目前以 Vercel 部署，Supabase 提供 Auth、PostgreSQL、Storage 與 server-side 管理資料存取。

本文件是人類開發者與 AI agent 進入專案的第一入口。若要接手修改，請先讀本檔，再讀 [AGENTS.md](./AGENTS.md)、[docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) 與 [CHANGELOG.md](./CHANGELOG.md)。

## 目前狀態

- 前端與 API 主要都在 `app/`，採 Next.js App Router。
- 共用 UI 與 client providers 在 `components/`，共用 Supabase、資料處理與 domain helper 在 `lib/`。
- Supabase schema 與資料修補集中在 `supabase/migrations/`，目前有大量歷史與時間戳 migration。
- 專案已有 git remote：`https://github.com/jour9927/Websiteforsaling.git`。
- 目前沒有偵測到正式 test script；日常驗證以 `npm run lint` 與 `npm run build` 為主。
- 多份舊文件仍保留作歷史參考；若與程式不一致，以實際程式、migration、`docs/ARCHITECTURE.md` 與本 README 為準。

## 快速開始

```bash
npm install
npm run dev
```

預設開發站點是 Next.js dev server 顯示的 localhost URL，通常是 `http://localhost:3000`。

## 環境變數

`.env.example` 目前只列出公開 Supabase 變數。實際開發或部署時，依功能可能需要以下變數：

| 變數 | 用途 |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 專案 URL，client/server 都會使用 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key，client/server 都會使用 |
| `SUPABASE_SERVICE_ROLE_KEY` | Server/admin/API/腳本的管理權限 key；不要提交 |
| `CRON_SECRET` | Vercel cron endpoint 驗證 |
| `GEMINI_API_KEY` | AI 內容產生 API |
| `RESEND_API_KEY`、`RESEND_FROM_EMAIL` | 通知寄信 |
| `NEXT_PUBLIC_SITE_URL` | 通知與外部連結 base URL |
| `VERCEL_URL`、`VERCEL_PROJECT_PRODUCTION_URL` | Vercel runtime URL fallback |

不要提交 `.env`、`.env.local`、token、private key、Supabase service role key 或任何憑證。

## 常用指令

```bash
npm install
npm run dev
npm run lint
npm run build
npm run start
```

目前 `package.json` 沒有 `test` 或 `typecheck` script。TypeScript 檢查主要透過 `npm run build` 與 Next.js build 流程觸發。若新增測試，請同步更新本 README、[AGENTS.md](./AGENTS.md) 與 [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)。

## 主要目錄

| 路徑 | 說明 |
| --- | --- |
| `app/` | Next.js App Router pages、layouts、route handlers 與 API |
| `components/` | 共用 UI、首頁/活動/競標/委託/圖鑑/管理後台元件 |
| `components/admin/` | 管理後台表單、列表與側邊欄 |
| `components/games/` | 小遊戲 client components |
| `lib/` | Supabase clients、auth helpers、domain helpers、fallback pools 與資料模型 helper |
| `hooks/` | React hooks |
| `scripts/` | 一次性資料修補、手動 migration、點數重算與管理腳本 |
| `supabase/` | Supabase config、migration、SQL analytics/recovery/update scripts |
| `public/` | 靜態圖片、活動圖、guide 圖與 placeholder assets |
| `docs/` | 架構與功能專題文件 |

大型或產物目錄如 `.git/`、`node_modules/`、`.next/`、`.next_broken_*`、`.vercel/`、`supabase/.temp/` 不應作為一般程式掃描或提交內容。

## 主要功能區

- 活動、報名、抽獎與公告。
- 會員 profile、歷史紀錄、訊息、通知、付款、配送、背包與道具。
- 管理後台：活動、競標、委託、會員、報名、公告、商品、付款、配送、通知與資料維護。
- 競標系統與自動追價 / anti-snipe 相關流程。
- 委託與委託聊天室。
- 商店、購物車與 checkout。
- 配布圖鑑、使用者收藏、配布證章/緞帶附加與點數加成。
- Guide books、排行榜、人氣互動、虛擬留言與 AI 內容產生。
- 期間活動頁面與小遊戲，例如 30 周年、伊布日、random distribution battle。

## 文件索引

| 文件 | 用途 |
| --- | --- |
| [README.md](./README.md) | 專案第一入口、快速開始、目錄與指令 |
| [AGENTS.md](./AGENTS.md) | AI agent / Codex / Claude / Cursor 接手操作規範 |
| [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) | 架構、資料流、控制流、模組與限制 |
| [CHANGELOG.md](./CHANGELOG.md) | 變更紀錄與本次整理紀錄 |
| [WEBSITE_FEATURES.md](./WEBSITE_FEATURES.md) | 歷史功能清單，需與實際程式交叉確認 |
| [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) | Supabase 設定參考，部分內容可能已過時 |
| [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) | 歷史部署 checklist，部署前需重驗 |
| [docs/配布點數計算系統.md](./docs/配布點數計算系統.md) | 配布點數系統說明，部分數值需與程式/migration 比對 |
| [docs/配布資料缺失報告.md](./docs/配布資料缺失報告.md) | 配布資料修補紀錄 |
| [docs/競標系統強化詳細文檔.md](./docs/競標系統強化詳細文檔.md) | 競標強化歷史設計 |
| [docs/AUCTION_SCHEDULING_PRESETS.md](./docs/AUCTION_SCHEDULING_PRESETS.md) | 競標批次排程與價格 preset，包含尚未執行的 Kiyu-style rolling auction setup |
| [docs/虛擬留言模板池注意事項.md](./docs/虛擬留言模板池注意事項.md) | 虛擬留言模板池維護注意事項 |

## 新開發者 / 新 Agent 閱讀順序

1. `README.md`：確認專案目的、指令與目錄。
2. `AGENTS.md`：確認本 repo 的操作規範、git 規則與驗證要求。
3. `docs/ARCHITECTURE.md`：理解架構、資料流、核心模組與高風險區域。
4. `CHANGELOG.md`：確認近期整理與產品變更。
5. 依任務閱讀對應專題文件與程式，例如 `app/api/*`、`lib/auth.ts`、`lib/distributionBadges.ts`、`supabase/migrations/*`。

## 開發流程

1. 先執行 `git status --short --branch`，不要混入既有 dirty files。
2. 閱讀任務相關的 page、component、API route、`lib/` helper 與 migration。
3. 做最小可驗證修改。
4. 執行 `npm run lint`；若有 runtime 或 Next.js 相關變更，執行 `npm run build`。
5. 更新相關文件與 `CHANGELOG.md`。
6. 分類 staged files，避免把使用者未提交修改、local log、產物目錄或 secrets 放進 commit。

## Git 與部署注意事項

- 不要提交 `.env*`、Supabase tokens、service role key、private key。
- 不要提交 `node_modules/`、`.next/`、`.next_broken_*`、`.vercel/`、`supabase/.temp/` 或驗證 log。
- 若要變更 Supabase schema，先讀對應 migration 與 `supabase/config.toml`，並明確區分本機 migration、遠端 DB push、Vercel 部署。
- 直接部署、production DB write、direct push to protected branch 都屬高風險操作，必須依使用者明確指示與 repo guardrails 處理。
