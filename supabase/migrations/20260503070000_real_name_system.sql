-- 實名制：入群基本要求
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS real_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS real_name_kana TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS owned_games TEXT[] DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS real_name_submitted_at TIMESTAMPTZ;

COMMENT ON COLUMN profiles.real_name IS '實名（支援中英日）';
COMMENT ON COLUMN profiles.real_name_kana IS '日文讀音（選填）';
COMMENT ON COLUMN profiles.owned_games IS '持有的寶可夢遊戲';
COMMENT ON COLUMN profiles.real_name_submitted_at IS '實名提交時間';
