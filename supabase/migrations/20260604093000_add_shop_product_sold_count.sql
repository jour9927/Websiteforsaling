ALTER TABLE public.shop_products
ADD COLUMN IF NOT EXISTS sold_count INTEGER DEFAULT 0;

UPDATE public.shop_products
SET sold_count = 0
WHERE sold_count IS NULL;
