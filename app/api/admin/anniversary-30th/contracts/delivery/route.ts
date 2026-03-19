import { NextResponse } from "next/server";
import { createAdminSupabaseClient, createServerSupabaseClient } from "@/lib/auth";

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

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", session.user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const payload = await request.json().catch(() => ({}));
  const participantId = typeof payload.participantId === "string" ? payload.participantId : "";
  const contractType = payload.contractType === "main" || payload.contractType === "additional" ? payload.contractType : null;

  if (!participantId || !contractType) {
    return NextResponse.json({ error: "participantId and contractType are required" }, { status: 400 });
  }

  const { data: participant } = await adminSupabase
    .from("anniversary_participants")
    .select("id, user_id, target_pokemon, campaign_id")
    .eq("id", participantId)
    .maybeSingle();

  if (!participant) {
    return NextResponse.json({ error: "Participant not found" }, { status: 404 });
  }

  const [{ data: campaign }, { data: contract }] = await Promise.all([
    adminSupabase
      .from("anniversary_campaigns")
      .select("id, event_id")
      .eq("id", participant.campaign_id)
      .maybeSingle(),
    adminSupabase
      .from("anniversary_contracts")
      .select("*")
      .eq("participant_id", participant.id)
      .eq("contract_type", contractType)
      .maybeSingle(),
  ]);

  if (!campaign?.event_id) {
    return NextResponse.json({ error: "Campaign event_id is missing" }, { status: 503 });
  }

  if (!contract) {
    return NextResponse.json({ error: "Contract not found" }, { status: 404 });
  }

  if (contract.delivery_record_id) {
    const { data: existingDelivery } = await adminSupabase
      .from("user_deliveries")
      .select("id, status, item_name")
      .eq("id", contract.delivery_record_id)
      .maybeSingle();

    return NextResponse.json({
      delivery: existingDelivery,
      alreadyExists: true,
    });
  }

  const canCreateDelivery =
    contractType === "main"
      ? ["secured", "paid", "delivered"].includes(contract.status)
      : ["paid", "delivered"].includes(contract.status);

  if (!canCreateDelivery) {
    return NextResponse.json({ error: "目前契約狀態尚未進入可交付階段。" }, { status: 409 });
  }

  const itemName =
    contract.pokemon_name || (contractType === "main" ? participant.target_pokemon : "守護伊布");

  const { data: delivery, error: deliveryError } = await adminSupabase
    .from("user_deliveries")
    .insert({
      user_id: participant.user_id,
      event_id: campaign.event_id,
      item_name: itemName,
      quantity: 1,
      status: "pending",
      notes:
        contractType === "main"
          ? "30 週年主契約交付紀錄。"
          : "30 週年追加契約交付紀錄。",
    })
    .select("id, status, item_name, delivery_date")
    .single();

  if (deliveryError || !delivery) {
    return NextResponse.json({ error: deliveryError?.message || "Unable to create delivery" }, { status: 500 });
  }

  const nextStatus = contract.status === "secured" ? "paid" : contract.status;
  const { error: contractUpdateError } = await adminSupabase
    .from("anniversary_contracts")
    .update({
      delivery_record_id: delivery.id,
      status: nextStatus,
      notes:
        contractType === "main"
          ? "主契約已進入交付流程。"
          : `追加契約 ${itemName} 已進入交付流程。`,
    })
    .eq("id", contract.id);

  if (contractUpdateError) {
    await adminSupabase.from("user_deliveries").delete().eq("id", delivery.id);
    return NextResponse.json({ error: contractUpdateError.message }, { status: 500 });
  }

  return NextResponse.json({
    delivery,
    alreadyExists: false,
  });
}
