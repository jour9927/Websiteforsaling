# Changelog

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
