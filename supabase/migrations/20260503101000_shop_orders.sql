-- 商店訂單表
CREATE TABLE IF NOT EXISTS shop_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'delivered', 'cancelled')),
  total_amount INTEGER NOT NULL DEFAULT 0,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 訂單項目表
CREATE TABLE IF NOT EXISTS shop_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES shop_orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES shop_products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  price INTEGER NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: 用戶只能看自己的訂單
ALTER TABLE shop_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own orders"
  ON shop_orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own orders"
  ON shop_orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own order items"
  ON shop_order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM shop_orders
      WHERE shop_orders.id = shop_order_items.order_id
      AND shop_orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create own order items"
  ON shop_order_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM shop_orders
      WHERE shop_orders.id = shop_order_items.order_id
      AND shop_orders.user_id = auth.uid()
    )
  );

-- 索引
CREATE INDEX IF NOT EXISTS idx_shop_orders_user_id ON shop_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_shop_orders_status ON shop_orders(status);
CREATE INDEX IF NOT EXISTS idx_shop_order_items_order_id ON shop_order_items(order_id);
