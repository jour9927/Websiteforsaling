import { createServerSupabaseClient } from "@/lib/auth";
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

// 虛擬用戶完整頁面元件（與真實用戶一樣豐富）
function VirtualUserPage({ profile, virtualId, featuredEvents }: {
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
    featuredEvents: Array<{
        id: string;
        title: string;
        image_url: string | null;
        visual_card_url: string | null;
    }>;
}) {
    // 假的願望清單
    const fakeWishlists = featuredEvents.slice(0, 3).map((event, index) => ({
        id: `wish-${index}`,
        title: event.title,
        image: event.visual_card_url || event.image_url,
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

            {/* 精選收藏展示 */}
            <section className="glass-card p-6">
                <h2 className="mb-4 text-lg font-semibold text-white">🏆 精選收藏</h2>
                {featuredEvents.length > 0 ? (
                    <div className="grid grid-cols-5 gap-3 md:grid-cols-10">
                        {featuredEvents.slice(0, 10).map((event, index) => {
                            const imageUrl = event.visual_card_url || event.image_url;
                            return (
                                <div
                                    key={event.id}
                                    className="group relative aspect-square overflow-hidden rounded-lg bg-white/10"
                                >
                                    {imageUrl ? (
                                        <Image
                                            src={imageUrl}
                                            alt={event.title || "收藏"}
                                            fill
                                            className="object-cover transition group-hover:scale-110"
                                        />
                                    ) : (
                                        <div className="flex h-full items-center justify-center text-2xl">
                                            🎴
                                        </div>
                                    )}
                                    <div className="absolute left-1 top-1 rounded-full bg-black/50 px-1.5 text-xs text-white">
                                        #{index + 1}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <p className="text-center text-white/50">尚未有收藏</p>
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

            {/* 留言區 */}
            <section className="glass-card p-6">
                <h2 className="mb-4 text-lg font-semibold text-white">💬 留言區</h2>

                {/* 留言列表 */}
                <div className="space-y-3">
                    {fakeComments.map((comment) => (
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

                {/* 提示訊息 */}
                <p className="mt-4 text-center text-xs text-white/40">此會員尚未開放留言功能</p>
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
            // 是虛擬用戶，抓取活動作為精選收藏
            const { data: events } = await supabase
                .from("events")
                .select("id, title, image_url, visual_card_url")
                .eq("status", "published")
                .order("created_at", { ascending: false })
                .limit(10);

            return <VirtualUserPage virtualId={idOrUsername} profile={virtualProfile} featuredEvents={events || []} />;
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

    // 載入目標用戶的留言
    const { data: comments } = await supabase
        .from("profile_comments")
        .select(`
      *,
      commenter:commenter_id (id, full_name)
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

    // 載入所有可願望的活動（如果是自己的頁面才需要）
    const { data: allEvents } = await supabase
        .from("events")
        .select("id, title, image_url, visual_card_url, estimated_value")
        .eq("status", "published")
        .order("created_at", { ascending: false });

    // 載入最近訪客（最多 10 位）
    const { data: recentVisitors } = await supabase
        .from("profile_visits")
        .select(`
            visitor:visitor_id (id, full_name, username)
        `)
        .eq("profile_user_id", userId)
        .order("visited_at", { ascending: false })
        .limit(10);

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
            recentVisitors={
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (recentVisitors?.map((v: any) => v.visitor).filter(Boolean) || []) as any
            }
        />
    );
}
