import Link from "next/link";
import type { Route } from "next";
import { createServerSupabaseClient } from "@/lib/auth";
import { MemberOnlyBlock } from "@/components/MemberOnlyBlock";

export const dynamic = 'force-dynamic';

export default async function AnnouncementsPage() {
  const supabase = createServerSupabaseClient();
  
  // 檢查用戶登入狀態
  const { data: { user } } = await supabase.auth.getUser();
  const isLoggedIn = !!user;
  
  // 從 Supabase 載入已發布的公告
  const { data: announcements } = await supabase
    .from('announcements')
    .select('*')
    .eq('status', 'published')
    .order('created_at', { ascending: false });

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'published': return '發布中';
      case 'scheduled': return '已排程';
      case 'draft': return '草稿';
      default: return status;
    }
  };

  return (
    <div className="space-y-8">
      <header className="glass-card p-8">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-200/70">公告牆</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">最新活動公告</h1>
        <p className="mt-3 text-sm text-white/70">掌握活動最新消息、緊急通知與系統公告。</p>
      </header>
      
      {!isLoggedIn ? (
        <MemberOnlyBlock 
          title="公告內容僅限會員查看" 
          description="登入以查看最新活動公告、重要通知與獨家訊息"
          itemCount={5}
        />
      ) : announcements && announcements.length > 0 ? (
        <section className="space-y-4">
          {announcements.map((notice) => (
            <article key={notice.id} className="glass-card p-6">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs text-white/50">
                    發布日期 {new Date(notice.published_at || notice.created_at).toLocaleDateString('zh-TW')}
                  </p>
                  <h2 className="mt-1 text-xl font-semibold text-white/90">{notice.title}</h2>
                </div>
                <span className="w-fit rounded-full bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-white/80">
                  {getStatusDisplay(notice.status)}
                </span>
              </div>
              <p className="mt-4 text-sm text-white/75 whitespace-pre-wrap">
                {notice.content.length > 200 
                  ? notice.content.substring(0, 200) + '...' 
                  : notice.content}
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-sky-200">
                <Link href={`/announcements/${notice.id}` as Route} className="hover:text-sky-100">
                  查看完整內容
                </Link>
                <span className="text-white/30">|</span>
                <Link href="/events" className="hover:text-sky-100">
                  查看相關活動
                </Link>
              </div>
            </article>
          ))}
        </section>
      ) : (
        <section className="glass-card p-12 text-center">
          <p className="text-white/60">目前沒有已發布的公告</p>
          <p className="mt-2 text-sm text-white/40">管理員可以在後台建立並發布公告</p>
        </section>
      )}
    </div>
  );
}
