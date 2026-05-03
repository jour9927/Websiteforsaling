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

  let body: { real_name?: string; real_name_kana?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "無效的請求" }, { status: 400 });
  }

  const { real_name, real_name_kana } = body;

  if (!real_name || !real_name.trim()) {
    return NextResponse.json({ error: "請填寫名字" }, { status: 400 });
  }

  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      real_name: real_name.trim(),
      real_name_kana: real_name_kana?.trim() || null,
      real_name_submitted_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (updateError) {
    return NextResponse.json({ error: "儲存失敗：" + updateError.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    message: "實名資料已提交！",
  });
}
