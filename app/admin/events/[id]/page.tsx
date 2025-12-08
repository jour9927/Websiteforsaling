import Link from "next/link";
import type { Route } from "next";
import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/auth";
import EventEditForm from "./EventEditForm";
import AddRegistrationForm from "@/components/admin/AddRegistrationForm";
import { getStatusLabel } from "@/lib/statusLabels";

export const dynamic = "force-dynamic";

interface AdminEventEditPageProps {
  params: { id: string };
}

export default async function AdminEventEditPage({ params }: AdminEventEditPageProps) {
  const supabase = createServerSupabaseClient();

  const { data: event, error } = await supabase
    .from("events")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error || !event) {
    notFound();
  }

  // 載入此活動的報名記錄
  const { data: registrations } = await supabase
    .from("registrations")
    .select(`
      id,
      status,
      registered_at,
      user_id
    `)
    .eq("event_id", params.id)
    .order("registered_at", { ascending: false });

  // 載入會員資料
  const userIds = registrations?.map(r => r.user_id) || [];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, email, full_name")
    .in("id", userIds);

  // 合併資料
  const registrationsWithProfiles = registrations?.map(reg => ({
    ...reg,
    profile: profiles?.find(p => p.id === reg.user_id)
  })) || [];

  const previewHref = `/events/${params.id}` as Route;

  return (
    <section className="space-y-8">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/60">活動設定</p>
          <h1 className="text-2xl font-semibold text-white/90">{event.title}</h1>
          <p className="text-xs text-white/60">調整活動資訊、封面與排程，儲存後會同步更新前台頁面。</p>
        </div>
        <Link
          href={previewHref}
          className="rounded-xl border border-white/30 px-4 py-2 text-xs text-white/80 transition hover:bg-white/10"
        >
          前台預覽
        </Link>
      </header>

      <EventEditForm event={event} />

      {/* 報名管理區塊 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* 幫會員報名表單 */}
        <AddRegistrationForm 
          eventId={params.id} 
          eventTitle={event.title}
        />

        {/* 目前報名列表 */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white/90">報名列表</h3>
              <p className="text-xs text-white/60">
                共 {registrationsWithProfiles.length} 筆報名
              </p>
            </div>
          </div>

          {registrationsWithProfiles.length === 0 ? (
            <div className="mt-4 text-center text-sm text-white/50">
              尚無報名記錄
            </div>
          ) : (
            <div className="mt-4 max-h-96 space-y-2 overflow-y-auto">
              {registrationsWithProfiles.map((reg) => (
                <div
                  key={reg.id}
                  className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white/90">
                      {reg.profile?.full_name || reg.profile?.email || "未知會員"}
                    </p>
                    <p className="text-xs text-white/50">
                      {reg.profile?.email}
                    </p>
                    <p className="mt-1 text-xs text-white/40">
                      {new Date(reg.registered_at).toLocaleString("zh-TW")}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs ${
                      reg.status === "confirmed"
                        ? "bg-green-500/20 text-green-200"
                        : reg.status === "pending"
                        ? "bg-yellow-500/20 text-yellow-200"
                        : "bg-gray-500/20 text-gray-200"
                    }`}
                  >
                    {getStatusLabel(reg.status)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
