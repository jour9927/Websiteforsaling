import { createServerSupabaseClient } from "@/lib/auth";
import { getStatusLabel } from "@/lib/statusLabels";
import { redirect } from "next/navigation";
import Link from "next/link";

export const dynamic = 'force-dynamic';

type Event = {
  id: string;
  title: string;
  start_date: string;
};

type RegistrationData = {
  id: string;
  status: string;
  registered_at: string;
  event: Event | Event[] | null;
};

export default async function HistoryPage() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  // 未登入者導向登入頁
  if (!user) {
    redirect("/login?redirect=/history");
  }

  // 載入用戶的報名記錄
  const { data: registrations, error } = await supabase
    .from('registrations')
    .select(`
      id,
      status,
      registered_at,
      event:events (
        id,
        title,
        start_date
      )
    `)
    .eq('user_id', user.id) as {
      data: RegistrationData[] | null;
      error: { message?: string; code?: string } | null;
    };

  const allRegistrations = registrations ?? [];
  
  // 按活動開始時間排序（最近的活動在前）
  allRegistrations.sort((a, b) => {
    const eventA = Array.isArray(a.event) ? a.event[0] : a.event;
    const eventB = Array.isArray(b.event) ? b.event[0] : b.event;
    const dateA = eventA?.start_date ? new Date(eventA.start_date).getTime() : 0;
    const dateB = eventB?.start_date ? new Date(eventB.start_date).getTime() : 0;
    return dateB - dateA;
  });
  
  const confirmedRegistrations = allRegistrations.filter((reg) => reg.status === 'confirmed');
  const pendingRegistrations = allRegistrations.filter((reg) => reg.status === 'pending');
  const cancelledRegistrations = allRegistrations.filter((reg) => reg.status === 'cancelled');

  const resolveEvent = (registration: RegistrationData) => {
    return Array.isArray(registration.event) ? registration.event[0] : registration.event;
  };

  return (
    <div className="flex flex-col gap-8">
      <section className="glass-card p-8">
        <h1 className="text-3xl font-semibold">參與紀錄</h1>
        <p className="mt-2 text-sm text-slate-200/70">
          查看已報名活動與抽選結果。報名成功後會先進入待確認，須待管理員批准後才會列入正式參與紀錄。
        </p>
        {error && (
          <div className="mt-4 rounded-lg bg-red-500/20 border border-red-500/50 p-4">
            <p className="text-sm text-red-200 font-semibold">⚠️ 查詢錯誤</p>
            <p className="mt-1 text-xs text-red-300">{error.message}</p>
            <p className="mt-1 text-xs text-red-300/70">錯誤代碼: {error.code}</p>
            {error.code === '42501' && (
              <p className="mt-2 text-xs text-yellow-200">
                💡 這是權限問題，請執行 supabase/migrations/010_fix_registrations_rls.sql
              </p>
            )}
          </div>
        )}
      </section>

      <section className="glass-card p-6">
        <h2 className="text-lg font-semibold text-white/90">待確認報名</h2>
        <p className="mt-1 text-xs text-white/60">
          管理員會在審核後決定是否批准，批准後才會移至參與紀錄表格。
        </p>
        {pendingRegistrations.length === 0 ? (
          <p className="mt-4 text-sm text-white/60">目前沒有等待審核的報名。</p>
        ) : (
          <div className="mt-4 grid gap-4">
            {pendingRegistrations.map((reg) => {
              const event = resolveEvent(reg);
              return (
                <div key={reg.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.2em] text-white/40">活動</p>
                      <p className="text-base font-semibold text-white/90">
                        {event?.title || "未知活動"}
                      </p>
                    </div>
                    <span className="rounded-full bg-yellow-500/20 px-3 py-1 text-[11px] font-semibold text-yellow-200">
                        {getStatusLabel(reg.status)}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-col gap-1 text-[11px] text-white/60 sm:flex-row sm:items-center sm:justify-between">
                    <span>
                      報名時間: {new Date(reg.registered_at).toLocaleDateString("zh-TW")}
                    </span>
                    {event?.id && (
                      <Link
                        href={`/events/${event.id}`}
                        className="text-[11px] font-semibold text-blue-300 hover:text-blue-200"
                      >
                        查看活動
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {cancelledRegistrations.length > 0 && (
        <section className="glass-card p-6">
          <h2 className="text-lg font-semibold text-white/90">已被拒絕的報名</h2>
          <p className="mt-1 text-xs text-white/60">
            這些報名目前已被管理員取消，可再次報名或聯繫管理員了解詳情。
          </p>
          <div className="mt-4 space-y-3">
            {cancelledRegistrations.map((reg) => {
              const event = resolveEvent(reg);
              return (
                <div key={reg.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between text-sm">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.2em] text-white/40">活動</p>
                      <p className="text-white/90 font-medium">{event?.title || "未知活動"}</p>
                    </div>
                    <span className="rounded-full bg-rose-500/20 px-3 py-1 text-[11px] font-semibold text-rose-200">
                      {getStatusLabel(reg.status)}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-col gap-1 text-[11px] text-white/60 sm:flex-row sm:items-center sm:justify-between">
                    <span>
                      報名時間: {new Date(reg.registered_at).toLocaleDateString("zh-TW")}
                    </span>
                    {event?.id && (
                      <Link
                        href={`/events/${event.id}`}
                        className="text-[11px] font-semibold text-blue-300 hover:text-blue-200"
                      >
                        查看活動
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {confirmedRegistrations.length === 0 ? (
        <section className="glass-card p-12 text-center">
          <p className="text-lg text-white/60">尚未有任何已確認的參與紀錄</p>
          <p className="mt-2 text-sm text-white/50">
            報名後會先進入待確認階段，管理員批准後即可在此看到活動。
          </p>
          <Link
            href="/"
            className="mt-4 inline-block rounded-xl bg-white/20 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/30"
          >
            瀏覽活動
          </Link>
        </section>
      ) : (
        <section className="glass-card overflow-hidden">
          <table className="min-w-full divide-y divide-white/10 text-sm text-white/80">
            <thead className="bg-white/10 text-left text-xs uppercase tracking-[0.2em]">
              <tr>
                <th className="px-6 py-4">活動名稱</th>
                <th className="px-6 py-4">狀態</th>
                <th className="px-6 py-4">活動時間</th>
                <th className="px-6 py-4">報名時間</th>
                <th className="px-6 py-4">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {confirmedRegistrations.map((reg) => {
                const event = resolveEvent(reg);
                return (
                  <tr key={reg.id}>
                    <td className="px-6 py-4">{event?.title || '未知活動'}</td>
                    <td className="px-6 py-4">
                      <span className={`rounded-full px-3 py-1 text-xs ${
                        reg.status === 'confirmed' ? 'bg-green-500/20 text-green-200' :
                        reg.status === 'pending' ? 'bg-yellow-500/20 text-yellow-200' :
                        'bg-gray-500/20 text-gray-200'
                      }`}>
                        {getStatusLabel(reg.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {event?.start_date ? new Date(event.start_date).toLocaleDateString('zh-TW') : '-'}
                    </td>
                    <td className="px-6 py-4">
                      {new Date(reg.registered_at).toLocaleDateString('zh-TW')}
                    </td>
                    <td className="px-6 py-4">
                      {event?.id && (
                        <Link
                          href={`/events/${event.id}`}
                          className="text-blue-300 hover:text-blue-200"
                        >
                          查看活動 →
                        </Link>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}
