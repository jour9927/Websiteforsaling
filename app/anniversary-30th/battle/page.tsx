import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/auth";
import {
  ANNIVERSARY_30TH_SLUG,
  ANNIVERSARY_30TH_STARTS_AT,
  isEventStarted,
  resolveBattlesRemaining,
  getPartnerPokemon,
  getPokemonSpriteUrl,
  type AnniversaryCampaign,
  type AnniversaryParticipant,
  type AnniversaryBattle,
} from "@/lib/anniversary30th";
import { Anniversary30thBattleConsole } from "@/components/Anniversary30thBattleConsole";

export const dynamic = "force-dynamic";

async function loadBattleState(userId?: string) {
  const supabase = createServerSupabaseClient();

  const { data: campaignData } = await supabase
    .from("anniversary_campaigns")
    .select("*")
    .eq("slug", ANNIVERSARY_30TH_SLUG)
    .maybeSingle();

  const campaign = (campaignData || null) as AnniversaryCampaign | null;

  if (!campaign || !userId) {
    return { campaign, participant: null as AnniversaryParticipant | null, battle: null as AnniversaryBattle | null };
  }

  const { data: participantData } = await supabase
    .from("anniversary_participants")
    .select("*")
    .eq("campaign_id", campaign.id)
    .eq("user_id", userId)
    .maybeSingle();

  const participant = (participantData || null) as AnniversaryParticipant | null;

  if (!participant) {
    return { campaign, participant: null, battle: null };
  }

  // Check for existing in-progress battle
  const { data: battleData } = await supabase
    .from("anniversary_battles")
    .select("*")
    .eq("participant_id", participant.id)
    .in("status", ["pending", "in_progress"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return {
    campaign,
    participant,
    battle: (battleData || null) as AnniversaryBattle | null,
  };
}

export default async function Anniversary30thBattlePage() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { campaign, participant, battle } = await loadBattleState(user?.id);

  const started = isEventStarted(campaign?.starts_at || ANNIVERSARY_30TH_STARTS_AT);
  const battlesRemaining = resolveBattlesRemaining(participant, campaign?.battles_per_day || 3);

  if (!user) {
    return (
      <div className="rounded-3xl border border-white/10 bg-black/30 p-8 text-center">
        <h1 className="text-3xl font-bold text-white">⚔️ 對決戰場</h1>
        <p className="mt-4 text-sm text-white/60">請先登入後再進入對決。</p>
        <Link
          href="/login?redirect=/anniversary-30th/battle"
          className="mt-6 inline-flex rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-3 text-sm font-bold text-white transition hover:brightness-110"
        >
          登入後進入
        </Link>
      </div>
    );
  }

  if (!campaign || !participant) {
    return (
      <div className="rounded-3xl border border-rose-500/20 bg-black/30 p-8 text-center">
        <h1 className="text-3xl font-bold text-white">⚔️ 對決戰場</h1>
        <p className="mt-4 text-sm text-white/60">
          {!campaign ? "活動尚未建立。" : "你尚未報名此活動。"}
        </p>
        <Link
          href="/anniversary-30th"
          className="mt-6 inline-flex rounded-2xl bg-white/10 px-5 py-2 text-sm font-semibold text-white/80 transition hover:bg-white/15"
        >
          返回活動中心
        </Link>
      </div>
    );
  }

  if (!participant.partner_pokemon) {
    return (
      <div className="rounded-3xl border border-amber-500/20 bg-black/30 p-8 text-center">
        <h1 className="text-3xl font-bold text-white">⚔️ 對決戰場</h1>
        <p className="mt-4 text-sm text-white/60">請先選擇你的攜帶伴侶寶可夢。</p>
        <Link
          href="/anniversary-30th"
          className="mt-6 inline-flex rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-3 text-sm font-bold text-white transition hover:brightness-110"
        >
          返回選擇伴侶
        </Link>
      </div>
    );
  }

  if (!started) {
    return (
      <div className="rounded-3xl border border-amber-500/20 bg-black/30 p-8 text-center">
        <h1 className="text-3xl font-bold text-white">⚔️ 對決戰場</h1>
        <p className="mt-4 text-sm text-amber-200/60">活動尚未開始，請於 3/20 20:00 後再來。</p>
        <Link
          href="/anniversary-30th"
          className="mt-6 inline-flex rounded-2xl bg-white/10 px-5 py-2 text-sm font-semibold text-white/80 transition hover:bg-white/15"
        >
          返回活動中心
        </Link>
      </div>
    );
  }

  const partner = getPartnerPokemon(participant.partner_pokemon);

  return (
    <Anniversary30thBattleConsole
      partnerPokemon={partner}
      partnerSpriteUrl={getPokemonSpriteUrl(partner.sprite)}
      battlesRemaining={battlesRemaining}
      totalWins={participant.total_wins ?? 0}
      winStreak={participant.win_streak ?? 0}
      initialBattle={battle}
    />
  );
}
