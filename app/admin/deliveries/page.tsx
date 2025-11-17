import { createServerSupabaseClient } from "@/lib/auth";
import { redirect } from "next/navigation";
import UserDeliveryRow from "@/components/admin/UserDeliveryRow";
import AddDeliveryForm from "@/components/admin/AddDeliveryForm";

export const dynamic = "force-dynamic";

export default async function AdminDeliveriesPage() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/admin/deliveries");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    redirect("/?error=unauthorized");
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
      profiles!user_deliveries_user_id_fkey (
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

  // Transform the data to match UserDelivery type
  const userDeliveries = deliveriesRaw?.map((delivery) => ({
    id: delivery.id,
    item_name: delivery.item_name,
    quantity: delivery.quantity,
    status: delivery.status,
    delivery_date: delivery.delivery_date,
    notes: delivery.notes,
    created_at: delivery.created_at,
    updated_at: delivery.updated_at,
    user: Array.isArray(delivery.profiles) ? delivery.profiles[0] : delivery.profiles,
    event: Array.isArray(delivery.events) ? delivery.events[0] : delivery.events,
  }));

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
  const totalDelivered = userDeliveries?.filter(d => d.status === 'delivered').length || 0;
  const totalPending = userDeliveries?.filter(d => d.status === 'pending').length || 0;
  const totalInTransit = userDeliveries?.filter(d => d.status === 'in_transit').length || 0;

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-white/90">交付紀錄管理</h1>
        <p className="mt-1 text-sm text-white/60">管理所有會員的活動物品交付紀錄。</p>
      </header>

      {/* Statistics */}
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

      {/* Add Delivery Form */}
      <AddDeliveryForm events={events ?? []} users={users ?? []} />

      {/* Delivery List */}
      {!userDeliveries || userDeliveries.length === 0 ? (
        <div className="glass-card p-6 text-center text-white/60">
          暫時沒有任何交付紀錄。
        </div>
      ) : (
        <div className="space-y-4">
          {userDeliveries.map((delivery) => (
            <UserDeliveryRow key={delivery.id} delivery={delivery} events={events ?? []} />
          ))}
        </div>
      )}
    </section>
  );
}
