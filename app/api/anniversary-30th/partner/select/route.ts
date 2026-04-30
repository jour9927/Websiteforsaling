import { NextResponse } from "next/server";
import { createAdminSupabaseClient, createServerSupabaseClient } from "@/lib/auth";
import {
  ANNIVERSARY_30TH_SLUG,
  PARTNER_POKEMON_POOL,
  type AnniversaryCampaign,
  type AnniversaryParticipant,
} from "@/lib/anniversary30th";

export const dynamic = "force-dynamic";

const PLAYER_TEAM_SELECTION_SIZE = 3;

function normalizeTeamPokemon(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return Array.from(
    new Set(value.filter((id): id is string => typeof id === "string")),
  );
}

function findInvalidPokemonId(ids: string[]) {
  return ids.find((id) => !PARTNER_POKEMON_POOL.some((pokemon) => pokemon.id === id));
}

export async function POST(request: Request) {
  const supabase = createServerSupabaseClient();
  const adminSupabase = createAdminSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const partnerId = typeof body.partnerId === "string" ? body.partnerId : "";
  const requestedTeamPokemon = normalizeTeamPokemon(body.teamPokemon);

  const valid = PARTNER_POKEMON_POOL.find((p) => p.id === partnerId);
  if (!valid && requestedTeamPokemon.length === 0) {
    return NextResponse.json({ error: "無效的寶可夢選擇。" }, { status: 400 });
  }

  const invalidTeamPokemon = findInvalidPokemonId(requestedTeamPokemon);
  if (invalidTeamPokemon) {
    return NextResponse.json({ error: "隊伍內含無效的寶可夢選擇。" }, { status: 400 });
  }

  const { data: campaignData } = await supabase
    .from("anniversary_campaigns")
    .select("*")
    .eq("slug", ANNIVERSARY_30TH_SLUG)
    .maybeSingle();

  const campaign = (campaignData || null) as AnniversaryCampaign | null;
  if (!campaign) {
    return NextResponse.json({ error: "活動尚未建立。" }, { status: 503 });
  }

  const { data: participantData } = await supabase
    .from("anniversary_participants")
    .select("*")
    .eq("campaign_id", campaign.id)
    .eq("user_id", session.user.id)
    .maybeSingle();

  const participant = (participantData || null) as AnniversaryParticipant | null;
  if (!participant) {
    return NextResponse.json({ error: "你尚未報名此活動。" }, { status: 404 });
  }

  if (participant.partner_pokemon) {
    if (requestedTeamPokemon.length === 0) {
      return NextResponse.json({ error: "你已經選擇了主力寶可夢，請改用隊伍補選。" }, { status: 409 });
    }

    const primaryPokemon = participant.partner_pokemon;
    const teamPokemon = [
      primaryPokemon,
      ...requestedTeamPokemon.filter((id) => id !== primaryPokemon),
    ].slice(0, PLAYER_TEAM_SELECTION_SIZE);

    if (teamPokemon.length !== PLAYER_TEAM_SELECTION_SIZE) {
      return NextResponse.json({ error: "請保留原本主力，並補選到 3 隻隊伍寶可夢。" }, { status: 400 });
    }

    const { error: updateTeamError } = await adminSupabase
      .from("anniversary_participants")
      .update({ team_pokemon: teamPokemon })
      .eq("id", participant.id);

    if (updateTeamError) {
      return NextResponse.json({ error: updateTeamError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      teamPokemon,
    });
  }

  if (!valid) {
    return NextResponse.json({ error: "無效的寶可夢選擇。" }, { status: 400 });
  }

  const { error: updateError } = await adminSupabase
    .from("anniversary_participants")
    .update({ partner_pokemon: partnerId, team_pokemon: [partnerId] })
    .eq("id", participant.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    partnerPokemon: valid.name,
  });
}
