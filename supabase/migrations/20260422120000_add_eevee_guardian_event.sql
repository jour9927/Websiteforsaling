-- Eevee Guardian Event: 9-day medal collection battle campaign

create table if not exists public.eevee_guardian_campaigns (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  total_days int not null default 9 check (total_days > 0),
  daily_battles int not null default 1 check (daily_battles > 0),
  win_points numeric(4, 1) not null default 1.0,
  lose_points numeric(4, 1) not null default 0.5,
  target_medals int not null default 9 check (target_medals > 0),
  rare_reward_name text not null default '五種勳章以上稀有伊布',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.eevee_guardian_players (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.eevee_guardian_campaigns(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  total_points numeric(6, 1) not null default 0,
  total_battles int not null default 0,
  total_wins int not null default 0,
  total_losses int not null default 0,
  total_damage bigint not null default 0,
  medals_collected int not null default 0,
  last_battle_day date,
  today_battles_used int not null default 0,
  rare_reward_unlocked boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (campaign_id, user_id)
);

create table if not exists public.eevee_guardian_battles (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.eevee_guardian_campaigns(id) on delete cascade,
  player_id uuid not null references public.eevee_guardian_players(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  battle_day date not null,
  status text not null check (status in ('pending', 'won', 'lost', 'cancelled')),
  points_awarded numeric(4, 1) not null default 0,
  player_damage int not null default 0,
  opponent_damage int not null default 0,
  turns int not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (player_id, battle_day)
);

create index if not exists idx_eevee_guardian_players_campaign on public.eevee_guardian_players(campaign_id);
create index if not exists idx_eevee_guardian_players_user on public.eevee_guardian_players(user_id);
create index if not exists idx_eevee_guardian_battles_campaign_day on public.eevee_guardian_battles(campaign_id, battle_day);
create index if not exists idx_eevee_guardian_battles_user on public.eevee_guardian_battles(user_id);

alter table public.eevee_guardian_campaigns enable row level security;
alter table public.eevee_guardian_players enable row level security;
alter table public.eevee_guardian_battles enable row level security;

-- Campaign: authenticated users can view active campaigns
drop policy if exists "eevee_guardian_campaigns_select_authenticated"
  on public.eevee_guardian_campaigns;
create policy "eevee_guardian_campaigns_select_authenticated"
  on public.eevee_guardian_campaigns
  for select
  to authenticated
  using (true);

-- Players: user can read/write own row
drop policy if exists "eevee_guardian_players_select_own"
  on public.eevee_guardian_players;
create policy "eevee_guardian_players_select_own"
  on public.eevee_guardian_players
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "eevee_guardian_players_insert_own"
  on public.eevee_guardian_players;
create policy "eevee_guardian_players_insert_own"
  on public.eevee_guardian_players
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "eevee_guardian_players_update_own"
  on public.eevee_guardian_players;
create policy "eevee_guardian_players_update_own"
  on public.eevee_guardian_players
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Battles: user can read/write own battle row
drop policy if exists "eevee_guardian_battles_select_own"
  on public.eevee_guardian_battles;
create policy "eevee_guardian_battles_select_own"
  on public.eevee_guardian_battles
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "eevee_guardian_battles_insert_own"
  on public.eevee_guardian_battles;
create policy "eevee_guardian_battles_insert_own"
  on public.eevee_guardian_battles
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "eevee_guardian_battles_update_own"
  on public.eevee_guardian_battles;
create policy "eevee_guardian_battles_update_own"
  on public.eevee_guardian_battles
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

insert into public.eevee_guardian_campaigns (
  slug,
  title,
  starts_at,
  ends_at,
  total_days,
  daily_battles,
  win_points,
  lose_points,
  target_medals,
  rare_reward_name,
  is_active
)
values (
  'eevee-medal-guardians',
  '勳章型伊布蒐集控系列護衛活動',
  '2026-04-22T00:00:00+08:00',
  '2026-04-30T23:59:59+08:00',
  9,
  1,
  1.0,
  0.5,
  9,
  '五種勳章以上稀有伊布',
  true
)
on conflict (slug) do update
set
  title = excluded.title,
  starts_at = excluded.starts_at,
  ends_at = excluded.ends_at,
  total_days = excluded.total_days,
  daily_battles = excluded.daily_battles,
  win_points = excluded.win_points,
  lose_points = excluded.lose_points,
  target_medals = excluded.target_medals,
  rare_reward_name = excluded.rare_reward_name,
  is_active = excluded.is_active,
  updated_at = now();
