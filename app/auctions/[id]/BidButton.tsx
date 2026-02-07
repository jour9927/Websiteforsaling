"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type BidButtonProps = {
    auctionId: string;
    minIncrement: number;
    currentPrice: number;      // 真實最高價（從資料庫）
    startingPrice: number;     // 起標價
    simulatedHighest?: number; // 模擬最高價（從 Client 傳入）
};

export default function BidButton({
    auctionId,
    minIncrement,
    currentPrice,
    startingPrice,
    simulatedHighest = 0
}: BidButtonProps) {
    const router = useRouter();

    // 計算有效最高價（真實 vs 模擬取大者）
    const effectiveHighest = Math.max(currentPrice, simulatedHighest, startingPrice);

    // 最低出價 = 有效最高價 + 最低加價
    const minBid = effectiveHighest + minIncrement;

    const [bidAmount, setBidAmount] = useState(minBid);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // 當 minBid 變化時更新預設出價金額
    useEffect(() => {
        setBidAmount(minBid);
    }, [minBid]);

    const handleQuickBid = (increment: number) => {
        setBidAmount(effectiveHighest + increment);
    };

    const handleBid = async () => {
        if (bidAmount < minBid) {
            setError(`出價金額需 ≥ $${minBid.toLocaleString()}`);
            return;
        }

        setLoading(true);
        setError("");
        setSuccess("");

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setError("請先登入");
                return;
            }

            // 使用 RPC 函數出價
            const { data, error: rpcError } = await supabase
                .rpc('place_bid', {
                    p_auction_id: auctionId,
                    p_user_id: user.id,
                    p_amount: bidAmount
                });

            if (rpcError) throw rpcError;

            const result = data as { success: boolean; error?: string; bid_id?: string };

            if (!result.success) {
                setError(result.error || "出價失敗");
                return;
            }

            setSuccess("出價成功！");
            router.refresh();

            // 更新為下一個最低出價金額
            setBidAmount(bidAmount + minIncrement);
        } catch (err) {
            setError(err instanceof Error ? err.message : "出價失敗");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            {error && (
                <div className="rounded-lg bg-red-500/20 border border-red-500/50 px-3 py-2 text-sm text-red-100">
                    {error}
                </div>
            )}

            {success && (
                <div className="rounded-lg bg-green-500/20 border border-green-500/50 px-3 py-2 text-sm text-green-100">
                    {success}
                </div>
            )}

            {/* 快速加價按鈕 */}
            <div className="flex gap-2">
                <button
                    onClick={() => handleQuickBid(minIncrement)}
                    className="flex-1 rounded-lg border border-white/20 bg-white/10 py-2 text-sm font-medium text-white/90 transition hover:bg-white/20"
                >
                    +${minIncrement}
                </button>
                <button
                    onClick={() => handleQuickBid(minIncrement * 2)}
                    className="flex-1 rounded-lg border border-white/20 bg-white/10 py-2 text-sm font-medium text-white/90 transition hover:bg-white/20"
                >
                    +${minIncrement * 2}
                </button>
                <button
                    onClick={() => handleQuickBid(minIncrement * 5)}
                    className="flex-1 rounded-lg border border-white/20 bg-white/10 py-2 text-sm font-medium text-white/90 transition hover:bg-white/20"
                >
                    +${minIncrement * 5}
                </button>
            </div>

            {/* 手動輸入 */}
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60">$</span>
                    <input
                        type="number"
                        min={minBid}
                        value={bidAmount}
                        onChange={(e) => setBidAmount(parseInt(e.target.value) || minBid)}
                        className="w-full rounded-xl border border-white/20 bg-white/10 py-3 pl-8 pr-4 text-lg font-semibold text-white text-center focus:border-white/40 focus:outline-none"
                    />
                </div>
            </div>

            <p className="text-center text-xs text-white/50">
                最低出價: ${minBid.toLocaleString()}
                {simulatedHighest > currentPrice && (
                    <span className="text-purple-300"> (目前點數不可用)</span>
                )}
            </p>

            {/* 出價按鈕 */}
            <button
                onClick={handleBid}
                disabled={loading || bidAmount < minBid}
                className="w-full rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 py-4 text-lg font-bold text-white shadow-lg transition hover:from-yellow-400 hover:to-orange-400 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {loading ? "處理中..." : `出價 $${bidAmount.toLocaleString()}`}
            </button>
        </div>
    );
}
