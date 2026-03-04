-- 為每位用戶新增 AI 個人化設定欄位
-- ai_system_prompt: 管理員為該用戶手動撰寫的專屬 system prompt（覆蓋共用模板中的用戶描述）
-- ai_user_summary: 管理員為該用戶撰寫的摘要（收藏偏好、個性、互動風格等）

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS ai_system_prompt TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS ai_user_summary TEXT DEFAULT NULL;

COMMENT ON COLUMN profiles.ai_system_prompt IS '管理員自訂該用戶的 AI system prompt（如為空則使用共用模板）';
COMMENT ON COLUMN profiles.ai_user_summary IS '管理員自訂該用戶的 AI 摘要（收藏偏好、個性描述等）';
