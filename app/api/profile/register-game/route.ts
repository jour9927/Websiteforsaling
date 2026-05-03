import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/auth";

export const dynamic = "force-dynamic";

const VALID_GAMES = ["sword_shield", "scarlet_violet", "legends_arceus", "bdsp", "lets_go"];

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

  // 5/30 前發放獎勵
  const deadline = new Date("2026-05-30T23:59:59+08:00");
  const now = new Date();
  let rewardMessage = "";

  if (now <= deadline) {
    const rewardPoints = 5000;

    const { error: itemError } = await supabase.from("user_items").insert({
      user_id: userId,
      name: `🎮 遊戲登記獎勵 (${game_id})`,
      quantity: 1,
      notes: `5/30 前登記遊戲版本獎勵 (${rewardPoints.toLocaleString()} 點)`,
    });

    if (!itemError) {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("fortune_points")
        .eq("id", userId)
        .single();

      const currentPoints = profileData?.fortune_points || 0;
      await supabase
        .from("profiles")
        .update({ fortune_points: currentPoints + rewardPoints })
        .eq("id", userId);

      rewardMessage = ` 🎉 獲得 ${rewardPoints.toLocaleString()} 點獎勵！`;
    }
  }

  return NextResponse.json({
    success: true,
    message: `遊戲版本已登記！${rewardMessage}`,
  });
}
