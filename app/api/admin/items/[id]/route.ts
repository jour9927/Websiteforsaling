import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/auth";

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

  const payload = await request.json().catch(() => ({}));
  const updates: Partial<{
    name: string;
    quantity: number;
    event_id: string;
    notes: string;
  }> = {};

  if (typeof payload.name === "string" && payload.name.trim().length > 0) {
    updates.name = payload.name.trim();
  }
  if (typeof payload.quantity === "number" && payload.quantity >= 0) {
    updates.quantity = payload.quantity;
  }
  if (typeof payload.event_id === "string" && payload.event_id !== "") {
    updates.event_id = payload.event_id;
  }
  if (typeof payload.notes === "string") {
    updates.notes = payload.notes;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("user_items")
    .update(updates)
    .eq("id", context.params.id)
    .select("id, name, quantity, event_id, notes, updated_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ item: data });
}
