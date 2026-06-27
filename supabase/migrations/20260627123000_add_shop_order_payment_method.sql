-- Add checkout payment method for shop orders.
-- pay_now keeps the existing checkout behavior; deferred lets users reserve first and pay later.

ALTER TABLE public.shop_orders
  ADD COLUMN IF NOT EXISTS payment_method TEXT NOT NULL DEFAULT 'pay_now'
  CHECK (payment_method IN ('pay_now', 'deferred'));

CREATE INDEX IF NOT EXISTS idx_shop_orders_payment_method
  ON public.shop_orders(payment_method);
