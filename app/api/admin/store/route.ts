import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/auth";

// GET /api/admin/store — 列出全部商品（含下架）
export async function GET() {
  const supabase = createAdminSupabaseClient();

  const { data, error } = await supabase
    .from("shop_products")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}

// POST /api/admin/store — 新增商品
export async function POST(req: NextRequest) {
  const supabase = createAdminSupabaseClient();

  const body = await req.json();
  const { name, description, price, image_url, category, stock, is_active } = body;

  if (!name || price == null) {
    return NextResponse.json(
      { error: "name 和 price 為必填" },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from("shop_products")
    .insert({
      name,
      description: description ?? "",
      price: Number(price),
      image_url: image_url ?? "",
      category: category ?? "一般",
      stock: stock != null ? Number(stock) : -1,
      is_active: is_active ?? true,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
