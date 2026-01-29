import { createServerSupabaseClient } from "@/lib/auth";
import { TabSwitcher } from "@/components/TabSwitcher";
import { EventsContent } from "@/components/EventsContent";
import { AnnouncementsContent } from "@/components/AnnouncementsContent";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export default async function EventsListPage() {
  const supabase = createServerSupabaseClient();

  // 檢查用戶登入狀態
  const { data: { user } } = await supabase.auth.getUser();
  const isLoggedIn = !!user;

  // 取得目前時間
  const now = new Date().toISOString();

  // 載入進行中的活動（已開始但未結束）
  const { data: ongoingEvents } = await supabase
    .from('events')
    .select('*')
    .eq('status', 'published')
    .lte('start_date', now)
    .gte('end_date', now)
    .order('start_date', { ascending: true });

  // 載入即將開始的活動（尚未開始）
  const { data: upcomingEvents } = await supabase
    .from('events')
    .select('*')
    .eq('status', 'published')
    .gt('start_date', now)
    .order('start_date', { ascending: true });

  // 載入近期舉辦過的活動（已結束）
  const { data: recentEvents } = await supabase
    .from('events')
    .select('*')
    .lt('end_date', now)
    .order('end_date', { ascending: false })
    .limit(6);

  // 載入已發布的公告
  const { data: announcements } = await supabase
    .from('announcements')
    .select('*')
    .eq('status', 'published')
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-8">
      {/* Event Glass Hero */}
      <header className="glass-card p-8 text-center">
        <p className="text-sm uppercase tracking-[0.35em] text-slate-200">Event Glass</p>
        <h1 className="mt-3 text-4xl font-semibold md:text-5xl">沉浸式活動公告牆</h1>
        <p className="mt-4 text-base text-slate-200">
          即時同步的活動資訊、抽選與盲盒，全部在行動裝置上完成。
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          {!isLoggedIn ? (
            <>
              <Link href="/login" className="rounded-full bg-white/20 px-6 py-2 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/30">
                登入參加
              </Link>
              <Link href="/signup" className="rounded-full border border-white/40 px-6 py-2 text-sm font-semibold text-white/90 transition hover:bg-white/10">
                立即註冊
              </Link>
            </>
          ) : (
            <Link href="/collection" className="rounded-full bg-white/20 px-6 py-2 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/30">
              瀏覽圖鑑
            </Link>
          )}
        </div>
      </header>

      <TabSwitcher
        eventsContent={
          <EventsContent
            ongoingEvents={ongoingEvents}
            upcomingEvents={upcomingEvents}
            recentEvents={recentEvents}
          />
        }
        announcementsContent={
          <AnnouncementsContent
            announcements={announcements}
            isLoggedIn={isLoggedIn}
          />
        }
      />
    </div>
  );
}
