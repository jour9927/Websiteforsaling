-- 创建用户付款表
CREATE TABLE IF NOT EXISTS user_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
  payment_date TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_user_payments_user_id ON user_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_user_payments_event_id ON user_payments(event_id);
CREATE INDEX IF NOT EXISTS idx_user_payments_status ON user_payments(status);

-- 启用 RLS
ALTER TABLE user_payments ENABLE ROW LEVEL SECURITY;

-- 用户可以查看自己的付款记录
CREATE POLICY "Users can view their own payments"
  ON user_payments
  FOR SELECT
  USING (auth.uid() = user_id);

-- 管理员可以查看所有付款记录
CREATE POLICY "Admins can view all payments"
  ON user_payments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- 管理员可以插入付款记录
CREATE POLICY "Admins can insert payments"
  ON user_payments
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- 管理员可以更新付款记录
CREATE POLICY "Admins can update payments"
  ON user_payments
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- 管理员可以删除付款记录
CREATE POLICY "Admins can delete payments"
  ON user_payments
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_user_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_payments_updated_at
  BEFORE UPDATE ON user_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_user_payments_updated_at();
