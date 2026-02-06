import { createServerSupabaseClient } from "@/lib/auth";
import Link from "next/link";
import { PersonalSpaceContent } from "@/components/PersonalSpaceContent";
import AuctionCard from "@/components/AuctionCard";

export const dynamic = "force-dynamic";

// 熱門競標區塊元件
async function HotAuctionsSection() {
  const supabase = createServerSupabaseClient();

  const { data: auctions } = await supabase
    .from('auctions')
    .select('*, distributions(pokemon_name, pokemon_name_en, pokemon_sprite_url)')
    .eq('status', 'active')
    .order('bid_count', { ascending: false })
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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {auctions.map((auction) => (
          <AuctionCard key={auction.id} auction={auction} />
        ))}
      </div>
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

  // 載入用戶的留言
  const { data: comments } = await supabase
    .from("profile_comments")
    .select(`
      *,
      commenter:commenter_id (id, full_name)
    `)
    .eq("profile_user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10);

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

  return (
    <div className="flex flex-col gap-8">
      {/* 熱門競標區塊 */}
      <HotAuctionsSection />

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
      />
    </div>
  );
}

