import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/auth";

export async function POST(request: Request) {
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
    const { user_id, event_id, registered_at } = body;

    if (!user_id || !event_id) {
      return NextResponse.json(
        { error: "缺少必要參數" },
        { status: 400 }
      );
    }

    // 檢查該會員是否已報名
    const { data: existingRegistration, error: checkError } = await supabase
      .from("registrations")
      .select("id")
      .eq("user_id", user_id)
      .eq("event_id", event_id)
      .maybeSingle();

    if (checkError) {
      console.error("檢查報名記錄錯誤:", checkError);
      return NextResponse.json(
        { error: `檢查報名失敗: ${checkError.message}` },
        { status: 500 }
      );
    }

    if (existingRegistration) {
      return NextResponse.json(
        { error: "該會員已經報名過此活動" },
        { status: 400 }
      );
    }

    // 檢查活動是否存在
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("id, title, max_participants, offline_registrations")
      .eq("id", event_id)
      .single();

    if (eventError || !event) {
      console.error("查詢活動錯誤:", eventError);
      return NextResponse.json(
        { error: "活動不存在" },
        { status: 404 }
      );
    }

    // 檢查名額（需要加上線下報名人數）
    if (event.max_participants) {
      const { count: confirmedCount } = await supabase
        .from("registrations")
        .select("*", { count: "exact", head: true })
        .eq("event_id", event_id)
        .eq("status", "confirmed");

      const offlineRegistrations = event.offline_registrations || 0;
      const totalRegistrations = (confirmedCount || 0) + offlineRegistrations;

      console.log('名額檢查詳情:', {
        活動ID: event_id,
        已確認線上報名: confirmedCount,
        線下報名: offlineRegistrations,
        總計: totalRegistrations,
        上限: event.max_participants,
        是否已滿: totalRegistrations >= event.max_participants
      });

      if (totalRegistrations >= event.max_participants) {
        return NextResponse.json(
          { error: `活動名額已滿 (已報名 ${totalRegistrations}/${event.max_participants})` },
          { status: 400 }
        );
      }
    }

    // 建立報名記錄，管理員代報名直接設為 confirmed
    const insertData: {
      user_id: string;
      event_id: string;
      status: string;
      registered_at?: string;
    } = {
      user_id,
      event_id,
      status: "confirmed"
    };

    // 如果有指定報名時間，使用指定的時間
    if (registered_at) {
      insertData.registered_at = new Date(registered_at).toISOString();
    }

    const { data: registration, error: insertError } = await supabase
      .from("registrations")
      .insert(insertData)
      .select()
      .single();

    if (insertError) {
      console.error("建立報名記錄失敗:", insertError);
      return NextResponse.json(
        { error: `建立報名失敗: ${insertError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      registration
    });

  } catch (error) {
    console.error("管理員代報名錯誤:", error);
    return NextResponse.json(
      { error: "系統錯誤" },
      { status: 500 }
    );
  }
}
