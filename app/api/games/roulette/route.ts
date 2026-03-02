import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/auth";

export async function POST(_req: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("lottery_tickets, fortune_points")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const currentTickets = profile.lottery_tickets || 0;
    if (currentTickets < 1) {
      return NextResponse.json({ error: "抽獎券不足！請先去集點打卡獲取喔！" }, { status: 400 });
    }

    // Roulette Logic
    // 1% -> 3000 pts
    // 5% -> 1996 pts
    // 10% -> 300 pts
    // 34% -> 30 pts
    // 20% -> 1 extra check ticket (Refund)
    // 30% -> "時光沙漏" (0 pts)
    const roll = Math.random() * 100;
    let prizeName = "";
    let ptsAdded = 0;
    let ticAdded = 0;

    if (roll < 1) {
      prizeName = "大賞：3000 點數！";
      ptsAdded = 3000;
    } else if (roll < 6) {
      prizeName = "特賞：1996 點數！";
      ptsAdded = 1996;
    } else if (roll < 16) {
      prizeName = "參賞：300 點數！";
      ptsAdded = 300;
    } else if (roll < 50) {
      prizeName = "普賞：30 點數！";
      ptsAdded = 30;
    } else if (roll < 70) {
      prizeName = "幸運：再來一次（退還一張券）！";
      ticAdded = 1;
    } else {
      prizeName = "時光沙漏（銘謝惠顧）";
      ptsAdded = 0;
    }

    const newTickets = currentTickets - 1 + ticAdded;
    const newPoints = (profile.fortune_points || 0) + ptsAdded;

    // Update DB safely
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        lottery_tickets: newTickets,
        fortune_points: newPoints
      })
      .eq("id", user.id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      prizeName,
      ptsAdded,
      ticAdded,
      newTickets,
      newPoints
    });

  } catch (error: Error | unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
