import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/auth";
import { EeveeGuardianBattleHub } from "@/components/EeveeGuardianBattleHub";

export const dynamic = "force-dynamic";

export default async function EeveeGuardianPage() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <section className="space-y-6">
        <div className="rounded-3xl border border-amber-300/20 bg-[radial-gradient(ellipse_at_top_left,rgba(245,158,11,0.16),transparent_45%),linear-gradient(160deg,#0f1220,#121827_45%,#0a1120)] p-8 text-white">
          <p className="text-xs uppercase tracking-[0.35em] text-amber-300/70">Eevee Medal Guardians</p>
          <h1 className="mt-3 text-3xl font-black">勳章型伊布蒐集控系列護衛活動</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-white/70">
            活動共 9 天，每日可參與 1 場守衛戰。勝利獲得 1 點，落敗也有 0.5 點。
            集滿 9 勳章即可獲得「五種勳章以上稀有伊布」。
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/25 p-8 text-center">
          <p className="text-white/70">登入後即可進入 Gen3 對戰入口，累積每日勳章進度。</p>
          <Link
            href="/login?redirect=/eevee-guardian"
            className="mt-6 inline-flex rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-3 text-sm font-semibold text-white transition hover:brightness-110"
          >
            登入後參與活動
          </Link>
        </div>
      </section>
    );
  }

  return <EeveeGuardianBattleHub />;
}
