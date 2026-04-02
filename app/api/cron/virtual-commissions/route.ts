import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import {
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

    // 2. 取得可用配布（第八世代、排除 OT=HOME、排除抽獎卷/抵用卷）
    const { data: distributions } = await supabase
      .from("distributions")
      .select("id, pokemon_name, pokemon_name_en, points, generation, original_trainer")
      .eq("generation", 8)
      .neq("original_trainer", "HOME")
      .not("pokemon_name", "ilike", "%抽獎%")
      .not("pokemon_name", "ilike", "%抵用%")
      .not("points", "is", null)
      .gt("points", 100);

    if (!distributions || distributions.length === 0) {
      return NextResponse.json({ message: "No distributions found" });
    }

    // 3. 隨機產生 13-16 則虛擬委託（全部直接 active，不限每日 5 單）
    const postCount = 13 + Math.floor(Math.random() * 4); // 13-16
    const selectedVirtualUsers = pickRandom(virtualUsers, postCount);
    const selectedDistributions = pickRandom(distributions, postCount);

    let createdCount = 0;
    const createdIds: string[] = [];
    const today = new Date().toISOString().split("T")[0];

    for (let i = 0; i < postCount; i++) {
      const vu = selectedVirtualUsers[i];
      const dist = selectedDistributions[i];
      const priceType = "twd";
      const rawPrice = generateBasePrice(dist.points);
      // TWD 計價：1 點 ≈ NT$0.3~0.5，取整到十位，限制合理範圍
      const rate = 0.3 + Math.random() * 0.2;
      let basePrice = Math.round(rawPrice * rate / 10) * 10;
      basePrice = Math.max(50, Math.min(basePrice, 9990));
      const platformFee = generateFee(basePrice);

      const { data: created, error } = await supabase
        .from("commissions")
        .insert({
          poster_virtual_id: vu.id,
          poster_type: "virtual",
          distribution_id: dist.id,
          pokemon_name: dist.pokemon_name,
          description: "",
          base_price: basePrice,
          price_type: priceType,
          platform_fee: platformFee,
          status: "active",
          activated_date: today,
          reviewed_at: new Date().toISOString(),
          admin_review_note: "虛擬用戶自動發佈",
        })
        .select("id")
        .single();

      if (!error && created) {
        createdCount++;
        createdIds.push(created.id);
      }
    }

    // 4. 隨機讓 13-16 個虛擬用戶接單（從所有未被接的 active 虛擬委託中選）
    const { data: activeVirtualCommissions } = await supabase
      .from("commissions")
      .select("id, base_price, platform_fee")
      .eq("status", "active")
      .eq("poster_type", "virtual")
      .is("executor_id", null)
      .is("executor_virtual_id", null)
      .limit(50);

    let acceptedCount = 0;

    if (activeVirtualCommissions && activeVirtualCommissions.length > 0) {
      const acceptCount = 13 + Math.floor(Math.random() * 4); // 13-16
      const toAccept = pickRandom(activeVirtualCommissions, acceptCount);
      const acceptors = pickRandom(virtualUsers, toAccept.length);

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

    // 5. 隨機完成 13-16 個「至少 1 天前」接單的虛擬委託
    //    避免同一輪 cron 接單後立刻完成，讓「進行中」狀態至少持續 1 天
    let completedCount = 0;
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: acceptedVirtual } = await supabase
      .from("commissions")
      .select("id")
      .eq("status", "accepted")
      .eq("poster_type", "virtual")
      .eq("executor_type", "virtual")
      .lt("accepted_at", oneDayAgo)
      .limit(50);

    if (acceptedVirtual && acceptedVirtual.length > 0) {
      const completeCount = 13 + Math.floor(Math.random() * 4); // 13-16
      const toComplete = pickRandom(acceptedVirtual, completeCount);

      for (const commission of toComplete) {
        const { error } = await supabase
          .from("commissions")
          .update({
            status: "completed",
            completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", commission.id);

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
