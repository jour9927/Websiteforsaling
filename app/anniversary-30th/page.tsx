import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/auth";
import {
  ANNIVERSARY_30TH_SLUG,
  ANNIVERSARY_30TH_STARTS_AT,
  ANNIVERSARY_30TH_BATTLES_PER_DAY,
  ANNIVERSARY_30TH_TOTAL_DAYS,
  UNLOCK_PARTNER_CONSECUTIVE_WINS,
  UNLOCK_SECOND_POKEMON_TOTAL_WINS,
  UNLOCK_TITLE_TOTAL_WINS,
  UNLOCK_THIRD_POKEMON_TOTAL_WINS,
  UNLOCK_MASTER_BALL_TOTAL_WINS,
  UNLOCK_LEGENDARY_TOTAL_WINS,
  defaultCampaignCopy,
  formatDateRange,
  getPartnerPokemon,
  getPokemonSpriteUrl,
  isEventStarted,
  resolveBattlesRemaining,
  type AnniversaryCampaign,
  type AnniversaryParticipant,
} from "@/lib/anniversary30th";
import { Anniversary30thPartnerSelect } from "@/components/Anniversary30thPartnerSelect";
import { Anniversary30thCountdown } from "@/components/Anniversary30thCountdown";

export const dynamic = "force-dynamic";

async function loadPageState(userId?: string) {
  const supabase = createServerSupabaseClient();

  const { data: campaignData } = await supabase
    .from("anniversary_campaigns")
    .select("*")
    .eq("slug", ANNIVERSARY_30TH_SLUG)
    .maybeSingle();

  const campaign = (campaignData || null) as AnniversaryCampaign | null;

  if (!campaign || !userId) {
    return { campaign, participant: null as AnniversaryParticipant | null };
  }

  let participantData = await supabase
    .from("anniversary_participants")
    .select("*")
    .eq("campaign_id", campaign.id)
    .eq("user_id", userId)
    .maybeSingle()
    .then(res => res.data);

  // Auto-sync: If they registered via the generic /events UI but aren't in participants yet
  if (!participantData) {
    const EVENT_ID = "d5ea72b9-c8d6-4cde-8be5-9de8f3bc144a";
    const { data: reg } = await supabase
      .from("registrations")
      .select("id")
      .eq("event_id", EVENT_ID)
      .eq("user_id", userId)
      .eq("status", "confirmed")
      .maybeSingle();

    if (reg) {
      // Create their proxy anniversary_participants record instantly
      const { data: newParticipant } = await supabase
        .from("anniversary_participants")
        .insert({
          campaign_id: campaign.id,
          user_id: userId,
          target_pokemon: "unknown",
          total_battles_used: 0,
          today_battles_used: 0,
          win_streak: 0,
          max_win_streak: 0,
          total_wins: 0,
          partner_unlocked: false,
          second_pokemon_unlocked: false,
          title_unlocked: false,
          third_pokemon_unlocked: false,
          master_ball_unlocked: false,
          legendary_unlocked: false
        })
        .select("*")
        .single();
      
      participantData = newParticipant;
    }
  }

  return {
    campaign,
    participant: (participantData || null) as AnniversaryParticipant | null,
  };
}

function StatCard({ label, value, sub, tone = "white" }: { label: string; value: string | number; sub?: string; tone?: "white" | "amber" | "emerald" | "rose" }) {
  const toneMap = {
    white: "text-white",
    amber: "text-amber-200",
    emerald: "text-emerald-300",
    rose: "text-rose-300",
  };
  return (
    <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
      <p className="text-[11px] uppercase tracking-[0.25em] text-white/40">{label}</p>
      <p className={`mt-2 text-2xl font-bold ${toneMap[tone]}`}>{value}</p>
      {sub && <p className="mt-1 text-xs text-white/50">{sub}</p>}
    </div>
  );
}

function ProgressRing({ current, max, label }: { current: number; max: number; label: string }) {
  const pct = Math.min(100, (current / max) * 100);
  return (
    <div className="flex items-center gap-3">
      <div className="relative h-12 w-12">
        <svg className="h-12 w-12 -rotate-90" viewBox="0 0 48 48">
          <circle cx="24" cy="24" r="20" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="4" />
          <circle
            cx="24" cy="24" r="20" fill="none"
            stroke="url(#ring-grad)" strokeWidth="4"
            strokeDasharray={`${pct * 1.256} 125.6`}
            strokeLinecap="round"
          />
          <defs>
            <linearGradient id="ring-grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#f97316" />
            </linearGradient>
          </defs>
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
          {current}/{max}
        </span>
      </div>
      <span className="text-sm text-white/65">{label}</span>
    </div>
  );
}

export default async function Anniversary30thPage() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { campaign, participant } = await loadPageState(user?.id);

  const started = isEventStarted(campaign?.starts_at || ANNIVERSARY_30TH_STARTS_AT);
  const battlesPerDay = campaign?.battles_per_day || ANNIVERSARY_30TH_BATTLES_PER_DAY;
  const totalDays = campaign?.total_days || ANNIVERSARY_30TH_TOTAL_DAYS;
  const battlesRemaining = resolveBattlesRemaining(participant, battlesPerDay);
  const hasPartner = Boolean(participant?.partner_pokemon);
  const partner = hasPartner ? getPartnerPokemon(participant!.partner_pokemon!) : null;

  return (
    <div className="space-y-8">
      {/* ─── Hero Section ─── */}
      <section className="relative overflow-hidden rounded-[32px] border border-amber-400/20 bg-[radial-gradient(ellipse_at_15%_5%,rgba(251,191,36,0.18),transparent_38%),radial-gradient(ellipse_at_85%_90%,rgba(168,85,247,0.15),transparent_38%),linear-gradient(160deg,#0d0f1a,#14102a_45%,#0b1d2e)] p-8 shadow-[0_32px_80px_rgba(0,0,0,0.6)] md:p-12">
        <div className="pointer-events-none absolute -left-16 top-8 h-44 w-44 rounded-full bg-amber-300/15 blur-[60px]" />
        <div className="pointer-events-none absolute -right-20 bottom-8 h-52 w-52 rounded-full bg-purple-500/15 blur-[60px]" />

        <div className="relative z-10 flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs uppercase tracking-[0.4em] text-amber-300/70">
              30th Anniversary Battle Festival
            </p>
            <h1 className="mt-4 text-4xl font-black leading-tight text-white md:text-5xl xl:text-6xl">
              {campaign?.title || defaultCampaignCopy.title}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-white/65">
              選擇你的夥伴寶可夢，在七天對決中並肩作戰！每天 {battlesPerDay} 場，共 {totalDays * battlesPerDay} 場對決。
              擲骰子、答常識題、拉霸機 — 你永遠不知道下一場是什麼關卡！
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-white/70">
                {formatDateRange(campaign?.starts_at || null, campaign?.ends_at || null)}
              </span>
              <span className="rounded-full border border-amber-400/25 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-200">
                每天 {battlesPerDay} 場 ・ 至少完成 1 場
              </span>
              <span className="rounded-full border border-emerald-400/25 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-200">
                連贏 {UNLOCK_PARTNER_CONSECUTIVE_WINS} 場 → 永久獲得伴侶
              </span>
              <span className="rounded-full border border-purple-400/25 bg-purple-500/10 px-3 py-1 text-xs font-medium text-purple-200">
                累計 {UNLOCK_SECOND_POKEMON_TOTAL_WINS} 勝 → 解鎖第二隻
              </span>
            </div>
          </div>

          {/* Countdown / Partner Preview */}
          <div className="flex-shrink-0 xl:min-w-[320px]">
            {!started ? (
              <Anniversary30thCountdown />
            ) : hasPartner && partner ? (
              <div className="flex flex-col items-center rounded-2xl border border-amber-400/20 bg-black/30 p-6">
                <p className="text-[11px] uppercase tracking-[0.3em] text-amber-300/60">你的夥伴</p>
                <img
                  src={getPokemonSpriteUrl(partner.sprite)}
                  alt={partner.name}
                  className="mt-3 h-28 w-28 object-contain drop-shadow-[0_6px_20px_rgba(251,191,36,0.3)]"
                />
                <p className="mt-3 text-xl font-bold text-white">{partner.name}</p>
                <p className="mt-1 text-xs text-white/45">與你並肩作戰中</p>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {/* ─── Auth Gate ─── */}
      {!user ? (
        <section className="rounded-2xl border border-white/10 bg-black/25 p-8 text-center">
          <p className="text-white/65">請先登入，才能參與 30 週年對決活動。</p>
          <Link
            href="/login?redirect=/anniversary-30th"
            className="mt-5 inline-flex rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-3 text-sm font-bold text-white transition hover:brightness-110"
          >
            登入後參戰
          </Link>
        </section>
      ) : !campaign ? (
        <section className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-8 text-center">
          <p className="text-rose-200">找不到活動資料。請確認資料庫已建立。</p>
        </section>
      ) : !participant ? (
        <section className="rounded-2xl border border-amber-500/20 bg-black/25 p-8 text-center">
          <p className="text-white/65">你尚未報名此活動。請先完成報名流程。</p>
          <Link
            href="/anniversary-30th"
            className="mt-4 inline-flex rounded-2xl bg-white/10 px-5 py-2 text-sm font-semibold text-white/80 transition hover:bg-white/15"
          >
            返回首頁
          </Link>
        </section>
      ) : !hasPartner ? (
        /* ─── Partner Selection ─── */
        <Anniversary30thPartnerSelect />
      ) : (
        /* ─── Main Dashboard ─── */
        <>
          {/* Stats Grid */}
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="今日剩餘場次"
              value={`${battlesRemaining} / ${battlesPerDay}`}
              sub={`已使用 ${participant.total_battles_used} 場`}
              tone="amber"
            />
            <StatCard
              label="總勝場"
              value={participant.total_wins ?? 0}
              sub={`目標：${UNLOCK_SECOND_POKEMON_TOTAL_WINS} 場解鎖第二隻`}
              tone="emerald"
            />
            <StatCard
              label="目前連勝"
              value={participant.win_streak ?? 0}
              sub={`最高連勝：${participant.max_win_streak ?? 0}`}
              tone={((participant.win_streak ?? 0) >= UNLOCK_PARTNER_CONSECUTIVE_WINS) ? "emerald" : "white"}
            />
            <StatCard
              label="伴侶寶可夢"
              value={partner?.name || "—"}
              sub={
                participant.partner_unlocked
                  ? "✅ 已永久獲得"
                  : `連贏 ${UNLOCK_PARTNER_CONSECUTIVE_WINS} 場即可永久獲得`
              }
              tone={participant.partner_unlocked ? "emerald" : "amber"}
            />
          </section>

          {/* Unlock Progress */}
          <section className="rounded-2xl border border-white/10 bg-black/25 p-6">
            <h2 className="text-xl font-bold text-white">解鎖進度</h2>
            <div className="mt-5 grid gap-6 sm:grid-cols-2">
              <div className="rounded-xl border border-white/8 bg-black/20 p-4">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{participant.partner_unlocked ? "🎉" : "🔒"}</span>
                  <h3 className="font-semibold text-white">永久獲得伴侶寶可夢</h3>
                </div>
                <p className="mt-2 text-sm text-white/55">
                  {participant.partner_unlocked
                    ? `已解鎖！${partner?.name} 永遠屬於你了！`
                    : `連贏 ${UNLOCK_PARTNER_CONSECUTIVE_WINS} 場即可永久獲得。目前連勝：${participant.win_streak ?? 0}`}
                </p>
                <ProgressRing
                  current={Math.min(participant.win_streak ?? 0, UNLOCK_PARTNER_CONSECUTIVE_WINS)}
                  max={UNLOCK_PARTNER_CONSECUTIVE_WINS}
                  label="連勝進度"
                />
              </div>

              <div className="rounded-xl border border-white/8 bg-black/20 p-4">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{participant.second_pokemon_unlocked ? "🎉" : "🔒"}</span>
                  <h3 className="font-semibold text-white">第二隻寶可夢相遇權</h3>
                </div>
                <p className="mt-2 text-sm text-white/55">
                  {participant.second_pokemon_unlocked
                    ? "已解鎖！你可以遇見第二隻寶可夢了！"
                    : `累計贏得 ${UNLOCK_SECOND_POKEMON_TOTAL_WINS} 場即可解鎖。目前：${participant.total_wins ?? 0}`}
                </p>
                <ProgressRing
                  current={Math.min(participant.total_wins ?? 0, UNLOCK_SECOND_POKEMON_TOTAL_WINS)}
                  max={UNLOCK_SECOND_POKEMON_TOTAL_WINS}
                  label="勝場進度"
                />
              </div>

              <div className="rounded-xl border border-white/8 bg-black/20 p-4">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{participant.title_unlocked ? "🎉" : "🔒"}</span>
                  <h3 className="font-semibold text-white">專屬菁英訓練家稱號</h3>
                </div>
                <p className="mt-2 text-sm text-white/55">
                  {participant.title_unlocked
                    ? "已解鎖！你獲得了傳說中的菁英稱號！"
                    : `累計贏得 ${UNLOCK_TITLE_TOTAL_WINS} 場即可解鎖專屬稱號。目前：${participant.total_wins ?? 0}`}
                </p>
                <ProgressRing
                  current={Math.min(participant.total_wins ?? 0, UNLOCK_TITLE_TOTAL_WINS)}
                  max={UNLOCK_TITLE_TOTAL_WINS}
                  label="勝場進度"
                />
              </div>

              <div className="rounded-xl border border-white/8 bg-black/20 p-4">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{participant.third_pokemon_unlocked ? "🎉" : "🔒"}</span>
                  <h3 className="font-semibold text-white">第三隻寶可夢相遇權</h3>
                </div>
                <p className="mt-2 text-sm text-white/55">
                  {participant.third_pokemon_unlocked
                    ? "已解鎖！更強大的第三隻夥伴等著你！"
                    : `累計贏得 ${UNLOCK_THIRD_POKEMON_TOTAL_WINS} 場即可解鎖。目前：${participant.total_wins ?? 0}`}
                </p>
                <ProgressRing
                  current={Math.min(participant.total_wins ?? 0, UNLOCK_THIRD_POKEMON_TOTAL_WINS)}
                  max={UNLOCK_THIRD_POKEMON_TOTAL_WINS}
                  label="勝場進度"
                />
              </div>

              <div className="rounded-xl border border-white/8 bg-black/20 p-4">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{participant.master_ball_unlocked ? "🎉" : "🔒"}</span>
                  <h3 className="font-semibold text-white">大師球絕版虛擬徽章</h3>
                </div>
                <p className="mt-2 text-sm text-white/55">
                  {participant.master_ball_unlocked
                    ? "已解鎖！絕對捕獲的大師球徽章已入袋！"
                    : `累計贏得 ${UNLOCK_MASTER_BALL_TOTAL_WINS} 場即可解鎖。目前：${participant.total_wins ?? 0}`}
                </p>
                <ProgressRing
                  current={Math.min(participant.total_wins ?? 0, UNLOCK_MASTER_BALL_TOTAL_WINS)}
                  max={UNLOCK_MASTER_BALL_TOTAL_WINS}
                  label="勝場進度"
                />
              </div>

              <div className="rounded-xl border border-white/8 bg-black/20 p-4">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{participant.legendary_unlocked ? "🎉" : "🔒"}</span>
                  <h3 className="font-semibold text-white">傳說寶可夢隱藏解鎖權</h3>
                </div>
                <p className="mt-2 text-sm text-white/55">
                  {participant.legendary_unlocked
                    ? "已解鎖！活動最終的傳說寶可夢考驗已為你敞開大門！"
                    : `累計贏得 ${UNLOCK_LEGENDARY_TOTAL_WINS} 場即可解鎖最高機密。目前：${participant.total_wins ?? 0}`}
                </p>
                <ProgressRing
                  current={Math.min(participant.total_wins ?? 0, UNLOCK_LEGENDARY_TOTAL_WINS)}
                  max={UNLOCK_LEGENDARY_TOTAL_WINS}
                  label="勝場進度"
                />
              </div>
            </div>
          </section>

          {/* Daily Mission CTA */}
          <section className="relative overflow-hidden rounded-[28px] border border-amber-400/25 bg-gradient-to-br from-amber-500/10 via-black/30 to-purple-500/10 p-6 md:p-8">
            <div className="relative z-10 flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">每日對決任務</h2>
                <p className="mt-2 text-sm text-white/60">
                  {!started
                    ? "活動尚未開始，敬請期待！"
                    : battlesRemaining > 0
                      ? `今日還有 ${battlesRemaining} 場對決等你挑戰！進入後系統將為你配對對手。`
                      : "今日場次已用完，明天再來挑戰吧！"}
                </p>
              </div>

              {started && battlesRemaining > 0 ? (
                <Link
                  href="/anniversary-30th/battle"
                  className="flex-shrink-0 rounded-2xl border border-amber-400/40 bg-gradient-to-r from-amber-500 to-orange-500 px-8 py-4 text-lg font-bold text-white shadow-[0_8px_32px_rgba(251,191,36,0.25)] transition hover:brightness-110 hover:shadow-[0_8px_40px_rgba(251,191,36,0.35)]"
                >
                  ⚔️ 進入對決
                </Link>
              ) : started ? (
                <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-sm font-semibold text-white/50">
                  今日已完成
                </div>
              ) : (
                <div className="rounded-2xl border border-amber-400/20 bg-amber-500/5 px-6 py-4 text-sm font-semibold text-amber-200/60">
                  即將開放
                </div>
              )}
            </div>
          </section>

          {/* Rules */}
          <section className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-6">
              <h2 className="text-lg font-bold text-white">🎮 對決規則</h2>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-white/60">
                <li className="flex gap-2">
                  <span className="flex-shrink-0 text-amber-300">1.</span>
                  每日至少完成 1 場對決（每天最多 {battlesPerDay} 場）
                </li>
                <li className="flex gap-2">
                  <span className="flex-shrink-0 text-amber-300">2.</span>
                  進入對決時會自動配對對手，關卡類型隨機
                </li>
                <li className="flex gap-2">
                  <span className="flex-shrink-0 text-amber-300">3.</span>
                  三種關卡：骰子比大小、寶可夢常識題、拉霸機
                </li>
                <li className="flex gap-2">
                  <span className="flex-shrink-0 text-amber-300">4.</span>
                  每個關卡都有時間限制，超時由系統裁決
                </li>
                <li className="flex gap-2">
                  <span className="flex-shrink-0 text-amber-300">5.</span>
                  關卡內容只有進入後才知道！
                </li>
              </ul>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/25 p-6">
              <h2 className="text-lg font-bold text-white">🏆 獎勵說明</h2>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-white/60">
                <li className="flex gap-2">
                  <span className="flex-shrink-0 text-emerald-300">★</span>
                  連贏 {UNLOCK_PARTNER_CONSECUTIVE_WINS} 場：永久獲得你選擇的攜帶伴侶寶可夢
                </li>
                <li className="flex gap-2">
                  <span className="flex-shrink-0 text-purple-300">★</span>
                  累計贏得 {UNLOCK_SECOND_POKEMON_TOTAL_WINS} 場：解鎖第二隻寶可夢相遇權
                </li>
                <li className="flex gap-2">
                  <span className="flex-shrink-0 text-amber-300">★</span>
                  累計贏得 {UNLOCK_TITLE_TOTAL_WINS} 場：獲得專屬菁英訓練家稱號
                </li>
                <li className="flex gap-2">
                  <span className="flex-shrink-0 text-amber-300">★</span>
                  累計贏得 {UNLOCK_THIRD_POKEMON_TOTAL_WINS} 場：解鎖第三隻寶可夢相遇權
                </li>
                <li className="flex gap-2">
                  <span className="flex-shrink-0 text-amber-300">★</span>
                  累計贏得 {UNLOCK_MASTER_BALL_TOTAL_WINS} 場：獲得大師球絕版虛擬徽章
                </li>
                <li className="flex gap-2">
                  <span className="flex-shrink-0 text-amber-300">★</span>
                  累計贏得 {UNLOCK_LEGENDARY_TOTAL_WINS} 場：解鎖傳說寶可夢隱藏挑戰
                </li>
                <li className="flex gap-2">
                  <span className="flex-shrink-0 text-amber-300">★</span>
                  七天全勤：額外驚喜獎勵
                </li>
              </ul>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
