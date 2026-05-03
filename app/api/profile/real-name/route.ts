import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const supabase = createServerSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: "未登入" }, { status: 401 });
  }

  const userId = session.user.id;

  // 檢查是否已提交過
  const { data: existing } = await supabase
    .from("profiles")
    .select("real_name_submitted_at")
    .eq("id", userId)
    .single();

  if (existing?.real_name_submitted_at) {
    return NextResponse.json({ error: "你已經提交過實名資料了" }, { status: 400 });
  }

  let body: { real_name?: string; real_name_kana?: string; owned_games?: string[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "無效的請求" }, { status: 400 });
  }

  const { real_name, real_name_kana, owned_games } = body;

  if (!real_name || !real_name.trim()) {
    return NextResponse.json({ error: "請填寫名字" }, { status: 400 });
  }

  const now = new Date().toISOString();

  // 儲存實名資料
  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      real_name: real_name.trim(),
      real_name_kana: real_name_kana?.trim() || null,
      owned_games: owned_games || [],
      real_name_submitted_at: now,
    })
    .eq("id", userId);

  if (updateError) {
    return NextResponse.json({ error: "儲存失敗：" + updateError.message }, { status: 500 });
  }

  // 檢查是否在 5/30 前提交 → 發放獎勵
  const deadline = new Date("2026-05-30T23:59:59+08:00");
  const submittedAt = new Date(now);
  let rewardMessage = "";

  if (submittedAt <= deadline) {
    const rewardPoints = 10000;

    // 寫入獎勵記錄
    const { error: itemError } = await supabase.from("user_items").insert({
      user_id: userId,
      name: "🎁 實名制早鳥獎勵",
      quantity: 1,
      notes: `5/30 前完成實名登記獎勵 (${rewardPoints.toLocaleString()} 點)`,
    });

    if (!itemError) {
      // 更新 fortune_points
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

      rewardMessage = ` 🎉 5/30 前提交，獲得 ${rewardPoints.toLocaleString()} 點獎勵！`;
    }
  }

  return NextResponse.json({
    success: true,
    message: `實名資料已提交！${rewardMessage}`,
  });
}
