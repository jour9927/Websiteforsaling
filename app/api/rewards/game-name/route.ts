import { NextResponse } from "next/server";
import { createAdminSupabaseClient, createServerSupabaseClient } from "@/lib/auth";
import {
  STORE_REBATE_REWARDS,
  getStoreRebateRewardByKey,
} from "@/lib/rewardExchange";

export const dynamic = "force-dynamic";

type RedemptionRow = {
  id: string;
  reward_key: string;
  item_type: string;
  item_name: string;
  cost_points: number;
  discount_percent: number;
  backpack_item_id: string | null;
  created_at: string;
};

async function getAuthenticatedUser() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

async function loadRewardState(userId: string) {
  const adminClient = createAdminSupabaseClient();

  await adminClient
    .from("game_name_reward_balances")
    .upsert({ user_id: userId }, { onConflict: "user_id", ignoreDuplicates: true });

  const [{ data: balance, error: balanceError }, { data: redemptions, error: redemptionsError }] =
    await Promise.all([
      adminClient
        .from("game_name_reward_balances")
        .select("available_points, lifetime_points, updated_at")
        .eq("user_id", userId)
        .maybeSingle(),
      adminClient
        .from("game_name_reward_redemptions")
        .select("id, reward_key, item_type, item_name, cost_points, discount_percent, backpack_item_id, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

  if (balanceError) {
    throw new Error(balanceError.message);
  }

  if (redemptionsError) {
    throw new Error(redemptionsError.message);
  }

  return {
    balance: {
      availablePoints: balance?.available_points ?? 0,
      lifetimePoints: balance?.lifetime_points ?? 0,
      updatedAt: balance?.updated_at ?? null,
    },
    rewards: STORE_REBATE_REWARDS,
    redemptions: (redemptions ?? []) as RedemptionRow[],
  };
}

export async function GET() {
  const user = await getAuthenticatedUser();

  if (!user) {
    return NextResponse.json({ error: "請先登入" }, { status: 401 });
  }

  try {
    const state = await loadRewardState(user.id);
    return NextResponse.json(state);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "載入獎勵兌換資料失敗" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();

  if (!user) {
    return NextResponse.json({ error: "請先登入" }, { status: 401 });
  }

  let body: { reward_key?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "無效的請求" }, { status: 400 });
  }

  const reward = getStoreRebateRewardByKey(body.reward_key ?? "");

  if (!reward) {
    return NextResponse.json({ error: "無效的兌換項目" }, { status: 400 });
  }

  const adminClient = createAdminSupabaseClient();
  const { data, error } = await adminClient.rpc("redeem_game_name_reward_coupon", {
    p_user_id: user.id,
    p_reward_key: reward.key,
    p_item_type: reward.itemType,
    p_item_name: reward.name,
    p_cost_points: reward.pointsCost,
    p_discount_percent: reward.discountPercent,
  });

  if (error) {
    const message = error.message.includes("INSUFFICIENT_GAME_REWARD_POINTS")
      ? "遊戲名稱獎勵點不足，無法兌換此項目。"
      : error.message.includes("INVALID_GAME_REWARD_COUPON")
        ? "兌換項目規則不一致，請重新整理後再試。"
        : error.message;

    return NextResponse.json({ error: message }, { status: 400 });
  }

  const result = Array.isArray(data) ? data[0] : data;

  return NextResponse.json({
    success: true,
    message: `已兌換 ${reward.name}，道具已加入你的背包。`,
    reward,
    backpackItemId: result?.backpack_item_id ?? null,
    remainingPoints: result?.remaining_points ?? null,
  });
}
