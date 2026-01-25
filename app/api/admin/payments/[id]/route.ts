import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/auth";

export const dynamic = "force-dynamic";

const ALLOWED_STATUSES = ["pending", "paid", "overdue", "cancelled"] as const;
type AllowedStatus = (typeof ALLOWED_STATUSES)[number];

type RouteContext = {
  params: { id: string };
};

export async function PATCH(request: Request, context: RouteContext) {
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

  let payload: Record<string, unknown> = {};
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const updates: Partial<{
    amount: number;
    status: AllowedStatus;
    payment_date: string | null;
    event_id: string | null;
    notes: string;
  }> = {};

  if (typeof payload.amount === "number" && payload.amount >= 0) {
    updates.amount = payload.amount;
  } else if (typeof payload.amount === "string") {
    const parsedAmount = Number(payload.amount);
    if (!Number.isNaN(parsedAmount) && parsedAmount >= 0) {
      updates.amount = parsedAmount;
    }
  }

  if (typeof payload.status === "string" && ALLOWED_STATUSES.includes(payload.status as AllowedStatus)) {
    updates.status = payload.status as AllowedStatus;
  }

  if (payload.payment_date !== undefined) {
    updates.payment_date = payload.payment_date === "" || payload.payment_date === null ? null : String(payload.payment_date);
  }

  if (typeof payload.event_id === "string") {
    updates.event_id = payload.event_id === "" ? null : payload.event_id;
  }

  if (typeof payload.notes === "string") {
    updates.notes = payload.notes;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("user_payments")
    .update(updates)
    .eq("id", context.params.id)
    .select("id, amount, status, payment_date, notes, event_id, updated_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Payment not found" }, { status: 404 });
  }

  return NextResponse.json({ payment: data });
}

// DELETE /api/admin/payments/[id] - Delete payment
export async function DELETE(request: Request, context: RouteContext) {
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

  const { error } = await supabase
    .from("user_payments")
    .delete()
    .eq("id", context.params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
