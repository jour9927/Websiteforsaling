import { createServerSupabaseClient } from "@/lib/auth";
import AuctionCard from "@/components/AuctionCard";

export const dynamic = 'force-dynamic';

export default async function AuctionsPage() {
    const supabase = createServerSupabaseClient();

    // 取得所有進行中和已結束的競標
    const now = new Date().toISOString();
    const { data: auctions } = await supabase
        .from('auctions')
        .select('*, distributions(pokemon_name, pokemon_name_en, image_url)')
        .in('status', ['active', 'ended'])
        .order('end_time', { ascending: true });

    // 只顯示「已開始」的 active 競標（start_time <= now）
    const activeAuctions = auctions?.filter(a => a.status === 'active' && a.start_time <= now) || [];
    const endedAuctions = auctions?.filter(a => a.status === 'ended')
        .sort((a, b) => new Date(b.end_time).getTime() - new Date(a.end_time).getTime()) || [];

    return (
        <div className="flex flex-col gap-8">
            <header className="glass-card p-6">
                <h1 className="text-2xl font-semibold text-white/90">🔨 競標專區</h1>
                <p className="mt-2 text-sm text-white/60">
                    群內成員專屬的限時競標活動，把握機會贏得珍貴的配布寶可夢！
                </p>
            </header>

            {/* 進行中的競標 */}
            <section>
                <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white/90">
                    <span className="inline-block h-2 w-2 rounded-full bg-green-400 animate-pulse"></span>
                    進行中 ({activeAuctions.length})
                </h2>

                {activeAuctions.length === 0 ? (
                    <div className="glass-card p-8 text-center text-white/60">
                        目前沒有進行中的競標，請稍後再來查看！
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
