import { EventCard } from "@/components/EventCard";
import { createServerSupabaseClient } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export default async function EventsListPage() {
  const supabase = createServerSupabaseClient();
  
  // 取得目前時間
  const now = new Date().toISOString();
  
  // 載入進行中和即將開始的活動（status = published，結束時間在未來）
  const { data: upcomingEvents } = await supabase
    .from('events')
    .select('*')
    .eq('status', 'published')
    .gte('end_date', now)
    .order('start_date', { ascending: true });

  // 載入近期舉辦過的活動（status = closed 或結束時間已過）
  const { data: recentEvents } = await supabase
    .from('events')
    .select('*')
    .lt('end_date', now)
    .order('end_date', { ascending: false })
    .limit(6);

  return (
    <div className="space-y-8">
      <header className="glass-card p-8">
        <p className="text-xs uppercase tracking-[0.3em] text-white/60">Event Glass</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">活動列表</h1>
        <p className="mt-2 text-sm text-white/70">瀏覽近期活動，直接進入詳細頁查看報名與抽選資訊。</p>
      </header>

      {/* 進行中的活動 */}
      {upcomingEvents && upcomingEvents.length > 0 && (
        <section>
          <div className="mb-4 flex items-center gap-3">
            <h2 className="text-xl font-semibold text-white/90">🎯 進行中的活動</h2>
            <span className="rounded-full bg-green-500/20 px-3 py-1 text-xs text-green-200">
              {upcomingEvents.length} 個活動
            </span>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {upcomingEvents.map((event) => (
              <EventCard 
                key={event.id} 
                event={{
                  id: event.id,
                  title: event.title,
                  description: event.description || "精彩活動進行中",
                  date: event.start_date,
                  location: event.location || "線上活動",
                  cover: event.image_url && event.image_url.trim() !== '' ? event.image_url : undefined,
                  price: event.price || 0,
                  is_free: event.is_free ?? true
                }} 
              />
            ))}
          </div>
        </section>
      )}

      {/* 近期舉辦 */}
      {recentEvents && recentEvents.length > 0 && (
        <section>
          <div className="mb-4 flex items-center gap-3">
            <h2 className="text-xl font-semibold text-white/90">📅 近期舉辦</h2>
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/60">
              已結束
            </span>
          </div>
          <div className="grid gap-6 md:grid-cols-2 opacity-75">
            {recentEvents.map((event) => (
              <EventCard 
                key={event.id} 
                event={{
                  id: event.id,
                  title: event.title,
                  description: event.description || "活動已結束",
                  date: event.start_date,
                  location: event.location || "線上活動",
                  cover: event.image_url && event.image_url.trim() !== '' ? event.image_url : undefined,
                  price: event.price || 0,
                  is_free: event.is_free ?? true
                }} 
              />
            ))}
          </div>
        </section>
      )}

      {/* 沒有任何活動時 */}
      {(!upcomingEvents || upcomingEvents.length === 0) && (!recentEvents || recentEvents.length === 0) && (
        <section className="glass-card p-12 text-center">
          <p className="text-white/60">目前沒有活動</p>
          <p className="mt-2 text-sm text-white/40">敬請期待即將推出的精彩活動</p>
        </section>
      )}
    </div>
  );
}
