-- 洗翠索羅亞克批量競標排程
-- 2026-06-11 06:00 ~ 23:00 每 10 分鐘一場，共 102 場
-- 每場 end_time = start + 10 分鐘，global_link_v2 引擎虛擬競標
-- 底價 2000，虛擬目標 3000-6000

DO $$
DECLARE
  v_dist_id UUID := '71e74379-1c82-4fca-92db-2f8e2c0a5d8a';
  v_start TIMESTAMPTZ;
  v_end TIMESTAMPTZ;
  v_i INTEGER;
  v_hours INTEGER;
  v_mins INTEGER;
  v_end_hours INTEGER;
  v_end_mins INTEGER;
  v_today DATE := '2026-06-11';
  v_title TEXT;
BEGIN
  FOR v_i IN 0..101 LOOP
    v_hours := 6 + (v_i * 10) / 60;
    v_mins := (v_i * 10) % 60;
    v_end_hours := 6 + ((v_i + 1) * 10) / 60;
    v_end_mins := ((v_i + 1) * 10) % 60;
    
    v_start := (v_today + v_hours * INTERVAL '1 hour' + v_mins * INTERVAL '1 minute') AT TIME ZONE 'Asia/Taipei';
    v_end := (v_today + v_end_hours * INTERVAL '1 hour' + v_end_mins * INTERVAL '1 minute') AT TIME ZONE 'Asia/Taipei';
    
    v_title := '洗翠的樣子的索羅亞克 #' || LPAD(CAST(v_i + 1 AS TEXT), 3, '0');

    INSERT INTO public.auctions (
      distribution_id,
      title,
      description,
      starting_price,
      min_increment,
      current_price,
      start_time,
      end_time,
      status,
      bid_count,
      automation_mode,
      automation_target_min,
      automation_target_max,
      automation_stop_seconds
    ) VALUES (
      v_dist_id,
      v_title,
      '洗翠的樣子索羅亞克限時競標，10 分鐘決勝負！',
      2000,
      20,
      0,
      v_start,
      v_end,
      'active',
      0,
      'global_link_v2',
      3000,
      6000,
      1
    );
  END LOOP;
END;
$$;
