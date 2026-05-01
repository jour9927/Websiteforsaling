import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminSupabaseClient, createServerSupabaseClient } from "@/lib/auth";
import { AuctionPageClient } from "./AuctionPageClient";
import { getEstimatedBidCount } from "@/lib/simulatedBidCount";
import { getGlobalLinkV2VirtualHighest } from "@/lib/globalLinkV2VirtualBids";
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

    let currentAuction = auction;

    if (
        currentAuction.status === 'active' &&
        currentAuction.automation_mode === 'global_link_v2' &&
        new Date(currentAuction.end_time) <= new Date()
    ) {
        const adminSupabase = createAdminSupabaseClient();
        const { data: finalizerBids } = await adminSupabase
            .from('bids')
            .select('amount, created_at')
            .eq('auction_id', params.id)
            .gte('created_at', currentAuction.start_time)
            .order('created_at', { ascending: true });

        const virtualHighest = getGlobalLinkV2VirtualHighest({
            auctionId: params.id,
            startTime: currentAuction.start_time,
            endTime: currentAuction.end_time,
            startingPrice: currentAuction.starting_price,
            currentTime: new Date(currentAuction.end_time),
            targetMin: currentAuction.automation_target_min ?? 39000,
            targetMax: currentAuction.automation_target_max ?? 45000,
            stopSeconds: currentAuction.automation_stop_seconds ?? 1,
            realBids: finalizerBids ?? [],
        });

        const { error: finalizerError } = await adminSupabase.rpc("finalize_global_link_auto_follow_system", {
            p_auction_id: params.id,
            p_virtual_highest: virtualHighest,
        });

        if (finalizerError) {
            console.error("Global Link v2 auto-follow finalizer failed:", finalizerError);
        }

        const { data: refreshedAuction } = await supabase
            .from('auctions')
            .select('*, distributions(pokemon_name, pokemon_name_en, pokemon_sprite_url, original_trainer, trainer_id)')
            .eq('id', params.id)
            .single();

        currentAuction = refreshedAuction ?? currentAuction;
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

    // 取得本場次出價紀錄（依時間）。同一個競標重開時，用 start_time 切開舊場資料。
    const { data: bids } = await supabase
        .from('bids')
        .select('id, amount, created_at, profiles(full_name, email)')
        .eq('auction_id', params.id)
        .gte('created_at', currentAuction.start_time)
        .order('created_at', { ascending: false })
        .limit(50);

    // 最高價仍需用金額排序抓一次，避免「只抓最新 N 筆」時漏掉最高出價。
    const { data: highestBid } = await supabase
        .from('bids')
        .select('amount, profiles(full_name, email)')
        .eq('auction_id', params.id)
        .gte('created_at', currentAuction.start_time)
        .order('amount', { ascending: false })
        .limit(1)
        .maybeSingle();

    const sessionBids = (bids ?? []).map((bid) => ({
        id: bid.id,
        amount: bid.amount,
        created_at: bid.created_at,
        profiles: bid.profiles?.[0]
            ? {
                full_name: bid.profiles[0].full_name,
                email: bid.profiles[0].email
            }
            : undefined
    }));
    const sessionCurrentPrice = highestBid?.amount ?? 0;

    const imageUrl = currentAuction.image_url || currentAuction.distributions?.pokemon_sprite_url;
    const isEnded = new Date(currentAuction.end_time) < new Date() || currentAuction.status === 'ended';

    // 傳遞給 Client Component 的資料
    const clientProps = {
        auctionId: params.id,
        title: currentAuction.title,  // 新增：用於判斷是否為蒂安希
        realBids: sessionBids,
        startTime: currentAuction.start_time,
        startingPrice: currentAuction.starting_price,
        minIncrement: currentAuction.min_increment,
        endTime: currentAuction.end_time,
        isActive: !isEnded && currentAuction.status === 'active',
        realCurrentPrice: sessionCurrentPrice,
        realHighestBidder: highestBid?.profiles?.[0]?.full_name || highestBid?.profiles?.[0]?.email?.split('@')[0] || null,
        bidCount: sessionBids.length,
        automationMode: currentAuction.automation_mode === 'global_link_v2' ? 'global_link_v2' as const : 'legacy' as const,
        automationTargetMin: currentAuction.automation_target_min ?? 39000,
        automationTargetMax: currentAuction.automation_target_max ?? 45000,
        automationStopSeconds: currentAuction.automation_mode === 'global_link_v2'
            ? Math.max(1, currentAuction.automation_stop_seconds ?? 1)
            : currentAuction.automation_stop_seconds ?? 30
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
                        {currentAuction.bid_count >= 20 ? (
                            <span className="rounded-full bg-red-500/90 px-3 py-1 text-xs font-bold text-white animate-pulse">
                                🔥🔥🔥 白熱化
                            </span>
                        ) : currentAuction.bid_count >= 10 ? (
                            <span className="rounded-full bg-orange-500/80 px-3 py-1 text-xs font-bold text-white">
                                🔥🔥 激烈
                            </span>
                        ) : currentAuction.bid_count >= 5 ? (
                            <span className="rounded-full bg-yellow-600/80 px-3 py-1 text-xs font-medium text-white">
                                🔥 熱門
                            </span>
                        ) : null}
                    </div>

                    {/* 標題：主標題 + 活動名稱分行 */}
                    {(() => {
                        const [mainTitle, eventName] = currentAuction.title.split('\n');
                        return (
                            <div className="mt-4">
                                <h1 className="text-3xl font-semibold text-white">{mainTitle}</h1>
                                {eventName && (
                                    <p className="mt-1 text-sm text-purple-300">{eventName}</p>
                                )}
                            </div>
                        );
                    })()}

                    {currentAuction.distributions && (
                        <div className="mt-2 text-sm text-white/60">
                            配布資訊：{currentAuction.distributions.original_trainer && `OT: ${currentAuction.distributions.original_trainer}`}
                            {currentAuction.distributions.trainer_id && ` / ID: ${currentAuction.distributions.trainer_id}`}
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
                                        alt={currentAuction.title}
                                        className="max-h-full max-w-full object-contain p-8"
                                    />
                                </div>
                            ) : (
                                <div className="flex h-80 items-center justify-center bg-gradient-to-br from-purple-900/30 to-blue-900/30 text-6xl text-white/20">
                                    🎁
                                </div>
                            )}
                        </article>

                        {currentAuction.description && (
                            <article className="glass-card p-6">
                                <h2 className="text-lg font-semibold text-white/90">競標說明</h2>
                                <p className="mt-4 whitespace-pre-wrap text-sm text-slate-200/80">
                                    {currentAuction.description}
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
                            endTime={currentAuction.end_time}
                            isEnded={isEnded}
                            disableExtension={currentAuction.automation_mode === 'global_link_v2'}
                        />

                        {/* 目前最高價 - 由 Client 控制 */}
                        <div id="highest-price-slot" />

                        {/* 競標資訊 */}
                        <div className="space-y-2 border-y border-white/10 py-4 text-sm">
                            <div className="flex justify-between">
                                <span className="text-white/60">起標價</span>
                                <span className="text-white/90">${currentAuction.starting_price.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-white/60">最低加價</span>
                                <span className="text-white/90">+${currentAuction.min_increment.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-white/60">出價次數</span>
                                <span className="text-white/90">
                                    {currentAuction.bid_count + getEstimatedBidCount({
                                        auctionId: currentAuction.id,
                                        startTime: currentAuction.start_time || new Date(new Date(currentAuction.end_time).getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
                                        endTime: currentAuction.end_time,
                                        currentTime: currentAuction.status === 'ended' ? new Date(currentAuction.end_time) : new Date()
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
                        ) : currentAuction.status !== 'active' ? (
                            <div className="rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-center text-sm text-white/60">
                                競標尚未開始
                            </div>
                        ) : (
                            /* BidButton 由 AuctionPageClient Portal 渲染以獲取模擬最高價 */
                            <div id="bid-button-slot" />
                        )}

                        {/* 結束時間 */}
                        <div className="mt-2 text-center text-xs text-white/50">
                            結束時間: {new Date(currentAuction.end_time).toLocaleString('zh-TW')}
                        </div>

                        {/* 即時動態側欄 - 由 Client 控制 */}
                        <div id="sidebar-activity-slot" />
                    </aside>
                </section>
            </div>
        </AuctionPageClient>
    );
}
