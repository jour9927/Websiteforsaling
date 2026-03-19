CREATE TABLE IF NOT EXISTS anniversary_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  total_days INTEGER NOT NULL DEFAULT 7,
  battles_per_day INTEGER NOT NULL DEFAULT 2,
  top_cut INTEGER NOT NULL DEFAULT 10,
  entry_fee NUMERIC(10, 2) NOT NULL DEFAULT 2700,
  additional_fee NUMERIC(10, 2) NOT NULL DEFAULT 2700,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'ended')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS anniversary_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES anniversary_campaigns(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_pokemon TEXT NOT NULL,
  entry_fee_amount NUMERIC(10, 2) NOT NULL DEFAULT 2700,
  entry_fee_paid_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  current_rank INTEGER,
  best_rank INTEGER,
  final_rank INTEGER,
  total_battles_used INTEGER NOT NULL DEFAULT 0,
  today_battles_used INTEGER NOT NULL DEFAULT 0,
  last_battle_day DATE,
  has_entered_top_cut BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (campaign_id, user_id)
);

CREATE TABLE IF NOT EXISTS anniversary_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES anniversary_participants(id) ON DELETE CASCADE,
  contract_type TEXT NOT NULL CHECK (contract_type IN ('main', 'additional')),
  pokemon_name TEXT,
  price NUMERIC(10, 2) NOT NULL DEFAULT 2700,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'unlocked', 'priced', 'claimable', 'paid', 'delivered', 'forfeited')),
  revealed_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (participant_id, contract_type)
);

CREATE TABLE IF NOT EXISTS anniversary_battles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES anniversary_participants(id) ON DELETE CASCADE,
  battle_day INTEGER NOT NULL,
  battle_no INTEGER NOT NULL,
  template_code TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'won', 'lost')),
  final_tug_position INTEGER NOT NULL DEFAULT 0,
  opened_top_cut BOOLEAN NOT NULL DEFAULT FALSE,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (participant_id, battle_day, battle_no)
);

CREATE TABLE IF NOT EXISTS anniversary_battle_rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  battle_id UUID NOT NULL REFERENCES anniversary_battles(id) ON DELETE CASCADE,
  round_no INTEGER NOT NULL,
  game_type TEXT NOT NULL,
  scripted_outcome TEXT NOT NULL CHECK (scripted_outcome IN ('win', 'lose')),
  tug_delta INTEGER NOT NULL DEFAULT 0,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (battle_id, round_no)
);

CREATE TABLE IF NOT EXISTS anniversary_reveal_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL UNIQUE REFERENCES anniversary_participants(id) ON DELETE CASCADE,
  additional_unlocked_at TIMESTAMPTZ,
  revealed_pokemon TEXT,
  price_resolved NUMERIC(10, 2),
  price_resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS anniversary_curated_routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL UNIQUE REFERENCES anniversary_participants(id) ON DELETE CASCADE,
  force_final_top_cut BOOLEAN NOT NULL DEFAULT FALSE,
  force_additional_pokemon TEXT,
  force_additional_price NUMERIC(10, 2),
  preferred_templates TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_anniversary_participants_campaign_user
  ON anniversary_participants(campaign_id, user_id);
CREATE INDEX IF NOT EXISTS idx_anniversary_participants_current_rank
  ON anniversary_participants(campaign_id, current_rank);
CREATE INDEX IF NOT EXISTS idx_anniversary_contracts_participant
  ON anniversary_contracts(participant_id);
CREATE INDEX IF NOT EXISTS idx_anniversary_battles_participant
  ON anniversary_battles(participant_id);
CREATE INDEX IF NOT EXISTS idx_anniversary_rounds_battle
  ON anniversary_battle_rounds(battle_id);

ALTER TABLE anniversary_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE anniversary_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE anniversary_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE anniversary_battles ENABLE ROW LEVEL SECURITY;
ALTER TABLE anniversary_battle_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE anniversary_reveal_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE anniversary_curated_routes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active anniversary campaigns"
  ON anniversary_campaigns
  FOR SELECT
  USING (status = 'active');

CREATE POLICY "Admins can manage anniversary campaigns"
  ON anniversary_campaigns
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Users can view own anniversary participation"
  ON anniversary_participants
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Users can create own anniversary participation"
  ON anniversary_participants
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage anniversary participants"
  ON anniversary_participants
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Users can view own anniversary contracts"
  ON anniversary_contracts
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM anniversary_participants ap
      WHERE ap.id = anniversary_contracts.participant_id
      AND ap.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Users can create own anniversary contracts"
  ON anniversary_contracts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM anniversary_participants ap
      WHERE ap.id = anniversary_contracts.participant_id
      AND ap.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage anniversary contracts"
  ON anniversary_contracts
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Users can view own anniversary battles"
  ON anniversary_battles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM anniversary_participants ap
      WHERE ap.id = anniversary_battles.participant_id
      AND ap.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage anniversary battles"
  ON anniversary_battles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Users can view own anniversary battle rounds"
  ON anniversary_battle_rounds
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM anniversary_battles ab
      JOIN anniversary_participants ap ON ap.id = ab.participant_id
      WHERE ab.id = anniversary_battle_rounds.battle_id
      AND ap.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage anniversary battle rounds"
  ON anniversary_battle_rounds
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Users can view own anniversary reveal states"
  ON anniversary_reveal_states
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM anniversary_participants ap
      WHERE ap.id = anniversary_reveal_states.participant_id
      AND ap.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage anniversary reveal states"
  ON anniversary_reveal_states
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage anniversary curated routes"
  ON anniversary_curated_routes
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE OR REPLACE FUNCTION update_anniversary_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_anniversary_campaigns_updated_at ON anniversary_campaigns;
CREATE TRIGGER update_anniversary_campaigns_updated_at
  BEFORE UPDATE ON anniversary_campaigns
  FOR EACH ROW EXECUTE FUNCTION update_anniversary_updated_at();

DROP TRIGGER IF EXISTS update_anniversary_participants_updated_at ON anniversary_participants;
CREATE TRIGGER update_anniversary_participants_updated_at
  BEFORE UPDATE ON anniversary_participants
  FOR EACH ROW EXECUTE FUNCTION update_anniversary_updated_at();

DROP TRIGGER IF EXISTS update_anniversary_contracts_updated_at ON anniversary_contracts;
CREATE TRIGGER update_anniversary_contracts_updated_at
  BEFORE UPDATE ON anniversary_contracts
  FOR EACH ROW EXECUTE FUNCTION update_anniversary_updated_at();

DROP TRIGGER IF EXISTS update_anniversary_reveal_states_updated_at ON anniversary_reveal_states;
CREATE TRIGGER update_anniversary_reveal_states_updated_at
  BEFORE UPDATE ON anniversary_reveal_states
  FOR EACH ROW EXECUTE FUNCTION update_anniversary_updated_at();

DROP TRIGGER IF EXISTS update_anniversary_curated_routes_updated_at ON anniversary_curated_routes;
CREATE TRIGGER update_anniversary_curated_routes_updated_at
  BEFORE UPDATE ON anniversary_curated_routes
  FOR EACH ROW EXECUTE FUNCTION update_anniversary_updated_at();

INSERT INTO anniversary_campaigns (
  slug,
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
  'guardian-trial-30th',
  '30 週年心願契約守護戰',
  '以 2700 締結主契約，在七日守護戰中守住你的心願寶可夢，並在踏入前 10 時解鎖守護伊布的追加契約。',
  '2026-03-19 00:00:00+08',
  '2026-03-26 23:59:59+08',
  7,
  2,
  10,
  2700,
  2700,
  'active'
)
ON CONFLICT (slug) DO UPDATE SET
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
