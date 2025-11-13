import Link from "next/link";
import { EventCard } from "@/components/EventCard";
import { MemberOnlyBlock } from "@/components/MemberOnlyBlock";
import { createServerSupabaseClient } from "@/lib/auth";

export default async function HomePage() {
  const supabase = createServerSupabaseClient();
  
  // 檢查用戶登入狀態
  const { data: { user } } = await supabase.auth.getUser();
  const isLoggedIn = !!user;
  
  const now = new Date().toISOString();
  
  // 載入進行中的活動（已發布且未結束）
  const { data: upcomingEvents } = await supabase
    .from('events')
    .select('*')
    .eq('status', 'published')
    .gte('end_date', now)
    .order('start_date', { ascending: true })
    .limit(4);

  // 載入近期舉辦的活動（已結束）
  const { data: recentEvents } = await supabase
    .from('events')
    .select('*')
    .lt('end_date', now)
    .order('end_date', { ascending: false })
    .limit(3);

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

      {/* 進行中的活動 */}
      <section>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-white/90">🎯 進行中的活動</h2>
            <p className="mt-1 text-sm text-white/60">立即報名參加</p>
          </div>
          {isLoggedIn && (
            <Link href="/events" className="text-sm text-sky-200 hover:text-sky-100">
              查看全部 →
            </Link>
          )}
        </div>

        {isLoggedIn ? (
          upcomingEvents && upcomingEvents.length > 0 ? (
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
          ) : (
            <div className="glass-card p-12 text-center text-white/60">
              <p>目前沒有進行中的活動</p>
            </div>
          )
        ) : (
          <MemberOnlyBlock 
            title="僅限會員查看" 
            description="成為會員，探索精彩活動與獨家內容"
            itemCount={4}
          />
        )}
      </section>

      {/* 近期舉辦 */}
      <section>
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-white/90">📅 近期舉辦</h2>
          <p className="mt-1 text-sm text-white/60">回顧過往精彩活動</p>
        </div>
        
        {isLoggedIn ? (
          recentEvents && recentEvents.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-3 opacity-80">
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
          ) : (
            <div className="glass-card p-12 text-center text-white/60">
              <p>目前沒有近期活動記錄</p>
            </div>
          )
        ) : (
          <MemberOnlyBlock 
            title="會員專屬內容" 
            description="加入我們，回顧更多精彩瞬間"
            itemCount={3}
          />
        )}
      </section>

      {/* 沒有任何活動時 */}
      {(!upcomingEvents || upcomingEvents.length === 0) && (!recentEvents || recentEvents.length === 0) && (
        <section className="glass-card p-12 text-center">
          <p className="text-white/60">目前沒有活動</p>
          <p className="mt-2 text-sm text-white/40">管理員可以在後台建立並發布活動</p>
        </section>
      )}
    </div>
  );
}
