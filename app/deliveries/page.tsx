import { createServerSupabaseClient } from "@/lib/auth";
import Link from "next/link";

export const dynamic = "force-dynamic";

const statusLabels = {
  pending: "待交付",
  delivered: "已交付",
  in_transit: "運送中",
  cancelled: "已取消"
};

const statusColors = {
  pending: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  delivered: "bg-green-500/20 text-green-300 border-green-500/30",
  in_transit: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  cancelled: "bg-gray-500/20 text-gray-300 border-gray-500/30"
};

export default async function DeliveriesPage() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <section className="glass-card p-8 text-center">
        <h1 className="text-2xl font-semibold text-white">交付紀錄</h1>
        <p className="mt-3 text-sm text-white/70">請先登入以查看您的交付紀錄</p>
        <Link
          href="/login?redirect=/deliveries"
          className="mt-5 inline-block rounded-2xl bg-white/20 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/30"
        >
          登入
        </Link>
      </section>
    );
  }

  const { data: deliveriesRaw } = await supabase
    .from("user_deliveries")
    .select(`
      id,
      item_name,
      quantity,
      status,
      delivery_date,
      notes,
      created_at,
      updated_at,
      events (
        id,
        title,
        start_date
      )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  // Transform the data to handle array responses
  const deliveries = deliveriesRaw?.map((delivery) => ({
    ...delivery,
    event: Array.isArray(delivery.events) ? delivery.events[0] : delivery.events,
  }));

  // Calculate statistics
  const totalDelivered = deliveries?.filter(d => d.status === 'delivered').length || 0;
  const totalPending = deliveries?.filter(d => d.status === 'pending').length || 0;
  const totalInTransit = deliveries?.filter(d => d.status === 'in_transit').length || 0;

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-white/90">交付紀錄</h1>
        <p className="mt-1 text-sm text-white/60">
          查看您參與活動的物品交付紀錄與狀態。如需修改請聯繫管理員。
        </p>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="glass-card rounded-2xl border border-green-500/30 p-4">
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">已交付</p>
          <p className="mt-2 text-2xl font-bold text-green-300">{totalDelivered}</p>
          <p className="mt-1 text-xs text-white/40">筆記錄</p>
        </div>
        <div className="glass-card rounded-2xl border border-yellow-500/30 p-4">
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">待交付</p>
          <p className="mt-2 text-2xl font-bold text-yellow-300">{totalPending}</p>
          <p className="mt-1 text-xs text-white/40">筆記錄</p>
        </div>
        <div className="glass-card rounded-2xl border border-blue-500/30 p-4">
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">運送中</p>
          <p className="mt-2 text-2xl font-bold text-blue-300">{totalInTransit}</p>
          <p className="mt-1 text-xs text-white/40">筆記錄</p>
        </div>
      </div>

      {/* Delivery List */}
      {!deliveries || deliveries.length === 0 ? (
        <div className="glass-card p-6 text-center text-white/60">
          尚未有任何交付紀錄。
        </div>
      ) : (
        <div className="space-y-4">
          {deliveries.map((delivery) => (
            <article key={delivery.id} className="glass-card rounded-2xl border border-white/10 p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex-1 space-y-2">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-white/50">活動</p>
                    <p className="text-lg font-semibold text-white">{delivery.event?.title ?? "未知活動"}</p>
                    {delivery.event?.start_date && (
                      <p className="text-xs text-white/50">
                        日期：{new Date(delivery.event.start_date).toLocaleDateString("zh-TW")}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <span className="rounded-full bg-white/10 px-3 py-1 text-sm font-semibold text-white">
                      {delivery.item_name}
                    </span>
                    <span className="text-sm text-white/70">
                      數量：{delivery.quantity}
                    </span>
                    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusColors[delivery.status as keyof typeof statusColors]}`}>
                      {statusLabels[delivery.status as keyof typeof statusLabels]}
                    </span>
                  </div>

                  {delivery.delivery_date && (
                    <p className="text-xs text-white/50">
                      交付日期：{new Date(delivery.delivery_date).toLocaleDateString("zh-TW")}
                    </p>
                  )}

                  {delivery.notes && (
                    <p className="text-sm text-white/60">備註：{delivery.notes}</p>
                  )}
                </div>

                <div className="text-right text-xs text-white/40">
                  建立：{new Date(delivery.created_at).toLocaleDateString("zh-TW")}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
