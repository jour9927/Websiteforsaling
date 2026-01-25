import { NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/auth";

export const dynamic = "force-dynamic";

const ALLOWED_STATUSES = ["confirmed", "cancelled"] as const;
type AllowedStatus = (typeof ALLOWED_STATUSES)[number];

type RouteContext = {
  params: { id: string };
};

export async function PATCH(request: Request, context: RouteContext) {
  // First check authentication with regular client
  const supabase = createServerSupabaseClient();
  const {
    data: { session }
  } = await supabase.auth.getSession();

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

  let payload: { status?: string } = {};
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const requestedStatus = payload.status as AllowedStatus | undefined;

  if (!requestedStatus || !ALLOWED_STATUSES.includes(requestedStatus)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  // Use admin client to bypass RLS for update
  try {
    const adminClient = createAdminSupabaseClient();
    const { data, error } = await adminClient
      .from("registrations")
      .update({ status: requestedStatus })
      .eq("id", context.params.id)
      .select("id, status, updated_at")
      .single();

    if (error) {
      console.error("Registration update error:", error);
      return NextResponse.json({ 
        error: `更新失敗: ${error.message}`,
        hint: "請確認 SUPABASE_SERVICE_ROLE_KEY 環境變數已在 Vercel 中設置"
      }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: "找不到該報名記錄" }, { status: 404 });
    }

    return NextResponse.json({ registration: data });
  } catch (err) {
    console.error("Unexpected error:", err);
    return NextResponse.json({ 
      error: err instanceof Error ? err.message : "未知錯誤",
      hint: "請檢查伺服器日誌"
    }, { status: 500 });
  }
}
