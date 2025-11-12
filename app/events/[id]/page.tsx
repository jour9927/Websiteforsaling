import Link from "next/link";
import type { Route } from "next";
import { notFound } from "next/navigation";

type EventPageProps = {
  params: { id: string };
};

const demoEventDetail: Record<string, {
  title: string;
  description: string;
  tags: string[];
  slots: number;
}> = {
  "spring-carnival": {
    title: "春日嘉年華",
    description: "城市中最溫暖的春季活動，含工作坊與線上抽獎。",
    tags: ["市集", "抽獎", "音樂"],
    slots: 120
  },
  "summer-beats": {
    title: "夏夜電音祭",
    description: "以電子音樂與互動燈光打造的夜間活動。",
    tags: ["電音", "盲盒", "戶外"],
    slots: 200
  }
};

export default function EventPage({ params }: EventPageProps) {
  const event = demoEventDetail[params.id];

  if (!event) {
    notFound();
  }

  const drawHref = `/events/${params.id}/draw` as Route;

  return (
    <div className="flex flex-col gap-8">
      <header className="glass-card p-8">
        <Link href="/" className="text-sm text-slate-200/80 hover:text-white">
          ← 返回活動列表
        </Link>
        <h1 className="mt-4 text-3xl font-semibold">{event.title}</h1>
        <p className="mt-4 text-slate-200/90">{event.description}</p>
        <div className="mt-6 flex flex-wrap gap-2">
          {event.tags.map((tag) => (
            <span key={tag} className="rounded-full bg-white/15 px-3 py-1 text-xs uppercase tracking-wider text-slate-100">
              {tag}
            </span>
          ))}
        </div>
      </header>

      <section className="grid gap-6 md:grid-cols-[2fr_1fr]">
        <article className="glass-card p-6">
          <h2 className="text-lg font-semibold text-white/90">活動流程</h2>
          <ul className="mt-4 space-y-3 text-sm text-slate-200/80">
            <li>14:00 入場報到與互動裝置探索</li>
            <li>15:00 主舞台與品牌展示</li>
            <li>17:00 線上盲盒抽選開放</li>
            <li>18:30 限時閃電活動與兌換</li>
          </ul>
        </article>
        <aside className="glass-card flex flex-col gap-4 p-6">
          <div>
            <p className="text-xs uppercase text-slate-200/70">剩餘名額</p>
            <p className="text-3xl font-semibold text-white">{event.slots}</p>
          </div>
          <Link href={drawHref} className="rounded-xl bg-white/20 px-4 py-3 text-center text-sm font-semibold text-white/90 transition hover:bg-white/30">
            前往抽選
          </Link>
          <form className="flex flex-col gap-2">
            <button type="submit" className="rounded-xl border border-white/30 px-4 py-3 text-sm font-semibold text-white/90 transition hover:bg-white/5">
              立即報名
            </button>
          </form>
        </aside>
      </section>
    </div>
  );
}
