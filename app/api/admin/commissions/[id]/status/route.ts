import { NextResponse } from "next/server";
import { createAdminSupabaseClient, createServerSupabaseClient } from "@/lib/auth";
import { normalizeOptionalText } from "@/lib/commissions";

export const dynamic = "force-dynamic";

const ALLOWED_STATUSES = ["open", "rejected", "cancelled", "completed"] as const;
type AllowedStatus = (typeof ALLOWED_STATUSES)[number];

type RouteContext = {
  params: { id: string };
};

function isTransitionAllowed(currentStatus: string, nextStatus: AllowedStatus) {
  if (nextStatus === "open") {
    return currentStatus === "pending_review" || currentStatus === "queued";
  }

  if (nextStatus === "rejected") {
    return currentStatus === "pending_review" || currentStatus === "queued";
  }

  if (nextStatus === "completed") {
    return currentStatus === "awaiting_seller_confirmation" || currentStatus === "in_progress";
  }

  if (nextStatus === "cancelled") {
    return currentStatus !== "completed" && currentStatus !== "rejected";
  }

  return false;
}

export async function PATCH(request: Request, context: RouteContext) {
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

  const body = await request.json().catch(() => null);
  const requestedStatus =
    body && typeof body.status === "string" ? (body.status as AllowedStatus) : undefined;
  const reviewNote = normalizeOptionalText(body?.reviewNote, 600);

  if (!requestedStatus || !ALLOWED_STATUSES.includes(requestedStatus)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const { data: currentCommission, error: fetchError } = await adminSupabase
    .from("commissions")
    .select("id, status")
    .eq("id", context.params.id)
    .maybeSingle();

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  if (!currentCommission) {
    return NextResponse.json({ error: "找不到該委託。" }, { status: 404 });
  }

  if (!isTransitionAllowed(currentCommission.status, requestedStatus)) {
    return NextResponse.json({ error: "目前狀態不允許這個操作。" }, { status: 409 });
  }

  const { data: commission, error: updateError } = await adminSupabase
    .from("commissions")
    .update({
      status: requestedStatus,
      completed_at: requestedStatus === "completed" ? new Date().toISOString() : null,
      review_note: reviewNote,
    })
    .eq("id", context.params.id)
    .select("id, status, completed_at, review_note")
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ commission });
}
