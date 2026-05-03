import Link from "next/link";
import type { Route } from "next";
import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/auth";
import RegisterButton from "./RegisterButton";
import { ShareLinkButton } from "./ShareLinkButton";
import EventComments from "./EventComments";
import InviteCodeCopyButton from "./InviteCodeCopyButton";

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

  // Debug 輸出
  console.log('活動頁面人數統計:', {
    活動ID: params.id,
    已確認線上: confirmedOnline,
    待確認線上: pendingOnline,
    線下報名: offlineRegistrations,
    顯示總數: totalRegistrationCount,
    上限: event.max_participants
  });

  // 檢查用戶是否已報名
  let userRegistration = null;
  let userInviteCode: string | null = null;
  let invitedOthersCount = 0;
  if (user) {
    const { data } = await supabase
      .from('registrations')
      .select('*')
      .eq('event_id', params.id)
      .eq('user_id', user.id)
      .single();
    userRegistration = data;

    // 取得使用者邀請碼
    const { data: profile } = await supabase
      .from('profiles')
      .select('invitation_code')
      .eq('id', user.id)
      .single();
    userInviteCode = profile?.invitation_code || null;

    // 檢查用戶邀請了幾個人到此活動
    const { count } = await supabase
      .from('registrations')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', params.id)
      .eq('invited_by_user_id', user.id);
    invitedOthersCount = count || 0;
  }

  const remainingSlots = event.max_participants ? event.max_participants - totalRegistrationCount : null;
  const isOverCapacity = event.max_participants && totalRegistrationCount > event.max_participants;
  const isFull = event.max_participants && totalRegistrationCount >= event.max_participants && !isOverCapacity;
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
          <span className={`rounded-full px-3 py-1 text-xs font-medium ${event.status === 'published' && !isEnded
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
          {isOverCapacity && (
            <span className="rounded-full bg-amber-500/20 px-3 py-1 text-xs font-medium text-amber-200">
              🎉 本次活動特別加開名額
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
            <span className="text-white/60">{event.pre_registration_count > 0 ? '🎫 釋放名額:' : '👥 名額:'}</span>
            <span>
              {event.max_participants || '不限'}
              {isOverCapacity && (
                <span className="ml-1 text-amber-300">（已加開至 {totalRegistrationCount} 人）</span>
              )}
            </span>
          </div>
          {event.pre_registration_count > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-white/60">📋 預報名:</span>
              <span className="text-amber-400 font-semibold">{event.pre_registration_count.toLocaleString()} 人</span>
            </div>
          )}
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
            {event.pre_registration_count > 0 && (
              <p className="mt-2 text-sm text-amber-400/90">
                📋 已預報名 <span className="text-xl font-bold text-amber-400">{event.pre_registration_count.toLocaleString()}</span> 人
              </p>
            )}
            {event.pre_registration_count > 0 ? (
              event.title?.includes("暗影洛奇亞") ? (
                <>
                  <p className="mt-1 text-sm text-white/80">
                    已確認 <span className="text-lg font-semibold text-white">0</span>/1（第一梯次 圓形競技場）
                  </p>
                  <p className="mt-0.5 text-sm text-white/60">
                    已確認 <span className="text-lg font-semibold text-white/50">0</span>/1（第二梯次 XD暗影洛奇亞）
                  </p>
                </>
              ) : (
                <>
                  <p className="mt-1 text-sm text-white/80">
                    已確認 <span className="text-lg font-semibold text-white">15</span>/15（第一梯次）
                  </p>
                  <p className="mt-0.5 text-sm text-white/60">
                    已確認 <span className="text-lg font-semibold text-white/50">0</span>/15（第二梯次）<span className="text-xs text-white/30">尚未開放</span>
                  </p>
                </>
              )
            ) : (
              <p className="mt-1 text-sm text-white/80">
                已確認: <span className="text-2xl font-semibold text-white">{totalRegistrationCount}</span>
                {event.max_participants && ` / ${event.max_participants}`}
              </p>
            )}
            <p className="text-xs text-amber-300/80">
              {event.pre_registration_count > 0
                ? "報名會先進入排隊階段，只有獲得正式參與資格後才會出現在參與紀錄與抽選頁。"
                : "報名會先進入待確認，只有獲得管理員批准後才會出現在參與紀錄與抽選頁。"}
            </p>
            {pendingOnline > 0 && !event.pre_registration_count && (
              <p className="text-xs text-slate-200/60">
                目前 {pendingOnline} 筆報名仍待確認，通過核可後才會列入參與紀錄。
              </p>
            )}
            {remainingSlots !== null && !isOverCapacity && (
              <p className="mt-1 text-xs text-slate-200/60">
                剩餘名額: {remainingSlots > 0 ? remainingSlots : 0}
              </p>
            )}
            {isOverCapacity && (
              <p className="mt-1 text-xs text-amber-300/80">
                🎉 本次活動特別加開名額，歡迎報名！
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
          ) : isFull && !isOverCapacity ? (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-center text-sm text-red-200">
              名額已滿
            </div>
          ) : (
            <>
            <RegisterButton eventId={params.id} isPreRegistration={event.pre_registration_count > 0} />
            {event.pre_registration_count > 0 && (
              <p className="text-xs text-amber-400/70 text-center mt-1">目前僅開放預報名，審核通過後才算正式報名</p>
            )}
            </>
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

          {/* 邀請碼 */}
          {user && userInviteCode && (
            <div className="mt-2 rounded-xl border border-dashed border-amber-500/30 bg-amber-500/5 p-4">
              <p className="text-xs text-amber-300/80 mb-2">🎁 你的邀請碼 — 分享給朋友，活動結束有機會獲得驚喜！</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded-lg bg-white/10 px-3 py-2 text-center text-lg font-mono font-bold tracking-widest text-amber-400">
                  {userInviteCode}
                </code>
                <InviteCodeCopyButton code={userInviteCode} />
              </div>
            </div>
          )}

          {/* 活動結束後的驚喜抽獎 */}
          {isEnded && user && userRegistration && (
            (userRegistration.invited_by_user_id || invitedOthersCount > 0) && (
              <div className="mt-2 rounded-xl border border-dashed border-pink-500/40 bg-pink-500/10 p-4">
                <p className="text-xs text-pink-300/90 mb-1">🎁 邀請碼驚喜</p>
                {userRegistration.invited_by_user_id && (
                  <p className="text-xs text-pink-200/70 mb-2">你使用了邀請碼報名，獲得驚喜抽獎資格！</p>
                )}
                {invitedOthersCount > 0 && (
                  <p className="text-xs text-pink-200/70 mb-2">你的邀請碼被 {invitedOthersCount} 人使用，獲得驚喜抽獎資格！</p>
                )}
                <Link
                  href={`/events/${params.id}/invite-surprise` as Route}
                  className="block rounded-lg bg-gradient-to-r from-pink-500/60 to-purple-500/60 px-4 py-2 text-center text-sm font-semibold text-white transition hover:from-pink-500/80 hover:to-purple-500/80"
                >
                  🎁 領取驚喜
                </Link>
              </div>
            )
          )}
        </aside>
      </section>

      {/* 假象 Bug 留言區 */}
      <EventComments eventTitle={event.title} />
    </div>
  );
}
