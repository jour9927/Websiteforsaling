# 行動版活動網站架構規劃（Glass 風格）

## 一、技術堆疊
- Next.js (App Router)
- Tailwind CSS (+ 自定義 glass 樣式)
- Supabase (Auth, DB, Storage, Realtime)
- 部署：Vercel + Supabase
- 圖片上傳：Supabase Storage

## 二、功能路由與頁面
- `/`：活動公告牆（主頁）
- `/login` / `/signup`
- `/events/[id]`：活動詳情
- `/events/[id]/draw`：線上抽選頁
- `/profile`：個人設定
- `/history`：參與紀錄
- `/privacy`：隱私權政策
- `/logout`：登出

## 三、資料模型（PostgreSQL / Supabase）
```sql
-- users, events, event_assets, registrations, blind_boxes, draws, audit_logs
```
詳見原規劃內容。

## 四、API 設計
- `GET /api/events`
- `GET /api/events/[id]`
- `POST /api/events/[id]/register`
- `POST /api/events/[id]/draw`
- `GET /api/me/history`
- `PATCH /api/me/profile`

## 五、UI：Glassmorphism 樣式
```css
.glass-card {
  @apply rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md shadow-lg;
}
.glass-dark {
  @apply rounded-2xl border border-white/10 bg-neutral-800/40 backdrop-blur-md shadow;
}
```

## 六、頁面結構（Next.js）
```
/app
  /api/events/[id]/register/route.ts
  /api/events/[id]/draw/route.ts
  /events/[id]/page.tsx
  /login/page.tsx
  /profile/page.tsx
  /history/page.tsx
  /privacy/page.tsx
  /page.tsx
/components
  EventCard.tsx
/lib
  supabase.ts
  auth.ts
  db.ts
```

## 七、盲盒抽選邏輯（伺服器端隨機）
以 Node.js crypto 模組產生亂數，並以交易機制避免重複與作弊。

## 八、啟動步驟
```bash
npx create-next-app@latest event-glass
cd event-glass
npm i @supabase/supabase-js tailwindcss postcss autoprefixer
npx tailwindcss init -p
```
- 建立 Supabase 專案與資料表
- 將 `glass-card` 樣式加入 Tailwind
- 測試首頁與活動詳情頁

---

本文件可作為 Codex 或 Cursor 初始專案設定文件。
