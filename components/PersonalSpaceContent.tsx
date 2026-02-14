"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { DailyCheckInWidget } from "@/components/DailyCheckInWidget";
import { MaintenanceOverlay } from "@/components/MaintenanceOverlay";
import { useMaintenanceMode } from "@/components/MaintenanceContext";
import { MySocialStats } from "@/components/MySocialStats";

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
    parent_id?: string | null;
    is_virtual?: boolean;
    has_real_reply?: boolean;
    commenter: { id: string; full_name: string | null } | null;
};

type Profile = {
    id: string;
    full_name: string | null;
    pokemon_first_year: number | null;
    pokemon_first_game: string | null;
    bio: string | null;
    featured_items: string[] | null;
    created_at: string;
    role: string;
    username: string | null;
    total_views: number | null;
    today_views: number | null;
};

type Visitor = {
    id: string;
    full_name: string | null;
    username: string | null;
};

type PublicImage = {
    nickname: string | null;
    approval_rate: number;
};

type PublicPerception = {
    id: string;
    content: string;
    agree_rate: number;
    disagree_rate: number;
    participation_rate: number;
};

type User = {
    id: string;
    email?: string;
};

// 可拖拉的願望清單項目元件
function SortableWishlistItem({
    wishlist,
    isOwnProfile,
    onRemove,
}: {
    wishlist: Wishlist;
    isOwnProfile: boolean;
    onRemove: (id: string) => void;
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: wishlist.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const event = wishlist.events as Event | null;

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="flex items-center gap-3 rounded-lg bg-white/10 p-3"
        >
            {isOwnProfile && (
                <button
                    {...attributes}
                    {...listeners}
                    className="cursor-grab text-white/40 hover:text-white/60 active:cursor-grabbing"
                    title="拖曳排序"
                >
                    ⋮⋮
                </button>
            )}
            <div className="relative h-12 w-12 overflow-hidden rounded bg-white/10">
                {event?.visual_card_url || event?.image_url ? (
                    <Image
                        src={event.visual_card_url || event.image_url || ""}
                        alt={event.title || ""}
                        fill
                        className="object-cover"
                    />
                ) : (
                    <div className="flex h-full items-center justify-center">🎴</div>
                )}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                    {event?.title || "未知活動"}
                </p>
                {wishlist.note && (
                    <p className="text-xs text-white/50 truncate">{wishlist.note}</p>
                )}
            </div>
            {isOwnProfile && (
                <button
                    onClick={() => onRemove(wishlist.id)}
                    className="text-red-400/60 hover:text-red-400 text-sm"
                    title="移除願望"
                >
                    ✕
                </button>
            )}
        </div>
    );
}

type PersonalSpaceContentProps = {
    user: User;
    profile: Profile | null;
    wishlists: Wishlist[];
    comments: Comment[];
    userItems: UserItem[];
    allEvents: Event[];
    isOwnProfile: boolean;
    currentUserId?: string;
    recentVisitors?: Visitor[];
    publicImage?: PublicImage | null;
    publicPerceptions?: PublicPerception[];
    distributionStats?: { count: number; totalPoints: number };
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
    recentVisitors = [],
    publicImage,
    publicPerceptions = [],
    distributionStats,
}: PersonalSpaceContentProps) {
    const { maintenanceMode: COMMENTS_MAINTENANCE_MODE } = useMaintenanceMode();
    const router = useRouter();
    const [newComment, setNewComment] = useState("");
    const [replyTo, setReplyTo] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showWishlistModal, setShowWishlistModal] = useState(false);

    // 願望清單本地狀態（用於排序）
    const [localWishlists, setLocalWishlists] = useState(wishlists);

    // 拖拉感應器
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // ===== 虛擬互動系統 =====
    // 虛擬用戶名稱池
    const VIRTUAL_NAMES = [
        "王**", "李**", "陳**", "林**", "張**", "黃**", "劉**", "楊**",
        "P***", "S***", "M***", "T***", "A***", "K***",
        "小**", "大**", "阿**"
    ];

    // 虛擬留言池
    const VIRTUAL_COMMENTS = [
        "收藏好漂亮！🌟",
        "大佬帶帶我 🙏",
        "什麼時候再上新的？",
        "好羨慕你的收藏",
        "這個配布我也有！",
        "可以交流一下嗎？",
        "新手報到！學習中 📚",
        "你的願望清單我都想要 😂",
        "收藏家 respect 🫡",
        "路過留言～",
        "太強了吧這收藏！",
        "期待你的新增收藏 👀",
    ];

    // 使用「用戶 ID + 日期」生成確定性的隨機數（每天變化，但同一天內一致）
    const hashCode = (str: string) => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) - hash) + str.charCodeAt(i);
            hash |= 0;
        }
        return Math.abs(hash);
    };

    // 加入日期讓每天產生不同結果（以上午 11:00 為分界點）
    const now = new Date();
    // 如果現在時間早於 11:00，就用昨天的日期
    const adjustedDate = new Date(now);
    if (now.getHours() < 11) {
        adjustedDate.setDate(adjustedDate.getDate() - 1);
    }
    const todayKey = adjustedDate.toISOString().split('T')[0]; // YYYY-MM-DD
    const userHash = hashCode(user.id + todayKey);

    // 生成虛擬訪客（2-5 位）
    const virtualVisitorCount = 2 + (userHash % 4);
    const virtualVisitors = Array.from({ length: virtualVisitorCount }, (_, i) => {
        const nameIndex = (userHash + i * 7) % VIRTUAL_NAMES.length;
        const virtualId = `virtual-${userHash}-${i}`;
        return {
            id: virtualId,
            full_name: VIRTUAL_NAMES[nameIndex],
            username: null,
            isVirtual: true,
        };
    });

    // 生成虛擬留言（1-3 則）
    const virtualCommentCount = 1 + (userHash % 3);
    const virtualComments = Array.from({ length: virtualCommentCount }, (_, i) => {
        const nameIndex = (userHash + i * 11) % VIRTUAL_NAMES.length;
        const commentIndex = (userHash + i * 13) % VIRTUAL_COMMENTS.length;
        const daysAgo = (userHash + i * 5) % 14 + 1; // 1-14 天前
        const createdDate = new Date();
        createdDate.setDate(createdDate.getDate() - daysAgo);

        return {
            id: `virtual-comment-${userHash}-${i}`,
            content: VIRTUAL_COMMENTS[commentIndex],
            created_at: createdDate.toISOString(),
            commenter: {
                id: `virtual-${userHash}-${i}`,
                full_name: VIRTUAL_NAMES[nameIndex],
            },
            isVirtual: true,
        };
    });

    // 合併真實和虛擬訪客
    const allVisitors = [...recentVisitors, ...virtualVisitors];

    // 合併真實和虛擬留言，按時間排序（新的在前）
    const allComments = [...comments, ...virtualComments].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    // 虛擬瀏覽量統計（加到真實數據上）
    const virtualTotalViews = 50 + (userHash % 150); // 50-199
    const virtualTodayViews = 2 + (userHash % 8); // 2-9
    const displayTotalViews = (profile?.total_views || 0) + virtualTotalViews;
    const displayTodayViews = (profile?.today_views || 0) + virtualTodayViews;

    // 處理願望清單排序
    const handleWishlistDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const oldIndex = localWishlists.findIndex((w) => w.id === active.id);
        const newIndex = localWishlists.findIndex((w) => w.id === over.id);
        const newOrder = arrayMove(localWishlists, oldIndex, newIndex);
        setLocalWishlists(newOrder);

        // 更新資料庫中的 priority
        for (let i = 0; i < newOrder.length; i++) {
            await supabase
                .from("wishlists")
                .update({ priority: i })
                .eq("id", newOrder[i].id);
        }
    };

    // 寶可夢遊戲列表（本傳 + 外傳）
    const pokemonGames: Record<number, string> = {
        // 本傳
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
        // 外傳（部分年份與本傳重疊，顯示本傳即可）
        2020: "寶可夢咖啡 Mix",
        2015: "Pokken Tournament",
        2011: "Pokemon Rumble Blast",
        2007: "不可思議的迷宮 時/闇之探險隊",
        2005: "不可思議的迷宮",
        2003: "Pokemon Colosseum",
        2001: "Pokemon Stadium 金銀",
    };

    const getGameName = (year: number) => {
        const game = pokemonGames[year];
        return game ? `${game} (${year})` : `${year}年`;
    };

    // 計算統計資料（user_items + 配布圖鑑收藏合併）
    const itemCount = userItems.reduce((sum, item) => sum + item.quantity, 0);
    const itemValue = userItems.reduce((sum, item) => {
        const event = Array.isArray(item.events) ? item.events[0] : item.events;
        return sum + (event?.estimated_value || 0) * item.quantity;
    }, 0);
    const totalItems = itemCount + (distributionStats?.count || 0);
    const totalValue = itemValue + (distributionStats?.totalPoints || 0);

    // 取得精選展示的收藏
    const featuredItems = userItems.slice(0, 10);

    // 提交留言
    const handleSubmitComment = async () => {
        // 直接從 Supabase session 獲取當前登入用戶 ID，確保 RLS 政策通過
        const { data: { user: authUser } } = await supabase.auth.getUser();
        const commenterId = authUser?.id;

        if (!newComment.trim() || !commenterId) {
            if (!commenterId) {
                alert("請先登入才能留言");
            }
            return;
        }
        setIsSubmitting(true);

        // 檢查 replyTo 是否為有效 UUID（虛擬留言 ID 格式是 virtual-comment-xxx，不是 UUID）
        const isValidUUID = replyTo && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(replyTo);
        const parentId = isValidUUID ? replyTo : null;

        console.log("Submitting comment:", {
            profile_user_id: profile?.id || user.id,
            commenter_id: commenterId,
            content: newComment.trim(),
            parent_id: parentId,
        });

        const { error } = await supabase.from("profile_comments").insert({
            profile_user_id: profile?.id || user.id,
            commenter_id: commenterId,
            content: newComment.trim(),
            parent_id: parentId,
        });

        if (error) {
            console.error("Comment insert error:", error);
            alert(`留言失敗: ${error.message}`);
        } else {
            setNewComment("");
            setReplyTo(null);
            // 強制刷新頁面以顯示新留言
            window.location.reload();
        }
        setIsSubmitting(false);
    };

    // 刪除留言
    const handleDeleteComment = async (commentId: string) => {
        await supabase.from("profile_comments").delete().eq("id", commentId);
        window.location.reload();
    };

    // 願望清單備註狀態
    const [wishlistNote, setWishlistNote] = useState("");

    // 新增願望清單（含備註）
    const handleAddWishlist = async (eventId: string) => {
        const { error } = await supabase.from("wishlists").insert({
            user_id: user.id,
            event_id: eventId,
            priority: wishlists.length,
            note: wishlistNote || null,
        });

        if (!error) {
            setShowWishlistModal(false);
            setWishlistNote("");
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
                {/* 社交數據（卡片頂部） */}
                {isOwnProfile && (
                    <>
                        <div className="mb-4">
                            <h3 className="text-sm font-medium text-white/60 mb-3">📊 我的社交數據</h3>
                            <MySocialStats userId={user.id} />
                        </div>
                        <hr className="border-white/10 mb-6" />
                    </>
                )}
                <div className="flex flex-col gap-6 md:flex-row md:items-start">
                    {/* 頭像 */}
                    <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-3xl font-bold text-white shadow-lg">
                        {(profile?.full_name || user.email || "U").slice(0, 2).toUpperCase()}
                    </div>

                    {/* 資訊 */}
                    <div className="flex-1">
                        <div className="flex items-baseline gap-2">
                            <h1 className="text-2xl font-bold text-white">
                                {profile?.full_name || "未設定名稱"}
                            </h1>
                            {publicImage?.nickname && (
                                <>
                                    <span className="text-amber-400 font-medium">{publicImage.nickname}</span>
                                    <span className="text-xs text-white/30">
                                        （公眾形象名 約{publicImage.approval_rate}%認同）
                                    </span>
                                </>
                            )}
                        </div>
                        <p className="mt-1 text-sm text-white/60">{user.email}</p>

                        {profile?.bio && (
                            <p className="mt-3 text-sm text-white/80">{profile.bio}</p>
                        )}

                        <div className="mt-4 flex flex-wrap gap-4 text-sm">
                            {(profile?.pokemon_first_game || profile?.pokemon_first_year) && (
                                <div className="rounded-lg bg-white/10 px-3 py-2">
                                    <span className="text-white/60">首玩遊戲</span>
                                    <span className="ml-2 font-semibold text-amber-400">
                                        {profile?.pokemon_first_game || getGameName(profile?.pokemon_first_year || 0)}
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

                        {/* 公開 ID 和分享 */}
                        {isOwnProfile && (
                            <div className="mt-4 flex flex-wrap items-center gap-3">
                                <Link
                                    href="/profile"
                                    className="rounded-lg bg-white/10 px-4 py-2 text-sm text-white/80 transition hover:bg-white/20"
                                >
                                    編輯個人資料
                                </Link>

                                {profile?.username ? (
                                    <button
                                        onClick={() => {
                                            const url = `${window.location.origin}/user/${profile.username}`;
                                            navigator.clipboard.writeText(url);
                                            alert('已複製分享連結！');
                                        }}
                                        className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-500/20 to-purple-500/20 px-4 py-2 text-sm text-white/90 transition hover:from-blue-500/30 hover:to-purple-500/30"
                                    >
                                        <span>🔗</span>
                                        <span>/user/{profile.username}</span>
                                        <span className="text-xs text-white/50">複製</span>
                                    </button>
                                ) : (
                                    <Link
                                        href="/profile"
                                        className="flex items-center gap-2 rounded-lg border border-dashed border-white/30 px-4 py-2 text-sm text-white/60 transition hover:border-white/50 hover:text-white/80"
                                    >
                                        <span>🔗</span>
                                        <span>設定公開 ID</span>
                                    </Link>
                                )}
                            </div>
                        )}

                        {/* 訪問統計 */}
                        <div className="mt-4 pt-4 border-t border-white/10">
                            {/* 統計卡片 */}
                            <div className="grid grid-cols-2 gap-3 mb-4">
                                <div className="rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 p-3 text-center">
                                    <p className="text-2xl font-bold text-blue-400">{displayTotalViews}</p>
                                    <p className="text-xs text-white/50 mt-1">👁️ 歷史總瀏覽量</p>
                                </div>
                                <div className="rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 p-3 text-center">
                                    <p className="text-2xl font-bold text-green-400">{displayTodayViews}</p>
                                    <p className="text-xs text-white/50 mt-1">✨ 今日訪問</p>
                                </div>
                            </div>

                            {/* 今天有誰看過你 */}
                            {allVisitors.length > 0 ? (
                                <div className="rounded-xl bg-white/5 p-3">
                                    <p className="text-sm font-medium text-white/80 mb-2">👀 今天有誰看過你</p>
                                    <div className="flex items-center gap-2">
                                        <div className="flex -space-x-2 flex-1">
                                            {allVisitors.slice(0, 6).map((visitor: { id: string; full_name?: string | null; username?: string | null; isVirtual?: boolean }) => (
                                                <Link
                                                    key={visitor.id}
                                                    href={visitor.isVirtual ? "#" : `/user/${visitor.username || visitor.id}`}
                                                    className="relative h-9 w-9 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-xs font-bold text-white ring-2 ring-slate-800 transition hover:scale-110 hover:z-10"
                                                    title={visitor.full_name || "訪客"}
                                                    onClick={(e) => visitor.isVirtual && e.preventDefault()}
                                                >
                                                    {(visitor.full_name || "?").slice(0, 1).toUpperCase()}
                                                </Link>
                                            ))}
                                            {allVisitors.length > 6 && (
                                                <div className="relative h-9 w-9 rounded-full bg-white/20 flex items-center justify-center text-xs font-medium text-white ring-2 ring-slate-800">
                                                    +{allVisitors.length - 6}
                                                </div>
                                            )}
                                        </div>
                                        <span className="text-xs text-white/40 whitespace-nowrap">共 {allVisitors.length} 人</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="rounded-xl bg-white/5 p-4 text-center">
                                    <p className="text-white/40 text-sm">👀 還沒有人來過...</p>
                                    <p className="text-white/30 text-xs mt-1">分享你的公開 ID 邀請好友來訪吧！</p>
                                </div>
                            )}
                        </div>
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
                {localWishlists.length > 0 ? (
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleWishlistDragEnd}
                    >
                        <SortableContext
                            items={localWishlists.map((w) => w.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            <div className="space-y-2">
                                {localWishlists.map((wish) => (
                                    <SortableWishlistItem
                                        key={wish.id}
                                        wishlist={wish}
                                        isOwnProfile={isOwnProfile}
                                        onRemove={handleRemoveWishlist}
                                    />
                                ))}
                            </div>
                        </SortableContext>
                    </DndContext>
                ) : (
                    <p className="text-center text-white/50">尚未設定願望清單</p>
                )}
            </section>

            {/* 公眾認知區塊 */}
            {publicPerceptions.length > 0 && (
                <section className="glass-card p-6">
                    <div className="flex items-baseline gap-2 mb-4">
                        <h2 className="text-lg font-semibold text-white">👁️ 公眾認知</h2>
                        <span className="text-xs text-white/30">你在社群中的形象</span>
                    </div>
                    <div className="space-y-4">
                        {publicPerceptions.map((p) => (
                            <div key={p.id} className="rounded-lg bg-white/5 p-4">
                                {/* 第一行：內容 */}
                                <p className="text-white mb-3">&ldquo;{p.content}&rdquo;</p>

                                {/* 第二行：進度條和數據 */}
                                <div className="flex items-end gap-3">
                                    {/* 認同進度條 - 如果認同多則放大 */}
                                    <div className={`flex-1 transition-all ${p.agree_rate > p.disagree_rate ? 'scale-105 origin-left' : 'opacity-60'}`}>
                                        <div className={`flex items-center justify-between mb-1 ${p.agree_rate > p.disagree_rate ? 'text-sm font-medium' : 'text-xs'}`}>
                                            <span className="text-green-400">認同</span>
                                            <span className="text-green-400">{p.agree_rate}%</span>
                                        </div>
                                        <div className={`bg-white/10 rounded-full overflow-hidden ${p.agree_rate > p.disagree_rate ? 'h-3' : 'h-2'}`}>
                                            <div
                                                className="h-full bg-green-500 rounded-full transition-all"
                                                style={{ width: `${p.agree_rate}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* 不認同進度條 - 如果不認同多則放大 */}
                                    <div className={`flex-1 transition-all ${p.disagree_rate > p.agree_rate ? 'scale-105 origin-right' : 'opacity-60'}`}>
                                        <div className={`flex items-center justify-between mb-1 ${p.disagree_rate > p.agree_rate ? 'text-sm font-medium' : 'text-xs'}`}>
                                            <span className="text-red-400">不認同</span>
                                            <span className="text-red-400">{p.disagree_rate}%</span>
                                        </div>
                                        <div className={`bg-white/10 rounded-full overflow-hidden ${p.disagree_rate > p.agree_rate ? 'h-3' : 'h-2'}`}>
                                            <div
                                                className="h-full bg-red-500 rounded-full transition-all"
                                                style={{ width: `${p.disagree_rate}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* 參與人數 */}
                                    <span className="text-xs text-white/40 whitespace-nowrap">
                                        參與 {p.participation_rate} 人
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* 每日簽到區塊 - 僅在自己的頁面顯示 */}
            {isOwnProfile && (
                <DailyCheckInWidget />
            )}

            {/* 留言區 */}
            <section className="glass-card p-6 relative overflow-hidden">
                {/* 維護遮罩 */}
                {COMMENTS_MAINTENANCE_MODE && (
                    <div className="absolute inset-0 z-10">
                        <MaintenanceOverlay
                            title="維護中"
                            message="留言區暫時不予開放"
                        />
                    </div>
                )}
                <div className={COMMENTS_MAINTENANCE_MODE ? "blur-sm pointer-events-none select-none" : ""}>
                    <h2 className="mb-4 text-lg font-semibold text-white">💬 留言區</h2>

                    {/* 留言輸入 */}
                    <div className="mb-4">
                        {replyTo && (
                            <div className="mb-2 flex items-center gap-2 text-sm text-blue-300">
                                <span>↳ 回覆中</span>
                                <button
                                    onClick={() => { setReplyTo(null); setNewComment(""); }}
                                    className="text-white/40 hover:text-white"
                                >
                                    ✕ 取消
                                </button>
                            </div>
                        )}
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder={replyTo ? "輸入回覆內容..." : "留下一則訊息..."}
                                className="flex-1 rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none"
                                onKeyDown={(e) => e.key === "Enter" && handleSubmitComment()}
                            />
                            <button
                                onClick={handleSubmitComment}
                                disabled={isSubmitting || !newComment.trim()}
                                className="rounded-lg bg-blue-500/20 px-4 py-2 text-sm text-blue-200 transition hover:bg-blue-500/30 disabled:opacity-50"
                            >
                                {replyTo ? "回覆" : "發送"}
                            </button>
                        </div>
                    </div>

                    {/* 留言列表 - 討論串結構 */}
                    {allComments.length > 0 ? (
                        <div className="space-y-3">
                            {/* 先顯示頂層留言（沒有 parent_id 的） */}
                            {allComments
                                .filter((c: Comment & { isVirtual?: boolean }) => !c.parent_id)
                                .map((comment: Comment & { isVirtual?: boolean }) => {
                                    const isVirtualComment = comment.isVirtual || comment.is_virtual;
                                    const canDelete = !isVirtualComment && (currentUserId === comment.commenter?.id || isOwnProfile);
                                    // 找出這則留言的回覆
                                    const replies = allComments.filter((c: Comment & { isVirtual?: boolean }) => c.parent_id === comment.id);

                                    return (
                                        <div key={comment.id}>
                                            {/* 頂層留言 */}
                                            <div className="flex gap-3 rounded-lg bg-white/5 p-3">
                                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-purple-500 text-sm font-bold text-white">
                                                    {(comment.commenter?.full_name || "匿").slice(0, 1).toUpperCase()}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <span className="text-sm font-medium text-white truncate">
                                                            {comment.commenter?.full_name || "匿名"}
                                                        </span>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs text-white/40 shrink-0">
                                                                {new Date(comment.created_at).toLocaleDateString("zh-TW")}
                                                            </span>
                                                            {canDelete && (
                                                                <button
                                                                    onClick={() => handleDeleteComment(comment.id)}
                                                                    className="text-red-400/60 hover:text-red-400 text-xs"
                                                                    title="刪除留言"
                                                                >
                                                                    ✕
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <p className="mt-1 text-sm text-white/80 break-words">{comment.content}</p>
                                                    {/* 回覆按鈕 */}
                                                    {currentUserId && (
                                                        <button
                                                            onClick={() => {
                                                                setReplyTo(comment.id);
                                                                setNewComment(`@${comment.commenter?.full_name || "匿名"} `);
                                                            }}
                                                            className="mt-2 text-xs text-blue-300/60 hover:text-blue-300"
                                                        >
                                                            ↳ 回覆
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            {/* 子留言（回覆） */}
                                            {replies.length > 0 && (
                                                <div className="ml-8 mt-2 space-y-2 border-l-2 border-white/10 pl-4">
                                                    {replies.map((reply: Comment & { isVirtual?: boolean }) => {
                                                        const isReplyVirtual = reply.isVirtual || reply.is_virtual;
                                                        const canDeleteReply = !isReplyVirtual && (currentUserId === reply.commenter?.id || isOwnProfile);
                                                        return (
                                                            <div key={reply.id} className="flex gap-3 rounded-lg bg-white/5 p-3">
                                                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-teal-500 text-xs font-bold text-white">
                                                                    {(reply.commenter?.full_name || "匿").slice(0, 1).toUpperCase()}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-center justify-between gap-2">
                                                                        <span className="text-sm font-medium text-white truncate">
                                                                            {reply.commenter?.full_name || "匿名"}
                                                                        </span>
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="text-xs text-white/40 shrink-0">
                                                                                {new Date(reply.created_at).toLocaleDateString("zh-TW")}
                                                                            </span>
                                                                            {canDeleteReply && (
                                                                                <button
                                                                                    onClick={() => handleDeleteComment(reply.id)}
                                                                                    className="text-red-400/60 hover:text-red-400 text-xs"
                                                                                >
                                                                                    ✕
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                    <p className="mt-1 text-sm text-white/80 break-words">{reply.content}</p>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                        </div>
                    ) : (
                        <p className="text-center text-white/50">還沒有留言，成為第一個留言的人吧！</p>
                    )}
                </div>
            </section>

            {/* 願望清單 Modal */}
            {showWishlistModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="glass-card max-h-[80vh] w-full max-w-md overflow-y-auto p-6">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-white">選擇願望</h3>
                            <button
                                onClick={() => {
                                    setShowWishlistModal(false);
                                    setWishlistNote("");
                                }}
                                className="text-white/60 hover:text-white"
                            >
                                ✕
                            </button>
                        </div>

                        {/* 備註輸入框 */}
                        <div className="mb-4">
                            <input
                                type="text"
                                value={wishlistNote}
                                onChange={(e) => setWishlistNote(e.target.value)}
                                placeholder="備註（選填）：例如想要的原因..."
                                maxLength={100}
                                className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none"
                            />
                            <p className="mt-1 text-xs text-white/40">{wishlistNote.length}/100</p>
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
