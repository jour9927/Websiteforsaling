import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/auth";

type RouteContext = {
  params: { id: string };
};

export async function POST(request: Request, context: RouteContext) {
  const supabase = createServerSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: "未登入" }, { status: 401 });
  }

  const userId = session.user.id;
  const eventId = context.params.id;

  // 確認活動已結束
  const { data: event } = await supabase
    .from("events")
    .select("end_date, title")
    .eq("id", eventId)
    .single();

  if (!event) {
    return NextResponse.json({ error: "找不到活動" }, { status: 404 });
  }

  if (new Date(event.end_date) > new Date()) {
    return NextResponse.json({ error: "活動尚未結束" }, { status: 400 });
  }

  // 確認用戶有報名
  const { data: registration } = await supabase
    .from("registrations")
    .select("invited_by_user_id")
    .eq("event_id", eventId)
    .eq("user_id", userId)
    .single();

  if (!registration) {
    return NextResponse.json({ error: "你沒有報名此活動" }, { status: 400 });
  }

  // 檢查用戶是否被邀請
  const wasInvited = !!registration.invited_by_user_id;

  // 檢查用戶是否邀請了別人
  const { count: invitedOthers } = await supabase
    .from("registrations")
    .select("*", { count: "exact", head: true })
    .eq("event_id", eventId)
    .eq("invited_by_user_id", userId);

  const invitedCount = invitedOthers || 0;

  if (!wasInvited && invitedCount === 0) {
    return NextResponse.json({ error: "你沒有邀請碼資格" }, { status: 400 });
  }

  // 檢查是否已領取過（透過 user_items 的 notes 欄位判斷）
  const surpriseNote = `邀請碼驚喜 - ${event.title || eventId}`;
  const { data: existingItem } = await supabase
    .from("user_items")
    .select("id")
    .eq("user_id", userId)
    .like("notes", `%邀請碼驚喜%`)
    .eq("event_id", eventId)
    .maybeSingle();

  if (existingItem) {
    return NextResponse.json({ error: "你已經領取過驚喜了" }, { status: 400 });
  }

  // 隨機點數：5,000 ~ 50,000
  const minPoints = 5000;
  const maxPoints = 50000;
  const awardPoints = Math.floor(Math.random() * (maxPoints - minPoints + 1)) + minPoints;

  // 寫入 user_items
  const { error: insertError } = await supabase.from("user_items").insert({
    user_id: userId,
    event_id: eventId,
    name: "🎁 邀請碼驚喜",
    quantity: 1,
    notes: `${surpriseNote} (${awardPoints.toLocaleString()} 點)`,
  });

  if (insertError) {
    console.error("寫入 user_items 失敗:", insertError);
    return NextResponse.json({ error: "系統異常，請稍後再試" }, { status: 500 });
  }

  // 更新 fortune_points
  const { data: profile } = await supabase
    .from("profiles")
    .select("fortune_points")
    .eq("id", userId)
    .single();

  const currentPoints = profile?.fortune_points || 0;
  await supabase
    .from("profiles")
    .update({ fortune_points: currentPoints + awardPoints })
    .eq("id", userId);

  return NextResponse.json({
    success: true,
    message: `恭喜獲得 ${awardPoints.toLocaleString()} 點數！`,
    points: awardPoints,
  });
}
