-- Add the selected deferred payment duration for shop orders.
-- Existing deferred orders default to one month so older reservations stay valid.

ALTER TABLE public.shop_orders
  ADD COLUMN IF NOT EXISTS deferred_payment_months INTEGER;

UPDATE public.shop_orders
SET deferred_payment_months = 1
WHERE payment_method = 'deferred'
  AND deferred_payment_months IS NULL;

UPDATE public.shop_orders
SET deferred_payment_months = NULL
WHERE payment_method <> 'deferred'
  AND deferred_payment_months IS NOT NULL;

ALTER TABLE public.shop_orders
  DROP CONSTRAINT IF EXISTS shop_orders_deferred_payment_months_check;

ALTER TABLE public.shop_orders
  ADD CONSTRAINT shop_orders_deferred_payment_months_check
  CHECK (
    (
      payment_method = 'deferred'
      AND deferred_payment_months IN (1, 2)
    )
    OR (
      payment_method <> 'deferred'
      AND deferred_payment_months IS NULL
    )
  );

CREATE INDEX IF NOT EXISTS idx_shop_orders_deferred_payment_months
  ON public.shop_orders(deferred_payment_months)
  WHERE payment_method = 'deferred';
