# 邀請碼功能說明

## ✅ 已完成的更新

### 1. 資料庫變更
創建了新的遷移文件：`supabase/migrations/008_add_invitation_code.sql`

- ✅ 在 `profiles` 表中添加 `invitation_code` 欄位（VARCHAR(50)）
- ✅ 創建索引以提升查詢效能
- ✅ 欄位為可選（nullable），不會影響現有用戶

### 2. 註冊頁面更新
更新了 `app/signup/page.tsx`：

- ✅ 添加邀請碼輸入框
- ✅ 邀請碼為可選填寫，不影響正常註冊流程
- ✅ 輸入框限制最多 50 個字符
- ✅ 添加說明文字：「如果您有邀請碼，填寫後可享有特定優惠或權限」
- ✅ 註冊成功後自動保存邀請碼到用戶資料

## 📋 資料庫遷移步驟

在 Supabase Dashboard 執行以下 SQL（或等待本地同步）：

\`\`\`sql
-- 添加邀請碼字段到 profiles 表
ALTER TABLE profiles 
ADD COLUMN invitation_code VARCHAR(50);

-- 創建邀請碼索引以便快速查詢
CREATE INDEX IF NOT EXISTS idx_profiles_invitation_code ON profiles(invitation_code);
\`\`\`

## 🎯 使用方式

### 用戶註冊時：
1. 訪問註冊頁面：https://eventglass.vercel.app/signup
2. 填寫必填欄位（Email、密碼）
3. 選填暱稱
4. **選填邀請碼**（如有）
5. 完成註冊

### 管理員查看邀請碼：
可以在 Supabase Dashboard 或通過 API 查詢用戶的邀請碼：

\`\`\`sql
SELECT id, email, full_name, invitation_code 
FROM profiles 
WHERE invitation_code IS NOT NULL;
\`\`\`

## 🔮 未來擴展建議

### 1. 邀請碼驗證
可以創建一個 `invitation_codes` 表來管理有效的邀請碼：

\`\`\`sql
CREATE TABLE invitation_codes (
  code VARCHAR(50) PRIMARY KEY,
  description TEXT,
  max_uses INTEGER,
  used_count INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
\`\`\`

### 2. 邀請碼優惠
- 根據邀請碼給予特定權限
- 提供活動報名優先權
- 贈送會員點數或優惠

### 3. 邀請碼統計
在管理後台添加邀請碼使用統計：
- 查看每個邀請碼的使用次數
- 統計轉換率
- 追蹤邀請來源

## 📊 當前功能特點

✅ **簡單易用**：只需要一個輸入框，不強制填寫  
✅ **不影響現有流程**：即使不填邀請碼也能正常註冊  
✅ **資料完整性**：邀請碼會被保存到用戶資料中  
✅ **可擴展性**：預留了未來添加驗證和優惠功能的空間  

## 🚀 部署狀態

- ✅ 代碼已提交到 GitHub
- ✅ Vercel 會自動部署新版本
- ⚠️ 需要在 Supabase Dashboard 手動執行資料庫遷移

---

**注意**：記得在 Supabase Dashboard 的 SQL Editor 中執行 `008_add_invitation_code.sql` 中的 SQL 語句！
