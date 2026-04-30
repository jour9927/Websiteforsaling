INSERT INTO public.events (
  id,
  title,
  description,
  image_url,
  start_date,
  end_date,
  max_participants,
  status,
  organizer_category,
  eligibility_requirements,
  location,
  price,
  is_free,
  visual_card_url,
  estimated_value,
  series_tag,
  offline_registrations
)
VALUES (
  '20260510-4700-4000-8000-000000000001'::uuid,
  '葉伊布配布指定系列排除活動',
  '6/10 預定舉辦。參與資格 NT$ 9,999，可先指定排除至少 3 隻寶可夢；第 4 隻起每多排除 1 隻加 NT$ 1,000。可與正式盲盒抵用券疊加使用，讓抽選池更貼近想要的葉伊布配布方向。',
  'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/470.png',
  '2026-06-10 00:00:00+08'::timestamptz,
  '2026-06-10 23:59:59+08'::timestamptz,
  NULL,
  'draft'::event_status,
  'admin',
  '參與資格 NT$ 9,999。至少預選排除 3 隻；第 4 隻起每多 1 隻加 NT$ 1,000。可與正式盲盒抵用券疊加使用。',
  'Event Glass 線上配布',
  9999,
  FALSE,
  'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/470.png',
  9999,
  '葉伊布配布',
  0
)
ON CONFLICT (id) DO UPDATE
SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  image_url = EXCLUDED.image_url,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  max_participants = EXCLUDED.max_participants,
  status = EXCLUDED.status,
  organizer_category = EXCLUDED.organizer_category,
  eligibility_requirements = EXCLUDED.eligibility_requirements,
  location = EXCLUDED.location,
  price = EXCLUDED.price,
  is_free = EXCLUDED.is_free,
  visual_card_url = EXCLUDED.visual_card_url,
  estimated_value = EXCLUDED.estimated_value,
  series_tag = EXCLUDED.series_tag,
  offline_registrations = EXCLUDED.offline_registrations,
  updated_at = NOW();

UPDATE public.events
SET
  end_date = '2026-05-15 23:59:59+08'::timestamptz,
  updated_at = NOW()
WHERE id = '4d7e3f3f-f4a2-4d3c-9d0f-042520260001'::uuid;

UPDATE public.anniversary_campaigns
SET
  ends_at = '2026-05-15 23:59:59+08'::timestamptz,
  total_days = 21,
  updated_at = NOW()
WHERE slug = 'random-distribution-eevee-2026';
