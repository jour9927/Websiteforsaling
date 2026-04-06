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
    // 0. 重置模式：結案所有現有虛擬委託（?reset=true 時觸發）
    const isReset = request.nextUrl.searchParams.get("reset") === "true";
    let closedCount = 0;

    if (isReset) {
      const today = new Date().toISOString().split("T")[0];

      // 把所有非終態的虛擬委託結案，並清除 activated_date 釋放今日額度
      const { data: closedRows } = await supabase
        .from("commissions")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          activated_date: null,
        })
        .eq("poster_type", "virtual")
        .in("status", ["active", "queued", "accepted", "proof_submitted", "proof_approved", "pending_review"])
        .select("id");

      closedCount = closedRows?.length || 0;

      // 同時清除今日已完成的虛擬委託的 activated_date，避免佔用額度
      await supabase
        .from("commissions")
        .update({ activated_date: null })
        .eq("poster_type", "virtual")
        .eq("status", "completed")
        .eq("activated_date", today);
    }

    // 0b. 接單模式：把所有 active 的虛擬委託標為 accepted（?accept-all=true）
    const isAcceptAll = request.nextUrl.searchParams.get("accept-all") === "true";
    let forcedAcceptCount = 0;

    if (isAcceptAll) {
      const { data: virtualUsers2 } = await supabase
        .from("virtual_profiles")
        .select("id");

      const { data: activeToAccept } = await supabase
        .from("commissions")
        .select("id, base_price, platform_fee")
        .eq("poster_type", "virtual")
        .eq("status", "active")
        .is("executor_virtual_id", null)
        .is("executor_id", null)
        .limit(200);

      if (activeToAccept && activeToAccept.length > 0 && virtualUsers2 && virtualUsers2.length > 0) {
        const acceptors = pickRandom(virtualUsers2, activeToAccept.length);
        for (let i = 0; i < activeToAccept.length; i++) {
          const maxFee = Math.floor((activeToAccept[i].base_price * 4) / 5 - activeToAccept[i].platform_fee);
          const execRatio = 0.4 + Math.random() * 0.4;
          const executorFee = Math.max(Math.round(maxFee * execRatio / 100) * 100, 100);

          const { error } = await supabase
            .from("commissions")
            .update({
              executor_virtual_id: acceptors[i].id,
              executor_type: "virtual",
              status: "accepted",
              executor_fee: executorFee,
              executor_fee_approved: true,
              accepted_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("id", activeToAccept[i].id)
            .eq("status", "active");

          if (!error) forcedAcceptCount++;
        }
      }

      return NextResponse.json({
        success: true,
        message: `強制接單完成：${forcedAcceptCount} 筆`,
        forcedAccepted: forcedAcceptCount,
      });
    }

    // 1. 取得虛擬用戶
    const { data: virtualUsers } = await supabase
      .from("virtual_profiles")
      .select("id, display_name");

    if (!virtualUsers || virtualUsers.length === 0) {
      return NextResponse.json({ message: "No virtual users found", closed: closedCount });
    }

    // 2. 取得可用配布：8代（便宜）+ 7代（貴）
    const baseQuery = supabase
      .from("distributions")
      .select("id, pokemon_name, pokemon_name_en, points, generation, original_trainer")
      .neq("original_trainer", "HOME")
      .not("pokemon_name", "ilike", "%抽獎%")
      .not("pokemon_name", "ilike", "%抵用%")
      .not("points", "is", null)
      .gt("points", 100);

    const [{ data: gen8Dist }, { data: gen7Dist }] = await Promise.all([
      baseQuery.eq("generation", 8),
      supabase
        .from("distributions")
        .select("id, pokemon_name, pokemon_name_en, points, generation, original_trainer")
        .eq("generation", 7)
        .neq("original_trainer", "HOME")
        .not("pokemon_name", "ilike", "%抽獎%")
        .not("pokemon_name", "ilike", "%抵用%")
        .not("points", "is", null)
        .gt("points", 100),
    ]);

    if ((!gen8Dist || gen8Dist.length === 0) && (!gen7Dist || gen7Dist.length === 0)) {
      return NextResponse.json({ message: "No distributions found" });
    }

    // 3. 生成兩批：8 筆八代（200~490 元）+ 8 筆七代（1,000~3,000 元）
    const today = new Date().toISOString().split("T")[0];
    let createdCount = 0;
    const createdIds: string[] = [];

    type DistRow = { id: string; pokemon_name: string; points: number | null };

    const insertBatch = async (
      dists: DistRow[],
      count: number,
      priceFn: (rawPrice: number) => number,
    ) => {
      const selected = pickRandom(dists, count);
      const users = pickRandom(virtualUsers, count);
      for (let i = 0; i < count; i++) {
        const dist = selected[i];
        const rawPrice = generateBasePrice(dist.points);
        const basePrice = priceFn(rawPrice);
        const platformFee = generateFee(basePrice);
        const { data: created, error } = await supabase
          .from("commissions")
          .insert({
            poster_virtual_id: users[i].id,
            poster_type: "virtual",
            distribution_id: dist.id,
            pokemon_name: dist.pokemon_name,
            description: "",
            base_price: basePrice,
            price_type: "twd",
            platform_fee: platformFee,
            status: "active",
            activated_date: today,
            reviewed_at: new Date().toISOString(),
          })
          .select("id")
          .single();
        if (!error && created) {
          createdCount++;
          createdIds.push(created.id);
        }
      }
    };

    // 八代：200~490 元
    if (gen8Dist && gen8Dist.length > 0) {
      await insertBatch(gen8Dist, 8, (raw) => {
        const rate = 0.03 + Math.random() * 0.05;
        return Math.max(200, Math.min(Math.round(raw * rate / 10) * 10, 490));
      });
    }

    // 七代：1,000~3,000 元
    if (gen7Dist && gen7Dist.length > 0) {
      await insertBatch(gen7Dist, 8, (raw) => {
        const rate = 0.08 + Math.random() * 0.08;
        return Math.max(1000, Math.min(Math.round(raw * rate / 100) * 100, 3000));
      });
    }

    // 4. 隨機讓虛擬用戶接單（排除本輪剛建立的，讓它們保持「刊登中」）
    const { data: activeVirtualCommissions } = await supabase
      .from("commissions")
      .select("id, base_price, platform_fee")
      .eq("status", "active")
      .eq("poster_type", "virtual")
      .is("executor_id", null)
      .is("executor_virtual_id", null)
      .not("id", "in", `(${createdIds.length > 0 ? createdIds.join(",") : "00000000-0000-0000-0000-000000000000"})`)
      .limit(50);

    let acceptedCount = 0;

    if (activeVirtualCommissions && activeVirtualCommissions.length > 0) {
      const acceptCount = 16 + Math.floor(Math.random() * 3); // 16-18
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
      const completeCount = 16 + Math.floor(Math.random() * 3); // 16-18
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
      message: `虛擬委託：${isReset ? `結案 ${closedCount}、` : ""}建立 ${createdCount}、接單 ${acceptedCount}、完成 ${completedCount}`,
      closed: closedCount,
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
