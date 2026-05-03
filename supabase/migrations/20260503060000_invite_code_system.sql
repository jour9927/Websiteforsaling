-- 邀請碼系統：registrations 追蹤邀請關係 + events 啟用驚喜抽獎
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS invited_by_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- 活動啟用邀請碼驚喜功能
ALTER TABLE events ADD COLUMN IF NOT EXISTS invite_surprise_enabled BOOLEAN DEFAULT false;

COMMENT ON COLUMN registrations.invited_by_user_id IS '邀請此使用者報名的人（來自邀請碼）';
COMMENT ON COLUMN events.invite_surprise_enabled IS '活動結束後是否為有邀請人的使用者開啟驚喜抽獎';
