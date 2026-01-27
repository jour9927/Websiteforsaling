import { createServerSupabaseClient } from "@/lib/auth";
import Link from "next/link";

export const dynamic = "force-dynamic";

type ItemWithEvent = {
  id: string;
  name: string;
  quantity: number;
  notes: string | null;
  updated_at: string;
  event_id: string | null;
  event: {
    id: string;
    title: string;
    start_date: string;
    image_url: string | null;
    estimated_value: number;
  } | null;
};

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
      event_id,
      events (
        id,
        title,
        start_date,
        image_url,
        estimated_value
      )
    `)
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  // Transform the data to handle array responses
  const items: ItemWithEvent[] = (itemsRaw || []).map((item) => ({
    ...item,
    event: Array.isArray(item.events) ? item.events[0] : item.events,
  }));

  // 計算資產統計
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalValue = items.reduce((sum, item) => {
    const eventValue = item.event?.estimated_value || 0;
    return sum + eventValue * item.quantity;
  }, 0);

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-white/90">我的物品</h1>
        <p className="mt-1 text-sm text-white/60">
          這裡顯示你在各個活動中獲得的物品，如需修改請聯繫管理員。
        </p>
      </header>

      {/* V2.0 資產統計區塊 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="glass-card p-4 text-center">
          <p className="text-xs uppercase tracking-wider text-white/50">物品總數</p>
          <p className="mt-1 text-2xl font-bold text-white">
            {totalItems} <span className="text-base text-white/50">件</span>
          </p>
        </div>
        <div className="glass-card p-4 text-center">
          <p className="text-xs uppercase tracking-wider text-white/50">資產估值</p>
          <p className="mt-1 text-2xl font-bold text-amber-400">
            ${totalValue.toLocaleString()}
          </p>
        </div>
      </div>

      {/* 快速連結 */}
      <div className="flex gap-3">
        <Link
          href="/collection"
          className="rounded-xl bg-amber-500/20 px-4 py-2 text-sm text-amber-400 transition hover:bg-amber-500/30"
        >
          📚 查看圖鑑
        </Link>
      </div>

      {!items || items.length === 0 ? (
        <div className="glass-card p-6 text-center text-white/60">
          尚未有任何物品紀錄，前往活動頁面報名即可獲得專屬道具。
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <article key={item.id} className="glass-card rounded-2xl border border-white/10 p-5">
              <div className="flex gap-4">
                {/* 物品圖片 */}
                {item.event?.image_url && (
                  <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl">
                    <img
                      src={item.event.image_url}
                      alt={item.event.title}
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}

                <div className="flex-1">
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
                    {/* V2.0 估值顯示 */}
                    {item.event?.estimated_value ? (
                      <span className="rounded-full bg-amber-500/20 px-3 py-1 text-xs text-amber-400">
                        估值：${(item.event.estimated_value * item.quantity).toLocaleString()}
                      </span>
                    ) : null}
                    <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-white/80">
                      更新：{new Date(item.updated_at).toLocaleString("zh-TW")}
                    </span>
                  </div>

                  {item.notes && (
                    <p className="mt-3 text-sm text-white/60">備註：{item.notes}</p>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
