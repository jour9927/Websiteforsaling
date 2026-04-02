import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  // 驗證 cron secret
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    const now = new Date();
    let depositsReturned = 0;
    let commissionsActivated = 0;

    // 1. 押底歸還：completed + 10 天已過 → status = returned
    const { data: eligibleDeposits } = await supabase
      .from("commission_deposits")
      .select("id, commission_id")
      .eq("status", "held")
      .lte("return_eligible_at", now.toISOString());

    if (eligibleDeposits && eligibleDeposits.length > 0) {
      for (const deposit of eligibleDeposits) {
        const { error } = await supabase
          .from("commission_deposits")
          .update({
            status: "returned",
            returned_at: now.toISOString(),
          })
          .eq("id", deposit.id);

        if (!error) depositsReturned++;
      }
    }

    // 2. 排隊啟用：如果今日 active < 5，啟用排隊中的下一個
    const today = now.toISOString().split("T")[0];
    const { count: todayActive } = await supabase
      .from("commissions")
      .select("id", { count: "exact", head: true })
      .eq("activated_date", today)
      .neq("status", "cancelled");

    const slotsAvailable = 5 - (todayActive || 0);

    if (slotsAvailable > 0) {
      const { data: queuedCommissions } = await supabase
        .from("commissions")
        .select("id, queue_position")
        .eq("status", "queued")
        .order("queue_position", { ascending: true })
        .limit(slotsAvailable);

      if (queuedCommissions && queuedCommissions.length > 0) {
        for (const qc of queuedCommissions) {
          const { error } = await supabase
            .from("commissions")
            .update({
              status: "active",
              activated_date: today,
              queue_position: null,
              updated_at: now.toISOString(),
            })
            .eq("id", qc.id);

          if (!error) commissionsActivated++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `維護完成：歸還 ${depositsReturned} 筆押底、啟用 ${commissionsActivated} 筆排隊委託`,
      depositsReturned,
      commissionsActivated,
      todaySlotsUsed: (todayActive || 0) + commissionsActivated,
    });
  } catch (err) {
    return NextResponse.json(
      { error: `Cron error: ${err instanceof Error ? err.message : "unknown"}` },
      { status: 500 }
    );
  }
}
