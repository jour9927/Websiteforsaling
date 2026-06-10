import { NextResponse } from "next/server";
import { createAdminSupabaseClient, createServerSupabaseClient } from "@/lib/auth";

export const dynamic = "force-dynamic";

const VALID_GAMES = ["sword_shield", "scarlet_violet", "legends_arceus", "bdsp", "lets_go"];
const GAME_NAME_REWARD_POINTS_PER_REGISTRATION = 1;

export async function POST(request: Request) {
  const supabase = createServerSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: "未登入" }, { status: 401 });
  }

  const userId = session.user.id;

  let body: { game_id?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "無效的請求" }, { status: 400 });
  }

  const { game_id } = body;

  if (!game_id || !VALID_GAMES.includes(game_id)) {
    return NextResponse.json({ error: "無效的遊戲 ID" }, { status: 400 });
  }

  // 檢查是否已登記過此遊戲
  const { data: profile } = await supabase
    .from("profiles")
    .select("owned_games")
    .eq("id", userId)
    .single();

  const currentGames: string[] = profile?.owned_games || [];

  if (currentGames.includes(game_id)) {
    return NextResponse.json({ error: "此遊戲版本已登記過了" }, { status: 400 });
  }

  // 登記遊戲
  const updatedGames = [...currentGames, game_id];
  const { error: updateError } = await supabase
    .from("profiles")
    .update({ owned_games: updatedGames })
    .eq("id", userId);

  if (updateError) {
    return NextResponse.json({ error: "登記失敗：" + updateError.message }, { status: 500 });
  }

  const adminClient = createAdminSupabaseClient();
  const { data: rewardRows, error: rewardError } = await adminClient.rpc(
    "grant_game_name_reward_points",
    {
      p_user_id: userId,
      p_points: GAME_NAME_REWARD_POINTS_PER_REGISTRATION,
    },
  );

  let rewardMessage = "";
  if (rewardError) {
    rewardMessage = " 登記已完成，但獎勵點發放失敗，請聯繫管理員確認。";
  } else {
    const rewardResult = Array.isArray(rewardRows) ? rewardRows[0] : rewardRows;
    const grantedPoints = rewardResult?.granted_points ?? 0;
    const availablePoints = rewardResult?.available_points ?? 0;

    rewardMessage =
      grantedPoints > 0
        ? ` 獲得 ${grantedPoints} 點遊戲名稱獎勵點，目前可用 ${availablePoints} 點。`
        : ` 遊戲名稱獎勵點已達 10 點上限，目前可用 ${availablePoints} 點。`;
  }

  return NextResponse.json({
    success: true,
    message: `遊戲版本已登記！${rewardMessage}`,
  });
}
