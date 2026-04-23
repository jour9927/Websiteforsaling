INSERT INTO events (
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
  '4d7e3f3f-f4a2-4d3c-9d0f-042520260001'::uuid,
  '隨機型配布對戰活動',
  '4/23 開放預先報名，4/25 正式開戰。活動為期九天，每天最多兩場復古對戰；勝場 2 分、敗場 1 分，累積 19 分即可取得伊布配布資格。',
  NULL,
  '2026-04-23 00:00:00+08'::timestamptz,
  '2026-05-03 23:59:59+08'::timestamptz,
  500,
  'published'::event_status,
  'admin',
  '需先完成預先報名，進入活動頁後選擇一隻出場寶可夢。',
  'Event Glass 線上對戰場',
  0,
  TRUE,
  NULL,
  0,
  '隨機型配布',
  0
)
ON CONFLICT (id) DO UPDATE
SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  max_participants = EXCLUDED.max_participants,
  status = EXCLUDED.status,
  organizer_category = EXCLUDED.organizer_category,
  eligibility_requirements = EXCLUDED.eligibility_requirements,
  location = EXCLUDED.location,
  price = EXCLUDED.price,
  is_free = EXCLUDED.is_free,
  estimated_value = EXCLUDED.estimated_value,
  series_tag = EXCLUDED.series_tag,
  offline_registrations = EXCLUDED.offline_registrations,
  updated_at = NOW();

INSERT INTO anniversary_campaigns (
  slug,
  event_id,
  title,
  description,
  starts_at,
  ends_at,
  total_days,
  battles_per_day,
  top_cut,
  entry_fee,
  additional_fee,
  status
)
VALUES (
  'random-distribution-eevee-2026',
  '4d7e3f3f-f4a2-4d3c-9d0f-042520260001'::uuid,
  '隨機型配布對戰活動',
  '4/23 開放預先報名，4/25 正式開戰。九天內每天最多 2 場，勝場 2 分、敗場 1 分，累積 19 分取得伊布。',
  '2026-04-25 00:00:00+08'::timestamptz,
  '2026-05-03 23:59:59+08'::timestamptz,
  9,
  2,
  0,
  0,
  0,
  'active'
)
ON CONFLICT (slug) DO UPDATE
SET
  event_id = EXCLUDED.event_id,
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  starts_at = EXCLUDED.starts_at,
  ends_at = EXCLUDED.ends_at,
  total_days = EXCLUDED.total_days,
  battles_per_day = EXCLUDED.battles_per_day,
  top_cut = EXCLUDED.top_cut,
  entry_fee = EXCLUDED.entry_fee,
  additional_fee = EXCLUDED.additional_fee,
  status = EXCLUDED.status,
  updated_at = NOW();
