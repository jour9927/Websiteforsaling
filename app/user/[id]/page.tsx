import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/auth";
import { notFound } from "next/navigation";
import { PersonalSpaceContent } from "@/components/PersonalSpaceContent";
import Link from "next/link";
import Image from "next/image";
import { SocialStats } from "@/components/SocialStats";

export const dynamic = "force-dynamic";

type Props = {
    params: Promise<{ id: string }>;
};

// 檢查是否為 UUID 格式
function isUUID(str: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

// 確保色違寶可夢使用正確的 shiny sprite URL
function getSpriteUrl(dist: { pokemon_sprite_url?: string; is_shiny?: boolean }): string | undefined {
    if (!dist.pokemon_sprite_url) return undefined;
    if (dist.is_shiny && !dist.pokemon_sprite_url.includes('/shiny/')) {
        return dist.pokemon_sprite_url.replace('/sprites/pokemon/', '/sprites/pokemon/shiny/');
    }
    return dist.pokemon_sprite_url;
}

type FeaturedDist = {
    id: string;
    pokemon_name: string;
    pokemon_name_en?: string;
    pokemon_sprite_url?: string;
    points?: number;
    generation: number;
    is_shiny?: boolean;
    event_name?: string;
};

// 虛擬用戶完整頁面元件（與真實用戶一樣豐富）
function VirtualUserPage({ profile, virtualId, featuredDistributions }: {
    virtualId: string;
    profile: {
        display_name: string;
        member_since: string;
        collection_count: number;
        bid_count: number;
        avatar_seed: string;
        bio?: string;
        pokemon_first_game?: string;
        total_value?: number;
        total_views?: number;
        today_views?: number;
        popularity_score?: number;
        followers_count?: number;
    };
    featuredDistributions: FeaturedDist[];
}) {
    // 假的願望清單（用配布寶可夢）
    const fakeWishlists = featuredDistributions.slice(0, 3).map((dist, index) => ({
        id: `wish-${index}`,
        title: dist.pokemon_name,
        image: getSpriteUrl(dist) || null,
        note: ['超想要！', '夢寐以求', '求收'][index] || null
    }));

    // 假的留言
    const fakeComments = [
        { id: 'c1', name: '訪客A', content: '收藏好漂亮！', time: '2天前' },
        { id: 'c2', name: '訪客B', content: '大佬帶帶我 🙏', time: '5天前' },
        { id: 'c3', name: '路人C', content: '什麼時候再上新的？', time: '1週前' },
    ];

    return (
        <div className="space-y-8">
            {/* 個人資料卡 */}
            <section className="glass-card p-6">
                <div className="flex flex-col gap-6 md:flex-row md:items-start">
                    {/* 頭像 */}
                    <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-3xl font-bold text-white shadow-lg">
                        {profile.display_name.slice(0, 2).toUpperCase()}
                    </div>

                    {/* 資訊 */}
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold text-white">
                            {profile.display_name}
                        </h1>
                        <p className="mt-1 text-sm text-white/60">會員</p>

                        {profile.bio && (
                            <p className="mt-3 text-sm text-white/80">{profile.bio}</p>
                        )}

                        <div className="mt-4 flex flex-wrap gap-4 text-sm">
                            {profile.pokemon_first_game && (
                                <div className="rounded-lg bg-white/10 px-3 py-2">
                                    <span className="text-white/60">首玩遊戲</span>
                                    <span className="ml-2 font-semibold text-amber-400">
                                        {profile.pokemon_first_game}
                                    </span>
                                </div>
                            )}
                            <div className="rounded-lg bg-white/10 px-3 py-2">
                                <span className="text-white/60">加入日期</span>
                                <span className="ml-2 font-semibold text-white">
                                    {new Date(profile.member_since).toLocaleDateString("zh-TW")}
                                </span>
                            </div>
                            <div className="rounded-lg bg-white/10 px-3 py-2">
                                <span className="text-white/60">收藏數量</span>
                                <span className="ml-2 font-semibold text-green-400">{profile.collection_count}</span>
                            </div>
                            <div className="rounded-lg bg-white/10 px-3 py-2">
                                <span className="text-white/60">資產估值</span>
                                <span className="ml-2 font-semibold text-amber-400">
                                    ${(profile.total_value || profile.collection_count * 150).toLocaleString()}
                                </span>
                            </div>
                        </div>

                        {/* 訪問統計 */}
                        <div className="mt-4 pt-4 border-t border-white/10">
                            <div className="grid grid-cols-2 gap-3 mb-4">
                                <div className="rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 p-3 text-center">
                                    <p className="text-2xl font-bold text-blue-400">{profile.total_views || 87}</p>
                                    <p className="text-xs text-white/50 mt-1">👁️ 歷史總瀏覽量</p>
                                </div>
                                <div className="rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 p-3 text-center">
                                    <p className="text-2xl font-bold text-green-400">{profile.today_views || 3}</p>
                                    <p className="text-xs text-white/50 mt-1">✨ 今日訪問</p>
                                </div>
                            </div>
                        </div>

                        {/* 社交統計與互動按鈕 */}
                        <div className="mt-4 pt-4 border-t border-white/10">
                            <SocialStats
                                virtualId={virtualId}
                                initialFollowers={profile.followers_count || 0}
                                initialPopularity={profile.popularity_score || 0}
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* 精選收藏展示：配布寶可夢貴重程度前 10 名 */}
            <section className="glass-card p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-white">🏆 精選收藏</h2>
                    <Link
                        href="/pokedex"
                        className="text-sm text-white/60 hover:text-white transition"
                    >
                        查看配布圖鑑 →
                    </Link>
                </div>
                {featuredDistributions.length > 0 ? (
                    <div className="grid grid-cols-5 gap-3 md:grid-cols-10">
                        {featuredDistributions.map((dist, index) => {
                            const spriteUrl = getSpriteUrl(dist);
                            return (
                                <div
                                    key={dist.id}
                                    className="group relative aspect-square overflow-hidden rounded-xl bg-white/10 ring-1 ring-white/10 hover:ring-amber-400/50 transition-all"
                                >
                                    {spriteUrl ? (
                                        <Image
                                            src={spriteUrl}
                                            alt={dist.pokemon_name}
                                            fill
                                            className="object-contain p-1 transition group-hover:scale-110"
                                        />
                                    ) : (
                                        <div className="flex h-full items-center justify-center text-2xl">🐾</div>
                                    )}
                                    {/* 排名徽章 */}
                                    <div className={`absolute left-1 top-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${index === 0 ? "bg-amber-500 text-black" :
                                        index === 1 ? "bg-gray-300 text-black" :
                                            index === 2 ? "bg-amber-700 text-white" :
                                                "bg-black/60 text-amber-300"
                                        }`}>
                                        #{index + 1}
                                    </div>
                                    {/* 異色標記 */}
                                    {dist.is_shiny && (
                                        <div className="absolute right-1 top-1 text-[12px]">✨</div>
                                    )}
                                    {/* Hover overlay */}
                                    <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/80 via-black/30 to-transparent p-1.5 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                                        <p className="truncate text-[10px] font-medium text-white leading-tight">{dist.pokemon_name}</p>
                                        {(dist.points || 0) > 0 && (
                                            <p className="text-[9px] text-amber-400 font-semibold">{(dist.points || 0).toLocaleString()} pts</p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <p className="text-center text-white/50">尚未收集配布寶可夢</p>
                )}
            </section>

            {/* 願望清單 */}
            <section className="glass-card p-6">
                <h2 className="mb-4 text-lg font-semibold text-white">💫 願望清單</h2>
                {fakeWishlists.length > 0 ? (
                    <div className="space-y-2">
                        {fakeWishlists.map((wish) => (
                            <div key={wish.id} className="flex items-center gap-3 rounded-lg bg-white/10 p-3">
                                <div className="relative h-12 w-12 overflow-hidden rounded bg-white/10">
                                    {wish.image ? (
                                        <Image
                                            src={wish.image}
                                            alt={wish.title}
                                            fill
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="flex h-full items-center justify-center">🎴</div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-white truncate">
                                        {wish.title}
                                    </p>
                                    {wish.note && (
                                        <p className="text-xs text-white/50 truncate">{wish.note}</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-center text-white/50">尚未設定願望清單</p>
                )}
            </section>

            {/* 留言區 - 隱私模式 */}
            <section className="glass-card p-6 relative overflow-hidden">
                <h2 className="mb-4 text-lg font-semibold text-white">💬 留言區</h2>

                {/* 模糊的假留言背景 */}
                <div className="space-y-3 blur-sm select-none pointer-events-none">
                    {fakeComments.slice(0, 2).map((comment) => (
                        <div key={comment.id} className="flex gap-3 rounded-lg bg-white/5 p-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-purple-500 text-sm font-bold text-white">
                                {comment.name.slice(0, 1).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-sm font-medium text-white truncate">
                                        {comment.name}
                                    </span>
                                    <span className="text-xs text-white/40 shrink-0">
                                        {comment.time}
                                    </span>
                                </div>
                                <p className="mt-1 text-sm text-white/80 break-words">{comment.content}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* 隱私遮罩 */}
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-t from-slate-900/95 via-slate-900/90 to-slate-900/80 backdrop-blur-[2px]">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10 mb-4">
                        <span className="text-3xl">🔒</span>
                    </div>
                    <p className="text-lg font-medium text-white">對方已開啟隱私模式</p>
                    <p className="mt-1 text-sm text-white/50">留言區僅對好友開放</p>
                </div>
            </section>

            {/* 返回連結 */}
            <div className="text-center">
                <Link
                    href="/auctions"
                    className="inline-block text-sm text-white/50 hover:text-white/80 transition"
                >
                    ← 返回競標區
                </Link>
            </div>
        </div>
    );
}

export default async function UserProfilePage({ params }: Props) {
    const { id: idOrUsername } = await params;
    const supabase = createServerSupabaseClient();

    // 取得當前登入用戶
    const {
        data: { user: currentUser },
    } = await supabase.auth.getUser();

    // 先檢查是否為虛擬用戶
    if (isUUID(idOrUsername)) {
        const { data: virtualProfile } = await supabase
            .from("virtual_profiles")
            .select("*")
            .eq("id", idOrUsername)
            .single();

        if (virtualProfile) {
            // 是虛擬用戶，抽取隨機配布寶可夢作為精選收藏
            // 用 virtualId 的 hash 作為種子，確保同一虛擬用戶每次看到的配布相同
            const { data: allDists } = await supabase
                .from("distributions")
                .select("id, pokemon_name, pokemon_name_en, pokemon_sprite_url, points, generation, is_shiny, event_name")
                .gt("points", 0)
                .order("points", { ascending: false });

            // 確定性隨機：用 virtualId 生成種子
            const seed = idOrUsername.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
            const shuffled = (allDists || []).map((d, i) => ({ d, sort: Math.sin(seed * (i + 1)) }));
            shuffled.sort((a, b) => a.sort - b.sort);
            const featured = shuffled.slice(0, 10).map(s => s.d)
                .sort((a, b) => (b.points || 0) - (a.points || 0));

            return <VirtualUserPage virtualId={idOrUsername} profile={virtualProfile} featuredDistributions={featured} />;
        }
    }

    // 根據 UUID 或 username 查詢真實用戶
    let targetProfile;
    if (isUUID(idOrUsername)) {
        const { data } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", idOrUsername)
            .single();
        targetProfile = data;
    } else {
        const { data } = await supabase
            .from("profiles")
            .select("*")
            .eq("username", idOrUsername.toLowerCase())
            .single();
        targetProfile = data;
    }

    if (!targetProfile) {
        notFound();
    }

    const userId = targetProfile.id;

    // 記錄訪問（如果是登入用戶且不是訪問自己）
    if (currentUser && currentUser.id !== userId) {
        // 更新訪問統計
        const today = new Date().toISOString().split('T')[0];

        // 檢查是否需要重置今日訪問數
        if (targetProfile.last_view_reset !== today) {
            await supabase
                .from("profiles")
                .update({
                    today_views: 1,
                    total_views: (targetProfile.total_views || 0) + 1,
                    last_view_reset: today
                })
                .eq("id", userId);
        } else {
            await supabase
                .from("profiles")
                .update({
                    today_views: (targetProfile.today_views || 0) + 1,
                    total_views: (targetProfile.total_views || 0) + 1
                })
                .eq("id", userId);
        }

        // 記錄訪客（用於顯示最近訪客頭像）
        await supabase
            .from("profile_visits")
            .upsert({
                profile_user_id: userId,
                visitor_id: currentUser.id,
                visited_at: new Date().toISOString(),
            }, {
                onConflict: 'profile_user_id,visitor_id'
            });
    }

    // 載入目標用戶的願望清單
    const { data: wishlists } = await supabase
        .from("wishlists")
        .select(`
      *,
      events (id, title, image_url, visual_card_url, estimated_value)
    `)
        .eq("user_id", userId)
        .order("priority", { ascending: false });

    // Admin client 繞過 RLS（用於配布和留言查詢）
    const adminSupabase = createAdminSupabaseClient();

    // 載入目標用戶的留言（包含真實 + 虛擬留言）
    const { data: comments } = await adminSupabase
        .from("profile_comments")
        .select(`
      *,
      commenter:commenter_id (id, full_name),
      virtual_commenter:virtual_commenter_id (id, display_name)
    `)
        .eq("profile_user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20);

    // 載入目標用戶收藏
    const { data: userItems } = await supabase
        .from("user_items")
        .select(`
      *,
      events (id, title, image_url, visual_card_url, estimated_value, series_tag)
    `)
        .eq("user_id", userId);

    // 載入用戶參加紀錄
    const { data: userRegistrations } = await supabase
        .from("registrations")
        .select(`
      id, status, registered_at,
      events (id, title, image_url, visual_card_url, start_date, end_date, estimated_value)
    `)
        .eq("user_id", userId)
        .eq("status", "confirmed")
        .order("registered_at", { ascending: false });

    // 載入配布圖鑑收藏（用 admin client 繞過 RLS，讓其他人也能看到收藏）
    const { data: userDistributions } = await adminSupabase
        .from("user_distributions")
        .select("distribution_id, distributions(id, pokemon_name, pokemon_name_en, pokemon_sprite_url, points, generation, is_shiny, event_name, game_titles)")
        .eq("user_id", userId);

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

    // 載入所有可願望的活動（如果是自己的頁面才需要）
    const { data: allEvents } = await supabase
        .from("events")
        .select("id, title, image_url, visual_card_url, estimated_value")
        .eq("status", "published")
        .order("created_at", { ascending: false });

    // 計算今日起始時間
    const todayStartDate = new Date();
    todayStartDate.setHours(0, 0, 0, 0);
    const todayISOStr = todayStartDate.toISOString();

    // 載入今日真實訪客（最多 10 位）
    const { data: realVisitorRows } = await supabase
        .from("profile_visits")
        .select("visitor:visitor_id (id, full_name, username)")
        .eq("profile_user_id", userId)
        .not("visitor_id", "is", null)
        .gte("visited_at", todayISOStr)
        .order("visited_at", { ascending: false })
        .limit(10);

    // 載入今日 cron 虛擬訪客（如果 cron 有跑的話）
    const { data: cronVisitorRows } = await supabase
        .from("profile_visits")
        .select("virtual_visitor:virtual_visitor_id (id, display_name)")
        .eq("profile_user_id", userId)
        .not("virtual_visitor_id", "is", null)
        .gte("visited_at", todayISOStr)
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

    // 如果 cron 沒有跑，使用 server-side fallback（從 virtual_profiles 表隨機挑選）
    let fallbackVisitors: { id: string; full_name: string; username: null; isVirtual: true }[] = [];
    if (cronVisitors.length === 0) {
        const { data: allVirtualProfiles } = await supabase
            .from("virtual_profiles")
            .select("id, display_name")
            .limit(20);

        if (allVirtualProfiles && allVirtualProfiles.length > 0) {
            const todayKey = todayStartDate.toISOString().split('T')[0];
            let hash = 0;
            const seed = userId + todayKey;
            for (let i = 0; i < seed.length; i++) {
                hash = ((hash << 5) - hash) + seed.charCodeAt(i);
                hash |= 0;
            }
            hash = Math.abs(hash);

            const count = 2 + (hash % 4);
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

    const recentVisitors = [...realVisitors, ...cronVisitors, ...fallbackVisitors];

    // 建立虛擬用戶物件給 PersonalSpaceContent
    const targetUser = {
        id: userId,
        email: targetProfile.email || undefined,
    };

    const isOwnProfile = currentUser?.id === userId;

    return (
        <PersonalSpaceContent
            user={targetUser}
            profile={targetProfile}
            wishlists={wishlists || []}
            comments={comments || []}
            userItems={userItems || []}
            allEvents={allEvents || []}
            isOwnProfile={isOwnProfile}
            currentUserId={currentUser?.id}
            recentVisitors={recentVisitors}
            distributionStats={distributionStats}
            topDistributions={topDistributions}
            registrations={userRegistrations || []}
        />
    );
}
