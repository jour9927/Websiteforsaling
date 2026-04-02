import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/auth";

// GET /api/commissions/[id]/messages — 取得委託對話訊息
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "請先登入" }, { status: 401 });
  }

  // 確認使用者是委託的 poster 或 executor
  const { data: commission, error: commissionError } = await supabase
    .from("commissions")
    .select("id, poster_id, executor_id")
    .eq("id", params.id)
    .single();

  if (commissionError || !commission) {
    return NextResponse.json({ error: "找不到此委託" }, { status: 404 });
  }

  if (commission.poster_id !== user.id && commission.executor_id !== user.id) {
    return NextResponse.json({ error: "無權限查看此對話" }, { status: 403 });
  }

  // 取得所有訊息，按時間升序
  const { data: messages, error: msgError } = await supabase
    .from("commission_messages")
    .select(
      `
      id,
      commission_id,
      sender_id,
      sender_virtual_id,
      sender_type,
      content,
      created_at,
      profiles:sender_id ( id, display_name, avatar_url ),
      virtual_profiles:sender_virtual_id ( id, display_name, avatar_url )
    `
    )
    .eq("commission_id", params.id)
    .order("created_at", { ascending: true });

  if (msgError) {
    return NextResponse.json({ error: "讀取訊息失敗" }, { status: 500 });
  }

  return NextResponse.json({ messages: messages || [] });
}

// POST /api/commissions/[id]/messages — 發送委託訊息
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "請先登入" }, { status: 401 });
  }

  // 確認使用者是委託的 poster 或 executor
  const { data: commission, error: commissionError } = await supabase
    .from("commissions")
    .select("id, poster_id, executor_id")
    .eq("id", params.id)
    .single();

  if (commissionError || !commission) {
    return NextResponse.json({ error: "找不到此委託" }, { status: 404 });
  }

  if (commission.poster_id !== user.id && commission.executor_id !== user.id) {
    return NextResponse.json({ error: "無權限在此對話發送訊息" }, { status: 403 });
  }

  // 解析並驗證 body
  let body: { content?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "請提供有效的 JSON" }, { status: 400 });
  }

  const content = body.content?.trim();
  if (!content) {
    return NextResponse.json({ error: "訊息內容不可為空" }, { status: 400 });
  }
  if (content.length > 500) {
    return NextResponse.json(
      { error: "訊息內容不可超過 500 字" },
      { status: 400 }
    );
  }

  // 插入訊息
  const { data: message, error: insertError } = await supabase
    .from("commission_messages")
    .insert({
      commission_id: params.id,
      sender_id: user.id,
      sender_type: "user",
      content,
    })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json({ error: "發送訊息失敗" }, { status: 500 });
  }

  return NextResponse.json({ message });
}
