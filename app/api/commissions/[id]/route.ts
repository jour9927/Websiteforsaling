import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/auth";

// GET /api/commissions/[id] — 取得單筆委託詳情
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from("commissions")
    .select(
      `*,
       distributions(id, pokemon_name, pokemon_name_en, pokemon_sprite_url, pokemon_dex_number, generation, points, game_titles, original_trainer, distribution_method, region, is_shiny),
       poster:profiles!commissions_poster_id_fkey(id, display_name),
       poster_virtual:virtual_profiles!commissions_poster_virtual_id_fkey(id, display_name, avatar_seed),
       executor:profiles!commissions_executor_id_fkey(id, display_name),
       executor_virtual:virtual_profiles!commissions_executor_virtual_id_fkey(id, display_name, avatar_seed),
       commission_deposits(id, deposit_pokemon_name, deposit_pokemon_value, status, return_eligible_at),
       commission_messages(id, sender_id, sender_virtual_id, sender_type, content, created_at)`
    )
    .eq("id", params.id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "找不到此委託" }, { status: 404 });
  }

  // 隱藏虛擬用戶身份
  const c = data as Record<string, unknown>;
  const poster = c.poster_type === "virtual" ? c.poster_virtual : c.poster;
  const executor = c.executor_type === "virtual" ? c.executor_virtual : c.executor;
  const hideKeys = ["poster_type", "poster_virtual", "executor_type", "executor_virtual", "poster_virtual_id", "executor_virtual_id", "admin_review_note", "reviewed_by"];
  const cleaned = Object.fromEntries(Object.entries(c).filter(([k]) => !hideKeys.includes(k)));

  return NextResponse.json({ commission: { ...cleaned, poster, executor } });
}
