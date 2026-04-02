import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import {
  COMMISSION_POST_DESCRIPTIONS,
  pickRandom,
  generateBasePrice,
  generateFee,
} from "@/lib/commissionFallbackPool";

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
    // 1. 取得虛擬用戶
    const { data: virtualUsers } = await supabase
      .from("virtual_profiles")
      .select("id, display_name");

    if (!virtualUsers || virtualUsers.length === 0) {
      return NextResponse.json({ message: "No virtual users found" });
    }

    // 2. 取得可用配布
    const { data: distributions } = await supabase
      .from("distributions")
      .select("id, pokemon_name, pokemon_name_en, points, generation")
      .not("points", "is", null)
      .gt("points", 100);

    if (!distributions || distributions.length === 0) {
      return NextResponse.json({ message: "No distributions found" });
    }

    // 3. 隨機產生 3-4 則虛擬委託
    const postCount = 3 + Math.floor(Math.random() * 2); // 3 or 4
    const selectedVirtualUsers = pickRandom(virtualUsers, postCount);
    const selectedDistributions = pickRandom(distributions, postCount);
    const selectedDescriptions = pickRandom(COMMISSION_POST_DESCRIPTIONS, postCount);

    let createdCount = 0;
    const createdIds: string[] = [];
    const today = new Date().toISOString().split("T")[0];

    // 檢查今日已啟用數
    const { count: todayActiveCount } = await supabase
      .from("commissions")
      .select("id", { count: "exact", head: true })
      .eq("activated_date", today)
      .neq("status", "cancelled");

    let todaySlots = 5 - (todayActiveCount || 0);

    for (let i = 0; i < postCount; i++) {
      const vu = selectedVirtualUsers[i];
      const dist = selectedDistributions[i];
      const desc = selectedDescriptions[i];
      const priceType = Math.random() > 0.3 ? "points" : "twd";
      let basePrice = generateBasePrice(dist.points);
      // TWD 計價：1 點 ≈ NT$0.3~0.5，取整到十位，且限制在合理範圍
      if (priceType === "twd") {
        const rate = 0.3 + Math.random() * 0.2; // 0.3~0.5
        basePrice = Math.round(basePrice * rate / 10) * 10;
        basePrice = Math.max(50, Math.min(basePrice, 9990)); // NT$50 ~ NT$9,990
      }
      const platformFee = generateFee(basePrice);

      const status = todaySlots > 0 ? "active" : "queued";
      const activatedDate = todaySlots > 0 ? today : null;

      const { data: created, error } = await supabase
        .from("commissions")
        .insert({
          poster_virtual_id: vu.id,
          poster_type: "virtual",
          distribution_id: dist.id,
          pokemon_name: dist.pokemon_name,
          description: desc,
          base_price: basePrice,
          price_type: priceType,
          platform_fee: platformFee,
          status,
          activated_date: activatedDate,
          reviewed_at: new Date().toISOString(),
          admin_review_note: "虛擬用戶自動發佈",
        })
        .select("id")
        .single();

      if (!error && created) {
        createdCount++;
        createdIds.push(created.id);
        if (status === "active") todaySlots--;
      }
    }

    // 4. 隨機讓 1-2 個虛擬用戶接單（從 active 的虛擬委託中選）
    const { data: activeVirtualCommissions } = await supabase
      .from("commissions")
      .select("id, base_price, platform_fee")
      .eq("status", "active")
      .eq("poster_type", "virtual")
      .is("executor_id", null)
      .is("executor_virtual_id", null)
      .limit(10);

    let acceptedCount = 0;

    if (activeVirtualCommissions && activeVirtualCommissions.length > 0) {
      const acceptCount = 1 + Math.floor(Math.random() * 2); // 1 or 2
      const toAccept = pickRandom(activeVirtualCommissions, acceptCount);
      const acceptors = pickRandom(virtualUsers, acceptCount);

      for (let i = 0; i < toAccept.length; i++) {
        // 計算執行者抽成：剩餘空間（base_price*4/5 - platform_fee）的 40%~80%
        const maxFee = Math.floor((toAccept[i].base_price * 4) / 5 - toAccept[i].platform_fee);
        const execRatio = 0.4 + Math.random() * 0.4;
        const executorFee = Math.round(maxFee * execRatio / 100) * 100;

        const { error } = await supabase
          .from("commissions")
          .update({
            executor_virtual_id: acceptors[i].id,
            executor_type: "virtual",
            status: "accepted",
            executor_fee: Math.max(executorFee, 100),
            executor_fee_approved: true,
            accepted_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", toAccept[i].id)
          .eq("status", "active");

        if (!error) acceptedCount++;
      }
    }

    // 5. 隨機完成 0-1 個「至少 1 天前」接單的虛擬委託
    //    避免同一輪 cron 接單後立刻完成，讓「進行中」狀態至少持續 1 天
    let completedCount = 0;
    if (Math.random() > 0.4) {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data: acceptedVirtual } = await supabase
        .from("commissions")
        .select("id")
        .eq("status", "accepted")
        .eq("poster_type", "virtual")
        .eq("executor_type", "virtual")
        .lt("accepted_at", oneDayAgo)
        .limit(5);

      if (acceptedVirtual && acceptedVirtual.length > 0) {
        const toComplete = pickRandom(acceptedVirtual, 1)[0];
        const { error } = await supabase
          .from("commissions")
          .update({
            status: "completed",
            completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", toComplete.id);

        if (!error) completedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `虛擬委託：建立 ${createdCount}、接單 ${acceptedCount}、完成 ${completedCount}`,
      created: createdCount,
      accepted: acceptedCount,
      completed: completedCount,
    });
  } catch (err) {
    return NextResponse.json(
      { error: `Cron error: ${err instanceof Error ? err.message : "unknown"}` },
      { status: 500 }
    );
  }
}
