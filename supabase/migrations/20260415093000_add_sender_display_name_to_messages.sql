ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS sender_display_name TEXT;

COMMENT ON COLUMN public.messages.sender_display_name IS
'管理員發送訊息時顯示給收件者看的回覆者身分，例如 客服團隊 或 小菜';
