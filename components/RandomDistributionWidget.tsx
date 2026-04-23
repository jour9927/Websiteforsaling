import Link from "next/link";
import {
  ANNIVERSARY_30TH_BATTLES_PER_DAY,
  ANNIVERSARY_30TH_EEVEE_POINT_GOAL,
  ANNIVERSARY_30TH_TOTAL_BATTLES,
  ANNIVERSARY_30TH_TOTAL_DAYS,
  getPokemonSpriteUrl,
} from "@/lib/anniversary30th";

type RandomDistributionWidgetProps = {
  compact?: boolean;
};

export function RandomDistributionWidget({ compact = false }: RandomDistributionWidgetProps) {
  return (
    <section className="overflow-hidden rounded-lg border border-emerald-300/20 bg-[#111612] text-white shadow-[0_18px_60px_rgba(0,0,0,0.28)]">
      <div className="grid gap-6 p-5 md:grid-cols-[1fr_auto] md:items-center md:p-7">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-200/75">
            4/23 預先報名開放
          </p>
          <h2 className="mt-3 text-2xl font-black leading-tight md:text-3xl">
            隨機型配布對戰活動
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-white/70">
            4/25 正式開戰，連續 {ANNIVERSARY_30TH_TOTAL_DAYS} 天、每天 {ANNIVERSARY_30TH_BATTLES_PER_DAY} 場。
            勝場 2 分、敗場 1 分，累積 {ANNIVERSARY_30TH_EEVEE_POINT_GOAL} 分即可取得伊布配布資格。
          </p>
          {!compact ? (
            <div className="mt-4 flex flex-wrap gap-2 text-xs text-white/60">
              <span className="rounded border border-white/12 px-3 py-1.5">
                總場次 {ANNIVERSARY_30TH_TOTAL_BATTLES}
              </span>
              <span className="rounded border border-white/12 px-3 py-1.5">
                復古掌機對戰 UI
              </span>
              <span className="rounded border border-white/12 px-3 py-1.5">
                需先選擇出場寶可夢
              </span>
            </div>
          ) : null}
          <Link
            href="/random-distribution"
            className="mt-5 inline-flex rounded bg-emerald-300 px-5 py-2.5 text-sm font-black text-slate-950 transition hover:bg-emerald-200"
          >
            進入活動頁
          </Link>
        </div>

        <div className="flex items-center justify-center gap-4 md:justify-end">
          <div className="rounded-lg border border-white/12 bg-black/30 p-4">
            <img
              src={getPokemonSpriteUrl("133")}
              alt="伊布"
              className="h-24 w-24 object-contain md:h-28 md:w-28"
            />
          </div>
          <div className="hidden border-l border-white/12 pl-4 text-sm text-white/55 md:block">
            <p className="font-mono text-2xl font-black text-white">19</p>
            <p>伊布目標分</p>
          </div>
        </div>
      </div>
    </section>
  );
}
