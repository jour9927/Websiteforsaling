-- 獨立商店商品表
CREATE TABLE IF NOT EXISTS shop_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  price INTEGER NOT NULL DEFAULT 0,
  image_url TEXT DEFAULT '',
  category TEXT DEFAULT '一般',
  stock INTEGER DEFAULT -1,  -- -1 = 無限庫存
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: 任何人都可以看已上架商品
ALTER TABLE shop_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active products"
  ON shop_products FOR SELECT
  USING (is_active = true);

-- Admin 有完整 CRUD 權限
-- 使用 service_role key 繞過 RLS，此處只確保 anon key 的 SELECT 安全
