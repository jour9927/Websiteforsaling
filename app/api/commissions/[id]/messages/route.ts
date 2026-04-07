import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/auth";

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

  // 確認使用者是委託的 poster 或 executor（或管理員）
  const adminSupabase = createAdminSupabaseClient();

  const { data: commission, error: commissionError } = await adminSupabase
    .from("commissions")
    .select("id, poster_id, poster_type, poster_virtual_id, executor_id")
    .eq("id", params.id)
    .single();

  if (commissionError || !commission) {
    return NextResponse.json({ error: "找不到此委託" }, { status: 404 });
  }

  // 查詢是否為 admin
  const { data: profile } = await adminSupabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  const isAdmin = profile?.role === "admin";

  const isParticipant =
    commission.poster_id === user.id || commission.executor_id === user.id;

  // 虛擬委託：admin 也可以存取（代虛擬用戶回覆）
  const isVirtualPoster = commission.poster_type === "virtual";

  if (!isParticipant && !(isAdmin && isVirtualPoster)) {
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

  // 確認使用者是委託的 poster 或 executor（或管理員）
  const adminSupabasePost = createAdminSupabaseClient();

  const { data: commissionPost, error: commissionError } = await adminSupabasePost
    .from("commissions")
    .select("id, poster_id, poster_type, poster_virtual_id, executor_id")
    .eq("id", params.id)
    .single();

  if (commissionError || !commissionPost) {
    return NextResponse.json({ error: "找不到此委託" }, { status: 404 });
  }

  const { data: profilePost } = await adminSupabasePost
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  const isAdminPost = profilePost?.role === "admin";

  const isParticipantPost =
    commissionPost.poster_id === user.id || commissionPost.executor_id === user.id;
  const isVirtualPosterPost = commissionPost.poster_type === "virtual";

  if (!isParticipantPost && !(isAdminPost && isVirtualPosterPost)) {
    return NextResponse.json({ error: "無權限在此對話發送訊息" }, { status: 403 });
  }

  // 解析並驗證 body
  let body: { content?: string; as_virtual?: boolean };
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

  // admin 以虛擬用戶名義回覆（as_virtual: true）
  const sendAsVirtual =
    isAdminPost && isVirtualPosterPost && body.as_virtual === true;

  const insertPayload = sendAsVirtual
    ? {
        commission_id: params.id,
        sender_virtual_id: commissionPost.poster_virtual_id,
        sender_type: "virtual" as const,
        content,
      }
    : {
        commission_id: params.id,
        sender_id: user.id,
        sender_type: "user" as const,
        content,
      };

  // 插入訊息
  const { data: message, error: insertError } = await adminSupabasePost
    .from("commission_messages")
    .insert(insertPayload)
    .select()
    .single();

  if (insertError) {
    return NextResponse.json({ error: "發送訊息失敗" }, { status: 500 });
  }

  return NextResponse.json({ message });
}
