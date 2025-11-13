import { createServerSupabaseClient } from "@/lib/auth";
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
    .eq('user_id', user.id)
    .order('registered_at', { ascending: false }) as { data: RegistrationData[] | null; error: any };

  // 添加调试日志
  console.log('=== History Page Debug ===');
  console.log('User ID:', user.id);
  console.log('User Email:', user.email);
  console.log('Registrations:', registrations);
  console.log('Registrations count:', registrations?.length || 0);
  console.log('Error:', error);
  console.log('========================');

  const statusText = (status: string) => {
    switch (status) {
      case 'confirmed': return '已確認';
      case 'pending': return '待確認';
      case 'cancelled': return '已取消';
      default: return status;
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <section className="glass-card p-8">
        <h1 className="text-3xl font-semibold">參與紀錄</h1>
        <p className="mt-2 text-sm text-slate-200/70">查看已報名活動與抽選結果。</p>
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

      {!registrations || registrations.length === 0 ? (
        <section className="glass-card p-12 text-center">
          <p className="text-lg text-white/60">尚未報名任何活動</p>
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
              {registrations.map((reg) => {
                // Supabase 返回的 event 可能是数组，取第一个元素
                const event = Array.isArray(reg.event) ? reg.event[0] : reg.event;
                return (
                  <tr key={reg.id}>
                    <td className="px-6 py-4">{event?.title || '未知活動'}</td>
                    <td className="px-6 py-4">
                      <span className={`rounded-full px-3 py-1 text-xs ${
                        reg.status === 'confirmed' ? 'bg-green-500/20 text-green-200' :
                        reg.status === 'pending' ? 'bg-yellow-500/20 text-yellow-200' :
                        'bg-gray-500/20 text-gray-200'
                      }`}>
                        {statusText(reg.status)}
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
