import { NextResponse } from "next/server";
import { createAdminSupabaseClient, createServerSupabaseClient } from "@/lib/auth";
import { ANNIVERSARY_30TH_SLUG } from "@/lib/anniversary30th";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const supabase = createServerSupabaseClient();
  const adminSupabase = createAdminSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json().catch(() => ({}));
  const targetPokemon = typeof payload.targetPokemon === "string" ? payload.targetPokemon.trim() : "";

  if (!targetPokemon) {
    return NextResponse.json({ error: "targetPokemon is required" }, { status: 400 });
  }

  const { data: campaign, error: campaignError } = await supabase
    .from("anniversary_campaigns")
    .select("id, event_id, entry_fee, additional_fee")
    .eq("slug", ANNIVERSARY_30TH_SLUG)
    .maybeSingle();

  if (campaignError || !campaign) {
    return NextResponse.json({ error: "Campaign is not configured yet" }, { status: 503 });
  }
  const entryFeeLabel = Number(campaign.entry_fee || 0).toLocaleString("zh-TW");

  const { data: existingParticipant } = await supabase
    .from("anniversary_participants")
    .select("id")
    .eq("campaign_id", campaign.id)
    .eq("user_id", session.user.id)
    .maybeSingle();

  if (existingParticipant) {
    return NextResponse.json({ error: "你已經建立過主契約了" }, { status: 409 });
  }

  const { data: participant, error: participantError } = await supabase
    .from("anniversary_participants")
    .insert({
      campaign_id: campaign.id,
      user_id: session.user.id,
      target_pokemon: targetPokemon,
      entry_fee_amount: campaign.entry_fee,
    })
    .select("id")
    .single();

  if (participantError || !participant) {
    return NextResponse.json({ error: participantError?.message || "Unable to create participant" }, { status: 500 });
  }

  const { data: insertedContracts, error: contractError } = await supabase
    .from("anniversary_contracts")
    .insert([
      {
        participant_id: participant.id,
        contract_type: "main",
        pokemon_name: targetPokemon,
        price: campaign.entry_fee,
        status: "holding",
        notes: "主契約已建立，目前進入暫時持有階段。若未守到最後，保證金將在結算時退回。",
      },
      {
        participant_id: participant.id,
        contract_type: "additional",
        pokemon_name: null,
        price: campaign.additional_fee,
        status: "pending",
        notes: "活動期間曾踏入前 10，即可解鎖守護伊布的追加契約顯現儀式。",
      },
    ])
    .select("*");

  if (contractError) {
    await supabase.from("anniversary_participants").delete().eq("id", participant.id);
    return NextResponse.json({ error: contractError.message }, { status: 500 });
  }

  const mainContract = (insertedContracts || []).find((contract) => contract.contract_type === "main");

  if (campaign.event_id && mainContract) {
    const now = new Date().toISOString();
    const { data: paymentRecord, error: paymentError } = await adminSupabase
      .from("user_payments")
      .insert({
        user_id: session.user.id,
        event_id: campaign.event_id,
        amount: campaign.entry_fee,
        status: "paid",
        payment_date: now,
        notes: `30 週年主契約暫持保證金。目標寶可夢：${targetPokemon}。若未守到最後，${entryFeeLabel} 退還。`,
      })
      .select("id")
      .single();

    if (paymentError || !paymentRecord) {
      await supabase.from("anniversary_participants").delete().eq("id", participant.id);
      return NextResponse.json({ error: paymentError?.message || "Unable to create payment record" }, { status: 500 });
    }

    const { error: mainContractError } = await adminSupabase
      .from("anniversary_contracts")
      .update({
        payment_record_id: paymentRecord.id,
        status: "holding",
        notes: "主契約已建立，暫持保證金已記錄完成；若未守到最後，系統會在結算時退回。",
      })
      .eq("id", mainContract.id);

    if (mainContractError) {
      await adminSupabase.from("user_payments").delete().eq("id", paymentRecord.id);
      await supabase.from("anniversary_participants").delete().eq("id", participant.id);
      return NextResponse.json({ error: mainContractError.message }, { status: 500 });
    }
  }

  return NextResponse.json({
    success: true,
    participantId: participant.id,
  });
}
