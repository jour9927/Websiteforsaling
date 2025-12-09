import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/auth";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createServerSupabaseClient();
  
  // 驗證管理員身份
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: "未登入" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "無權限" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { registered_at } = body;

    if (!registered_at) {
      return NextResponse.json(
        { error: "缺少報名時間" },
        { status: 400 }
      );
    }

    // 更新報名時間
    const { data, error } = await supabase
      .from("registrations")
      .update({
        registered_at: new Date(registered_at).toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq("id", params.id)
      .select()
      .single();

    if (error) {
      console.error("更新報名時間錯誤:", error);
      return NextResponse.json(
        { error: `更新失敗: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("更新報名時間異常:", error);
    return NextResponse.json(
      { error: "系統錯誤" },
      { status: 500 }
    );
  }
}
