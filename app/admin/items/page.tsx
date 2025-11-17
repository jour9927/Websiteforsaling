import { createServerSupabaseClient } from "@/lib/auth";
import { redirect } from "next/navigation";
import UserItemRow from "@/components/admin/UserItemRow";

export const dynamic = "force-dynamic";

export default async function AdminUserItemsPage() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/admin/items");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    redirect("/?error=unauthorized");
  }

  const { data: userItemsRaw } = await supabase
    .from("user_items")
    .select(`
      id,
      name,
      quantity,
      notes,
      updated_at,
      user_id,
      event_id,
      profiles!user_items_user_id_fkey (
        id,
        full_name,
        email
      ),
      events (
        id,
        title
      )
    `)
    .order("updated_at", { ascending: false });

  // Transform the data to match UserItem type
  const userItems = userItemsRaw?.map((item: any) => ({
    id: item.id,
    name: item.name,
    quantity: item.quantity,
    notes: item.notes,
    updated_at: item.updated_at,
    user: Array.isArray(item.profiles) ? item.profiles[0] : item.profiles,
    event: Array.isArray(item.events) ? item.events[0] : item.events,
  }));

  const { data: events } = await supabase
    .from("events")
    .select("id, title")
    .order("start_date", { ascending: false });

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-white/90">我的物品管理</h1>
        <p className="mt-1 text-sm text-white/60">編輯會員在不同活動中獲得的物品。</p>
      </header>

      {!userItems || userItems.length === 0 ? (
        <div className="glass-card p-6 text-center text-white/60">
          暫時沒有任何會員物品記錄。
        </div>
      ) : (
        <div className="space-y-4">
          {userItems.map((item) => (
            <UserItemRow key={item.id} item={item} events={events ?? []} />
          ))}
        </div>
      )}
    </section>
  );
}
