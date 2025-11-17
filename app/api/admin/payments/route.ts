import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/auth";

export const dynamic = "force-dynamic";

const ALLOWED_STATUSES = ["pending", "paid", "overdue", "cancelled"] as const;
type AllowedStatus = (typeof ALLOWED_STATUSES)[number];

// POST /api/admin/payments - Create new payment
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

  const insertData: {
    user_id: string;
    event_id: string;
    amount: number;
    status: AllowedStatus;
    payment_date?: string | null;
    notes?: string;
  } = {
    user_id: payload.user_id as string,
    event_id: payload.event_id as string,
    amount: 0,
    status: "pending"
  };

  // Parse amount
  if (typeof payload.amount === "number" && payload.amount >= 0) {
    insertData.amount = payload.amount;
  } else if (typeof payload.amount === "string") {
    const parsedAmount = Number(payload.amount);
    if (!Number.isNaN(parsedAmount) && parsedAmount >= 0) {
      insertData.amount = parsedAmount;
    }
  }

  // Parse status
  if (typeof payload.status === "string" && ALLOWED_STATUSES.includes(payload.status as AllowedStatus)) {
    insertData.status = payload.status as AllowedStatus;
  }

  // Parse payment_date
  if (payload.payment_date !== undefined && payload.payment_date !== null && payload.payment_date !== "") {
    insertData.payment_date = String(payload.payment_date);
  }

  // Parse notes
  if (typeof payload.notes === "string") {
    insertData.notes = payload.notes;
  }

  const { data, error } = await supabase
    .from("user_payments")
    .insert(insertData)
    .select("id, amount, status, payment_date, event_id, notes, created_at, updated_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ payment: data }, { status: 201 });
}
