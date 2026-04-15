ALTER TABLE public.backpack_items
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

COMMENT ON COLUMN public.backpack_items.expires_at IS
'背包道具有效期限，超過期限後視為過期不可使用';
