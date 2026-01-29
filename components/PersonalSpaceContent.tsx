"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

type Event = {
    id: string;
    title: string;
    image_url: string | null;
    visual_card_url: string | null;
    estimated_value: number | null;
    series_tag?: string | null;
};

type UserItem = {
    id: string;
    quantity: number;
    events: Event | Event[] | null;
};

type Wishlist = {
    id: string;
    event_id: string;
    priority: number;
    note: string | null;
    events: Event | Event[] | null;
};

type Comment = {
    id: string;
    content: string;
    created_at: string;
    commenter: { id: string; full_name: string | null } | null;
};

type Profile = {
    id: string;
    full_name: string | null;
    pokemon_first_year: number | null;
    bio: string | null;
    featured_items: string[] | null;
    created_at: string;
    role: string;
};

type User = {
    id: string;
    email?: string;
};

type PersonalSpaceContentProps = {
    user: User;
    profile: Profile | null;
    wishlists: Wishlist[];
    comments: Comment[];
    userItems: UserItem[];
    allEvents: Event[];
    isOwnProfile: boolean;
    currentUserId?: string;
};

export function PersonalSpaceContent({
    user,
    profile,
    wishlists,
    comments,
    userItems,
    allEvents,
    isOwnProfile,
    currentUserId,
}: PersonalSpaceContentProps) {
    const router = useRouter();
    const [newComment, setNewComment] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showWishlistModal, setShowWishlistModal] = useState(false);

    // 寶可夢本傳遊戲列表
    const pokemonGames: Record<number, string> = {
        2022: "朱/紫",
        2021: "晶燦鑽石/明亮珍珠",
        2019: "劍/盾",
        2018: "Let's Go 皮卡丘/伊布",
        2017: "究極之日/究極之月",
        2016: "太陽/月亮",
        2014: "終極紅寶石/始源藍寶石",
        2013: "X/Y",
        2012: "黑2/白2",
        2010: "黑/白",
        2009: "心金/魂銀",
        2008: "白金",
        2006: "鑽石/珍珠",
        2004: "火紅/葉綠",
        2002: "紅寶石/藍寶石",
        2000: "水晶",
        1999: "金/銀",
        1998: "皮卡丘",
        1996: "紅/綠/藍",
    };

    const getGameName = (year: number) => pokemonGames[year] || `${year}年`;

    // 計算統計資料
    const totalItems = userItems.reduce((sum, item) => sum + item.quantity, 0);
    const totalValue = userItems.reduce((sum, item) => {
        const event = Array.isArray(item.events) ? item.events[0] : item.events;
        return sum + (event?.estimated_value || 0) * item.quantity;
    }, 0);

    // 取得精選展示的收藏
    const featuredItems = userItems.slice(0, 10);

    // 提交留言
    const handleSubmitComment = async () => {
        const commenterId = currentUserId || user.id;
        if (!newComment.trim() || !commenterId) return;
        setIsSubmitting(true);

        const { error } = await supabase.from("profile_comments").insert({
            profile_user_id: profile?.id || user.id,
            commenter_id: commenterId,
            content: newComment.trim(),
        });

        if (!error) {
            setNewComment("");
            router.refresh();
        }
        setIsSubmitting(false);
    };

    // 新增願望清單
    const handleAddWishlist = async (eventId: string) => {
        const { error } = await supabase.from("wishlists").insert({
            user_id: user.id,
            event_id: eventId,
            priority: wishlists.length,
        });

        if (!error) {
            setShowWishlistModal(false);
            router.refresh();
        }
    };

    // 刪除願望清單項目
    const handleRemoveWishlist = async (id: string) => {
        await supabase.from("wishlists").delete().eq("id", id);
        router.refresh();
    };

    return (
        <div className="space-y-8">
            {/* 個人資料卡 */}
            <section className="glass-card p-6">
                <div className="flex flex-col gap-6 md:flex-row md:items-start">
                    {/* 頭像 */}
                    <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-3xl font-bold text-white shadow-lg">
                        {(profile?.full_name || user.email || "U").slice(0, 2).toUpperCase()}
                    </div>

                    {/* 資訊 */}
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold text-white">
                            {profile?.full_name || "未設定名稱"}
                        </h1>
                        <p className="mt-1 text-sm text-white/60">{user.email}</p>

                        {profile?.bio && (
                            <p className="mt-3 text-sm text-white/80">{profile.bio}</p>
                        )}

                        <div className="mt-4 flex flex-wrap gap-4 text-sm">
                            {profile?.pokemon_first_year && (
                                <div className="rounded-lg bg-white/10 px-3 py-2">
                                    <span className="text-white/60">首玩遊戲</span>
                                    <span className="ml-2 font-semibold text-amber-400">
                                        {getGameName(profile.pokemon_first_year)}
                                    </span>
                                </div>
                            )}
                            <div className="rounded-lg bg-white/10 px-3 py-2">
                                <span className="text-white/60">加入日期</span>
                                <span className="ml-2 font-semibold text-white">
                                    {new Date(profile?.created_at || Date.now()).toLocaleDateString("zh-TW")}
                                </span>
                            </div>
                            <div className="rounded-lg bg-white/10 px-3 py-2">
                                <span className="text-white/60">收藏數量</span>
                                <span className="ml-2 font-semibold text-green-400">{totalItems}</span>
                            </div>
                            <div className="rounded-lg bg-white/10 px-3 py-2">
                                <span className="text-white/60">資產估值</span>
                                <span className="ml-2 font-semibold text-amber-400">
                                    ${totalValue.toLocaleString()}
                                </span>
                            </div>
                        </div>

                        {isOwnProfile && (
                            <Link
                                href="/profile"
                                className="mt-4 inline-block rounded-lg bg-white/10 px-4 py-2 text-sm text-white/80 transition hover:bg-white/20"
                            >
                                編輯個人資料
                            </Link>
                        )}
                    </div>
                </div>
            </section>

            {/* 精選收藏展示 */}
            <section className="glass-card p-6">
                <h2 className="mb-4 text-lg font-semibold text-white">🏆 精選收藏</h2>
                {featuredItems.length > 0 ? (
                    <div className="grid grid-cols-5 gap-3 md:grid-cols-10">
                        {featuredItems.map((item, index) => {
                            const event = Array.isArray(item.events) ? item.events[0] : item.events;
                            const imageUrl = event?.visual_card_url || event?.image_url;
                            return (
                                <div
                                    key={item.id}
                                    className="group relative aspect-square overflow-hidden rounded-lg bg-white/10"
                                >
                                    {imageUrl ? (
                                        <Image
                                            src={imageUrl}
                                            alt={event?.title || "收藏"}
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
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-white">💫 願望清單</h2>
                    {isOwnProfile && (
                        <button
                            onClick={() => setShowWishlistModal(true)}
                            className="rounded-lg bg-amber-500/20 px-3 py-1.5 text-sm text-amber-200 transition hover:bg-amber-500/30"
                        >
                            + 新增願望
                        </button>
                    )}
                </div>
                {wishlists.length > 0 ? (
                    <div className="grid gap-3 md:grid-cols-2">
                        {wishlists.map((wish) => {
                            const event = Array.isArray(wish.events) ? wish.events[0] : wish.events;
                            const imageUrl = event?.visual_card_url || event?.image_url;
                            return (
                                <div
                                    key={wish.id}
                                    className="flex items-center gap-3 rounded-lg bg-white/5 p-3"
                                >
                                    <div className="relative h-12 w-12 overflow-hidden rounded-lg bg-white/10">
                                        {imageUrl ? (
                                            <Image src={imageUrl} alt={event?.title || ""} fill className="object-cover" />
                                        ) : (
                                            <div className="flex h-full items-center justify-center">✨</div>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium text-white">{event?.title || "未知"}</p>
                                        {wish.note && <p className="text-xs text-white/50">{wish.note}</p>}
                                    </div>
                                    {isOwnProfile && (
                                        <button
                                            onClick={() => handleRemoveWishlist(wish.id)}
                                            className="text-red-400 hover:text-red-300"
                                        >
                                            ✕
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <p className="text-center text-white/50">尚未設定願望清單</p>
                )}
            </section>

            {/* 留言區 */}
            <section className="glass-card p-6">
                <h2 className="mb-4 text-lg font-semibold text-white">💬 留言區</h2>

                {/* 留言輸入 */}
                <div className="mb-4 flex gap-2">
                    <input
                        type="text"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="留下一則訊息..."
                        className="flex-1 rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none"
                    />
                    <button
                        onClick={handleSubmitComment}
                        disabled={isSubmitting || !newComment.trim()}
                        className="rounded-lg bg-blue-500/20 px-4 py-2 text-sm text-blue-200 transition hover:bg-blue-500/30 disabled:opacity-50"
                    >
                        發送
                    </button>
                </div>

                {/* 留言列表 */}
                {comments.length > 0 ? (
                    <div className="space-y-3">
                        {comments.map((comment) => (
                            <div key={comment.id} className="rounded-lg bg-white/5 p-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-white">
                                        {comment.commenter?.full_name || "匿名"}
                                    </span>
                                    <span className="text-xs text-white/40">
                                        {new Date(comment.created_at).toLocaleDateString("zh-TW")}
                                    </span>
                                </div>
                                <p className="mt-1 text-sm text-white/80">{comment.content}</p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-center text-white/50">還沒有留言，成為第一個留言的人吧！</p>
                )}
            </section>

            {/* 願望清單 Modal */}
            {showWishlistModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="glass-card max-h-[80vh] w-full max-w-md overflow-y-auto p-6">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-white">選擇願望</h3>
                            <button
                                onClick={() => setShowWishlistModal(false)}
                                className="text-white/60 hover:text-white"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="space-y-2">
                            {allEvents
                                .filter((e) => !wishlists.some((w) => w.event_id === e.id))
                                .map((event) => (
                                    <button
                                        key={event.id}
                                        onClick={() => handleAddWishlist(event.id)}
                                        className="flex w-full items-center gap-3 rounded-lg bg-white/10 p-3 text-left transition hover:bg-white/20"
                                    >
                                        <div className="relative h-10 w-10 overflow-hidden rounded bg-white/10">
                                            {event.visual_card_url || event.image_url ? (
                                                <Image
                                                    src={event.visual_card_url || event.image_url || ""}
                                                    alt={event.title}
                                                    fill
                                                    className="object-cover"
                                                />
                                            ) : (
                                                <div className="flex h-full items-center justify-center">🎴</div>
                                            )}
                                        </div>
                                        <span className="text-sm text-white">{event.title}</span>
                                    </button>
                                ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
