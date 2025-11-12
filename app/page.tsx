import Link from "next/link";
import { EventCard } from "@/components/EventCard";

const demoEvents = [
  {
    id: "spring-carnival",
    title: "春日嘉年華",
    description: "限時線上抽獎與市集活動",
    date: "2025-03-21",
    location: "松菸文創園區",
    cover: "/images/spring.jpg"
  },
  {
    id: "summer-beats",
    title: "夏夜電音祭",
    description: "DJ lineup 與即時抽盲盒",
    date: "2025-07-05",
    location: "高雄流行音樂中心",
    cover: "/images/summer.jpg"
  }
];

export default function HomePage() {
  return (
    <div className="flex flex-col gap-12">
      <section className="glass-card p-8 text-center">
        <p className="text-sm uppercase tracking-[0.35em] text-slate-200">Event Glass</p>
        <h1 className="mt-3 text-4xl font-semibold md:text-5xl">沉浸式活動公告牆</h1>
        <p className="mt-4 text-base text-slate-200">
          即時同步的活動資訊、抽選與盲盒，全部在行動裝置上完成。
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link href="/login" className="rounded-full bg-white/20 px-6 py-2 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/30">
            登入參加
          </Link>
          <Link href="/signup" className="rounded-full border border-white/40 px-6 py-2 text-sm font-semibold text-white/90 transition hover:bg-white/10">
            立即註冊
          </Link>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        {demoEvents.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </section>
    </div>
  );
}
