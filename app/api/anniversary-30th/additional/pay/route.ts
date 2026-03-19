import { NextResponse } from "next/server";
import { createAdminSupabaseClient, createServerSupabaseClient } from "@/lib/auth";
import {
  ANNIVERSARY_30TH_SLUG,
  type AnniversaryCampaign,
  type AnniversaryContract,
  type AnniversaryParticipant,
  type AnniversaryRevealState,
} from "@/lib/anniversary30th";

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

  const { data: campaignData } = await supabase
    .from("anniversary_campaigns")
    .select("*")
    .eq("slug", ANNIVERSARY_30TH_SLUG)
    .maybeSingle();

  const campaign = (campaignData || null) as AnniversaryCampaign | null;

  if (!campaign || !campaign.event_id) {
    return NextResponse.json({ error: "活動尚未綁定付款事件。" }, { status: 503 });
  }

  const { data: participantData } = await supabase
    .from("anniversary_participants")
    .select("*")
    .eq("campaign_id", campaign.id)
    .eq("user_id", session.user.id)
    .maybeSingle();

  const participant = (participantData || null) as AnniversaryParticipant | null;

  if (!participant) {
    return NextResponse.json({ error: "找不到你的主契約參戰資料。" }, { status: 404 });
  }

  const [{ data: revealStateData }, { data: contractsData }] = await Promise.all([
    adminSupabase
      .from("anniversary_reveal_states")
      .select("*")
      .eq("participant_id", participant.id)
      .maybeSingle(),
    adminSupabase
      .from("anniversary_contracts")
      .select("*")
      .eq("participant_id", participant.id),
  ]);

  const revealState = (revealStateData || null) as AnniversaryRevealState | null;
  const contracts = (contractsData || []) as AnniversaryContract[];
  const additionalContract = contracts.find((contract) => contract.contract_type === "additional") ?? null;

  if (!additionalContract) {
    return NextResponse.json({ error: "找不到追加契約。" }, { status: 404 });
  }

  if (!revealState?.revealed_pokemon || !revealState.price_resolved) {
    return NextResponse.json({ error: "請先完成顯現與定價儀式。" }, { status: 409 });
  }

  if (additionalContract.payment_record_id) {
    const { data: existingPayment } = await adminSupabase
      .from("user_payments")
      .select("id, status, amount")
      .eq("id", additionalContract.payment_record_id)
      .maybeSingle();

    return NextResponse.json({
      paymentId: existingPayment?.id || additionalContract.payment_record_id,
      status: existingPayment?.status || "pending",
      amount: Number(existingPayment?.amount || revealState.price_resolved),
      alreadyExists: true,
    });
  }

  const { data: paymentData, error: paymentError } = await adminSupabase
    .from("user_payments")
    .insert({
      user_id: session.user.id,
      event_id: campaign.event_id,
      amount: revealState.price_resolved,
      status: "pending",
      notes: `30 週年追加契約締約金。顯現結果：${revealState.revealed_pokemon}。`,
    })
    .select("id, status, amount")
    .single();

  if (paymentError || !paymentData) {
    return NextResponse.json({ error: paymentError?.message || "Unable to create payment record" }, { status: 500 });
  }

  const { error: contractUpdateError } = await adminSupabase
    .from("anniversary_contracts")
    .update({
      payment_record_id: paymentData.id,
      status: "priced",
      notes: `追加契約已顯現為 ${revealState.revealed_pokemon}，付款資訊已建立，目前待處理 NT$ ${Number(revealState.price_resolved).toLocaleString()}。`,
    })
    .eq("id", additionalContract.id);

  if (contractUpdateError) {
    await adminSupabase.from("user_payments").delete().eq("id", paymentData.id);
    return NextResponse.json({ error: contractUpdateError.message }, { status: 500 });
  }

  return NextResponse.json({
    paymentId: paymentData.id,
    status: paymentData.status,
    amount: Number(paymentData.amount),
    alreadyExists: false,
  });
}
