# CLAUDE.md — 網站架設 (Event Glass)

## 專案路徑

```
/Users/alan_dingchaoliao/Documents/網站開發/網站架設/
```

> **注意**：Claude worktree 位於 `.claude/worktrees/agitated-archimedes/`，是主資料夾的工作副本。
> 改完程式碼後必須 push 到 master，再到主資料夾執行 `git pull origin master` 同步。

---

## 技術棧

- **框架**: Next.js 14 App Router + TypeScript（strict mode）
- **資料庫**: Supabase (PostgreSQL) — 無 ORM，直接用 Supabase client
- **認證**: Supabase Auth，SSR cookie-based
- **樣式**: Tailwind CSS + Glassmorphism 風格
- **部署**: Vercel（push to master 自動部署）
- **Git**: https://github.com/jour9927/Websiteforsaling

---

## 必做規則

### 每次改程式碼後
1. 在 worktree 跑 `npm run build` — 確認無 error（warning 可接受）
2. Build 通過後才 commit + push to master
3. Push 後確認 Vercel commit status = `success`（用 `gh api repos/jour9927/Websiteforsaling/commits/<sha>/statuses`）
4. 通知主資料夾 `git pull origin master`

### 更新 MD 文件後
- **一定要同步主資料夾**：worktree 改的 MD push 上去後，主資料夾要 pull
- 更新對象優先順序：`WEBSITE_FEATURES.md` → `PROJECT_CONTEXT.md` → 其他

### Supabase 操作
- 需要 bypass RLS 的操作（admin 功能）必須用 `createAdminSupabaseClient()`（service role key）
- 一般用戶操作用 `createServerSupabaseClient()`（anon key）
- 新增 migration 後要在 Supabase SQL Editor 手動執行，不會自動套用

---

## 踩過的坑

### 1. Battle unique constraint violation（重複踩，踩了 5 次）
- **問題**：`battle_no` 或 `(user_id, battle_day, battle_no)` unique 約束衝突
- **根本原因**：用計算值預測 battle_no，多 tab 或快速連點時會碰撞
- **正確做法**：先查 DB 的 `MAX(battle_no)`，再 +1；或用 retry loop 處理 unique constraint violation
- **相關 commits**：`9f5993e`, `0b154ab`, `58638cf`

### 2. RLS 策略沒有自動套用
- **問題**：migration `.sql` 檔案寫好了，但資料操作仍失敗
- **根本原因**：Supabase migration 需要手動在 SQL Editor 執行，不是 push 就生效
- **症狀**：`new row violates row-level security policy`
- **解法**：登入 Supabase → SQL Editor → 貼上 migration 內容執行

### 3. TypeScript build 因為 ESLint 失敗
- **問題**：Vercel build 因 ESLint error 中斷（不只是 warning）
- **常見原因**：unused variable、`any` type、`useEffect` missing dependency
- **規則**：`react/jsx-no-undef`（JSX 用了未 import 的元件）是 error，會 block build
- **正確做法**：改完程式碼一定先跑本地 `npm run build`，不要直接推

### 4. Admin 操作需要 Service Role Key，anon key 沒有權限
- **問題**：報名審核、狀態更新等 admin API 用 anon client 會被 RLS 擋
- **解法**：server-side API route 用 `createAdminSupabaseClient()`（lib/auth.ts）
- **不要**：把 service role key 放到 client-side component

### 5. 限定活動關閉方式
- **規則**：關閉活動用**註解**，不要刪程式碼，方便日後恢復
- **需要註解的地方**（以 30 週年為例）：
  1. `components/SiteHeader.tsx` — primaryLinks 陣列
  2. `app/page.tsx` — import + 兩處 JSX 使用（未登入區塊 + 已登入區塊各一個）
  3. `components/admin/AdminSidebar.tsx` — adminNavItems 陣列
- **注意**：`app/page.tsx` 中同一個元件可能出現多次（未登入/已登入兩段），要全部找到

### 6. Worktree 改的 MD 沒有更新到主資料夾
- **問題**：在 worktree 改了文件 push 上去，但主資料夾還是舊版
- **解法**：push 後到主資料夾執行 `git pull origin master`

### 7. `.next_broken_*` 殘骸資料夾
- 根目錄有 `.next_broken_1773844706/` 是廢棄 build，不要動，不影響運作

---

## MD 文件路徑與索引

### 主項目 MD 路徑
```
/Users/alan_dingchaoliao/Documents/網站開發/網站架設/
```
所有下列文件皆位於此目錄根部。Worktree 改動 push 後，必須在主資料夾執行 `git pull origin master` 同步。

### 現有 MD 文件索引（根目錄）

| 文件 | 用途 |
|------|------|
| `CLAUDE.md` | **本檔案**：專案級規則、必做事項、踩過的坑、環境變數 |
| `CHANGELOG.md` | 變更日誌、功能發布、文檔更新、技術細節 |
| `WEBSITE_FEATURES.md` | 功能清單、路由結構、限定活動狀態、近期變更記錄 |
| `PROJECT_CONTEXT.md` | 架構說明、技術選型、部署流程 |
| `REGISTRATION_FIX_SUMMARY.md` | 報名紀錄 bug 修復記錄 |
| `REGISTRATION_APPROVAL_FIX.md` | 報名審核失敗診斷 |
| `AUCTION_FEATURE.md` | 競標功能說明 |
| `VIRTUAL_USER_SYSTEM.md` | 虛擬用戶系統說明 |
| `SYLVEON_BLINDBOX_SETUP.md` | 盲盒活動設定 |
| `MIGRATION_GUIDE.md` | DB migration 操作指南 |
| `DEPLOYMENT_CHECKLIST.md` | Vercel 部署後必做清單 |

---

## 限定活動現況（2026-03-31）

| 活動 | 狀態 | 恢復方式 |
|------|------|----------|
| 30週年守護戰 `/anniversary-30th` | 關閉 | 取消 SiteHeader / page.tsx / AdminSidebar 三處註解 |
| 伊布集點日 `/eevee-day` | 開放 | — |
| 春節活動 `SpringFestivalBanner` | 關閉 | 取消 page.tsx 中的 SpringFestivalBanner 註解 |
| 時光輪盤 `/games/roulette` | 關閉 | 取消 games/page.tsx 中的 roulette 區塊註解 |

---

## 環境變數（位置：`.env.local`）

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY   ← admin 操作必須
CRON_SECRET
GEMINI_API_KEY
```

Vercel 上也需要對應設定（Settings → Environment Variables）。
