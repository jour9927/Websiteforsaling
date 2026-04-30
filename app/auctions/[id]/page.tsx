import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/auth";
import { AuctionPageClient } from "./AuctionPageClient";
import { getEstimatedBidCount } from "@/lib/simulatedBidCount";
import CountdownTimer from "./CountdownTimer";

type AuctionPageProps = {
    params: { id: string };
};

export const dynamic = 'force-dynamic';

export default async function AuctionPage({ params }: AuctionPageProps) {
    const supabase = createServerSupabaseClient();

    // 取得競標資訊
    const { data: auction, error } = await supabase
        .from('auctions')
        .select('*, distributions(pokemon_name, pokemon_name_en, pokemon_sprite_url, original_trainer, trainer_id)')
        .eq('id', params.id)
        .single();

    if (error || !auction) {
        notFound();
    }

    // 取得當前用戶
    const { data: { user } } = await supabase.auth.getUser();

    // 取得用戶 profile 以檢查角色
    let userProfile = null;
    if (user) {
        const { data } = await supabase
            .from('profiles')
            .select('role, full_name')
            .eq('id', user.id)
            .single();
        userProfile = data;
    }

    // 取得本場次出價紀錄。同一個競標重開時，用 start_time 切開舊場資料。
    const { data: bids } = await supabase
        .from('bids')
        .select('*, profiles(full_name, email)')
        .eq('auction_id', params.id)
        .gte('created_at', auction.start_time)
        .order('amount', { ascending: false })
        .limit(20);

    const sessionBids = bids || [];
    const sessionHighestBid = sessionBids[0] || null;
    const sessionCurrentPrice = sessionHighestBid?.amount ?? 0;

    const imageUrl = auction.image_url || auction.distributions?.pokemon_sprite_url;
    const isEnded = new Date(auction.end_time) < new Date() || auction.status === 'ended';

    // 傳遞給 Client Component 的資料
    const clientProps = {
        auctionId: params.id,
        title: auction.title,  // 新增：用於判斷是否為蒂安希
        realBids: sessionBids,
        startTime: auction.start_time,
        startingPrice: auction.starting_price,
        minIncrement: auction.min_increment,
        endTime: auction.end_time,
        isActive: !isEnded && auction.status === 'active',
        realCurrentPrice: sessionCurrentPrice,
        realHighestBidder: sessionHighestBid?.profiles?.full_name || sessionHighestBid?.profiles?.email?.split('@')[0] || null,
        bidCount: sessionBids.length,
        automationMode: auction.automation_mode === 'global_link_v2' ? 'global_link_v2' as const : 'legacy' as const,
        automationTargetMin: auction.automation_target_min ?? 35000,
        automationTargetMax: auction.automation_target_max ?? 40000,
        automationStopSeconds: auction.automation_mode === 'global_link_v2'
            ? 3
            : auction.automation_stop_seconds ?? 30
    };

    return (
        <AuctionPageClient {...clientProps}>
            <div className="flex flex-col gap-8">
                <header className="glass-card p-6">
                    <Link href="/auctions" className="text-sm text-slate-200/80 hover:text-white">
                        ← 返回競標列表
                    </Link>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                        {isEnded ? (
                            <span className="rounded-full bg-gray-500/20 px-3 py-1 text-xs font-medium text-gray-200">
                                已結標
                            </span>
                        ) : (
                            <>
                                <span className="rounded-full bg-green-500/20 px-3 py-1 text-xs font-medium text-green-200 animate-pulse">
                                    🔴 競標進行中
                                </span>
                                {/* 在線人數顯示 - 由 Client 控制 */}
                                <div id="viewer-count-slot" />
                            </>
                        )}
                        {auction.bid_count >= 20 ? (
                            <span className="rounded-full bg-red-500/90 px-3 py-1 text-xs font-bold text-white animate-pulse">
                                🔥🔥🔥 白熱化
                            </span>
                        ) : auction.bid_count >= 10 ? (
                            <span className="rounded-full bg-orange-500/80 px-3 py-1 text-xs font-bold text-white">
                                🔥🔥 激烈
                            </span>
                        ) : auction.bid_count >= 5 ? (
                            <span className="rounded-full bg-yellow-600/80 px-3 py-1 text-xs font-medium text-white">
                                🔥 熱門
                            </span>
                        ) : null}
                    </div>

                    {/* 標題：主標題 + 活動名稱分行 */}
                    {(() => {
                        const [mainTitle, eventName] = auction.title.split('\n');
                        return (
                            <div className="mt-4">
                                <h1 className="text-3xl font-semibold text-white">{mainTitle}</h1>
                                {eventName && (
                                    <p className="mt-1 text-sm text-purple-300">{eventName}</p>
                                )}
                            </div>
                        );
                    })()}

                    {auction.distributions && (
                        <div className="mt-2 text-sm text-white/60">
                            配布資訊：{auction.distributions.original_trainer && `OT: ${auction.distributions.original_trainer}`}
                            {auction.distributions.trainer_id && ` / ID: ${auction.distributions.trainer_id}`}
                        </div>
                    )}
                </header>

                <section className="grid gap-6 md:grid-cols-[2fr_1fr]">
                    {/* 左側：圖片與說明 */}
                    <div className="space-y-6">
                        <article className="glass-card overflow-hidden p-0">
                            {imageUrl ? (
                                <div className="flex h-80 items-center justify-center bg-gradient-to-br from-purple-900/30 to-blue-900/30">
                                    <img
                                        src={imageUrl}
                                        alt={auction.title}
                                        className="max-h-full max-w-full object-contain p-8"
                                    />
                                </div>
                            ) : (
                                <div className="flex h-80 items-center justify-center bg-gradient-to-br from-purple-900/30 to-blue-900/30 text-6xl text-white/20">
                                    🎁
                                </div>
                            )}
                        </article>

                        {auction.description && (
                            <article className="glass-card p-6">
                                <h2 className="text-lg font-semibold text-white/90">競標說明</h2>
                                <p className="mt-4 whitespace-pre-wrap text-sm text-slate-200/80">
                                    {auction.description}
                                </p>
                            </article>
                        )}

                        {/* 出價紀錄 - 由 Client 控制 */}
                        <div id="bid-history-slot" />
                    </div>

                    {/* 右側：出價區塊 */}
                    <aside className="glass-card flex flex-col gap-4 p-6 h-fit sticky top-24">
                        {/* 倒數計時器 */}
                        <CountdownTimer
                            endTime={auction.end_time}
                            isEnded={isEnded}
                            disableExtension={auction.automation_mode === 'global_link_v2'}
                        />

                        {/* 目前最高價 - 由 Client 控制 */}
                        <div id="highest-price-slot" />

                        {/* 競標資訊 */}
                        <div className="space-y-2 border-y border-white/10 py-4 text-sm">
                            <div className="flex justify-between">
                                <span className="text-white/60">起標價</span>
                                <span className="text-white/90">${auction.starting_price.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-white/60">最低加價</span>
                                <span className="text-white/90">+${auction.min_increment.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-white/60">出價次數</span>
                                <span className="text-white/90">
                                    {auction.bid_count + getEstimatedBidCount({
                                        auctionId: auction.id,
                                        startTime: auction.start_time || new Date(new Date(auction.end_time).getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
                                        endTime: auction.end_time,
                                        currentTime: auction.status === 'ended' ? new Date(auction.end_time) : new Date()
                                    })} 次
                                </span>
                            </div>
                        </div>

                        {/* 出價區 */}
                        {!user ? (
                            <Link
                                href={`/login?redirect=/auctions/${params.id}`}
                                className="rounded-xl bg-white/20 px-4 py-3 text-center text-sm font-semibold text-white/90 transition hover:bg-white/30"
                            >
                                登入以出價
                            </Link>
                        ) : !userProfile || !['member', 'admin'].includes(userProfile.role) ? (
                            <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-center text-sm text-yellow-200">
                                ⚠️ 需要群內成員資格才能出價
                            </div>
                        ) : isEnded ? (
                            <div className="rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-center text-sm text-white/60">
                                競標已結束
                            </div>
                        ) : auction.status !== 'active' ? (
                            <div className="rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-center text-sm text-white/60">
                                競標尚未開始
                            </div>
                        ) : (
                            /* BidButton 由 AuctionPageClient Portal 渲染以獲取模擬最高價 */
                            <div id="bid-button-slot" />
                        )}

                        {/* 結束時間 */}
                        <div className="mt-2 text-center text-xs text-white/50">
                            結束時間: {new Date(auction.end_time).toLocaleString('zh-TW')}
                        </div>

                        {/* 即時動態側欄 - 由 Client 控制 */}
                        <div id="sidebar-activity-slot" />
                    </aside>
                </section>
            </div>
        </AuctionPageClient>
    );
}
