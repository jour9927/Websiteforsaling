import Link from "next/link";
import { EventCard } from "@/components/EventCard";
import { createServerSupabaseClient } from "@/lib/auth";

export default async function HomePage() {
  const supabase = createServerSupabaseClient();
  
  // 從 Supabase 載入已發布的活動
  const { data: events } = await supabase
    .from('events')
    .select('*')
    .eq('status', 'published')
    .order('start_date', { ascending: true })
    .limit(6);

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

      {events && events.length > 0 ? (
        <section className="grid gap-6 md:grid-cols-2">
          {events.map((event) => (
            <EventCard 
              key={event.id} 
              event={{
                id: event.id,
                title: event.title,
                description: event.description || "精彩活動即將開始",
                date: event.start_date,
                location: "線上活動",
                cover: event.image_url || "/images/default.jpg"
              }} 
            />
          ))}
        </section>
      ) : (
        <section className="glass-card p-12 text-center">
          <p className="text-white/60">目前沒有已發布的活動</p>
          <p className="mt-2 text-sm text-white/40">管理員可以在後台建立並發布活動</p>
        </section>
      )}
    </div>
  );
}
