import { EventCard, type EventSummary } from "@/components/EventCard";

const allEvents: EventSummary[] = [
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

export default function EventsListPage() {
  return (
    <div className="space-y-8">
      <header className="glass-card p-8">
        <p className="text-xs uppercase tracking-[0.3em] text-white/60">Event Glass</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">活動列表</h1>
        <p className="mt-2 text-sm text-white/70">瀏覽近期活動，直接進入詳細頁查看報名與抽選資訊。</p>
      </header>
      <section className="grid gap-6 md:grid-cols-2">
        {allEvents.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </section>
    </div>
  );
}
