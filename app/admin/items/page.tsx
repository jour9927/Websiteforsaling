import { createServerSupabaseClient } from "@/lib/auth";
import { redirect } from "next/navigation";
import UserItemRow, { type UserItem } from "@/components/admin/UserItemRow";

export const dynamic = "force-dynamic";

type RawUserItem = Omit<UserItem, "event" | "user"> & {
  event: { id: string | null; title: string | null }[] | null;
  user: { id: string; full_name: string | null; email: string | null }[] | null;
};

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

  const { data: userItems } = await supabase
    .from("user_items")
    .select(`
      id,
      name,
      quantity,
      notes,
      updated_at,
      user:profiles (
        id,
        full_name,
        email
      ),
      event:events (
        id,
        title
      )
    `)
    .order("updated_at", { ascending: false });

  // Supabase 會回傳關聯為陣列，這裡攤平成單一物件以符合 UI 型別
  const normalizedUserItems: UserItem[] = (userItems ?? []).map((item: RawUserItem) => ({
    ...item,
    event: Array.isArray(item.event) ? item.event[0] ?? null : item.event ?? null,
    user: Array.isArray(item.user) ? item.user[0] ?? null : item.user ?? null
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

      {normalizedUserItems.length === 0 ? (
        <div className="glass-card p-6 text-center text-white/60">
          暫時沒有任何會員物品記錄。
        </div>
      ) : (
        <div className="space-y-4">
          {normalizedUserItems.map((item) => (
            <UserItemRow key={item.id} item={item} events={events ?? []} />
          ))}
        </div>
      )}
    </section>
  );
}
