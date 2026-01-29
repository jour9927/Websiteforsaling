import { createServerSupabaseClient } from "@/lib/auth";
import Link from "next/link";
import { CollectionCard } from "@/components/CollectionCard";
import { MemberOnlyBlock } from "@/components/MemberOnlyBlock";

export const dynamic = "force-dynamic";

type UserItem = {
    event_id: string | null;
    quantity: number;
};

export default async function CollectionPage() {
    const supabase = createServerSupabaseClient();
    const {
        data: { user }
    } = await supabase.auth.getUser();

    // 取得所有已發布的活動（用於圖鑑牆）
    const { data: events } = await supabase
        .from("events")
        .select("id, title, image_url, visual_card_url, estimated_value, series_tag, status")
        .eq("status", "published")
        .order("start_date", { ascending: false });

    // 如果使用者已登入，取得其擁有的物品
    let userItems: UserItem[] = [];
    if (user) {
        const { data } = await supabase
            .from("user_items")
            .select("event_id, quantity")
            .eq("user_id", user.id);
        userItems = data || [];
    }

    // 建立使用者擁有的物品 Map（event_id -> quantity）
    const ownedMap = new Map<string, number>();
    userItems.forEach((item) => {
        if (item.event_id) {
            const current = ownedMap.get(item.event_id) || 0;
            ownedMap.set(item.event_id, current + item.quantity);
        }
    });

    // 取得所有不重複的系列標籤
    const allTags = events
        ?.map((e) => e.series_tag)
        .filter((tag): tag is string => !!tag);
    const uniqueTags = [...new Set(allTags)];

    // 計算統計數據
    const totalEvents = events?.length || 0;
    const ownedCount = [...ownedMap.keys()].filter((id) =>
        events?.some((e) => e.id === id)
    ).length;
    const totalValue = events
        ?.filter((e) => ownedMap.has(e.id))
        .reduce((sum, e) => sum + (e.estimated_value || 0) * (ownedMap.get(e.id) || 1), 0) || 0;

    // 未登入用戶顯示會員限定區塊
    if (!user) {
        return (
            <section className="space-y-6">
                <header>
                    <h1 className="text-2xl font-semibold text-white/90">收藏圖鑑</h1>
                    <p className="mt-1 text-sm text-white/60">
                        收集所有活動卡片，打造你的專屬圖鑑！
                    </p>
                </header>
                <MemberOnlyBlock
                    title="會員專屬功能"
                    description="登入後即可查看完整收藏圖鑑、追蹤收藏進度與資產估值"
                    itemCount={4}
                />
            </section>
        );
    }

    return (
        <section className="space-y-6">
            {/* 頁面標題 */}
            <header>
                <h1 className="text-2xl font-semibold text-white/90">收藏圖鑑</h1>
                <p className="mt-1 text-sm text-white/60">
                    收集所有活動卡片，打造你的專屬圖鑑！
                </p>
            </header>

            {/* 統計區塊 */}
            <div className="grid grid-cols-3 gap-4">
                <div className="glass-card p-4 text-center">
                    <p className="text-xs uppercase tracking-wider text-white/50">收藏進度</p>
                    <p className="mt-1 text-2xl font-bold text-white">
                        {ownedCount} / {totalEvents}
                    </p>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                        <div
                            className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-500"
                            style={{ width: `${totalEvents > 0 ? (ownedCount / totalEvents) * 100 : 0}%` }}
                        />
                    </div>
                </div>
                <div className="glass-card p-4 text-center">
                    <p className="text-xs uppercase tracking-wider text-white/50">估值總額</p>
                    <p className="mt-1 text-2xl font-bold text-amber-400">
                        ${totalValue.toLocaleString()}
                    </p>
                </div>
                <div className="glass-card p-4 text-center">
                    <p className="text-xs uppercase tracking-wider text-white/50">完成度</p>
                    <p className="mt-1 text-2xl font-bold text-white">
                        {totalEvents > 0 ? Math.round((ownedCount / totalEvents) * 100) : 0}%
                    </p>
                </div>
            </div>

            {/* 系列篩選標籤 */}
            {uniqueTags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-medium text-white">
                        全部
                    </span>
                    {uniqueTags.map((tag) => (
                        <span
                            key={tag}
                            className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/70 transition hover:bg-white/20"
                        >
                            {tag}
                        </span>
                    ))}
                </div>
            )}

            {/* 未登入提示 */}
            {!user && (
                <div className="glass-card border-amber-500/30 bg-amber-500/10 p-4">
                    <p className="text-sm text-amber-200">
                        💡 <Link href="/login?redirect=/collection" className="underline">登入</Link> 後即可查看你的收藏狀態！
                    </p>
                </div>
            )}

            {/* 圖鑑牆 */}
            {!events || events.length === 0 ? (
                <div className="glass-card p-6 text-center text-white/60">
                    目前沒有可顯示的圖鑑項目。
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                    {events.map((event) => (
                        <CollectionCard
                            key={event.id}
                            id={event.id}
                            title={event.title}
                            imageUrl={event.image_url}
                            visualCardUrl={event.visual_card_url}
                            estimatedValue={event.estimated_value || 0}
                            seriesTag={event.series_tag}
                            owned={ownedMap.has(event.id)}
                            quantity={ownedMap.get(event.id)}
                        />
                    ))}
                </div>
            )}
        </section>
    );
}
