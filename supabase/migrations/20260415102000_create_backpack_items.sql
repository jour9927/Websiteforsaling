CREATE TABLE IF NOT EXISTS public.backpack_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (
    item_type IN (
      'blindbox_discount_500',
      'blindbox_discount_1000',
      'auction_fee_rebate_30',
      'auction_fee_rebate_40'
    )
  ),
  item_name TEXT NOT NULL,
  note TEXT,
  granted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_backpack_items_user_id ON public.backpack_items(user_id);
CREATE INDEX IF NOT EXISTS idx_backpack_items_created_at ON public.backpack_items(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_backpack_items_active ON public.backpack_items(is_active);

ALTER TABLE public.backpack_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own backpack items" ON public.backpack_items;
CREATE POLICY "Users can view their own backpack items"
ON public.backpack_items
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all backpack items" ON public.backpack_items;
CREATE POLICY "Admins can view all backpack items"
ON public.backpack_items
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);

DROP POLICY IF EXISTS "Admins can insert backpack items" ON public.backpack_items;
CREATE POLICY "Admins can insert backpack items"
ON public.backpack_items
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);

DROP POLICY IF EXISTS "Admins can update backpack items" ON public.backpack_items;
CREATE POLICY "Admins can update backpack items"
ON public.backpack_items
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);

DROP POLICY IF EXISTS "Admins can delete backpack items" ON public.backpack_items;
CREATE POLICY "Admins can delete backpack items"
ON public.backpack_items
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);
