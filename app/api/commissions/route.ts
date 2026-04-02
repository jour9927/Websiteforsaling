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
       poster:profiles!commissions_poster_id_fkey(id, full_name),
       poster_virtual:virtual_profiles!commissions_poster_virtual_id_fkey(id, display_name, avatar_seed),
       executor:profiles!commissions_executor_id_fkey(id, full_name),
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

  // 隱藏虛擬用戶身份：統一為 poster / executor 欄位
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const hideKeys = ["poster_type", "poster_virtual", "executor_type", "executor_virtual", "poster_virtual_id", "executor_virtual_id", "admin_review_note", "reviewed_by"];
  const sanitized = (data || []).map((c: Record<string, any>) => {
    const rawPoster = c.poster_type === "virtual" ? c.poster_virtual : c.poster;
    const poster = rawPoster ? { id: rawPoster.id, display_name: rawPoster.display_name || rawPoster.full_name || "匿名" } : null;
    const rawExecutor = c.executor_type === "virtual" ? c.executor_virtual : c.executor;
    const executor = rawExecutor ? { id: rawExecutor.id, display_name: rawExecutor.display_name || rawExecutor.full_name || "匿名" } : null;
    const cleaned = Object.fromEntries(Object.entries(c).filter(([k]) => !hideKeys.includes(k)));
    return { ...cleaned, poster, executor };
  });

  return NextResponse.json({
    commissions: sanitized,
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
  const { distribution_id, pokemon_name, description, base_price, price_type, platform_fee, proof_images } = body;

  // 驗證必填
  if (!pokemon_name || !base_price) {
    return NextResponse.json({ error: "寶可夢名稱和底價為必填" }, { status: 400 });
  }

  // 驗證抽成上限
  if (platform_fee && platform_fee > (base_price * 4) / 5) {
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
      platform_fee: platform_fee || 0,
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
