import { createServerSupabaseClient } from "@/lib/auth";
import Link from "next/link";
import { PersonalSpaceContent } from "@/components/PersonalSpaceContent";
import AuctionCard from "@/components/AuctionCard";
import { PopularityWidgetToggle } from "@/components/PopularityWidgetToggle";
import { MySocialStats } from "@/components/MySocialStats";
import { MaintenanceToggle } from "@/components/MaintenanceToggle";

// 每次請求都重新執行，確保競標數據是最新的
export const dynamic = "force-dynamic";

// 熱門競標區塊元件
async function HotAuctionsSection() {
  const supabase = createServerSupabaseClient();

  const { data: auctions } = await supabase
    .from('auctions')
    .select('*, distributions(pokemon_name, pokemon_name_en, pokemon_sprite_url)')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(4);

  if (!auctions || auctions.length === 0) return null;

  return (
    <section className="glass-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-white/90">
          <span className="inline-block h-2 w-2 rounded-full bg-red-400 animate-pulse"></span>
          🔥 熱門競標
        </h2>
        <Link
          href="/auctions"
          className="text-sm text-white/60 hover:text-white transition"
        >
          查看更多 →
        </Link>
      </div>
      {/* 橫向滑動容器 - 增加間距給 hover 放大效果留空間 */}
      <div className="flex gap-6 overflow-x-auto overflow-y-visible py-3 snap-x snap-mandatory scrollbar-hide -mx-4 px-4">
        {auctions.map((auction) => (
          <div
            key={auction.id}
            className="flex-shrink-0 w-[280px] snap-start"
          >
            <AuctionCard auction={auction} />
          </div>
        ))}
      </div>
      {/* 滑動提示 */}
      <p className="text-xs text-white/40 text-center mt-2">← 左右滑動查看更多 →</p>
    </section>
  );
}

export default async function HomePage() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 未登入用戶顯示登入引導頁 + 熱門競標
  if (!user) {
    return (
      <div className="flex flex-col gap-8 py-12">
        <section className="glass-card max-w-lg mx-auto p-8 text-center">
          <p className="text-sm uppercase tracking-[0.35em] text-slate-200">Event Glass</p>
          <h1 className="mt-3 text-4xl font-semibold md:text-5xl">個人空間</h1>
          <p className="mt-4 text-base text-slate-200">
            打造專屬你的收藏展示間，與社群成員互動交流。
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/login"
              className="rounded-full bg-white/20 px-6 py-2 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/30"
            >
              登入查看
            </Link>
            <Link
              href="/signup"
              className="rounded-full border border-white/40 px-6 py-2 text-sm font-semibold text-white/90 transition hover:bg-white/10"
            >
              立即註冊
            </Link>
          </div>
        </section>

        {/* 熱門競標區塊 */}
        <HotAuctionsSection />
      </div>
    );
  }

  // 載入用戶資料
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // 載入用戶的願望清單
  const { data: wishlists } = await supabase
    .from("wishlists")
    .select(`
      *,
      events (id, title, image_url, visual_card_url, estimated_value)
    `)
    .eq("user_id", user.id)
    .order("priority", { ascending: false });

  // 載入用戶的留言（顯示最近的留言）
  // 先查詢基本留言資料，不使用 join（避免 Server Component 中的 JOIN 語法問題）
  const { data: rawComments } = await supabase
    .from("profile_comments")
    .select("*")
    .eq("profile_user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  // 如果有留言，查詢對應的 commenter profiles
  let comments = rawComments || [];
  if (rawComments && rawComments.length > 0) {
    const commenterIds = [...new Set(rawComments.map(c => c.commenter_id).filter(Boolean))];
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", commenterIds);

    // 手動合併 commenter 資料
    const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);
    comments = rawComments.map(comment => ({
      ...comment,
      commenter: profilesMap.get(comment.commenter_id) || null
    }));
  }

  // 載入用戶收藏（用於精選展示）
  const { data: userItems } = await supabase
    .from("user_items")
    .select(`
      *,
      events (id, title, image_url, visual_card_url, estimated_value, series_tag)
    `)
    .eq("user_id", user.id);

  // 載入所有可願望的活動
  const { data: allEvents } = await supabase
    .from("events")
    .select("id, title, image_url, visual_card_url, estimated_value")
    .eq("status", "published")
    .order("created_at", { ascending: false });

  // 載入公眾形象名
  const { data: publicImage } = await supabase
    .from("public_images")
    .select("nickname, approval_rate")
    .eq("user_id", user.id)
    .single();

  // 載入公眾認知
  const { data: publicPerceptions } = await supabase
    .from("public_perceptions")
    .select("id, content, agree_rate, disagree_rate, participation_rate")
    .eq("user_id", user.id)
    .order("sort_order");

  return (
    <div className="flex flex-col gap-8">
      {/* 管理員維護過罩開關 */}
      <MaintenanceToggle />

      {/* 熱門競標區塊 */}
      <HotAuctionsSection />

      {/* 人氣排行榜小組件（可開關） */}
      <PopularityWidgetToggle />

      {/* 我的社交統計 */}
      <div className="glass-card p-4">
        <h3 className="text-sm font-medium text-white/60 mb-3">📊 我的社交數據</h3>
        <MySocialStats userId={user.id} />
      </div>

      {/* 個人空間內容 */}
      <PersonalSpaceContent
        user={user}
        profile={profile}
        wishlists={wishlists || []}
        comments={comments || []}
        userItems={userItems || []}
        allEvents={allEvents || []}
        isOwnProfile={true}
        currentUserId={user.id}
        publicImage={publicImage}
        publicPerceptions={publicPerceptions || []}
      />
    </div>
  );
}

