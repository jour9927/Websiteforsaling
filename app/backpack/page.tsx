import { createServerSupabaseClient } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type BackpackItemRow = {
  id: string;
  item_type: string;
  item_name: string;
  note: string | null;
  is_active: boolean;
  created_at: string;
  expires_at: string | null;
};

function formatRemaining(expiryIso: string) {
  const now = Date.now();
  const end = new Date(expiryIso).getTime();
  const diff = end - now;

  if (diff <= 0) return "已到期";

  const totalMinutes = Math.floor(diff / 60000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) return `剩餘 ${days} 天 ${hours} 小時`;
  if (hours > 0) return `剩餘 ${hours} 小時 ${minutes} 分鐘`;
  return `剩餘 ${minutes} 分鐘`;
}

export default async function BackpackPage() {
  const supabase = createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/backpack");
  }

  await supabase
    .from("profiles")
    .update({ last_read_backpack_items_at: new Date().toISOString() })
    .eq("id", user.id);

  const { data: items } = await supabase
    .from("backpack_items")
    .select("id, item_type, item_name, note, is_active, created_at, expires_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const rows = (items || []) as BackpackItemRow[];
  const activeCount = rows.filter((item) => {
    const expired = item.expires_at && new Date(item.expires_at) <= new Date();
    return item.is_active && !expired;
  }).length;

  return (
    <div className="space-y-6">
      <header className="glass-card p-6">
        <h1 className="text-2xl font-semibold text-white">我的背包</h1>
        <p className="mt-1 text-sm text-white/60">
          管理員發放的道具都會顯示在這裡，包含獲得原因備註。
        </p>
        <div className="mt-4 inline-flex items-center rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs text-cyan-100">
          目前可用道具：{activeCount} 件
        </div>
      </header>

      <section className="glass-card p-6">
        {rows.length === 0 ? (
          <p className="text-sm text-white/60">目前背包沒有任何道具。</p>
        ) : (
          <div className="space-y-3">
            {rows.map((item) => (
              (() => {
                const isExpired =
                  Boolean(item.expires_at) && new Date(item.expires_at as string) <= new Date();
                const isUrgent =
                  Boolean(item.expires_at) &&
                  !isExpired &&
                  new Date(item.expires_at as string).getTime() - Date.now() <= 48 * 60 * 60 * 1000;

                return (
                  <article
                    key={item.id}
                    className={`rounded-xl border p-4 ${
                      item.is_active && !isExpired
                        ? "border-emerald-400/20 bg-emerald-400/5"
                        : isExpired
                          ? "border-red-400/30 bg-red-500/10"
                          : "border-white/10 bg-white/5"
                    }`}
                  >
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base font-semibold text-white/90">{item.item_name}</h2>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      item.is_active && !isExpired
                        ? "bg-emerald-500/20 text-emerald-200"
                        : isExpired
                          ? "bg-red-500/20 text-red-200"
                          : "bg-white/10 text-white/50"
                    }`}
                  >
                    {item.is_active && !isExpired
                      ? "可使用"
                      : isExpired
                        ? "已到期"
                        : "已停用"}
                  </span>
                </div>

                <p className="mt-2 text-xs text-white/50">
                  發放時間：{new Date(item.created_at).toLocaleString("zh-TW")}
                </p>

                <p className={`mt-1 text-xs ${isExpired || isUrgent ? "animate-pulse text-red-300" : "text-white/50"}`}>
                  期限：
                  {item.expires_at
                    ? `${new Date(item.expires_at).toLocaleString("zh-TW")}（${formatRemaining(item.expires_at)}）`
                    : "無期限"}
                </p>

                <p className="mt-2 text-sm text-white/80">
                  備註：{item.note?.trim() ? item.note : "無備註"}
                </p>
                  </article>
                );
              })()
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
