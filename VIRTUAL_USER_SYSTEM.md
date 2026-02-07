# 🤖 水軍模擬用戶系統

## 概述

此系統用於模擬虛擬用戶在平台上的互動行為，增加用戶頁面的活躍度。

---

## 功能列表

| 功能 | 說明 | 執行時間 |
|------|------|---------|
| **虛擬訪問** | 虛擬用戶訪問真實用戶頁面 | 每天 11:00 |
| **虛擬留言** | 30% 機率自動留言 | 每天 11:00 |
| **手動留言** | 管理員自訂留言內容 | 隨時 |
| **瀏覽量累加** | 更新 total_views 和 today_views | 每天 11:00 |
| **自動清理** | 刪除 7 天以上的虛擬留言和訪問 | 每天 11:00 |

---

## 留言保留策略

| 顯示 | 儲存 |
|------|------|
| 主頁只顯示 **最近 3 天** 的留言 | 虛擬留言/訪問在服務器保留 **7 天** |

> 每天 Cron Job 會自動清理超過 7 天的虛擬記錄

```
├── app/
│   ├── api/cron/virtual-visits/route.ts   # Cron Job API
│   ├── admin/virtual-comments/page.tsx    # 管理後台頁面
│   └── user/[id]/page.tsx                 # 虛擬用戶個人頁面
├── components/
│   └── PersonalSpaceContent.tsx           # 顯示虛擬訪客和留言
├── supabase/migrations/
│   ├── 021_create_virtual_profiles.sql    # 虛擬用戶表
│   ├── 026_virtual_visits.sql             # 虛擬訪問支援
│   ├── 027_increment_views_function.sql   # 瀏覽量函數
│   └── 028_virtual_comments.sql           # 虛擬留言支援
└── vercel.json                            # Cron 排程設定
```

---

## 資料庫表格

### virtual_profiles（虛擬用戶）
- `id` - UUID 主鍵
- `display_name` - 顯示名稱（如「王**」「李**」）
- `avatar_url` - 頭像 URL
- `bio` - 簡介

### profile_visits（訪問記錄）
- `profile_user_id` - 被訪問的用戶
- `visitor_id` - 真實訪客 ID（可為 NULL）
- `virtual_visitor_id` - 虛擬訪客 ID
- `is_virtual` - 是否為虛擬訪問
- `visited_at` - 訪問時間

### profile_comments（留言）
- `profile_user_id` - 被留言的用戶
- `commenter_id` - 真實留言者 ID（可為 NULL）
- `virtual_commenter_id` - 虛擬留言者 ID
- `is_virtual` - 是否為虛擬留言
- `content` - 留言內容

---

## 使用方式

### 自動執行（Cron Job）
- **時間**：每天 11:00（UTC+8）
- **API**：`/api/cron/virtual-visits`
- **設定**：`vercel.json`

### 手動管理
1. 進入 `/admin/virtual-comments`
2. 選擇目標用戶
3. 選擇虛擬用戶
4. 輸入留言內容或使用快速範本
5. 發送

---

## 預設留言範本

```
收藏好漂亮！🌟
大佬帶帶我 🙏
什麼時候再上新的？
好羨慕你的收藏
這個配布我也有！
可以交流一下嗎？
新手報到！學習中 📚
你的願望清單我都想要 😂
收藏家 respect 🫡
路過留言～
太強了吧這收藏！
期待你的新增收藏 👀
```

---

## 環境變數

| 變數名稱 | 說明 |
|---------|------|
| `CRON_SECRET` | Cron Job 安全驗證金鑰 |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase 服務角色金鑰（用於繞過 RLS） |

---

## 更新日誌

- **2026-02-08** - 建立水軍留言管理後台
- **2026-02-08** - 新增虛擬留言到 Cron Job
- **2026-02-08** - 整合虛擬用戶系統，使用 virtual_profiles 作為訪客來源
