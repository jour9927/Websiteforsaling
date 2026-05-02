import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/auth";

// PUT /api/admin/store/orders/[id] — 更新訂單狀態
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const supabase = createAdminSupabaseClient();
  const body = await req.json();
  const { status } = body;

  if (!status || !["pending", "paid", "delivered", "cancelled"].includes(status)) {
    return NextResponse.json(
      { error: "無效的訂單狀態" },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from("shop_orders")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", params.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
