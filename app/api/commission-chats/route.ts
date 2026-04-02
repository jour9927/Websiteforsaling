import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/auth";

/* eslint-disable @typescript-eslint/no-explicit-any */

// GET /api/commission-chats — 取得使用者所有有對話的委託
export async function GET() {
  const supabase = createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "請先登入" }, { status: 401 });
  }

  // 取得使用者作為 poster 或 executor 且狀態在進行中的委託
  const { data: commissions, error: commError } = await supabase
    .from("commissions")
    .select(
      `id,
       pokemon_name,
       status,
       poster_id,
       executor_id,
       poster_type,
       executor_type,
       created_at,
       updated_at,
       distributions(pokemon_name, pokemon_name_en, pokemon_sprite_url),
       poster:profiles!commissions_poster_id_fkey(id, full_name),
       poster_virtual:virtual_profiles!commissions_poster_virtual_id_fkey(id, display_name),
       executor:profiles!commissions_executor_id_fkey(id, full_name),
       executor_virtual:virtual_profiles!commissions_executor_virtual_id_fkey(id, display_name)`
    )
    .in("status", [
      "accepted",
      "proof_submitted",
      "proof_approved",
      "completed",
    ])
    .or(`poster_id.eq.${user.id},executor_id.eq.${user.id}`);

  if (commError) {
    return NextResponse.json(
      { error: "讀取委託失敗" },
      { status: 500 }
    );
  }

  if (!commissions || commissions.length === 0) {
    return NextResponse.json({ chats: [] });
  }

  // 取得每筆委託的最新訊息和訊息數
  const commissionIds = commissions.map((c: any) => c.id);

  const { data: latestMessages } = await supabase
    .from("commission_messages")
    .select("id, commission_id, content, sender_id, created_at")
    .in("commission_id", commissionIds)
    .order("created_at", { ascending: false });

  // 整理：每筆委託的最新訊息 + 訊息數
  const messagesByCommission: Record<
    string,
    { latest: any; count: number }
  > = {};
  for (const msg of latestMessages || []) {
    const cid = msg.commission_id;
    if (!messagesByCommission[cid]) {
      messagesByCommission[cid] = { latest: msg, count: 0 };
    }
    messagesByCommission[cid].count++;
  }

  // 組合結果，隱藏虛擬用戶身份
  const chats = commissions
    .map((c: any) => {
      const rawPoster =
        c.poster_type === "virtual" ? c.poster_virtual : c.poster;
      const poster = rawPoster
        ? {
            id: rawPoster.id,
            display_name:
              rawPoster.display_name || rawPoster.full_name || "匿名",
          }
        : null;

      const rawExecutor =
        c.executor_type === "virtual" ? c.executor_virtual : c.executor;
      const executor = rawExecutor
        ? {
            id: rawExecutor.id,
            display_name:
              rawExecutor.display_name || rawExecutor.full_name || "匿名",
          }
        : null;

      const msgInfo = messagesByCommission[c.id];

      return {
        id: c.id,
        pokemon_name: c.pokemon_name,
        status: c.status,
        poster_id: c.poster_id,
        executor_id: c.executor_id,
        poster,
        executor,
        distributions: c.distributions,
        latest_message: msgInfo?.latest || null,
        message_count: msgInfo?.count || 0,
        last_activity: msgInfo?.latest?.created_at || c.updated_at,
      };
    })
    .sort(
      (a: any, b: any) =>
        new Date(b.last_activity).getTime() -
        new Date(a.last_activity).getTime()
    );

  return NextResponse.json({ chats });
}
