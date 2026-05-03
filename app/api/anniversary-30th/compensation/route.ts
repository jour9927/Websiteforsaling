import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient, createServerSupabaseClient } from "@/lib/auth";
import {
  ANNIVERSARY_30TH_EEVEE_POINT_GOAL,
  ANNIVERSARY_30TH_SLUG,
  calculateAnniversaryEventPoints,
  type AnniversaryCampaign,
  type AnniversaryParticipant,
} from "@/lib/anniversary30th";

export const dynamic = "force-dynamic";

type CompensationChoice = "blindbox_discount_500" | "blindbox_discount_1000" | "blindbox_discount_2000" | "blindbox_discount_5000" | "shop_rebate_50" | "pokemon_choice_5";

type BackpackCompensationItem = {
  id: string;
  item_type: string;
  item_name: string;
  note: string | null;
  created_at: string;
};

const COMPENSATION_NOTE = "隨機型伊布配布活動對戰積分重整補償";
const COMPENSATION_ITEM_NAMES: Record<CompensationChoice, string> = {
  blindbox_discount_500: "500 元盲盒抵用券",
  blindbox_discount_1000: "1000 元盲盒抵用券",
  blindbox_discount_2000: "2000 元盲盒抵用券",
  blindbox_discount_5000: "5000 元盲盒抵用券",
  shop_rebate_50: "商店消費報銷券（50%）",
  pokemon_choice_5: "寶可夢五選一補償券",
};

function resolveCompensationChoice(item: BackpackCompensationItem | null): CompensationChoice | null {
  if (!item) return null;
  if (item.item_type === "blindbox_discount_500") return "blindbox_discount_500";
  if (item.item_type === "blindbox_discount_1000") return "blindbox_discount_1000";
  if (item.item_type === "blindbox_discount_2000") return "blindbox_discount_2000";
  if (item.item_type === "blindbox_discount_5000") return "blindbox_discount_5000";
  if (item.item_type === "pokemon_choice_5") return "pokemon_choice_5";
  if (item.item_name.includes("50%")) return "shop_rebate_50";
  return null;
}

async function countCompletedBattles(
  adminSupabase: ReturnType<typeof createAdminSupabaseClient>,
  participantId: string,
) {
  const { count } = await adminSupabase
    .from("anniversary_battles")
    .select("id", { count: "exact", head: true })
    .eq("participant_id", participantId)
    .in("status", ["won", "lost"]);

  return count ?? 0;
}

async function loadCompensationState(userId: string) {
  const adminSupabase = createAdminSupabaseClient();

  const { data: campaignData } = await adminSupabase
    .from("anniversary_campaigns")
    .select("*")
    .eq("slug", ANNIVERSARY_30TH_SLUG)
    .maybeSingle();

  const campaign = (campaignData || null) as AnniversaryCampaign | null;
  if (!campaign) {
    return {
      eligible: false,
      choice: null as CompensationChoice | null,
      participant: null as AnniversaryParticipant | null,
      eventPoints: 0,
    };
  }

  const { data: participantData } = await adminSupabase
    .from("anniversary_participants")
    .select("*")
    .eq("campaign_id", campaign.id)
    .eq("user_id", userId)
    .maybeSingle();

  const participant = (participantData || null) as AnniversaryParticipant | null;
  const completedBattleCount = participant
    ? await countCompletedBattles(adminSupabase, participant.id)
    : 0;
  const eventPoints = calculateAnniversaryEventPoints(
    completedBattleCount,
    participant?.total_wins ?? 0,
  );

  const { data: existingCompensation } = await adminSupabase
    .from("backpack_items")
    .select("id, item_type, item_name, note, created_at")
    .eq("user_id", userId)
    .eq("note", COMPENSATION_NOTE)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const choice = resolveCompensationChoice((existingCompensation || null) as BackpackCompensationItem | null);
  const eligible = Boolean(participant && (participant.partner_unlocked || eventPoints >= ANNIVERSARY_30TH_EEVEE_POINT_GOAL));

  return {
    eligible,
    choice,
    participant,
    eventPoints,
  };
}

export async function GET() {
  const supabase = createServerSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: "請先登入" }, { status: 401 });
  }

  const state = await loadCompensationState(session.user.id);

  return NextResponse.json({
    eligible: state.eligible,
    choice: state.choice,
    eventPoints: state.eventPoints,
  });
}

export async function POST(request: NextRequest) {
  const supabase = createServerSupabaseClient();
  const adminSupabase = createAdminSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: "請先登入" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const choice = body?.choice as CompensationChoice | undefined;

  if (
    choice !== "blindbox_discount_500" &&
    choice !== "blindbox_discount_1000" &&
    choice !== "blindbox_discount_2000" &&
    choice !== "blindbox_discount_5000" &&
    choice !== "shop_rebate_50" &&
    choice !== "pokemon_choice_5"
  ) {
    return NextResponse.json({ error: "補償選項不正確" }, { status: 400 });
  }

  const state = await loadCompensationState(session.user.id);

  if (!state.eligible) {
    return NextResponse.json({ error: "此帳號不在本次補償選擇範圍內" }, { status: 403 });
  }

  if (state.choice) {
    return NextResponse.json({
      choice: state.choice,
      message: "已完成補償選擇",
    });
  }

  const itemType =
    choice === "blindbox_discount_500"
      ? "blindbox_discount_500"
      : choice === "blindbox_discount_1000"
        ? "blindbox_discount_1000"
        : choice === "blindbox_discount_2000"
          ? "blindbox_discount_2000"
          : choice === "blindbox_discount_5000"
            ? "blindbox_discount_5000"
            : choice === "pokemon_choice_5"
              ? "pokemon_choice_5"
              : "auction_fee_rebate_40";
  const { error: insertError } = await adminSupabase
    .from("backpack_items")
    .insert({
      user_id: session.user.id,
      item_type: itemType,
      item_name: COMPENSATION_ITEM_NAMES[choice],
      note: COMPENSATION_NOTE,
      is_active: true,
    });

  if (insertError) {
    console.error("[anniversary-30th/compensation] Failed to grant compensation", insertError);
    return NextResponse.json({ error: "補償發放失敗，請稍後再試" }, { status: 500 });
  }

  return NextResponse.json({
    choice,
    message: "補償已發放到背包",
  });
}
