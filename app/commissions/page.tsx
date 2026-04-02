import { createServerSupabaseClient } from "@/lib/auth";
import Link from "next/link";
import type { Route } from "next";
import CommissionList from "@/components/CommissionList";

export const dynamic = "force-dynamic";

export default async function CommissionsPage() {
  const supabase = createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 取得公開委託
  const { data: rawCommissions } = await supabase
    .from("commissions")
    .select(
      `*,
       distributions(pokemon_name, pokemon_name_en, pokemon_sprite_url, generation, points),
       poster:profiles!commissions_poster_id_fkey(id, full_name),
       poster_virtual:virtual_profiles!commissions_poster_virtual_id_fkey(id, display_name, avatar_seed)`
    )
    .in("status", ["active", "accepted", "proof_submitted", "proof_approved", "completed", "queued"])
    .order("created_at", { ascending: false })
    .limit(50);

  // 隱藏虛擬用戶身份：統一為 poster 欄位
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const hideKeys = ["poster_type", "poster_virtual", "poster_virtual_id", "admin_review_note", "reviewed_by"];
  const commissions = (rawCommissions || []).map((c: any) => {
    const rawPoster = c.poster_type === "virtual" ? c.poster_virtual : c.poster;
    const poster = rawPoster ? { id: rawPoster.id, display_name: rawPoster.display_name || rawPoster.full_name || "匿名" } : null;
    const cleaned = Object.fromEntries(Object.entries(c).filter(([k]) => !hideKeys.includes(k)));
    return { ...cleaned, poster } as any;
  });

  const listedCommissions = commissions?.filter((c: any) => ["active", "queued"].includes(c.status)) || [];
  const inProgressCommissions =
    commissions?.filter((c: any) =>
      ["accepted", "proof_submitted", "proof_approved"].includes(c.status)
    ) || [];
  const completedCommissions = commissions?.filter((c: any) => c.status === "completed") || [];

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <header className="glass-card p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-white/90">📋 場外委託區</h1>
            <p className="mt-2 text-sm text-white/60">
              群內、群外成員皆可刊登或接下委託任務，嚴格審核確保寶可夢合法性。
            </p>
          </div>
          {user && (
            <Link
              href={"/commissions/create" as Route}
              className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-500"
            >
              + 刊登委託
            </Link>
          )}
        </div>
        <div className="mt-4 flex flex-wrap gap-3 text-xs text-white/50">
          <span className="rounded-full bg-white/5 px-3 py-1">🔒 嚴格合法性審核</span>
          <span className="rounded-full bg-white/5 px-3 py-1">📦 每日上限 5 單</span>
          <span className="rounded-full bg-white/5 px-3 py-1">💰 抽成上限 4/5</span>
          <span className="rounded-full bg-white/5 px-3 py-1">🛡️ 押底保護機制</span>
        </div>
      </header>

      {/* 特別說明 */}
      <div className="glass-card border border-amber-500/20 bg-amber-500/5 p-4">
        <h3 className="text-sm font-semibold text-amber-400">📢 群外成員特別說明</h3>
        <p className="mt-1 text-xs text-white/60">
          為加強自由與開放的社群理念，群內、群外成員即日起皆可在場外委託區進行刊登委託、執行委託。
          所有委託均需通過嚴格的寶可夢合法性證明審核。
        </p>
      </div>

      {/* 刊登中 */}
      <section>
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white/90">
          <span className="inline-block h-2 w-2 rounded-full bg-green-400 animate-pulse"></span>
          刊登中 ({listedCommissions.length})
        </h2>
        {listedCommissions.length === 0 ? (
          <div className="glass-card p-8 text-center text-white/60">
            <p>目前沒有刊登中的委託，稍後再來看看吧！</p>
          </div>
        ) : (
          <CommissionList commissions={listedCommissions} />
        )}
      </section>

      {/* 委託進行中 */}
      {inProgressCommissions.length > 0 && (
        <section>
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white/90">
            <span className="inline-block h-2 w-2 rounded-full bg-blue-400 animate-pulse"></span>
            委託進行中 ({inProgressCommissions.length})
          </h2>
          <CommissionList commissions={inProgressCommissions} />
        </section>
      )}

      {/* 委託已完成 */}
      {completedCommissions.length > 0 && (
        <section>
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white/90">
            <span className="inline-block h-2 w-2 rounded-full bg-gray-400"></span>
            委託已完成 ({completedCommissions.length})
          </h2>
          <CommissionList commissions={completedCommissions} />
        </section>
      )}

      {!user && (
        <div className="glass-card p-6 text-center">
          <p className="text-white/60">
            <Link href={"/login?redirect=/commissions" as Route} className="text-indigo-400 hover:underline">
              登入
            </Link>
            {" "}後即可刊登或接受委託
          </p>
        </div>
      )}
    </div>
  );
}
