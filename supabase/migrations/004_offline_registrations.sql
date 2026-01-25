-- 新增線下報名人數欄位
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS offline_registrations INTEGER DEFAULT 0 NOT NULL;

-- 新增註解說明
COMMENT ON COLUMN events.offline_registrations IS '線下報名人數（手動調整）';

-- 更新函式：計算總報名人數（包含線上和線下）
CREATE OR REPLACE FUNCTION get_total_registration_count(event_id UUID)
RETURNS INTEGER AS $$
DECLARE
  online_count INTEGER;
  offline_count INTEGER;
BEGIN
  -- 計算線上報名人數
  SELECT COUNT(*)::INTEGER INTO online_count
  FROM registrations
  WHERE registrations.event_id = get_total_registration_count.event_id
    AND status IN ('pending', 'confirmed');
  
  -- 取得線下報名人數
  SELECT offline_registrations INTO offline_count
  FROM events
  WHERE id = get_total_registration_count.event_id;
  
  -- 回傳總和
  RETURN COALESCE(online_count, 0) + COALESCE(offline_count, 0);
END;
$$ LANGUAGE plpgsql;

-- 新增函式：取得剩餘可報名人數
CREATE OR REPLACE FUNCTION get_available_slots(event_id UUID)
RETURNS INTEGER AS $$
DECLARE
  max_slots INTEGER;
  total_registered INTEGER;
BEGIN
  -- 取得活動的人數上限
  SELECT max_participants INTO max_slots
  FROM events
  WHERE id = get_available_slots.event_id;
  
  -- 如果沒有上限，回傳 NULL（表示無限制）
  IF max_slots IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- 取得總報名人數
  total_registered := get_total_registration_count(event_id);
  
  -- 計算剩餘名額
  RETURN GREATEST(max_slots - total_registered, 0);
END;
$$ LANGUAGE plpgsql;
