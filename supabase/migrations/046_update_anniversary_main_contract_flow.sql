ALTER TABLE anniversary_contracts
ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMPTZ;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'anniversary_contracts'::regclass
      AND conname = 'anniversary_contracts_status_check'
  ) THEN
    ALTER TABLE anniversary_contracts DROP CONSTRAINT anniversary_contracts_status_check;
  END IF;
END $$;

ALTER TABLE anniversary_contracts
ADD CONSTRAINT anniversary_contracts_status_check
CHECK (
  status IN (
    'pending',
    'holding',
    'unlocked',
    'priced',
    'secured',
    'paid',
    'delivered',
    'refunded',
    'forfeited'
  )
);

UPDATE anniversary_contracts
SET
  status = 'holding',
  notes = COALESCE(
    notes,
    '主契約已進入暫時持有狀態；若未守到最後，2700 將退還。'
  )
WHERE contract_type = 'main'
  AND status = 'pending';

UPDATE anniversary_contracts
SET
  status = 'secured',
  notes = '七日守護戰已完成，你已守到最後；主契約正式成立。'
WHERE contract_type = 'main'
  AND status = 'claimable';

UPDATE anniversary_contracts
SET
  status = 'refunded',
  refunded_at = COALESCE(refunded_at, NOW()),
  notes = '主契約未能守到最後，2700 已轉入退款流程。'
WHERE contract_type = 'main'
  AND status IN ('forfeited');

UPDATE anniversary_campaigns
SET
  description = '先支付 2700 建立主契約暫時持有資格。活動期間若失守出局，系統將退回 2700；若守到最後，這隻寶可夢就正式歸屬於你。',
  updated_at = NOW()
WHERE slug = 'guardian-trial-30th';

UPDATE events
SET
  description = '30 週年限定的七日守護試煉。先支付 2700 建立主契約暫時持有資格；若中途失守出局，2700 退還，若守到最後，心願寶可夢正式歸屬於你。曾踏入前 10，則可解鎖守護伊布的追加契約。',
  eligibility_requirements = '需先完成主契約暫持締結；曾踏入前 10 才能啟動追加契約顯現儀式。',
  updated_at = NOW()
WHERE title = '30 週年心願契約守護戰'
  AND series_tag = '30週年契約';
