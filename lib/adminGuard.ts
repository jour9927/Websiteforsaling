import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/auth";

/**
 * 管理後台 API 的存取檢查。
 *
 * 與其他 admin route 內嵌的那段邏輯完全一致（session → profiles.role === "admin"），
 * 只是抽出來共用，避免再有路由漏掉。
 *
 * 用法：
 *   const denied = await requireAdmin();
 *   if (denied) return denied;
 *
 * 回傳 null 代表通過；回傳 NextResponse 代表要直接把它丟回去。
 */
export async function requireAdmin(): Promise<NextResponse | null> {
  const supabase = createServerSupabaseClient();

  const {
    data: { user: verifiedUser },
  } = await supabase.auth.getUser();
  const session = verifiedUser ? { user: verifiedUser } : null;

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", session.user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return null;
}
