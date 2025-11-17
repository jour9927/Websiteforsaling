-- 创建交付记录表
CREATE TABLE IF NOT EXISTS user_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'delivered', 'in_transit', 'cancelled')),
  delivery_date TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_user_deliveries_user_id ON user_deliveries(user_id);
CREATE INDEX IF NOT EXISTS idx_user_deliveries_event_id ON user_deliveries(event_id);
CREATE INDEX IF NOT EXISTS idx_user_deliveries_status ON user_deliveries(status);

-- 启用 RLS
ALTER TABLE user_deliveries ENABLE ROW LEVEL SECURITY;

-- 用户可以查看自己的交付记录
CREATE POLICY "Users can view their own deliveries"
  ON user_deliveries
  FOR SELECT
  USING (auth.uid() = user_id);

-- 管理员可以查看所有交付记录
CREATE POLICY "Admins can view all deliveries"
  ON user_deliveries
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- 管理员可以插入交付记录
CREATE POLICY "Admins can insert deliveries"
  ON user_deliveries
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- 管理员可以更新交付记录
CREATE POLICY "Admins can update deliveries"
  ON user_deliveries
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- 管理员可以删除交付记录
CREATE POLICY "Admins can delete deliveries"
  ON user_deliveries
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_user_deliveries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_deliveries_updated_at
  BEFORE UPDATE ON user_deliveries
  FOR EACH ROW
  EXECUTE FUNCTION update_user_deliveries_updated_at();
