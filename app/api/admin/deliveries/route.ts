import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/auth";

export const dynamic = "force-dynamic";

const ALLOWED_STATUSES = ["pending", "delivered", "in_transit", "cancelled"] as const;
type AllowedStatus = (typeof ALLOWED_STATUSES)[number];

// GET /api/admin/deliveries?user_id=xxx - Get deliveries for a specific user
export async function GET(request: Request) {
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

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("user_id");

  if (!userId) {
    return NextResponse.json({ error: "user_id is required" }, { status: 400 });
  }

  const { data: deliveries, error } = await supabase
    .from("user_deliveries")
    .select(`
      id,
      item_name,
      quantity,
      status,
      delivery_date,
      notes,
      created_at,
      updated_at,
      event:events(id, title)
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const deliveriesData = (deliveries || []).map((d) => ({
    ...d,
    event: Array.isArray(d.event) ? d.event[0] : d.event
  }));

  return NextResponse.json({ deliveries: deliveriesData });
}

// POST /api/admin/deliveries - Create new delivery
export async function POST(request: Request) {
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

  // Validate required fields
  if (!payload.user_id || typeof payload.user_id !== "string") {
    return NextResponse.json({ error: "user_id is required" }, { status: 400 });
  }

  if (!payload.event_id || typeof payload.event_id !== "string") {
    return NextResponse.json({ error: "event_id is required" }, { status: 400 });
  }

  if (!payload.item_name || typeof payload.item_name !== "string") {
    return NextResponse.json({ error: "item_name is required" }, { status: 400 });
  }

  const insertData: {
    user_id: string;
    event_id: string;
    item_name: string;
    quantity: number;
    status: AllowedStatus;
    delivery_date?: string | null;
    notes?: string;
  } = {
    user_id: payload.user_id as string,
    event_id: payload.event_id as string,
    item_name: (payload.item_name as string).trim(),
    quantity: 1,
    status: "pending"
  };

  // Parse quantity
  if (typeof payload.quantity === "number" && payload.quantity > 0) {
    insertData.quantity = payload.quantity;
  } else if (typeof payload.quantity === "string") {
    const parsedQty = Number(payload.quantity);
    if (!Number.isNaN(parsedQty) && parsedQty > 0) {
      insertData.quantity = parsedQty;
    }
  }

  // Parse status
  if (typeof payload.status === "string" && ALLOWED_STATUSES.includes(payload.status as AllowedStatus)) {
    insertData.status = payload.status as AllowedStatus;
  }

  // Parse delivery_date
  if (payload.delivery_date !== undefined && payload.delivery_date !== null && payload.delivery_date !== "") {
    insertData.delivery_date = String(payload.delivery_date);
  }

  // Parse notes
  if (typeof payload.notes === "string") {
    insertData.notes = payload.notes;
  }

  const { data, error } = await supabase
    .from("user_deliveries")
    .insert(insertData)
    .select("id, item_name, quantity, status, delivery_date, event_id, notes, created_at, updated_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ delivery: data }, { status: 201 });
}
