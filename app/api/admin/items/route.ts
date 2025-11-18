import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/admin/items?user_id=xxx - Get items for a specific user
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

  const { data: items, error } = await supabase
    .from("user_items")
    .select(`
      id,
      name,
      quantity,
      notes,
      created_at,
      updated_at,
      event:events (
        id,
        title
      )
    `)
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ items: items || [] });
}

// POST /api/admin/items - Create a new item
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

  const body = await request.json();
  const { user_id, name, quantity, event_id, notes } = body;

  if (!user_id || !name || quantity === undefined) {
    return NextResponse.json(
      { error: "user_id, name, and quantity are required" },
      { status: 400 }
    );
  }

  const { data: item, error } = await supabase
    .from("user_items")
    .insert({
      user_id,
      name,
      quantity: parseInt(quantity),
      event_id: event_id || null,
      notes: notes || null
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ item }, { status: 201 });
}
