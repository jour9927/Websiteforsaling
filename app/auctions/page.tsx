import { createServerSupabaseClient } from "@/lib/auth";
import AuctionCard from "@/components/AuctionCard";
import { SkinAuctions } from "@/components/skin/SkinAuctions";
import { getUiMode } from "@/lib/ui-mode.server";
import { isSkinMode } from "@/lib/ui-mode";
// [春節活動] 明年再啟用
// import { SpringFestivalBanner } from "@/components/SpringFestivalBanner";

export const dynamic = 'force-dynamic';

export default async function AuctionsPage() {
    const supabase = createServerSupabaseClient();

    const now = new Date().toISOString();
    const { data: auctions } = await supabase
        .from('auctions')
        .select('*, distributions(pokemon_name, pokemon_name_en, image_url)')
        .in('status', ['active', 'ended'])
        .order('start_time', { ascending: true });

    // 正在進行：start_time <= now AND end_time > now AND status = active
    const activeAuctions = auctions?.filter(a =>
        a.status === 'active' && a.start_time <= now && a.end_time > now
    ) || [];

    // 即將開始：start_time > now AND status = active（下一場）
    const upcomingAuction = auctions?.find(a =>
        a.status === 'active' && a.start_time > now
    );

    // 已結束：status = ended，或 status = active 但 end_time 已過
    const endedAuctions = auctions?.filter(a =>
        a.status === 'ended' || (a.status === 'active' && a.end_time <= now)
    ).sort((a, b) => new Date(b.end_time).getTime() - new Date(a.end_time).getTime()) || [];

    if (isSkinMode(getUiMode())) {
        return (
            <SkinAuctions
                activeAuctions={activeAuctions}
                endedAuctions={endedAuctions.slice(0, 6)}
                endedTotal={endedAuctions.length}
                upcomingAuction={upcomingAuction ?? null}
            />
        );
    }

    return (
        <div className="flex flex-col gap-8">
            <header className="glass-card p-6">
                <h1 className="text-2xl font-semibold text-white/90">🔨 競標專區</h1>
                <p className="mt-2 text-sm text-white/60">
                    群內成員專屬的限時競標活動，把握機會贏得珍貴的配布寶可夢！
                </p>
            </header>

            {/* [春節活動] 明年再啟用 */}
            {/* <SpringFestivalBanner /> */}

            {/* 進行中的競標 */}
            <section>
                <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white/90">
                    <span className="inline-block h-2 w-2 rounded-full bg-green-400 animate-pulse"></span>
                    進行中 ({activeAuctions.length})
                </h2>

                {activeAuctions.length === 0 ? (
                    <div className="glass-card p-8 text-center text-white/60">
                        {upcomingAuction ? (
                            <p>下一場競標將於 {new Date(upcomingAuction.start_time).toLocaleTimeString("zh-TW", { timeZone: "Asia/Taipei", hour: "2-digit", minute: "2-digit" })} 開始：<strong className="text-amber-400">{upcomingAuction.title}</strong></p>
                        ) : (
                            <p>目前沒有進行中的競標，請稍後再來查看！</p>
                        )}
                    </div>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {activeAuctions.map((auction) => (
                            <AuctionCard key={auction.id} auction={auction} />
                        ))}
                    </div>
                )}
            </section>

            {/* 已結束的競標 */}
            {endedAuctions.length > 0 && (
                <section>
                    <h2 className="mb-4 text-lg font-semibold text-white/70">
                        已結標 ({endedAuctions.length})
                    </h2>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 opacity-60">
                        {endedAuctions.slice(0, 6).map((auction) => (
                            <AuctionCard key={auction.id} auction={auction} />
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}
