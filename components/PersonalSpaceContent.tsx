"use client";

import { useState, useEffect, useMemo } from "react";
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
// [簽到] 暫時隱藏
// import { DailyCheckInWidget } from "@/components/DailyCheckInWidget";

import { MySocialStats } from "@/components/MySocialStats";
import { SocialStats } from "@/components/SocialStats";
import { sampleWithoutRepeat, PERSONAL_SPACE_COMMENTS, getCollectionAwareComment, buildCollectionContext, NEGATIVE_COMMENTS } from "@/lib/commentFallbackPool";

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
    virtual_commenter?: { id: string; display_name: string } | null;
    likes_count?: number;
    dislikes_count?: number;
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
    lottery_tickets?: number;
    blindbox_coupons?: number;
    ai_user_summary?: string | null;
    ai_system_prompt?: string | null;
    followers_count?: number | null;
    popularity_score?: number | null;
};

type Visitor = {
    id: string;
    full_name: string | null;
    username: string | null;
    isVirtual?: boolean;
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

type Registration = {
    id: string;
    status: string;
    registered_at: string;
    events: RegistrationEvent | RegistrationEvent[] | null;
};

type RegistrationEvent = {
    id: string;
    title: string;
    image_url: string | null;
    visual_card_url: string | null;
    start_date: string | null;
    end_date: string | null;
    estimated_value: number | null;
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
    recentVisitors?: Visitor[];
    publicImage?: PublicImage | null;
    publicPerceptions?: PublicPerception[];
    distributionStats?: { count: number; totalPoints: number };
    topDistributions?: FeaturedDistribution[];
    registrations?: Registration[];
};

type FeaturedDistribution = {
    id: string;
    pokemon_name: string;
    pokemon_name_en?: string;
    pokemon_sprite_url?: string;
    points?: number;
    generation: number;
    is_shiny?: boolean;
    event_name?: string;
    game_titles?: string[];
};

// 確保色違寶可夢使用正確的 shiny sprite URL
function getDistSpriteUrl(dist: FeaturedDistribution): string | undefined {
    if (!dist.pokemon_sprite_url) return undefined;
    if (dist.is_shiny && !dist.pokemon_sprite_url.includes('/shiny/')) {
        return dist.pokemon_sprite_url.replace('/sprites/pokemon/', '/sprites/pokemon/shiny/');
    }
    return dist.pokemon_sprite_url;
}

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
    topDistributions = [],
    registrations = [],
}: PersonalSpaceContentProps) {
    const router = useRouter();
    const [newComment, setNewComment] = useState("");
    const [replyTo, setReplyTo] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showWishlistModal, setShowWishlistModal] = useState(false);
    const [featuredPreview, setFeaturedPreview] = useState<FeaturedDistribution | null>(null);

    // 按讚/倒讚狀態
    const [userReactions, setUserReactions] = useState<Record<string, { likes: number; dislikes: number; myReaction: 'like' | 'dislike' | null }>>({});
    const [isReacting, setIsReacting] = useState<Record<string, boolean>>({});

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
    // 虛擬用戶名稱池（用於留言系統）
    const VIRTUAL_NAMES = [
        "王**", "李**", "陳**", "林**", "張**", "黃**", "劉**", "楊**",
        "吳**", "蔡**", "謝**", "趙**", "周**", "徐**", "馬**", "朱**",
        "胡**", "高**", "羅**", "曾**", "郭**", "孫**", "蘇**", "葉**",
        "江**", "彭**", "鄧**", "余**", "唐**", "鄭**", "藩**", "豬**",
        "P***", "S***", "M***", "T***", "A***", "K***", "R***",
        "J***", "D***", "C***", "L***", "H***", "N***", "Y***",
        "W***", "B***", "G***", "E***", "F***", "V***",
        "小**", "大**", "阿**", "小米*", "小魚*", "小竹*",
        "小木*", "天**", "星**", "雲**", "雨**", "風**",
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
    const adjustedDate = new Date(now);
    if (now.getHours() < 11) {
        adjustedDate.setDate(adjustedDate.getDate() - 1);
    }
    const todayKey = adjustedDate.toISOString().split('T')[0];
    const userHash = hashCode(user.id + todayKey);

    // 生成虛擬留言（useMemo 避免每次 re-render 都重新計算）
    const initialVirtualComments = useMemo(() => {
        const virtualCommentCount = 1 + (userHash % 3);
        const sampledComments = sampleWithoutRepeat(PERSONAL_SPACE_COMMENTS, virtualCommentCount, userHash);

        // 如果有精選收藏，用確定性方式選取收藏留言（避免 Math.random 導致每次 re-render 都變動）
        if (topDistributions.length > 0 && sampledComments.length > 0) {
            const collectionComment = getCollectionAwareComment(topDistributions);
            if (collectionComment) {
                sampledComments[sampledComments.length - 1] = collectionComment;
            }
        }

        return sampledComments.map((content, i) => {
            const nameIndex = (userHash + i * 11) % VIRTUAL_NAMES.length;
            const daysAgo = (userHash + i * 5) % 14 + 1; // 1-14 天前
            const createdDate = new Date();
            createdDate.setDate(createdDate.getDate() - daysAgo);

            // 隨機但確定性的讚數
            let deterministicLikes = 15 + ((userHash + i * 7) % 35); // 15-49 讚
            let deterministicDislikes = ((userHash + i * 3) % 3); // 0-2 倒讚

            // 如果是被判定為負面/酸民留言，倒讚應該要比讚多
            if (NEGATIVE_COMMENTS.includes(content)) {
                deterministicLikes = ((userHash + i * 2) % 5); // 0-4 讚
                deterministicDislikes = 15 + ((userHash + i * 7) % 35); // 15-49 倒讚
            }

            return {
                id: `virtual-comment-${userHash}-${i}`,
                content,
                created_at: createdDate.toISOString(),
                commenter: {
                    id: `virtual-${userHash}-${i}`,
                    full_name: VIRTUAL_NAMES[nameIndex],
                },
                isVirtual: true,
                likes_count: deterministicLikes,
                dislikes_count: deterministicDislikes,
            };
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userHash, topDistributions.length]);

    // LLM 收藏感知留言（有 ai_user_summary → 70%，無 → 30%）
    const [llmComment, setLlmComment] = useState<{
        id: string; content: string; created_at: string;
        commenter: { id: string; full_name: string }; isVirtual: true;
    } | null>(null);

    useEffect(() => {
        if (topDistributions.length === 0) return;
        const llmThreshold = profile?.ai_user_summary ? 7 : 3; // 有 summary → 70%, 無 → 30%
        const shouldUseLlm = (userHash % 10) < llmThreshold;
        if (!shouldUseLlm) return;

        const collectionCtx = buildCollectionContext(topDistributions, 5);
        const userSummary = profile?.ai_user_summary || profile?.bio || '';
        const llmNameIndex = (userHash + 99) % VIRTUAL_NAMES.length;

        fetch('/api/generate-homepage-comment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                collectionContext: collectionCtx,
                userSummary: userSummary,
            }),
        })
            .then(res => res.ok ? res.json() : null)
            .then(data => {
                if (data?.reply) {
                    const createdDate = new Date();
                    createdDate.setDate(createdDate.getDate() - 1);
                    setLlmComment({
                        id: `llm-comment-${userHash}`,
                        content: data.reply,
                        created_at: createdDate.toISOString(),
                        commenter: {
                            id: `llm-${userHash}`,
                            full_name: data.simulatedName || VIRTUAL_NAMES[llmNameIndex],
                        },
                        isVirtual: true,
                    });
                }
            })
            .catch(() => { /* LLM 失敗，靜默降級 */ });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user.id]);

    // 合併虛擬留言（pool + LLM）
    const virtualComments = llmComment
        ? [llmComment, ...initialVirtualComments]
        : initialVirtualComments;

    // 訪客列表直接使用 server 傳入的資料（包含真實 + DB 虛擬訪客）
    const allVisitors = recentVisitors;

    // 合併真實和虛擬留言，按時間排序（新的在前）
    const allComments = [...comments, ...virtualComments].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    // 讀取當前使用者的按讚紀錄
    useEffect(() => {
        if (!allComments.length) return;

        const fetchReactions = async () => {
            try {
                const commentIds = allComments.map(c => c.id);
                const res = await fetch('/api/comments/reactions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ commentIds })
                });
                if (res.ok) {
                    const data = await res.json();
                    const initialReactions: Record<string, { likes: number; dislikes: number; myReaction: 'like' | 'dislike' | null }> = {};
                    allComments.forEach(c => {
                        const commentData = c as Comment & { likes_count?: number; dislikes_count?: number };
                        initialReactions[c.id] = {
                            likes: commentData.likes_count || 0,
                            dislikes: commentData.dislikes_count || 0,
                            myReaction: data.reactions?.[c.id] || null
                        };
                    });
                    setUserReactions(initialReactions);
                }
            } catch (error) {
                console.error('Failed to fetch user reactions', error);
            }
        };

        fetchReactions();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [allComments.length]);

    const handleReaction = async (commentId: string, action: 'like' | 'dislike') => {
        if (isReacting[commentId]) return;
        if (!currentUserId) {
            alert('請先登入才能對留言表態喔！');
            return;
        }

        setIsReacting(prev => ({ ...prev, [commentId]: true }));
        try {
            const res = await fetch(`/api/comments/${commentId}/react`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action })
            });
            if (res.ok) {
                const result = await res.json();
                if (result.success) {
                    setUserReactions(prev => ({
                        ...prev,
                        [commentId]: {
                            likes: result.data.likes_count,
                            dislikes: result.data.dislikes_count,
                            myReaction: result.data.current_reaction
                        }
                    }));
                }
            } else {
                const err = await res.json();
                alert(err.error || '操作失敗');
            }
        } catch (error) {
            console.error('Action failed', error);
        } finally {
            setIsReacting(prev => ({ ...prev, [commentId]: false }));
        }
    };

    // 瀏覽量統計（使用 DB 真實值，不再加前端虛擬基底）
    const displayTotalViews = profile?.total_views || 0;
    // ✨ 今日訪問 = 訪客列表總人數（保持一致）
    const displayTodayViews = allVisitors.length;

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

    // 精選配布已由 Server Component 傳入 topDistributions

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
                {!isOwnProfile && (
                    <>
                        <div className="mb-4">
                            <h3 className="text-sm font-medium text-white/60 mb-3">📊 社交數據</h3>
                            <SocialStats
                                userId={user.id}
                                isOwnProfile={false}
                                initialFollowers={profile?.followers_count || 0}
                                initialPopularity={profile?.popularity_score || 0}
                            />
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
                        {isOwnProfile && user.email && (
                            <p className="mt-1 text-sm text-white/60">{user.email}</p>
                        )}

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
                            {((profile?.lottery_tickets || 0) > 0) && (
                                <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 px-3 py-2">
                                    <span className="text-rose-200/80 text-xs">🎟️</span>
                                    <span className="ml-2 font-semibold text-rose-400">{profile?.lottery_tickets} <span className="text-[10px] font-normal opacity-70">張</span></span>
                                </div>
                            )}
                            {((profile?.blindbox_coupons || 0) > 0) && (
                                <div className="rounded-lg bg-cyan-500/10 border border-cyan-500/20 px-3 py-2">
                                    <span className="text-cyan-200/80 text-xs">🎫</span>
                                    <span className="ml-2 font-semibold text-cyan-400">{profile?.blindbox_coupons} <span className="text-[10px] font-normal opacity-70">張</span></span>
                                </div>
                            )}
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
                                                    href={`/user/${visitor.username || visitor.id}`}
                                                    className="relative h-9 w-9 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-xs font-bold text-white ring-2 ring-slate-800 transition hover:scale-110 hover:z-10 cursor-pointer"
                                                    title={visitor.full_name || "訪客"}
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

            {/* 精選收藏展示：已收集的寶可夢貴重程度前 10 名 */}
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
                {topDistributions.length > 0 ? (
                    <div className="grid grid-cols-5 gap-3 md:grid-cols-10">
                        {topDistributions.map((dist, index) => (
                            <div
                                key={dist.id}
                                className="group relative aspect-square overflow-hidden rounded-xl bg-white/10 cursor-pointer ring-1 ring-white/10 hover:ring-amber-400/50 transition-all"
                                onClick={() => setFeaturedPreview(dist)}
                            >
                                {/* 寶可夢圖片 */}
                                {getDistSpriteUrl(dist) ? (
                                    <Image
                                        src={getDistSpriteUrl(dist)!}
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
                                {/* Hover overlay：名稱 + 點數 */}
                                <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/80 via-black/30 to-transparent p-1.5 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                                    <p className="truncate text-[10px] font-medium text-white leading-tight">{dist.pokemon_name}</p>
                                    {(dist.points || 0) > 0 && (
                                        <p className="text-[9px] text-amber-400 font-semibold">{(dist.points || 0).toLocaleString()} pts</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-center text-white/50">尚未收集配布寶可夢</p>
                )}
            </section>

            {/* 精選收藏彈窗：配布詳情 */}
            {featuredPreview && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
                    onClick={() => setFeaturedPreview(null)}
                >
                    <div
                        className="relative w-full max-w-xs rounded-2xl overflow-hidden bg-gray-900 border border-white/10 shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* 寶可夢圖片 */}
                        <div className="relative aspect-square w-full bg-gradient-to-br from-white/10 to-white/5">
                            {getDistSpriteUrl(featuredPreview) ? (
                                <Image
                                    src={getDistSpriteUrl(featuredPreview)!}
                                    alt={featuredPreview.pokemon_name}
                                    fill
                                    className="object-contain p-4"
                                />
                            ) : (
                                <div className="flex h-full items-center justify-center text-6xl">🐾</div>
                            )}
                            {featuredPreview.is_shiny && (
                                <div className="absolute left-3 top-3 rounded-full bg-yellow-500/20 px-2 py-0.5 text-xs text-yellow-300">✨ 異色</div>
                            )}
                        </div>
                        {/* 資訊 */}
                        <div className="p-4 space-y-2">
                            <div>
                                <h3 className="text-lg font-semibold text-white">{featuredPreview.pokemon_name}</h3>
                                {featuredPreview.pokemon_name_en && (
                                    <p className="text-xs text-white/40">{featuredPreview.pokemon_name_en}</p>
                                )}
                            </div>
                            <div className="flex flex-wrap items-center gap-2 text-sm">
                                {(featuredPreview.points || 0) > 0 && (
                                    <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-amber-300 font-semibold text-xs">
                                        {(featuredPreview.points || 0).toLocaleString()} pts
                                    </span>
                                )}
                                <span className="rounded-full bg-white/10 px-2 py-0.5 text-white/60 text-xs">
                                    第 {featuredPreview.generation} 世代
                                </span>
                            </div>
                            {featuredPreview.event_name && (
                                <p className="text-xs text-white/50">🎟️ {featuredPreview.event_name}</p>
                            )}
                            {featuredPreview.game_titles && featuredPreview.game_titles.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                    {featuredPreview.game_titles.map((g, i) => (
                                        <span key={i} className="rounded bg-indigo-500/20 px-1.5 py-0.5 text-[10px] text-indigo-300">🎮 {g}</span>
                                    ))}
                                </div>
                            )}
                        </div>
                        {/* 關閉鈕 */}
                        <button
                            onClick={() => setFeaturedPreview(null)}
                            className="absolute right-3 top-3 rounded-full bg-black/60 p-1.5 text-white/80 hover:text-white transition"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                        </button>
                    </div>
                </div>
            )}

            {/* 📋 參加紀錄 */}
            {registrations.length > 0 && (
                <section className="glass-card p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-white">📋 參加紀錄</h2>
                        <span className="text-xs text-white/40">共 {registrations.length} 場活動</span>
                    </div>
                    <div className="grid grid-cols-5 gap-3 md:grid-cols-10">
                        {registrations.map((reg) => {
                            const event = (Array.isArray(reg.events) ? reg.events[0] : reg.events) as RegistrationEvent | null;
                            if (!event) return null;
                            const imageUrl = event.visual_card_url || event.image_url;
                            const endDate = event.end_date ? new Date(event.end_date) : null;
                            const startDate = event.start_date ? new Date(event.start_date) : null;
                            const now = new Date();
                            const isPast = endDate && endDate < now;
                            const isOngoing = startDate && endDate && startDate <= now && now <= endDate;

                            return (
                                <Link
                                    key={reg.id}
                                    href={`/events/${event.id}` as never}
                                    className="group relative aspect-square overflow-hidden rounded-xl bg-white/10 ring-1 ring-white/10 hover:ring-amber-400/50 transition-all"
                                >
                                    {/* 活動圖片 */}
                                    {imageUrl ? (
                                        <Image
                                            src={imageUrl}
                                            alt={event.title}
                                            fill
                                            className="object-cover transition group-hover:scale-110"
                                        />
                                    ) : (
                                        <div className="flex h-full items-center justify-center text-2xl">🎫</div>
                                    )}
                                    {/* 狀態徽章 */}
                                    <div className="absolute left-1 top-1">
                                        {isOngoing ? (
                                            <span className="rounded-full bg-green-500/80 px-1.5 py-0.5 text-[9px] font-bold text-white shadow">進行中</span>
                                        ) : isPast ? (
                                            <span className="rounded-full bg-black/60 px-1.5 py-0.5 text-[9px] font-bold text-white/60">已結束</span>
                                        ) : (
                                            <span className="rounded-full bg-blue-500/80 px-1.5 py-0.5 text-[9px] font-bold text-white shadow">即將</span>
                                        )}
                                    </div>
                                    {/* Hover overlay：活動名稱 */}
                                    <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/80 via-black/30 to-transparent p-1.5 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                                        <p className="truncate text-[10px] font-medium text-white leading-tight">{event.title}</p>
                                        {(event.estimated_value || 0) > 0 && (
                                            <p className="text-[9px] text-amber-400 font-semibold">${(event.estimated_value || 0).toLocaleString()}</p>
                                        )}
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </section>
            )}

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
                                <div className="flex items-end gap-5">
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
                                        <div className={`flex items-center justify-between mb-1 pl-1 ${p.disagree_rate > p.agree_rate ? 'text-sm font-medium' : 'text-xs'}`}>
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
                                    <span className="text-xs text-white/40 whitespace-nowrap pl-2">
                                        共 {p.participation_rate} 人投票
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* [簽到] 暫時隱藏 */}
            {/* {isOwnProfile && (
                <DailyCheckInWidget />
            )} */}

            {/* 留言區 */}
            <section className="glass-card p-6 relative overflow-hidden">
                {/* 🔒 鎖定遮罩 (留言區) - 暫時註解 */}
                {/* <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[2px]">
                    <div className="rounded-full bg-white/10 px-6 py-3 text-sm font-medium text-white shadow-xl backdrop-blur-md border border-white/20 flex items-center gap-2">
                        <span>🚧</span> 留言區系統優化中
                    </div>
                </div> */}

                <div>
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
                                                    {(comment.commenter?.full_name || comment.virtual_commenter?.display_name || "匿").slice(0, 1).toUpperCase()}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <span className="text-sm font-medium text-white truncate">
                                                            {comment.commenter?.full_name || comment.virtual_commenter?.display_name || "匿名"}
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
                                                    {/* 互動按鈕區 */}
                                                    <div className="mt-2 flex items-center gap-4">
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                onClick={() => handleReaction(comment.id, 'like')}
                                                                disabled={isReacting[comment.id]}
                                                                className={`flex items-center gap-1 text-xs transition ${userReactions[comment.id]?.myReaction === 'like' ? 'text-blue-400 font-bold' : 'text-white/40 hover:text-white/80'}`}
                                                            >
                                                                👍 {userReactions[comment.id]?.likes !== undefined ? userReactions[comment.id].likes : (comment.likes_count || 0)}
                                                            </button>
                                                            <button
                                                                onClick={() => handleReaction(comment.id, 'dislike')}
                                                                disabled={isReacting[comment.id]}
                                                                className={`flex items-center gap-1 text-xs transition ${userReactions[comment.id]?.myReaction === 'dislike' ? 'text-red-400 font-bold' : 'text-white/40 hover:text-white/80'}`}
                                                            >
                                                                👎 {userReactions[comment.id]?.dislikes !== undefined ? userReactions[comment.id].dislikes : (comment.dislikes_count || 0)}
                                                            </button>
                                                        </div>
                                                        {/* 回覆按鈕 */}
                                                        {currentUserId && (
                                                            <button
                                                                onClick={() => {
                                                                    setReplyTo(comment.id);
                                                                    setNewComment(`@${comment.commenter?.full_name || comment.virtual_commenter?.display_name || "匿名"} `);
                                                                }}
                                                                className="mt-2 text-xs text-blue-300/60 hover:text-blue-300"
                                                            >
                                                                ↳ 回覆
                                                            </button>
                                                        )}
                                                    </div>
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
                                                                    {/* 互動按鈕區 (子留言) */}
                                                                    <div className="mt-2 flex items-center gap-2">
                                                                        <button
                                                                            onClick={() => handleReaction(reply.id, 'like')}
                                                                            disabled={isReacting[reply.id]}
                                                                            className={`flex items-center gap-1 text-xs transition ${userReactions[reply.id]?.myReaction === 'like' ? 'text-blue-400 font-bold' : 'text-white/40 hover:text-white/80'}`}
                                                                        >
                                                                            👍 {userReactions[reply.id]?.likes !== undefined ? userReactions[reply.id].likes : (reply.likes_count || 0)}
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleReaction(reply.id, 'dislike')}
                                                                            disabled={isReacting[reply.id]}
                                                                            className={`flex items-center gap-1 text-xs transition ${userReactions[reply.id]?.myReaction === 'dislike' ? 'text-red-400 font-bold' : 'text-white/40 hover:text-white/80'}`}
                                                                        >
                                                                            👎 {userReactions[reply.id]?.dislikes !== undefined ? userReactions[reply.id].dislikes : (reply.dislikes_count || 0)}
                                                                        </button>
                                                                    </div>
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
                        <p className="text-center text-sm text-white/40 py-8 italic bg-white/5 rounded-lg border border-white/10">尚無留言，來當第一個留言的人吧！</p>
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
