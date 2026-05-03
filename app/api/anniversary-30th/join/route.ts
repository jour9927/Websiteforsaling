import { NextResponse } from "next/server";
import { createAdminSupabaseClient, createServerSupabaseClient } from "@/lib/auth";
import { ANNIVERSARY_30TH_EVENT_ID, ANNIVERSARY_30TH_SLUG } from "@/lib/anniversary30th";

export const dynamic = "force-dynamic";

export async function POST() {
  const supabase = createServerSupabaseClient();
  const adminSupabase = createAdminSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: campaign, error: campaignError } = await adminSupabase
    .from("anniversary_campaigns")
    .select("id, event_id")
    .eq("slug", ANNIVERSARY_30TH_SLUG)
    .maybeSingle();

  if (campaignError || !campaign) {
    return NextResponse.json({ error: "活動尚未建立。" }, { status: 503 });
  }

  const eventId = campaign.event_id || ANNIVERSARY_30TH_EVENT_ID;
  const now = new Date().toISOString();

  const { data: existingRegistration, error: registrationLookupError } = await adminSupabase
    .from("registrations")
    .select("id, status")
    .eq("event_id", eventId)
    .eq("user_id", session.user.id)
    .maybeSingle();

  if (registrationLookupError) {
    return NextResponse.json({ error: registrationLookupError.message }, { status: 500 });
  }

  if (!existingRegistration) {
    const { error: registrationError } = await adminSupabase
      .from("registrations")
      .insert({
        event_id: eventId,
        user_id: session.user.id,
        status: "pending",
        registered_at: now,
      });

    if (registrationError) {
      return NextResponse.json({ error: registrationError.message }, { status: 500 });
    }
  } else if (existingRegistration.status === "cancelled") {
    const { error: registrationError } = await adminSupabase
      .from("registrations")
      .update({ status: "pending" })
      .eq("id", existingRegistration.id);

    if (registrationError) {
      return NextResponse.json({ error: registrationError.message }, { status: 500 });
    }
  }

  const { data: existingParticipant, error: participantLookupError } = await adminSupabase
    .from("anniversary_participants")
    .select("id")
    .eq("campaign_id", campaign.id)
    .eq("user_id", session.user.id)
    .maybeSingle();

  if (participantLookupError) {
    return NextResponse.json({ error: participantLookupError.message }, { status: 500 });
  }

  if (existingParticipant) {
    return NextResponse.json({
      success: true,
      eventId,
      participantId: existingParticipant.id,
      alreadyRegistered: true,
    });
  }

  const { data: participant, error: participantError } = await adminSupabase
    .from("anniversary_participants")
    .insert({
      campaign_id: campaign.id,
      user_id: session.user.id,
      target_pokemon: "伊布",
      entry_fee_amount: 0,
      entry_fee_paid_at: now,
      total_battles_used: 0,
      today_battles_used: 0,
      win_streak: 0,
      max_win_streak: 0,
      total_wins: 0,
      partner_unlocked: false,
      has_entered_top_cut: false,
    })
    .select("id")
    .single();

  if (participantError || !participant) {
    return NextResponse.json({ error: participantError?.message || "無法建立參戰資料。" }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    eventId,
    participantId: participant.id,
    alreadyRegistered: false,
  });
}
