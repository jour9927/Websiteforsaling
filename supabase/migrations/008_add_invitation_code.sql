-- 添加邀请码字段到 profiles 表
ALTER TABLE profiles 
ADD COLUMN invitation_code VARCHAR(50);

-- 创建邀请码索引以便快速查询
CREATE INDEX IF NOT EXISTS idx_profiles_invitation_code ON profiles(invitation_code);

-- 添加注释说明
COMMENT ON COLUMN profiles.invitation_code IS '用户注册时使用的邀请码（可选）';
