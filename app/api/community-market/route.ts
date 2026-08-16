import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/auth";

function integer(value: unknown): number | null {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isInteger(parsed) ? parsed : null;
}

export async function POST(request: NextRequest) {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "請先登入" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "請提供正確的刊登資料" }, { status: 400 });
  }

  const userDistributionId =
    typeof body.user_distribution_id === "string" ? body.user_distribution_id : "";
  const startingPrice = integer(body.starting_price);
  const minIncrement = integer(body.min_increment);
  const buyNowPrice = body.buy_now_price ? integer(body.buy_now_price) : null;
  const durationHours = integer(body.duration_hours);
  const description = typeof body.description === "string" ? body.description.trim() : null;

  if (!userDistributionId || startingPrice === null || minIncrement === null || durationHours === null) {
    return NextResponse.json({ error: "請完整填寫刊登資料" }, { status: 400 });
  }
  if (![1, 3, 6, 12, 24, 72, 168, 336].includes(durationHours)) {
    return NextResponse.json({ error: "不支援這個拍賣時長" }, { status: 400 });
  }
  if (description && description.length > 500) {
    return NextResponse.json({ error: "商品說明不可超過 500 字" }, { status: 400 });
  }

  const endTime = new Date(Date.now() + durationHours * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase.rpc("create_community_auction", {
    p_user_distribution_id: userDistributionId,
    p_starting_price: startingPrice,
    p_min_increment: minIncrement,
    p_buy_now_price: buyNowPrice,
    p_end_time: endTime,
    p_description: description,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ auction: data }, { status: 201 });
}
