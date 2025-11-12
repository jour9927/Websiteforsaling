# Event Glass

行動版活動網站的 Next.js App Router 專案骨架，採用 Tailwind CSS 與 Supabase 後端服務。

## 主要技術
- Next.js 14 App Router（TypeScript）
- Tailwind CSS + Glassmorphism 客製樣式
- Supabase（Auth、DB、Storage、Realtime）

## 快速開始
```bash
npm install
npm run dev
```

在 `.env.local` 中設定 Supabase 環境變數：
```
NEXT_PUBLIC_SUPABASE_URL=你的專案 URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的匿名金鑰
```

## 目錄結構
- `app/`：App Router 頁面與 API Routes
- `components/`：共享 UI 元件（如 `EventCard`）
- `lib/`：Supabase 與資料存取邏輯

## 待辦
- 建立 Supabase Schema 與 RPC（對應 `lib/db.ts`）
- 串接真實活動資料、表單與驗證
- 補充測試與型別定義
