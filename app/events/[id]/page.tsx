import Link from "next/link";
import type { Route } from "next";
import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/auth";
import RegisterButton from "./RegisterButton";
import { ShareLinkButton } from "./ShareLinkButton";

type EventPageProps = {
  params: { id: string };
};

export const dynamic = 'force-dynamic';

export default async function EventPage({ params }: EventPageProps) {
  const supabase = createServerSupabaseClient();
  
  // 載入活動資料
  const { data: event, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', params.id)
    .single();

  if (error || !event) {
    notFound();
  }

  // 取得當前用戶
  const { data: { user } } = await supabase.auth.getUser();

  // 計算已確認的線上報名與待確認人數（線下報名不受影響）
  const { count: confirmedOnlineRegistrationCount } = await supabase
    .from('registrations')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', params.id)
    .eq('status', 'confirmed');

  const { count: pendingOnlineRegistrationCount } = await supabase
    .from('registrations')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', params.id)
    .eq('status', 'pending');

  const confirmedOnline = confirmedOnlineRegistrationCount || 0;
  const pendingOnline = pendingOnlineRegistrationCount || 0;
  const offlineRegistrations = event.offline_registrations || 0;

  // 總報名人數只計入已確認的線上報名與線下報名
  const totalRegistrationCount = confirmedOnline + offlineRegistrations;

  // 檢查用戶是否已報名
  let userRegistration = null;
  if (user) {
    const { data } = await supabase
      .from('registrations')
      .select('*')
      .eq('event_id', params.id)
      .eq('user_id', user.id)
      .single();
    userRegistration = data;
  }

  const remainingSlots = event.max_participants ? event.max_participants - totalRegistrationCount : null;
  const isFull = event.max_participants && totalRegistrationCount >= event.max_participants;
  const isEnded = new Date(event.end_date) < new Date();
  const drawHref = `/events/${params.id}/draw` as Route;

  return (
    <div className="flex flex-col gap-8">
      <header className="glass-card p-8">
        <Link href="/events" className="text-sm text-slate-200/80 hover:text-white">
          ← 返回活動列表
        </Link>
        
        {/* 活動狀態標籤 */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className={`rounded-full px-3 py-1 text-xs font-medium ${
            event.status === 'published' && !isEnded
              ? 'bg-green-500/20 text-green-200'
              : event.status === 'draft'
              ? 'bg-gray-500/20 text-gray-200'
              : 'bg-red-500/20 text-red-200'
          }`}>
            {event.status === 'published' && !isEnded ? '進行中' : isEnded ? '已結束' : '草稿'}
          </span>
          
          {event.organizer_category === 'vip' && (
            <span className="rounded-full bg-yellow-500/20 px-3 py-1 text-xs font-medium text-yellow-200">
              ⭐ 大佬主辦
            </span>
          )}
          
          {isFull && (
            <span className="rounded-full bg-red-500/20 px-3 py-1 text-xs font-medium text-red-200">
              已額滿
            </span>
          )}
        </div>

        <h1 className="mt-4 text-3xl font-semibold">{event.title}</h1>
        
        {/* 價格顯示 - 醒目位置 */}
        <div className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 px-4 py-2 border border-white/20">
          <span className="text-2xl">💰</span>
          <div>
            <p className="text-xs text-white/60">活動費用</p>
            <p className="text-xl font-bold text-white">
              {event.is_free || event.price === 0 ? '免費參加' : `NT$ ${event.price?.toLocaleString()}`}
            </p>
          </div>
        </div>
        
        {/* 活動資訊 */}
        <div className="mt-4 grid gap-3 text-sm text-slate-200/80 md:grid-cols-2">
          <div className="flex items-center gap-2">
            <span className="text-white/60">📅 開始時間:</span>
            <span className="break-all">{new Date(event.start_date).toLocaleString('zh-TW')}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-white/60">⏰ 結束時間:</span>
            <span className="break-all">{new Date(event.end_date).toLocaleString('zh-TW')}</span>
          </div>
          {event.location && (
            <div className="flex items-center gap-2">
              <span className="text-white/60">📍 地點:</span>
              <span className="break-all">{event.location}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <span className="text-white/60">👥 名額:</span>
            <span>{event.max_participants || '不限'}</span>
          </div>
        </div>

        {event.description && (
          <p className="mt-6 whitespace-pre-wrap text-slate-200/90">{event.description}</p>
        )}
      </header>

      <section className="grid gap-6 md:grid-cols-[2fr_1fr]">
        {/* 左側：活動詳細資訊 */}
        <div className="space-y-6">
          {event.eligibility_requirements && (
            <article className="glass-card p-6">
              <h2 className="text-lg font-semibold text-white/90">📋 參與資格</h2>
              <p className="mt-4 whitespace-pre-wrap text-sm text-slate-200/80">
                {event.eligibility_requirements}
              </p>
            </article>
          )}

          {event.image_url && (
            <article className="glass-card overflow-hidden p-0">
              <img 
                src={event.image_url} 
                alt={event.title}
                className="h-64 w-full object-cover"
              />
            </article>
          )}
        </div>

        {/* 右側：報名區塊 */}
        <aside className="glass-card flex flex-col gap-4 p-6">
          <div>
            <p className="text-xs uppercase text-slate-200/70">報名狀態</p>
            <p className="mt-2 text-sm text-white/80">
              已報名: <span className="text-2xl font-semibold text-white">{totalRegistrationCount}</span>
              {event.max_participants && ` / ${event.max_participants}`}
            </p>
            <p className="text-xs text-slate-200/60">
              報名會先進入待確認，只有獲得管理員批准後才會出現在參與紀錄與抽選頁。
            </p>
            {pendingOnline > 0 && (
              <p className="text-xs text-slate-200/60">
                目前 {pendingOnline} 筆報名仍待確認，通過核可後才會列入參與紀錄。
              </p>
            )}
            {remainingSlots !== null && (
              <p className="mt-1 text-xs text-slate-200/60">
                剩餘名額: {remainingSlots > 0 ? remainingSlots : 0}
              </p>
            )}
          </div>

          {/* 報名按鈕 */}
          {!user ? (
            <Link 
              href={`/login?redirect=/events/${params.id}`}
              className="rounded-xl bg-white/20 px-4 py-3 text-center text-sm font-semibold text-white/90 transition hover:bg-white/30"
            >
              登入以報名
            </Link>
          ) : userRegistration ? (
            <div className="space-y-2">
              <div className="rounded-xl border-2 border-green-500/50 bg-green-500/10 px-4 py-3 text-center">
                <p className="text-sm font-semibold text-green-200">✓ 已報名成功</p>
                <p className="mt-1 text-xs text-green-300/80">
                  狀態: {userRegistration.status === 'confirmed' ? '已確認' : '待確認'}
                </p>
              </div>
              <Link 
                href="/history"
                className="block rounded-xl border border-white/30 px-4 py-3 text-center text-sm font-semibold text-white/90 transition hover:bg-white/5"
              >
                查看我的報名記錄
              </Link>
            </div>
          ) : isEnded ? (
            <div className="rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-center text-sm text-white/60">
              活動已結束
            </div>
          ) : isFull ? (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-center text-sm text-red-200">
              名額已滿
            </div>
          ) : (
            <RegisterButton eventId={params.id} />
          )}

          {/* 抽選按鈕 */}
          {user && userRegistration && (
            <Link 
              href={drawHref} 
              className="rounded-xl border border-white/30 px-4 py-3 text-center text-sm font-semibold text-white/90 transition hover:bg-white/10"
            >
              🎲 前往抽選
            </Link>
          )}

          {/* 分享按鈕 */}
          <ShareLinkButton />
        </aside>
      </section>
    </div>
  );
}
