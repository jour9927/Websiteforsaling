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

  const { data: adminProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", session.user.id)
    .single();

  if (!adminProfile || adminProfile.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const payload = await request.json().catch(() => ({}));
  const userId = typeof payload.userId === "string" ? payload.userId : "";
  const targetPokemon = typeof payload.targetPokemon === "string" ? payload.targetPokemon.trim() : "";
  const markPaidOffline = payload.markPaidOffline !== false;

  if (!userId || !targetPokemon) {
    return NextResponse.json({ error: "userId and targetPokemon are required" }, { status: 400 });
  }

  const { data: targetProfile } = await adminSupabase
    .from("profiles")
    .select("id, full_name, email")
    .eq("id", userId)
    .maybeSingle();

  if (!targetProfile) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const { data: campaign, error: campaignError } = await adminSupabase
    .from("anniversary_campaigns")
    .select("id, event_id, entry_fee, additional_fee")
    .eq("slug", ANNIVERSARY_30TH_SLUG)
    .maybeSingle();

  if (campaignError || !campaign) {
    return NextResponse.json({ error: "Campaign is not configured yet" }, { status: 503 });
  }

  const { data: existingParticipant } = await adminSupabase
    .from("anniversary_participants")
    .select("id")
    .eq("campaign_id", campaign.id)
    .eq("user_id", userId)
    .maybeSingle();

  if (existingParticipant) {
    return NextResponse.json({ error: "這位會員已建立過參戰資格" }, { status: 409 });
  }

  const { data: participant, error: participantError } = await adminSupabase
    .from("anniversary_participants")
    .insert({
      campaign_id: campaign.id,
      user_id: userId,
      target_pokemon: targetPokemon,
      entry_fee_amount: campaign.entry_fee,
    })
    .select("id")
    .single();

  if (participantError || !participant) {
    return NextResponse.json({ error: participantError?.message || "Unable to create participant" }, { status: 500 });
  }

  const entryFeeLabel = Number(campaign.entry_fee || 0).toLocaleString("zh-TW");
  const additionalFeeLabel = Number(campaign.additional_fee || 0).toLocaleString("zh-TW");

  const { data: contracts, error: contractError } = await adminSupabase
    .from("anniversary_contracts")
    .insert([
      {
        participant_id: participant.id,
        contract_type: "main",
        pokemon_name: targetPokemon,
        price: campaign.entry_fee,
        status: "holding",
        notes: `管理員代建參戰。主契約已建立，暫持保證金 NT$ ${entryFeeLabel}；未守到最後將退回。`,
      },
      {
        participant_id: participant.id,
        contract_type: "additional",
        pokemon_name: null,
        price: campaign.additional_fee,
        status: "pending",
        notes: `活動期間曾踏入前 10，可解鎖追加契約顯現。完成後可建立 NT$ ${additionalFeeLabel} 付款資訊。`,
      },
    ])
    .select("*");

  if (contractError) {
    await adminSupabase.from("anniversary_participants").delete().eq("id", participant.id);
    return NextResponse.json({ error: contractError.message }, { status: 500 });
  }

  const mainContract = (contracts || []).find((entry) => entry.contract_type === "main");

  if (markPaidOffline && campaign.event_id && mainContract) {
    const now = new Date().toISOString();
    const { data: paymentRecord, error: paymentError } = await adminSupabase
      .from("user_payments")
      .insert({
        user_id: userId,
        event_id: campaign.event_id,
        amount: campaign.entry_fee,
        status: "paid",
        payment_date: now,
        notes: `管理員代建參戰（線下收款）。主契約目標：${targetPokemon}。`,
      })
      .select("id")
      .single();

    if (paymentError || !paymentRecord) {
      await adminSupabase.from("anniversary_participants").delete().eq("id", participant.id);
      return NextResponse.json({ error: paymentError?.message || "Unable to create payment record" }, { status: 500 });
    }

    const { error: mainContractError } = await adminSupabase
      .from("anniversary_contracts")
      .update({
        payment_record_id: paymentRecord.id,
        status: "holding",
        notes: `管理員代建參戰，已標記線下收款。主契約暫持保證金 NT$ ${entryFeeLabel} 已入帳。`,
      })
      .eq("id", mainContract.id);

    if (mainContractError) {
      await adminSupabase.from("user_payments").delete().eq("id", paymentRecord.id);
      await adminSupabase.from("anniversary_participants").delete().eq("id", participant.id);
      return NextResponse.json({ error: mainContractError.message }, { status: 500 });
    }
  }

  return NextResponse.json({
    success: true,
    participantId: participant.id,
    user: {
      id: targetProfile.id,
      full_name: targetProfile.full_name,
      email: targetProfile.email,
    },
  });
}
