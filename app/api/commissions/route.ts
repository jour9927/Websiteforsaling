import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/auth";

// GET /api/commissions — 取得委託列表
export async function GET(request: NextRequest) {
  const supabase = createServerSupabaseClient();
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = 20;
  const offset = (page - 1) * limit;

  let query = supabase
    .from("commissions")
    .select(
      `*,
       distributions(pokemon_name, pokemon_name_en, pokemon_sprite_url, generation, points),
       poster:profiles!commissions_poster_id_fkey(id, display_name),
       poster_virtual:virtual_profiles!commissions_poster_virtual_id_fkey(id, display_name, avatar_seed),
       executor:profiles!commissions_executor_id_fkey(id, display_name),
       executor_virtual:virtual_profiles!commissions_executor_virtual_id_fkey(id, display_name, avatar_seed)`,
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  // 篩選狀態（預設顯示公開可見的）
  if (status) {
    query = query.eq("status", status);
  } else {
    query = query.in("status", ["active", "accepted", "proof_submitted", "proof_approved", "completed", "queued"]);
  }

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    commissions: data || [],
    total: count || 0,
    page,
    totalPages: Math.ceil((count || 0) / limit),
  });
}

// POST /api/commissions — 建立新委託
export async function POST(request: NextRequest) {
  const supabase = createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "請先登入" }, { status: 401 });
  }

  const body = await request.json();
  const { distribution_id, pokemon_name, description, base_price, price_type, poster_fee, proof_images } = body;

  // 驗證必填
  if (!pokemon_name || !base_price) {
    return NextResponse.json({ error: "寶可夢名稱和底價為必填" }, { status: 400 });
  }

  // 驗證抽成上限
  if (poster_fee && poster_fee > (base_price * 4) / 5) {
    return NextResponse.json({ error: "抽成不可超過底價的 4/5" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("commissions")
    .insert({
      poster_id: user.id,
      poster_type: "user",
      distribution_id: distribution_id || null,
      pokemon_name,
      description: description || "",
      base_price,
      price_type: price_type === "twd" ? "twd" : "points",
      poster_fee: poster_fee || 0,
      proof_images: proof_images || [],
      status: "pending_review",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ commission: data }, { status: 201 });
}
