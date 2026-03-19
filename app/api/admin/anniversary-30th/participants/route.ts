import { NextResponse } from "next/server";
import { createAdminSupabaseClient, createServerSupabaseClient } from "@/lib/auth";
import { ANNIVERSARY_30TH_SLUG } from "@/lib/anniversary30th";

export const dynamic = "force-dynamic";

export async function GET() {
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

  const { data: campaign } = await adminSupabase
    .from("anniversary_campaigns")
    .select("id, event_id, slug, title")
    .eq("slug", ANNIVERSARY_30TH_SLUG)
    .maybeSingle();

  if (!campaign) {
    return NextResponse.json({ participants: [] });
  }

  const { data: participants } = await adminSupabase
    .from("anniversary_participants")
    .select("*")
    .eq("campaign_id", campaign.id)
    .order("created_at", { ascending: false });

  if (!participants || participants.length === 0) {
    return NextResponse.json({ participants: [] });
  }

  const participantIds = participants.map((participant) => participant.id);
  const userIds = participants.map((participant) => participant.user_id);

  const [{ data: profiles }, { data: contracts }, { data: revealStates }, { data: routes }] = await Promise.all([
    adminSupabase.from("profiles").select("id, full_name, email").in("id", userIds),
    adminSupabase.from("anniversary_contracts").select("*").in("participant_id", participantIds),
    adminSupabase.from("anniversary_reveal_states").select("*").in("participant_id", participantIds),
    adminSupabase.from("anniversary_curated_routes").select("*").in("participant_id", participantIds),
  ]);

  const paymentIds = (contracts || [])
    .map((contract) => contract.payment_record_id)
    .filter((value): value is string => Boolean(value));
  const deliveryIds = (contracts || [])
    .map((contract) => contract.delivery_record_id)
    .filter((value): value is string => Boolean(value));

  const [{ data: payments }, { data: deliveries }] = await Promise.all([
    paymentIds.length > 0
      ? adminSupabase.from("user_payments").select("id, status, payment_date, amount").in("id", paymentIds)
      : Promise.resolve({ data: [] }),
    deliveryIds.length > 0
      ? adminSupabase.from("user_deliveries").select("id, status, delivery_date, item_name").in("id", deliveryIds)
      : Promise.resolve({ data: [] }),
  ]);

  const profileMap = new Map((profiles || []).map((entry) => [entry.id, entry]));
  const contractMap = new Map(
    (contracts || []).map((contract) => [`${contract.participant_id}:${contract.contract_type}`, contract]),
  );
  const revealMap = new Map((revealStates || []).map((state) => [state.participant_id, state]));
  const routeMap = new Map((routes || []).map((route) => [route.participant_id, route]));
  const paymentMap = new Map((payments || []).map((payment) => [payment.id, payment]));
  const deliveryMap = new Map((deliveries || []).map((delivery) => [delivery.id, delivery]));

  const normalizedParticipants = participants.map((participant) => {
    const mainContract = contractMap.get(`${participant.id}:main`) || null;
    const additionalContract = contractMap.get(`${participant.id}:additional`) || null;

    return {
      participant,
      profile: profileMap.get(participant.user_id) || null,
      revealState: revealMap.get(participant.id) || null,
      curatedRoute: routeMap.get(participant.id) || null,
      mainContract: mainContract
        ? {
            ...mainContract,
            payment: mainContract.payment_record_id ? paymentMap.get(mainContract.payment_record_id) || null : null,
            delivery: mainContract.delivery_record_id ? deliveryMap.get(mainContract.delivery_record_id) || null : null,
          }
        : null,
      additionalContract: additionalContract
        ? {
            ...additionalContract,
            payment: additionalContract.payment_record_id
              ? paymentMap.get(additionalContract.payment_record_id) || null
              : null,
            delivery: additionalContract.delivery_record_id
              ? deliveryMap.get(additionalContract.delivery_record_id) || null
              : null,
          }
        : null,
    };
  });

  return NextResponse.json({
    campaign,
    participants: normalizedParticipants,
  });
}
