-- 新增活動欄位
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS organizer_category TEXT DEFAULT 'admin' CHECK (organizer_category IN ('admin', 'vip')),
ADD COLUMN IF NOT EXISTS eligibility_requirements TEXT,
ADD COLUMN IF NOT EXISTS location TEXT;

-- 新增函式：計算已報名人數
CREATE OR REPLACE FUNCTION get_registration_count(event_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM registrations
    WHERE registrations.event_id = get_registration_count.event_id
      AND status IN ('pending', 'confirmed')
  );
END;
$$ LANGUAGE plpgsql;
