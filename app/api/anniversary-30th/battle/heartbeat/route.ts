import { NextResponse } from "next/server";
import { createAdminSupabaseClient, createServerSupabaseClient } from "@/lib/auth";
import {
  ANNIVERSARY_30TH_SLUG,
  isBattleSessionExpired,
  type AnniversaryBattle,
  type AnniversaryCampaign,
  type AnniversaryParticipant,
} from "@/lib/anniversary30th";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const supabase = createServerSupabaseClient();
  const adminSupabase = createAdminSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const battleId = typeof body.battleId === "string" ? body.battleId : "";

  if (!battleId) {
    return NextResponse.json({ error: "battleId 必填。" }, { status: 400 });
  }

  const { data: campaignData } = await supabase
    .from("anniversary_campaigns")
    .select("*")
    .eq("slug", ANNIVERSARY_30TH_SLUG)
    .maybeSingle();

  const campaign = (campaignData || null) as AnniversaryCampaign | null;
  if (!campaign) {
    return NextResponse.json({ error: "活動未建立。" }, { status: 503 });
  }

  const { data: participantData } = await supabase
    .from("anniversary_participants")
    .select("*")
    .eq("campaign_id", campaign.id)
    .eq("user_id", session.user.id)
    .maybeSingle();

  const participant = (participantData || null) as AnniversaryParticipant | null;
  if (!participant) {
    return NextResponse.json({ error: "找不到參戰資料。" }, { status: 404 });
  }

  const { data: battleData } = await adminSupabase
    .from("anniversary_battles")
    .select("*")
    .eq("id", battleId)
    .eq("participant_id", participant.id)
    .in("status", ["pending", "in_progress"])
    .maybeSingle();

  const battle = (battleData || null) as AnniversaryBattle | null;
  if (!battle) {
    return NextResponse.json({ error: "找不到可續打的對決。" }, { status: 404 });
  }

  const now = new Date().toISOString();

  if (isBattleSessionExpired(battle.started_at || battle.last_active_at)) {
    await adminSupabase
      .from("anniversary_battles")
      .update({
        status: "lost",
        last_active_at: now,
        ended_at: now,
      })
      .eq("id", battle.id);

    return NextResponse.json({
      error: "這場對決已逾時，已自動結束。",
      battleExpired: true,
    }, { status: 409 });
  }

  await adminSupabase
    .from("anniversary_battles")
    .update({
      last_active_at: now,
    })
    .eq("id", battle.id);

  return NextResponse.json({
    success: true,
    lastActiveAt: now,
  });
}
