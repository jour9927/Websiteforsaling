import { NextResponse } from "next/server";
import { createAdminSupabaseClient, createServerSupabaseClient } from "@/lib/auth";
import {
  getCommissionDepositReturnDueAt,
  isCommissionDepositReturnReady,
} from "@/lib/commissions";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: { id: string };
};

const dueAtFormatter = new Intl.DateTimeFormat("zh-TW", {
  timeZone: "Asia/Taipei",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

export async function PATCH(_request: Request, context: RouteContext) {
  const supabase = createServerSupabaseClient();
  const adminSupabase = createAdminSupabaseClient();
  const {
    data: { session },
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

  const { data: currentCommission, error: fetchError } = await adminSupabase
    .from("commissions")
    .select(
      "id, status, is_first_time_client, deposit_details, completed_at, deposit_returned_at",
    )
    .eq("id", context.params.id)
    .maybeSingle();

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  if (!currentCommission) {
    return NextResponse.json({ error: "找不到該委託。" }, { status: 404 });
  }

  if (!currentCommission.is_first_time_client || !currentCommission.deposit_details?.trim()) {
    return NextResponse.json({ error: "此委託不需要押底歸還。" }, { status: 409 });
  }

  if (currentCommission.status !== "completed" || !currentCommission.completed_at) {
    return NextResponse.json({ error: "委託尚未完成，無法歸還押底。" }, { status: 409 });
  }

  if (currentCommission.deposit_returned_at) {
    return NextResponse.json({ error: "押底已經歸還。" }, { status: 409 });
  }

  if (!isCommissionDepositReturnReady(currentCommission.completed_at)) {
    const dueAt = getCommissionDepositReturnDueAt(currentCommission.completed_at);
    const formattedDueAt = dueAt ? dueAtFormatter.format(new Date(dueAt)) : null;

    return NextResponse.json(
      {
        error: formattedDueAt
          ? `押底需保留至 ${formattedDueAt} 後才能歸還。`
          : "押底尚未到可歸還時間。",
      },
      { status: 409 },
    );
  }

  const { data: commission, error: updateError } = await adminSupabase
    .from("commissions")
    .update({
      deposit_returned_at: new Date().toISOString(),
    })
    .eq("id", context.params.id)
    .select("id, deposit_returned_at")
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ commission });
}
