ALTER TABLE public.backpack_items
  DROP CONSTRAINT IF EXISTS backpack_items_item_type_check;

ALTER TABLE public.backpack_items
  ADD CONSTRAINT backpack_items_item_type_check
  CHECK (
    item_type IN (
      'blindbox_discount_500',
      'blindbox_discount_1000',
      'auction_fee_rebate_30',
      'auction_fee_rebate_40',
      'pokemon_choice_5'
    )
  );
