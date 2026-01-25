import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/auth";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get("eventId");

  if (!eventId) {
    return NextResponse.json({ error: "需要 eventId 參數" }, { status: 400 });
  }

  const supabase = createServerSupabaseClient();

  // 查詢所有報名記錄
  const { data: allRegistrations, error: allError } = await supabase
    .from("registrations")
    .select("*")
    .eq("event_id", eventId)
    .order("registered_at", { ascending: false });

  // 查詢已確認的報名
  const { data: confirmedRegistrations, error: confirmedError } = await supabase
    .from("registrations")
    .select("*")
    .eq("event_id", eventId)
    .eq("status", "confirmed")
    .order("registered_at", { ascending: false });

  // 查詢待確認的報名
  const { data: pendingRegistrations, error: pendingError } = await supabase
    .from("registrations")
    .select("*")
    .eq("event_id", eventId)
    .eq("status", "pending")
    .order("registered_at", { ascending: false });

  // 查詢活動資訊
  const { data: event } = await supabase
    .from("events")
    .select("*")
    .eq("id", eventId)
    .single();

  return NextResponse.json({
    eventId,
    event,
    summary: {
      total: allRegistrations?.length || 0,
      confirmed: confirmedRegistrations?.length || 0,
      pending: pendingRegistrations?.length || 0,
      offline: event?.offline_registrations || 0,
      displayTotal: (confirmedRegistrations?.length || 0) + (event?.offline_registrations || 0)
    },
    allRegistrations,
    confirmedRegistrations,
    pendingRegistrations,
    errors: {
      allError,
      confirmedError,
      pendingError
    }
  });
}
