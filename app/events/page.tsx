import { createServerSupabaseClient } from "@/lib/auth";
import { TabSwitcher } from "@/components/TabSwitcher";
import { EventsContent } from "@/components/EventsContent";
import { AnnouncementsContent } from "@/components/AnnouncementsContent";

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
      <header className="glass-card p-8">
        <p className="text-xs uppercase tracking-[0.3em] text-white/60">Event Glass</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">活動與公告</h1>
        <p className="mt-2 text-sm text-white/70">瀏覽近期活動與最新公告消息。</p>
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
