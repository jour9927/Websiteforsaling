# 專案上下文文件 (Project Context)

## 專案概述
**專案名稱**: 活動報名與抽獎網站 (Event Registration & Draw System)  
**技術棧**: Next.js 14 (App Router) + TypeScript + Tailwind CSS + Supabase  
**部署平台**: Vercel  
**Git Repository**: https://github.com/jour9927/Websiteforsaling

---

## 專案架構

### 核心技術選型
- **前端框架**: Next.js 14.2.33 with App Router
- **語言**: TypeScript 5.x
- **樣式**: Tailwind CSS 3.4 + 自訂 Glassmorphism 效果
- **後端/資料庫**: Supabase (Auth + PostgreSQL + Storage)
- **驗證**: Supabase SSR (@supabase/ssr)
- **部署**: Vercel (自動 CI/CD)

### 資料夾結構
```
/app                    # Next.js App Router 頁面
  /admin               # 管理後台 (需登入)
    /events            # 活動管理 CRUD
    /registrations     # 報名管理
    /announcements     # 公告管理
  /events              # 公開活動頁面
  /announcements       # 公開公告頁面
  /api                 # API Routes
    /events            # 活動相關 API
    /me                # 使用者資料 API
  /login, /signup      # 驗證頁面
  /profile, /history   # 使用者個人頁面

/components            # React 元件
  /admin               # 管理後台專用元件
  SiteHeader.tsx       # 全站導航列
  EventCard.tsx        # 活動卡片

/lib                   # 工具函式庫
  supabase.ts          # 客戶端 Supabase client
  auth.ts              # 伺服器端 Supabase client
  db.ts                # 資料庫操作 stub

/public                # 靜態資源
```

---

## 核心邏輯與流程

### 1. 驗證流程 (Authentication Flow)
**使用技術**: Supabase Auth + SSR

#### 客戶端驗證 (`lib/supabase.ts`)
```typescript
import { createBrowserClient } from "@supabase/ssr";
export const supabase = createBrowserClient(url, key);
```
- 用於客戶端元件的登入/註冊/登出
- 自動處理 session 持久化

#### 伺服器端驗證 (`lib/auth.ts`)
```typescript
export function createServerSupabaseClient() {
  const cookieStore = cookies();
  return createServerClient(url, key, {
    cookies: {
      get(name) { return cookieStore.get(name)?.value; },
      set(name, value, options) { /* try-catch 包裝 */ },
      remove(name, options) { /* try-catch 包裝 */ }
    }
  });
}
```
**重要**: 
- 使用 `@supabase/ssr` (新版) 取代已棄用的 `@supabase/auth-helpers-nextjs`
- Server Components 中 cookie 操作需用 try-catch 包裝 (read-only 情境)
- 用於 layout/page 等伺服器元件取得使用者 session

### 2. 頁面權限控管
- **公開頁面**: `/`, `/events`, `/announcements`, `/login`, `/signup`
- **需登入**: `/profile`, `/history`
- **管理員專用**: `/admin/*` (需額外檢查 role)

**實作位置**: 各頁面 `page.tsx` 中呼叫 `createServerSupabaseClient().auth.getUser()`

### 3. 資料結構 (待實作於 Supabase)
參考 `lib/db.ts` 中的 TypeScript 型別定義：

#### Events (活動)
```typescript
{
  id: string;
  title: string;
  description: string;
  image_url?: string;
  start_date: string;
  end_date: string;
  max_participants?: number;
  status: 'draft' | 'published' | 'closed';
  created_at: string;
}
```

#### Registrations (報名)
```typescript
{
  id: string;
  event_id: string;
  user_id: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  registered_at: string;
}
```

#### Announcements (公告)
```typescript
{
  id: string;
  title: string;
  content: string;
  published_at?: string;
  created_at: string;
}
```

#### DrawResults (抽獎結果)
```typescript
{
  id: string;
  event_id: string;
  user_id: string;
  drawn_at: string;
}
```

### 4. API Routes 設計
所有 API 皆位於 `/app/api/*`，返回 JSON：

- `GET /api/events` - 取得活動列表
- `POST /api/events` - 建立活動 (管理員)
- `GET /api/events/[id]` - 取得單一活動
- `PUT /api/events/[id]` - 更新活動 (管理員)
- `DELETE /api/events/[id]` - 刪除活動 (管理員)
- `POST /api/events/[id]/register` - 報名活動
- `POST /api/events/[id]/draw` - 執行抽獎 (管理員)
- `GET /api/me/profile` - 取得個人資料
- `GET /api/me/history` - 取得報名歷史

**目前狀態**: Stub 實作，返回假資料；需連接 Supabase 資料表

---

## UI/UX 設計原則

### Glassmorphism 風格
定義於 `app/globals.css`:
```css
.glass {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}
```
應用於卡片、導航列、表單等元件

### 響應式設計
- **Mobile First**: 預設行動裝置優先
- **Breakpoints**: 使用 Tailwind 標準 (sm, md, lg, xl)
- **導航**: 行動版使用 Hamburger Menu，桌面版完整導航列

### 配色
- **主色調**: Tailwind 預設 (可在 `tailwind.config.ts` 自訂)
- **背景**: 漸層 `bg-gradient-to-br from-blue-50 to-indigo-100`
- **文字**: 深灰 `text-gray-800`

---

## 環境變數設定

### 必要變數 (`.env.local` / Vercel Environment Variables)
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...your-anon-key
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...your-service-role-key
```

### 取得方式
1. 登入 [supabase.com](https://supabase.com)
2. 進入專案 → Project Settings → API
3. 複製 **Project URL**、**anon public** key、**service_role** key

### 安全注意事項
- ⚠️ **service_role key** 擁有完整資料庫權限，絕對不可暴露於客戶端
- 只在伺服器端 API Routes 使用
- 使用 Row Level Security (RLS) 保護資料表

---

## 部署流程

### Vercel 部署步驟
1. **連接 GitHub**: 在 Vercel 匯入 `jour9927/Websiteforsaling`
2. **設定環境變數**: 新增上述三個 Supabase 變數
3. **自動部署**: 每次 push 到 `master` 自動觸發
4. **查看部署**: https://websiteforsaling.vercel.app (範例)

### Build 指令
```bash
npm run build    # 本地測試建置
npm run lint     # 檢查程式碼品質
npm run dev      # 本地開發伺服器
```

---

## 已知問題與解決方案

### 1. Supabase 套件遷移 (已解決)
**問題**: `@supabase/auth-helpers-nextjs` 已棄用  
**解決**: 遷移至 `@supabase/ssr`  
**Commit**: `a09f0be` - "Fix: migrate from deprecated auth-helpers-nextjs to @supabase/ssr"

**變更內容**:
- 移除 `@supabase/auth-helpers-nextjs`
- 安裝 `@supabase/ssr`
- 更新 `lib/auth.ts` 使用 `createServerClient`
- 更新 `lib/supabase.ts` 使用 `createBrowserClient`
- 新增 try-catch 於 cookie 操作

### 2. TypeScript Typed Routes
**設定**: `next.config.mjs` 啟用 `typedRoutes: true`  
**效果**: 編譯時檢查路由正確性，避免錯誤連結

---

## 待辦事項 (Pending Tasks)

### 高優先級
- [ ] **Supabase Schema 建立**: 依照 `lib/db.ts` 型別建立資料表
- [ ] **RLS 政策設定**: 配置 Row Level Security 規則
- [ ] **API Routes 實作**: 連接真實 Supabase 資料
- [ ] **管理員權限檢查**: 實作 role-based access control

### 中優先級
- [ ] **表單驗證**: 新增 Zod 或 React Hook Form
- [ ] **錯誤處理**: 統一錯誤訊息與 UI 回饋
- [ ] **Loading 狀態**: 新增 Skeleton/Spinner
- [ ] **圖片上傳**: 整合 Supabase Storage

### 低優先級
- [ ] **單元測試**: Jest + React Testing Library
- [ ] **E2E 測試**: Playwright 或 Cypress
- [ ] **SEO 優化**: Metadata, Sitemap, Robots.txt
- [ ] **Analytics**: Google Analytics 或 Vercel Analytics

---

## 開發指南

### 新增頁面
1. 在 `app/` 下建立資料夾與 `page.tsx`
2. 遵循 Server Component 優先原則
3. 需客戶端互動時使用 `"use client"`

### 新增 API Route
1. 在 `app/api/` 建立 `route.ts`
2. 匯出 `GET`, `POST`, `PUT`, `DELETE` 等方法
3. 使用 `createServerSupabaseClient()` 存取資料庫

### Git 工作流程
```bash
git add .
git commit -m "feat: description"
git push
# Vercel 自動部署
```

---

## 聯絡與協作

**Repository**: https://github.com/jour9927/Websiteforsaling  
**Owner**: jour9927  
**Branch**: master  
**Last Updated**: 2025年11月12日

---

## 附錄: 關鍵決策紀錄

### 為何選擇 Next.js App Router？
- 原生支援 Server Components，減少客戶端 JS
- 檔案系統路由，結構清晰
- 內建 API Routes，前後端整合簡單

### 為何選擇 Supabase？
- 開源 Firebase 替代方案
- PostgreSQL 完整功能
- 內建 Auth、Storage、Realtime
- 與 Next.js SSR 良好整合

### 為何使用 Glassmorphism？
- 現代化視覺風格
- 適合活動/抽獎主題
- Tailwind 易於實現

---

**此文件應隨專案演進持續更新**
