import { NextResponse } from "next/server";
import { createAdminSupabaseClient, createServerSupabaseClient } from "@/lib/auth";
import {
  ANNIVERSARY_30TH_SLUG,
  PARTNER_POKEMON_POOL,
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
  const partnerId = typeof body.partnerId === "string" ? body.partnerId : "";

  const valid = PARTNER_POKEMON_POOL.find((p) => p.id === partnerId);
  if (!valid) {
    return NextResponse.json({ error: "無效的寶可夢選擇。" }, { status: 400 });
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
    return NextResponse.json({ error: "你已經選擇了伴侶寶可夢，無法更換。" }, { status: 409 });
  }

  const { error: updateError } = await adminSupabase
    .from("anniversary_participants")
    .update({ partner_pokemon: partnerId })
    .eq("id", participant.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    partnerPokemon: valid.name,
  });
}
