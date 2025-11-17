import { createServerSupabaseClient } from "@/lib/auth";
import { redirect } from "next/navigation";
import UserPaymentRow, { type UserPayment } from "@/components/admin/UserPaymentRow";
import AddPaymentForm from "@/components/admin/AddPaymentForm";

export const dynamic = "force-dynamic";

export default async function AdminPaymentsPage() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/admin/payments");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    redirect("/?error=unauthorized");
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
      profiles!user_payments_user_id_fkey (
        id,
        full_name,
        email
      ),
      events (
        id,
        title
      )
    `)
    .order("created_at", { ascending: false });

  const payments = paymentsRaw
    ?.flatMap((payment) => {
      const user = Array.isArray(payment.profiles) ? payment.profiles[0] : payment.profiles;

      if (!user) {
        return [];
      }

      return [
        {
          id: payment.id,
          amount: payment.amount ?? "0",
          status: payment.status,
          payment_date: payment.payment_date,
          notes: payment.notes,
          created_at: payment.created_at,
          updated_at: payment.updated_at,
          user,
          event: Array.isArray(payment.events) ? payment.events[0] : payment.events
        } satisfies UserPayment
      ];
    }) ?? [];

  const { data: events } = await supabase
    .from("events")
    .select("id, title")
    .order("start_date", { ascending: false });

  // Get all users for the add form
  const { data: users } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .order("full_name", { ascending: true });

  // Calculate statistics
  const totalPaid = payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + Number(p.amount), 0);
  const totalPending = payments.filter(p => p.status === 'pending').reduce((sum, p) => sum + Number(p.amount), 0);
  const totalOverdue = payments.filter(p => p.status === 'overdue').reduce((sum, p) => sum + Number(p.amount), 0);

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-white/90">付款管理</h1>
        <p className="mt-1 text-sm text-white/60">
          管理會員在各活動的付款紀錄，更新金額、狀態或活動關聯。
        </p>
      </header>

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="glass-card rounded-2xl border border-green-500/30 p-4">
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">已付款總額</p>
          <p className="mt-2 text-2xl font-bold text-green-300">NT$ {totalPaid.toLocaleString()}</p>
          <p className="mt-1 text-xs text-white/40">
            {payments.filter(p => p.status === 'paid').length} 筆記錄
          </p>
        </div>
        <div className="glass-card rounded-2xl border border-yellow-500/30 p-4">
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">待付款總額</p>
          <p className="mt-2 text-2xl font-bold text-yellow-300">NT$ {totalPending.toLocaleString()}</p>
          <p className="mt-1 text-xs text-white/40">
            {payments.filter(p => p.status === 'pending').length} 筆記錄
          </p>
        </div>
        <div className="glass-card rounded-2xl border border-red-500/30 p-4">
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">逾期總額</p>
          <p className="mt-2 text-2xl font-bold text-red-300">NT$ {totalOverdue.toLocaleString()}</p>
          <p className="mt-1 text-xs text-white/40">
            {payments.filter(p => p.status === 'overdue').length} 筆記錄
          </p>
        </div>
      </div>

      {/* Add Payment Form */}
      <AddPaymentForm events={events ?? []} users={users ?? []} />

      {/* Payment List */}
      {!payments || payments.length === 0 ? (
        <div className="glass-card p-6 text-center text-white/60">
          目前尚未有任何會員付款紀錄。
        </div>
      ) : (
        <div className="space-y-4">
          {payments.map((payment) => (
            <UserPaymentRow key={payment.id} payment={payment} events={events ?? []} />
          ))}
        </div>
      )}
    </section>
  );
}
