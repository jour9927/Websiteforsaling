import { createServerSupabaseClient } from "@/lib/auth";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ItemsPage() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <section className="glass-card p-8 text-center">
        <h1 className="text-2xl font-semibold text-white">我的物品</h1>
        <p className="mt-3 text-sm text-white/70">請先登入以查看您的活動物品</p>
        <Link
          href="/login?redirect=/items"
          className="mt-5 inline-block rounded-2xl bg-white/20 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/30"
        >
          登入
        </Link>
      </section>
    );
  }

  const { data: itemsRaw } = await supabase
    .from("user_items")
    .select(`
      id,
      name,
      quantity,
      notes,
      updated_at,
      events (
        id,
        title,
        start_date
      )
    `)
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  // Transform the data to handle array responses
  const items = itemsRaw?.map((item) => ({
    ...item,
    event: Array.isArray(item.events) ? item.events[0] : item.events,
  }));

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-white/90">我的物品</h1>
        <p className="mt-1 text-sm text-white/60">
          這裡顯示你在各個活動中獲得的物品，如需修改請聯繫管理員。
        </p>
      </header>

      {!items || items.length === 0 ? (
        <div className="glass-card p-6 text-center text-white/60">
          尚未有任何物品紀錄，前往活動頁面報名即可獲得專屬道具。
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <article key={item.id} className="glass-card rounded-2xl border border-white/10 p-5">
              <div className="flex flex-col gap-1">
                <p className="text-xs uppercase tracking-[0.3em] text-white/50">活動</p>
                <p className="text-lg font-semibold text-white">{item.event?.title ?? "未知活動"}</p>
                {item.event?.start_date && (
                  <p className="text-xs text-white/50">
                    日期：{new Date(item.event.start_date).toLocaleDateString("zh-TW")}
                  </p>
                )}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-white/80">
                  物品：{item.name}
                </span>
                <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-white/80">
                  數量：{item.quantity}
                </span>
                <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-white/80">
                  更新：{new Date(item.updated_at).toLocaleString("zh-TW")}
                </span>
              </div>
              {item.notes && (
                <p className="mt-3 text-sm text-white/60">備註：{item.notes}</p>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
