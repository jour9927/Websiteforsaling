import { createServerSupabaseClient } from "@/lib/auth";
import Link from "next/link";
import { PersonalSpaceContent } from "@/components/PersonalSpaceContent";
import AuctionCard from "@/components/AuctionCard";
import { PopularityWidgetToggle } from "@/components/PopularityWidgetToggle";
import { MaintenanceToggle } from "@/components/MaintenanceToggle";
// [伊布集點日] 活動已結束
// import { EeveeDayWidget } from "@/components/EeveeDayWidget";
// [春節活動] 明年再啟用
// import { SpringFestivalBanner } from "@/components/SpringFestivalBanner";
import { Anniversary30thBanner } from "@/components/Anniversary30thBanner";
// import { Anniversary30thPreRegWidget } from "@/components/Anniversary30thPreRegWidget";
// 每次請求都重新執行，確保競標數據是最新的
export const dynamic = "force-dynamic";

// 熱門競標區塊元件
async function HotAuctionsSection() {
  const supabase = createServerSupabaseClient();

  const now = new Date().toISOString();

  const { data: allActive } = await supabase
    .from('auctions')
    .select('*, distributions(pokemon_name, pokemon_name_en, pokemon_sprite_url)')
    .eq('status', 'active')
    .lte('start_time', now)
    .gt('end_time', now)
    .order('end_time', { ascending: true })
    .limit(4);

  const auctions = allActive;
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

  // [30週年活動] 討論中，暫時隱藏
  // const { count: totalBoxCount } = await supabase
  //   .from("user_distributions")
  //   .select("*", { count: "exact", head: true });

  // 未登入用戶顯示登入引導頁 + 熱門競標
  if (!user) {
    return (
      <div className="flex flex-col gap-8 py-12">
        {/* 30週年預先報名 (已移除) */}

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

        {/* [春節活動] 明年再啟用 */}
        {/* <SpringFestivalBanner /> */}
        <Anniversary30thBanner />

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

  // 載入用戶的留言（顯示最近的留言，包含虛擬留言）
  const { createAdminSupabaseClient: createAdmin } = await import("@/lib/auth");
  const adminClient = createAdmin();
  const { data: rawComments } = await adminClient
    .from("profile_comments")
    .select("*")
    .eq("profile_user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  // 合併 commenter 資料（真實 + 虛擬）
  let comments = rawComments || [];
  if (rawComments && rawComments.length > 0) {
    // 查真實 commenter
    const commenterIds = [...new Set(rawComments.map(c => c.commenter_id).filter(Boolean))];
    const { data: profilesData } = commenterIds.length > 0
      ? await supabase.from("profiles").select("id, full_name").in("id", commenterIds)
      : { data: [] };

    // 查虛擬 commenter
    const virtualIds = [...new Set(rawComments.map(c => c.virtual_commenter_id).filter(Boolean))];
    const { data: virtualData } = virtualIds.length > 0
      ? await adminClient.from("virtual_profiles").select("id, display_name").in("id", virtualIds)
      : { data: [] };

    const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);
    const virtualMap = new Map(virtualData?.map(p => [p.id, p]) || []);

    comments = rawComments.map(comment => ({
      ...comment,
      commenter: profilesMap.get(comment.commenter_id) || null,
      virtual_commenter: virtualMap.get(comment.virtual_commenter_id) || null,
    }));
  }

  // 載入用戶收藏（用於統計）
  const { data: userItems } = await supabase
    .from("user_items")
    .select(`
      *,
      events (id, title, image_url, visual_card_url, estimated_value, series_tag)
    `)
    .eq("user_id", user.id);

  // 載入用戶參加紀錄
  const { data: userRegistrations } = await supabase
    .from("registrations")
    .select(`
      id, status, registered_at,
      events (id, title, image_url, visual_card_url, start_date, end_date, estimated_value)
    `)
    .eq("user_id", user.id)
    .eq("status", "confirmed")
    .order("registered_at", { ascending: false });

  // 載入配布圖鑑收藏（帶完整配布資料）
  const { data: userDistributions } = await supabase
    .from("user_distributions")
    .select("distribution_id, distributions(id, pokemon_name, pokemon_name_en, pokemon_sprite_url, points, generation, is_shiny, event_name, game_titles)")
    .eq("user_id", user.id);

  const distributionStats = {
    count: userDistributions?.length || 0,
    totalPoints: userDistributions?.reduce((sum, ud) => {
      const dist = Array.isArray(ud.distributions) ? ud.distributions[0] : ud.distributions;
      return sum + ((dist as { points?: number })?.points || 0);
    }, 0) || 0,
  };

  // 精選配布：按 points 最高取前 10 筆
  const topDistributions = (userDistributions || [])
    .map(ud => {
      const dist = Array.isArray(ud.distributions) ? ud.distributions[0] : ud.distributions;
      return dist as { id: string; pokemon_name: string; pokemon_name_en?: string; pokemon_sprite_url?: string; points?: number; generation: number; is_shiny?: boolean; event_name?: string; game_titles?: string[] } | null;
    })
    .filter((d): d is NonNullable<typeof d> => d !== null && (d.points || 0) > 0)
    .sort((a, b) => (b.points || 0) - (a.points || 0))
    .slice(0, 10);

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

  // 計算今日起始時間
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayISO = todayStart.toISOString();

  // 載入今日真實訪客（最多 10 位）
  const { data: realVisitorRows } = await supabase
    .from("profile_visits")
    .select("visitor:visitor_id (id, full_name, username)")
    .eq("profile_user_id", user.id)
    .not("visitor_id", "is", null)
    .gte("visited_at", todayISO)
    .order("visited_at", { ascending: false })
    .limit(10);

  // 載入今日 cron 虛擬訪客（如果 cron 有跑的話）
  const { data: cronVisitorRows } = await supabase
    .from("profile_visits")
    .select("virtual_visitor:virtual_visitor_id (id, display_name)")
    .eq("profile_user_id", user.id)
    .not("virtual_visitor_id", "is", null)
    .gte("visited_at", todayISO)
    .order("visited_at", { ascending: false })
    .limit(10);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const realVisitors = (realVisitorRows?.map((v: any) => v.visitor).filter(Boolean) || []).map((v: any) => ({
    ...v,
    isVirtual: false,
  }));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cronVisitors = (cronVisitorRows?.map((v: any) => v.virtual_visitor).filter(Boolean) || []).map((v: any) => ({
    id: v.id,
    full_name: v.display_name,
    username: null,
    isVirtual: true,
  }));

  // 如果 cron 沒有跑（沒有 DB 虛擬訪客），使用 server-side fallback
  // 從 virtual_profiles 表隨機挑選 2-5 位，用確定性 hash 保證同一天內一致
  let fallbackVisitors: { id: string; full_name: string; username: null; isVirtual: true }[] = [];
  if (cronVisitors.length === 0) {
    const { data: allVirtualProfiles } = await supabase
      .from("virtual_profiles")
      .select("id, display_name")
      .limit(20);

    if (allVirtualProfiles && allVirtualProfiles.length > 0) {
      // 確定性 hash：用戶 ID + 今日日期
      const todayKey = todayStart.toISOString().split('T')[0];
      let hash = 0;
      const seed = user.id + todayKey;
      for (let i = 0; i < seed.length; i++) {
        hash = ((hash << 5) - hash) + seed.charCodeAt(i);
        hash |= 0;
      }
      hash = Math.abs(hash);

      const count = 2 + (hash % 4); // 2-5 位
      // 用 hash 做確定性 shuffle
      const shuffled = [...allVirtualProfiles].sort((a, b) => {
        const ha = Math.abs(Math.sin(hash * a.id.charCodeAt(0)) * 10000);
        const hb = Math.abs(Math.sin(hash * b.id.charCodeAt(0)) * 10000);
        return ha - hb;
      });

      fallbackVisitors = shuffled.slice(0, count).map(vp => ({
        id: vp.id,
        full_name: vp.display_name,
        username: null,
        isVirtual: true as const,
      }));
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recentVisitors = [...realVisitors, ...cronVisitors, ...fallbackVisitors] as any;

  return (
    <div className="flex flex-col gap-8">
      {/* 管理員維護過罩開關 */}
      <MaintenanceToggle />

      {/* 30週年預先報名 (已移除) */}

      {/* [春節活動] 明年再啟用 */}
      {/* <SpringFestivalBanner /> */}
      <Anniversary30thBanner />

      {/* 熱門競標區塊 */}
      <HotAuctionsSection />

      {/* [伊布 Day] 活動已結束 */}
      {/* <EeveeDayWidget /> */}

      {/* 人氣排行榜小組件（可開關） */}
      <PopularityWidgetToggle />

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
        distributionStats={distributionStats}
        topDistributions={topDistributions}
        registrations={userRegistrations || []}
        recentVisitors={recentVisitors}
      />
    </div>
  );
}

