ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS last_read_backpack_items_at TIMESTAMPTZ;

COMMENT ON COLUMN public.profiles.last_read_backpack_items_at IS
'使用者最後一次查看背包新道具提示的時間，用於背包氣泡未讀數';
