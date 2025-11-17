import { createServerSupabaseClient } from "@/lib/auth";
import Link from "next/link";

export const dynamic = "force-dynamic";

const statusLabels = {
  pending: "待付款",
  paid: "已付款",
  overdue: "逾期",
  cancelled: "已取消"
};

const statusColors = {
  pending: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  paid: "bg-green-500/20 text-green-300 border-green-500/30",
  overdue: "bg-red-500/20 text-red-300 border-red-500/30",
  cancelled: "bg-gray-500/20 text-gray-300 border-gray-500/30"
};

export default async function PaymentsPage() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <section className="glass-card p-8 text-center">
        <h1 className="text-2xl font-semibold text-white">我的付款</h1>
        <p className="mt-3 text-sm text-white/70">請先登入以查看您的付款記錄</p>
        <Link
          href="/login?redirect=/payments"
          className="mt-5 inline-block rounded-2xl bg-white/20 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/30"
        >
          登入
        </Link>
      </section>
    );
  }

  const { data: paymentsRaw } = await supabase
    .from("user_payments")
    .select(`
      id,
      amount,
      status,
      payment_date,
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
  const payments = paymentsRaw?.map((payment) => ({
    ...payment,
    event: Array.isArray(payment.events) ? payment.events[0] : payment.events,
  }));

  // Calculate totals
  const totalPaid = payments?.filter(p => p.status === 'paid').reduce((sum, p) => sum + Number(p.amount), 0) || 0;
  const totalPending = payments?.filter(p => p.status === 'pending').reduce((sum, p) => sum + Number(p.amount), 0) || 0;
  const totalOverdue = payments?.filter(p => p.status === 'overdue').reduce((sum, p) => sum + Number(p.amount), 0) || 0;

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-white/90">我的付款</h1>
        <p className="mt-1 text-sm text-white/60">
          查看您參與活動的付款記錄與狀態。如需修改請聯繫管理員。
        </p>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="glass-card rounded-2xl border border-green-500/30 p-4">
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">已付款</p>
          <p className="mt-2 text-2xl font-bold text-green-300">NT$ {totalPaid.toLocaleString()}</p>
        </div>
        <div className="glass-card rounded-2xl border border-yellow-500/30 p-4">
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">待付款</p>
          <p className="mt-2 text-2xl font-bold text-yellow-300">NT$ {totalPending.toLocaleString()}</p>
        </div>
        <div className="glass-card rounded-2xl border border-red-500/30 p-4">
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">逾期</p>
          <p className="mt-2 text-2xl font-bold text-red-300">NT$ {totalOverdue.toLocaleString()}</p>
        </div>
      </div>

      {/* Payment List */}
      {!payments || payments.length === 0 ? (
        <div className="glass-card p-6 text-center text-white/60">
          尚未有任何付款記錄。
        </div>
      ) : (
        <div className="space-y-4">
          {payments.map((payment) => (
            <article key={payment.id} className="glass-card rounded-2xl border border-white/10 p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex-1 space-y-2">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-white/50">活動</p>
                    <p className="text-lg font-semibold text-white">{payment.event?.title ?? "未知活動"}</p>
                    {payment.event?.start_date && (
                      <p className="text-xs text-white/50">
                        日期：{new Date(payment.event.start_date).toLocaleDateString("zh-TW")}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-xl font-bold text-white">
                      NT$ {Number(payment.amount).toLocaleString()}
                    </span>
                    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusColors[payment.status as keyof typeof statusColors]}`}>
                      {statusLabels[payment.status as keyof typeof statusLabels]}
                    </span>
                  </div>

                  {payment.payment_date && (
                    <p className="text-xs text-white/50">
                      付款日期：{new Date(payment.payment_date).toLocaleDateString("zh-TW")}
                    </p>
                  )}

                  {payment.notes && (
                    <p className="text-sm text-white/60">備註：{payment.notes}</p>
                  )}
                </div>

                <div className="text-right text-xs text-white/40">
                  建立：{new Date(payment.created_at).toLocaleDateString("zh-TW")}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
