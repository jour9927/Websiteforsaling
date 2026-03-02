import { createServerSupabaseClient } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import ProfileForm from "./ProfileForm";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 未登入者導向登入頁
  if (!user) {
    redirect("/login?redirect=/profile");
  }

  // 載入用戶資料（包含簽到相關欄位）
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // 取得使用者物品統計
  const { data: userItems } = await supabase
    .from("user_items")
    .select(`
      id,
      quantity,
      event_id,
      events (estimated_value)
    `)
    .eq("user_id", user.id);

  // 取得圖鑑統計
  const { data: events } = await supabase
    .from("events")
    .select("id")
    .eq("status", "published");

  // 取得使用者擁有的不重複活動 ID
  const ownedEventIds = new Set(
    userItems?.filter((i) => i.event_id).map((i) => i.event_id)
  );

  // 計算統計數據
  const itemCount = userItems?.reduce((sum, item) => sum + item.quantity, 0) || 0;
  const itemValue =
    userItems?.reduce((sum, item) => {
      const eventData = Array.isArray(item.events) ? item.events[0] : item.events;
      const value = eventData?.estimated_value || 0;
      return sum + value * item.quantity;
    }, 0) || 0;

  // 載入配布圖鑑收藏
  const { data: userDistributions } = await supabase
    .from("user_distributions")
    .select("distribution_id, distributions(points)")
    .eq("user_id", user.id);

  const distCount = userDistributions?.length || 0;
  const distPoints = userDistributions?.reduce((sum, ud) => {
    const dist = Array.isArray(ud.distributions) ? ud.distributions[0] : ud.distributions;
    return sum + ((dist as { points?: number })?.points || 0);
  }, 0) || 0;

  const totalItems = itemCount + distCount;
  const totalValue = itemValue + distPoints;
  const collectionTotal = events?.length || 0;
  const collectionOwned = [...ownedEventIds].filter((id) =>
    events?.some((e) => e.id === id)
  ).length;
  const collectionPercent =
    collectionTotal > 0 ? Math.round((collectionOwned / collectionTotal) * 100) : 0;

  // 計算今天是否可簽到
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let canCheckIn = true;
  if (profile?.last_check_in) {
    const lastCheckIn = new Date(profile.last_check_in);
    lastCheckIn.setHours(0, 0, 0, 0);
    canCheckIn = lastCheckIn.getTime() < today.getTime();
  }

  const quickLinks = [
    { label: "📚 圖鑑", href: "/collection" as const, color: "from-amber-500 to-orange-500" },
    { label: "📅 簽到", href: "/check-in" as const, color: "from-blue-500 to-cyan-500" },
    { label: "🎴 物品", href: "/items" as const, color: "from-purple-500 to-pink-500" },
    { label: "💳 付款", href: "/payments" as const, color: "from-green-500 to-emerald-500" },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* 頁面標題 */}
      <header>
        <h1 className="text-2xl font-semibold text-white/90">我的帳號</h1>
        <p className="mt-1 text-sm text-white/60">
          管理你的個人資料與查看帳號總覽
        </p>
      </header>

      {/* 統計卡片區 */}
      <div className="grid grid-cols-3 gap-4">
        {/* 簽到狀態 */}
        <Link
          href="/check-in"
          className="glass-card group p-4 text-center transition hover:border-blue-400/50"
        >
          <div className="text-2xl">📅</div>
          <p className="mt-2 text-xs uppercase tracking-wider text-white/50">
            連續簽到
          </p>
          <p className="mt-1 text-2xl font-bold text-white">
            {profile?.check_in_streak || 0}
            <span className="text-sm text-white/50"> 天</span>
          </p>
          {canCheckIn && (
            <span className="mt-2 inline-block rounded-full bg-blue-500/20 px-2 py-0.5 text-xs text-blue-300">
              今日可簽到
            </span>
          )}
        </Link>

        {/* 圖鑑進度 */}
        <Link
          href="/collection"
          className="glass-card group p-4 text-center transition hover:border-amber-400/50"
        >
          <div className="text-2xl">📚</div>
          <p className="mt-2 text-xs uppercase tracking-wider text-white/50">
            圖鑑進度
          </p>
          <p className="mt-1 text-2xl font-bold text-amber-400">
            {collectionOwned}
            <span className="text-sm text-white/50">/{collectionTotal}</span>
          </p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all"
              style={{ width: `${collectionPercent}%` }}
            />
          </div>
        </Link>

        {/* 資產估值 */}
        <Link
          href="/items"
          className="glass-card group p-4 text-center transition hover:border-green-400/50"
        >
          <div className="text-2xl">💰</div>
          <p className="mt-2 text-xs uppercase tracking-wider text-white/50">
            資產估值
          </p>
          <p className="mt-1 text-2xl font-bold text-green-400">
            ${totalValue.toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-white/40">
            {totalItems} 件物品
          </p>
        </Link>
      </div>

      {/* 幸運點數（如果有） */}
      {(profile?.fortune_points || 0) > 0 && (
        <div className="glass-card flex items-center justify-between p-4 mb-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🍀</span>
            <div>
              <p className="text-sm font-medium text-white">幸運點數</p>
              <p className="text-xs text-white/50">透過每日簽到累積</p>
            </div>
          </div>
          <p className="text-2xl font-bold text-amber-400">
            {profile?.fortune_points || 0}
          </p>
        </div>
      )}

      {/* 虛擬票券區塊 */}
      {((profile?.lottery_tickets || 0) > 0 || (profile?.blindbox_coupons || 0) > 0) && (
        <div className="flex flex-col gap-3 mb-3">
            {(profile?.lottery_tickets || 0) > 0 && (
            <div className="glass-card flex items-center justify-between p-4 border border-rose-500/30 bg-rose-500/5">
                <div className="flex items-center gap-3">
                <span className="text-2xl">🎟️</span>
                <div>
                    <p className="text-sm font-medium text-white">特選抽獎券</p>
                    <p className="text-xs text-white/50">可用於參與限定活動抽獎</p>
                </div>
                </div>
                <p className="text-2xl font-bold text-rose-400">
                {profile?.lottery_tickets || 0} <span className="text-sm font-normal text-rose-400/70">張</span>
                </p>
            </div>
            )}
            
            {(profile?.blindbox_coupons || 0) > 0 && (
            <div className="glass-card flex items-center justify-between p-4 border border-cyan-500/30 bg-cyan-500/5">
                <div className="flex items-center gap-3">
                <span className="text-2xl">🎫</span>
                <div>
                    <p className="text-sm font-medium text-white">$1000 盲盒抵用券</p>
                    <p className="text-xs text-white/50">購買精選盲盒時折抵使用</p>
                </div>
                </div>
                <p className="text-2xl font-bold text-cyan-400">
                {profile?.blindbox_coupons || 0} <span className="text-sm font-normal text-cyan-400/70">張</span>
                </p>
            </div>
            )}
        </div>
      )}

      {/* 快速入口 */}
      <div className="glass-card p-4">
        <h2 className="mb-3 text-sm font-medium text-white/70">快速入口</h2>
        <div className="grid grid-cols-4 gap-3">
          {quickLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-xl bg-gradient-to-br ${link.color} p-3 text-center text-sm font-medium text-white shadow-lg transition hover:scale-105 hover:shadow-xl`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>

      {/* 個人資料表單 */}
      <ProfileForm user={user} profile={profile} />
    </div>
  );
}
