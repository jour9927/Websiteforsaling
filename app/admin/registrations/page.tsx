import Link from "next/link";
import type { Route } from "next";
import { createServerSupabaseClient } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function AdminRegistrationsPage() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 检查是否为管理员
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    redirect("/");
  }

  // 获取所有报名记录，包含用户和活动信息
  const { data: registrations } = await supabase
    .from('registrations')
    .select(`
      id,
      status,
      registered_at,
      user_id,
      event_id
    `)
    .order('registered_at', { ascending: false })
    .limit(50);

  // 获取用户信息
  const userIds = registrations?.map(r => r.user_id) || [];
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, email, full_name')
    .in('id', userIds);

  // 获取活动信息
  const eventIds = registrations?.map(r => r.event_id) || [];
  const { data: events } = await supabase
    .from('events')
    .select('id, title, start_date')
    .in('id', eventIds);

  // 合并数据
  const registrationsWithDetails = registrations?.map(reg => ({
    ...reg,
    user: profiles?.find(p => p.id === reg.user_id),
    event: events?.find(e => e.id === reg.event_id)
  })) || [];

  // 统计数据
  const totalRegistrations = registrations?.length || 0;
  const pendingCount = registrations?.filter(r => r.status === 'pending').length || 0;
  const confirmedCount = registrations?.filter(r => r.status === 'confirmed').length || 0;

  const statusText = (status: string) => {
    switch (status) {
      case 'confirmed': return '已確認';
      case 'pending': return '待確認';
      case 'cancelled': return '已取消';
      default: return status;
    }
  };

  return (
    <section className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold text-white/90">報名管理</h1>
        <p className="mt-1 text-sm text-white/60">查看和管理所有活動報名記錄。</p>
      </header>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-3">
        <article className="glass-card p-6">
          <p className="text-xs uppercase text-white/60">總報名數</p>
          <p className="mt-2 text-3xl font-semibold text-white">{totalRegistrations}</p>
        </article>
        <article className="glass-card p-6">
          <p className="text-xs uppercase text-white/60">待確認</p>
          <p className="mt-2 text-3xl font-semibold text-yellow-200">{pendingCount}</p>
        </article>
        <article className="glass-card p-6">
          <p className="text-xs uppercase text-white/60">已確認</p>
          <p className="mt-2 text-3xl font-semibold text-green-200">{confirmedCount}</p>
        </article>
      </div>

      <article className="glass-card p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white/90">報名記錄</h2>
            <p className="text-xs text-white/60">所有活動的報名列表</p>
          </div>
        </div>
        
        {registrationsWithDetails.length === 0 ? (
          <div className="mt-6 text-center text-white/60">
            <p>目前沒有任何報名記錄</p>
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full divide-y divide-white/10 text-sm text-white/80">
              <thead className="text-left text-xs uppercase tracking-[0.2em] text-white/60">
                <tr>
                  <th className="px-4 py-3">會員</th>
                  <th className="px-4 py-3">活動</th>
                  <th className="px-4 py-3">報名時間</th>
                  <th className="px-4 py-3">狀態</th>
                  <th className="px-4 py-3">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {registrationsWithDetails.map((reg) => (
                  <tr key={reg.id}>
                    <td className="px-4 py-4 font-medium text-white/90">
                      {reg.user?.full_name || reg.user?.email || '未知用戶'}
                      <br />
                      <span className="text-xs text-white/50">{reg.user?.email}</span>
                    </td>
                    <td className="px-4 py-4 text-white/70">
                      {reg.event?.title || '未知活動'}
                    </td>
                    <td className="px-4 py-4 text-white/70">
                      {new Date(reg.registered_at).toLocaleString('zh-TW')}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`rounded-full px-3 py-1 text-xs ${
                        reg.status === 'confirmed' ? 'bg-green-500/20 text-green-200' :
                        reg.status === 'pending' ? 'bg-yellow-500/20 text-yellow-200' :
                        'bg-gray-500/20 text-gray-200'
                      }`}>
                        {statusText(reg.status)}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-xs text-sky-200 hover:text-sky-100">
                      <Link href={`/admin/registrations/${reg.id}` as Route}>詳細</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </article>
    </section>
  );
}
