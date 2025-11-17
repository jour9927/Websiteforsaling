import { createServerSupabaseClient } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const ALLOWED_STATUSES = ["pending", "delivered", "in_transit", "cancelled"] as const;
type AllowedStatus = (typeof ALLOWED_STATUSES)[number];

type RouteContext = {
  params: { id: string };
};

// PATCH /api/admin/deliveries/[id] - Update delivery
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
    item_name: string;
    quantity: number;
    status: AllowedStatus;
    delivery_date: string | null;
    event_id: string | null;
    notes: string;
  }> = {};

  if (typeof payload.item_name === "string" && payload.item_name.trim()) {
    updates.item_name = payload.item_name.trim();
  }

  if (typeof payload.quantity === "number" && payload.quantity > 0) {
    updates.quantity = payload.quantity;
  }

  if (typeof payload.status === "string" && ALLOWED_STATUSES.includes(payload.status as AllowedStatus)) {
    updates.status = payload.status as AllowedStatus;
  }

  if (payload.delivery_date !== undefined) {
    updates.delivery_date = payload.delivery_date === "" || payload.delivery_date === null ? null : String(payload.delivery_date);
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
    .from("user_deliveries")
    .update(updates)
    .eq("id", context.params.id)
    .select("id, item_name, quantity, status, delivery_date, event_id, notes, updated_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Delivery not found" }, { status: 404 });
  }

  return NextResponse.json({ delivery: data });
}

// DELETE /api/admin/deliveries/[id] - Delete delivery
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
    .from("user_deliveries")
    .delete()
    .eq("id", context.params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
