import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/auth";

// 此 API 供管理員直接創建一批「30週年時空裂縫」專屬的夢幻/超大牌精靈競標
export async function POST(req: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 檢查管理員權限 (可以根據你專案原有的 isAdmin 或 admin_roles 驗證機制調整)
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json({ error: "Require admin status" }, { status: 403 });
    }

    // 準備一批時空裂縫精靈的 ID（建議更換為你的資料庫中實際超神獸的 ID）
    const riftPokemonIds = [
      "14400000-0000-0000-0000-000000000000", // 隨意模擬的配布 ID，請管理員自己改為真實配布 ID
      "15000000-0000-0000-0000-000000000000"
    ];

    const auctionsData = riftPokemonIds.map(distribution_id => {
      // 設定起標價為 30 點數（呼應 30 週年）
      // 時空裂縫將於今天晚上 20:36 開始
      const now = new Date();
      now.setHours(20, 36, 0, 0);

      const end = new Date(now);
      end.setHours(end.getHours() + 2); // 2 小時後結束

      return {
        distribution_id,
        start_time: now.toISOString(),
        end_time: end.toISOString(),
        start_price: 30,  // 30週年特價 30 點起標
        current_price: 30, // 同起標價
        status: "scheduled", // 尚未開始，先排程
      };
    });

    // 寫入 Auctions 表
    const { error: insertError } = await supabase
      .from("auctions")
      .insert(auctionsData);

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "成功創建 30 週年「時空裂縫」競標！",
      count: auctionsData.length
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
