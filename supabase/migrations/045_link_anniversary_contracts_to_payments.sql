ALTER TABLE anniversary_campaigns
ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES events(id) ON DELETE SET NULL;

ALTER TABLE anniversary_contracts
ADD COLUMN IF NOT EXISTS payment_record_id UUID REFERENCES user_payments(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS delivery_record_id UUID REFERENCES user_deliveries(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_anniversary_campaigns_event_id
  ON anniversary_campaigns(event_id);

CREATE INDEX IF NOT EXISTS idx_anniversary_contracts_payment_record_id
  ON anniversary_contracts(payment_record_id);

CREATE INDEX IF NOT EXISTS idx_anniversary_contracts_delivery_record_id
  ON anniversary_contracts(delivery_record_id);

INSERT INTO events (
  title,
  description,
  start_date,
  end_date,
  max_participants,
  status,
  organizer_category,
  eligibility_requirements,
  location,
  price,
  is_free,
  series_tag
)
SELECT
  '30 週年心願契約守護戰',
  '30 週年限定的七日守護試煉。先支付 2700 締結主契約，守住前 10 讓心願寶可夢正式成立；曾踏入前 10，則可解鎖守護伊布的追加契約。',
  '2026-03-19 00:00:00+08'::timestamptz,
  '2026-03-26 23:59:59+08'::timestamptz,
  150,
  'published'::event_status,
  'admin',
  '需先完成主契約締結；曾踏入前 10 才能啟動追加契約顯現儀式。',
  'Event Glass 線上守護戰場',
  2700,
  false,
  '30週年契約'
WHERE NOT EXISTS (
  SELECT 1
  FROM events
  WHERE title = '30 週年心願契約守護戰'
    AND start_date = '2026-03-19 00:00:00+08'::timestamptz
    AND end_date = '2026-03-26 23:59:59+08'::timestamptz
);

UPDATE anniversary_campaigns AS campaigns
SET event_id = matching_event.id,
    updated_at = NOW()
FROM (
  SELECT id
  FROM events
  WHERE title = '30 週年心願契約守護戰'
    AND start_date = '2026-03-19 00:00:00+08'::timestamptz
    AND end_date = '2026-03-26 23:59:59+08'::timestamptz
  ORDER BY created_at ASC
  LIMIT 1
) AS matching_event
WHERE campaigns.slug = 'guardian-trial-30th'
  AND campaigns.event_id IS DISTINCT FROM matching_event.id;
