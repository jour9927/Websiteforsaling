-- Blind Box System for Events
-- This migration creates tables and functions to support blind box drawing mechanics

-- Table to store blind box reward pools for events
CREATE TABLE blind_box_rewards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  pokemon_name TEXT NOT NULL,
  pokemon_name_en TEXT,
  pokemon_dex_number INTEGER,
  points INTEGER NOT NULL DEFAULT 0,
  quantity INTEGER NOT NULL, -- Total quantity available
  remaining INTEGER NOT NULL, -- Remaining quantity
  sprite_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index for faster event lookups
CREATE INDEX idx_blind_box_rewards_event ON blind_box_rewards(event_id);

-- Enable RLS
ALTER TABLE blind_box_rewards ENABLE ROW LEVEL SECURITY;

-- Users can view rewards for published events
CREATE POLICY "Users can view rewards for published events"
  ON blind_box_rewards FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = blind_box_rewards.event_id
        AND events.status = 'published'
    )
    OR auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );

-- Admins can manage rewards
CREATE POLICY "Admins can manage rewards"
  ON blind_box_rewards FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Trigger for updated_at
CREATE TRIGGER update_blind_box_rewards_updated_at
  BEFORE UPDATE ON blind_box_rewards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to draw from blind box
CREATE OR REPLACE FUNCTION draw_blind_box(
  p_event_id UUID,
  p_user_id UUID,
  p_seed TEXT
)
RETURNS TABLE (
  drawn_rewards JSONB,
  message TEXT
) AS $$
DECLARE
  v_registration_exists BOOLEAN;
  v_already_drawn BOOLEAN;
  v_event_title TEXT;
  v_total_rewards INTEGER;
  v_rewards_to_draw RECORD;
  v_drawn_items JSONB := '[]'::JSONB;
  v_item_object JSONB;
BEGIN
  -- Check if user is registered for the event
  SELECT EXISTS (
    SELECT 1 FROM registrations
    WHERE event_id = p_event_id
      AND user_id = p_user_id
      AND status IN ('confirmed', 'pending')
  ) INTO v_registration_exists;

  IF NOT v_registration_exists THEN
    RETURN QUERY SELECT 
      '[]'::JSONB,
      '您尚未報名此活動'::TEXT;
    RETURN;
  END IF;

  -- Check if user already drew
  SELECT EXISTS (
    SELECT 1 FROM draw_results
    WHERE event_id = p_event_id
      AND user_id = p_user_id
  ) INTO v_already_drawn;

  IF v_already_drawn THEN
    RETURN QUERY SELECT 
      '[]'::JSONB,
      '您已經抽過盲盒了'::TEXT;
    RETURN;
  END IF;

  -- Get event title
  SELECT title INTO v_event_title
  FROM events
  WHERE id = p_event_id;

  -- Draw all available rewards for this event
  FOR v_rewards_to_draw IN
    SELECT id, pokemon_name, pokemon_name_en, pokemon_dex_number, 
           points, sprite_url, remaining
    FROM blind_box_rewards
    WHERE event_id = p_event_id
      AND remaining > 0
    ORDER BY id -- Deterministic order for consistent draws
  LOOP
    -- Decrease remaining quantity
    UPDATE blind_box_rewards
    SET remaining = remaining - 1
    WHERE id = v_rewards_to_draw.id;

    -- Add to user_items
    INSERT INTO user_items (user_id, event_id, name, quantity, notes)
    VALUES (
      p_user_id,
      p_event_id,
      v_rewards_to_draw.pokemon_name,
      1,
      format('從「%s」盲盒抽中', v_event_title)
    );

    -- Build item object
    v_item_object := jsonb_build_object(
      'pokemon_name', v_rewards_to_draw.pokemon_name,
      'pokemon_name_en', v_rewards_to_draw.pokemon_name_en,
      'pokemon_dex_number', v_rewards_to_draw.pokemon_dex_number,
      'points', v_rewards_to_draw.points,
      'sprite_url', v_rewards_to_draw.sprite_url
    );

    -- Add to drawn items array
    v_drawn_items := v_drawn_items || v_item_object;
  END LOOP;

  -- Record draw result
  INSERT INTO draw_results (event_id, user_id)
  VALUES (p_event_id, p_user_id);

  -- Return results
  RETURN QUERY SELECT 
    v_drawn_items,
    format('恭喜！您抽中了 %s 個獎勵！', jsonb_array_length(v_drawn_items))::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert Sylveon Blind Box Event
INSERT INTO events (
  title,
  description,
  start_date,
  end_date,
  max_participants,
  offline_registrations,
  price,
  is_free,
  status,
  location,
  organizer_category,
  eligibility_requirements
) VALUES (
  '仙子伊布配布盲盒',
  '每個盲盒包含 2 隻寶可夢：1 隻伊布 + 1 隻高點數仙子伊布（70,000+ 點數）！限量 50 盒，機會難得，先搶先贏！',
  '2026-03-12 10:00:00+08',
  '2026-03-12 18:00:00+08',
  50,
  48,
  5990,
  false,
  'published',
  '配布活動現場',
  'admin',
  '需完成線上付款或現場報名'
) RETURNING id;

-- Get the event_id for inserting rewards
-- Note: In practice, you'd run this separately or use a script
-- For now, admins can insert rewards manually via the admin interface

-- Example rewards structure (to be inserted after event creation):
-- INSERT INTO blind_box_rewards (event_id, pokemon_name, pokemon_name_en, pokemon_dex_number, points, quantity, remaining, sprite_url)
-- SELECT 
--   (SELECT id FROM events WHERE title = '仙子伊布配布盲盒' LIMIT 1),
--   '伊布', 'Eevee', 133, 0, 50, 50,
--   'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/133.png'
-- UNION ALL
-- SELECT 
--   (SELECT id FROM events WHERE title = '仙子伊布配布盲盒' LIMIT 1),
--   '仙子伊布', 'Sylveon', 700, 75000, 50, 50,
--   'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/700.png';

