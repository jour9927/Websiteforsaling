import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/auth";

// PUT /api/admin/store/[id] — 更新商品
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const supabase = createAdminSupabaseClient();
  const body = await req.json();
  const { name, description, price, image_url, category, stock, is_active, seller_name, interested_count, liked_count } = body;

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (name !== undefined) updates.name = name;
  if (description !== undefined) updates.description = description;
  if (price !== undefined) updates.price = Number(price);
  if (image_url !== undefined) updates.image_url = image_url;
  if (category !== undefined) updates.category = category;
  if (stock !== undefined) updates.stock = Number(stock);
  if (is_active !== undefined) updates.is_active = is_active;
  if (seller_name !== undefined) updates.seller_name = seller_name;
  if (interested_count !== undefined) updates.interested_count = Number(interested_count);
  if (liked_count !== undefined) updates.liked_count = Number(liked_count);

  const { data, error } = await supabase
    .from("shop_products")
    .update(updates)
    .eq("id", params.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// DELETE /api/admin/store/[id] — 刪除商品
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const supabase = createAdminSupabaseClient();

  const { error } = await supabase
    .from("shop_products")
    .delete()
    .eq("id", params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
