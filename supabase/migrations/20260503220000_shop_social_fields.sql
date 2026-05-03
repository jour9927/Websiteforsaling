-- Add social/community fields to shop_products
ALTER TABLE shop_products
  ADD COLUMN IF NOT EXISTS seller_name TEXT,
  ADD COLUMN IF NOT EXISTS interested_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS liked_count INTEGER DEFAULT 0;
