import { notFound, redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/auth";
import Link from "next/link";
import { getStatusLabel } from "@/lib/statusLabels";
import ApprovalControls from "./ApprovalControls";

export const dynamic = 'force-dynamic';

type AdminRegistrationDetailPageProps = {
  params: { id: string };
};

export default async function AdminRegistrationDetailPage({ params }: AdminRegistrationDetailPageProps) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    redirect("/");
  }

  const { data: registration, error } = await supabase
    .from('registrations')
    .select('*')
    .eq('id', params.id)
    .single();

  if (error || !registration) {
    notFound();
  }

  const { data: userProfile } = await supabase
    .from('profiles')
    .select('id, email, full_name, role')
    .eq('id', registration.user_id)
    .single();

  const { data: event } = await supabase
    .from('events')
    .select('*')
    .eq('id', registration.event_id)
    .single();

  return (
    <section className="space-y-6">
      <header>
        <Link href="/admin/registrations" className="text-sm text-white/60 hover:text-white">
          ← 返回報名列表
        </Link>
        <h1 className="mt-4 text-2xl font-semibold text-white/90">報名詳情</h1>
        <p className="mt-1 text-sm text-white/60">查看和管理報名記錄</p>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        <article className="glass-card p-6">
          <h2 className="text-lg font-semibold text-white/90">報名資訊</h2>
          <div className="mt-4 space-y-3 text-sm">
            <div>
              <p className="text-white/60">報名 ID</p>
              <p className="text-white/90 font-mono text-xs">{registration.id}</p>
            </div>
            <div>
              <p className="text-white/60">報名時間</p>
              <p className="text-white/90">{new Date(registration.registered_at).toLocaleString('zh-TW')}</p>
            </div>
            <div>
              <p className="text-white/60">狀態</p>
              <span className={`inline-block rounded-full px-3 py-1 text-xs mt-1 ${
                registration.status === 'confirmed' ? 'bg-green-500/20 text-green-200' :
                registration.status === 'pending' ? 'bg-yellow-500/20 text-yellow-200' :
                'bg-gray-500/20 text-gray-200'
              }`}>
                {getStatusLabel(registration.status)}
              </span>
            </div>
            {registration.updated_at && (
              <div>
                <p className="text-white/60">最後更新</p>
                <p className="text-white/90">{new Date(registration.updated_at).toLocaleString('zh-TW')}</p>
              </div>
            )}
          </div>
        </article>

        <article className="glass-card p-6">
          <h2 className="text-lg font-semibold text-white/90">會員資訊</h2>
          <div className="mt-4 space-y-3 text-sm">
            <div>
              <p className="text-white/60">姓名</p>
              <p className="text-white/90">{userProfile?.full_name || '未設定'}</p>
            </div>
            <div>
              <p className="text-white/60">Email</p>
              <p className="text-white/90">{userProfile?.email}</p>
            </div>
            <div>
              <p className="text-white/60">會員類型</p>
              <p className="text-white/90">
                {userProfile?.role === 'admin' ? '管理員' : 
                 userProfile?.role === 'vip' ? 'VIP' : '一般會員'}
              </p>
            </div>
          </div>
        </article>

        <article className="glass-card p-6 md:col-span-2">
          <h2 className="text-lg font-semibold text-white/90">活動資訊</h2>
          <div className="mt-4 space-y-3 text-sm">
            <div>
              <p className="text-white/60">活動名稱</p>
              <p className="text-white/90 text-lg">{event?.title}</p>
            </div>
            {event?.description && (
              <div>
                <p className="text-white/60">活動描述</p>
                <p className="text-white/80">{event.description}</p>
              </div>
            )}
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-white/60">開始時間</p>
                <p className="text-white/90">{event?.start_date ? new Date(event.start_date).toLocaleString('zh-TW') : '-'}</p>
              </div>
              <div>
                <p className="text-white/60">結束時間</p>
                <p className="text-white/90">{event?.end_date ? new Date(event.end_date).toLocaleString('zh-TW') : '-'}</p>
              </div>
              {event?.location && (
                <div>
                  <p className="text-white/60">地點</p>
                  <p className="text-white/90">{event.location}</p>
                </div>
              )}
              {event?.max_participants && (
                <div>
                  <p className="text-white/60">名額限制</p>
                  <p className="text-white/90">{event.max_participants} 人</p>
                </div>
              )}
            </div>
            <div className="pt-2">
              <Link 
                href={`/admin/events/${event?.id}`}
                className="text-sm text-blue-300 hover:text-blue-200"
              >
                查看活動詳情 →
              </Link>
            </div>
          </div>
        </article>
        <article className="glass-card p-6 md:col-span-2">
          <h2 className="text-lg font-semibold text-white/90">報名審核</h2>
          <p className="mt-1 text-xs text-white/60">
            管理員可在此批准或拒絕報名，批准後才會列入會員的參與紀錄。
          </p>
          <div className="mt-4">
            <ApprovalControls
              registrationId={registration.id}
              currentStatus={registration.status}
            />
          </div>
        </article>
      </div>
    </section>
  );
}
