-- Global Link v2 競標排程：7:00~23:50 不間斷，每 10 分鐘一批，每批 2 個
TRUNCATE TABLE public.auction_automation_v2_schedule_slots;

INSERT INTO public.auction_automation_v2_schedule_slots (auction_family, local_start_time, timezone, max_per_day, duration_minutes, is_active)
SELECT
  'global_link_eeveelution',
  (TIME '07:00' + (generate_series(0, 101) * INTERVAL '10 minutes'))::TIME,
  'Asia/Taipei',
  2,
  10,
  true
ON CONFLICT (auction_family, local_start_time, timezone) DO UPDATE
SET max_per_day = 2,
    duration_minutes = 10,
    is_active = true;
