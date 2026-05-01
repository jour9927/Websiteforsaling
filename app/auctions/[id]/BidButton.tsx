"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { AuctionAutomationMode } from "@/hooks/useSimulatedAuction";

type BidButtonProps = {
    auctionId: string;
    minIncrement: number;
    currentPrice: number;      // 真實最高價（從資料庫）
    startingPrice: number;     // 起標價
    endTime: string;
    simulatedHighest?: number; // 模擬最高價（從 Client 傳入）
    automationMode?: AuctionAutomationMode;
    automationStopSeconds?: number;
};

type AutoFollowSetting = {
    enabled: boolean;
    follow_increment: number;
};

type RpcResult = {
    success?: boolean;
    error?: string;
    message?: string;
    placed?: boolean;
    amount?: number;
};

const AUTO_FOLLOW_SYSTEM_MAX_BID = 100000;
const MIN_AUTO_FOLLOW_INCREMENT = 1;
const MAX_AUTO_FOLLOW_INCREMENT = 10000;
const DEFAULT_AUTO_FOLLOW_INCREMENT = 70;

function normalizeAutoFollowIncrement(value: number) {
    if (!Number.isFinite(value)) return DEFAULT_AUTO_FOLLOW_INCREMENT;
    return Math.min(
        MAX_AUTO_FOLLOW_INCREMENT,
        Math.max(MIN_AUTO_FOLLOW_INCREMENT, Math.trunc(value))
    );
}

export default function BidButton({
    auctionId,
    minIncrement,
    currentPrice,
    startingPrice,
    endTime,
    simulatedHighest = 0,
    automationMode = "legacy",
    automationStopSeconds = 30
}: BidButtonProps) {
    const router = useRouter();
    const isGlobalLinkV2 = automationMode === "global_link_v2";

    // 計算有效最高價（真實 vs 模擬取大者）
    const effectiveHighest = Math.max(currentPrice, simulatedHighest, startingPrice);

    // 最低出價 = 有效最高價 + 最低加價
    const minBid = effectiveHighest + minIncrement;

    const [bidAmount, setBidAmount] = useState(minBid);
    const [loading, setLoading] = useState(false);
    const [autoFollowLoading, setAutoFollowLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [hasAuctionCoupon, setHasAuctionCoupon] = useState(false);
    const [autoFollowEnabled, setAutoFollowEnabled] = useState(false);
    const [autoFollowStateLoaded, setAutoFollowStateLoaded] = useState(false);
    const [showCouponPrompt, setShowCouponPrompt] = useState(false);
    const [couponPromptDismissed, setCouponPromptDismissed] = useState(false);
    const [followIncrement, setFollowIncrement] = useState(DEFAULT_AUTO_FOLLOW_INCREMENT);
    const lastAutoBidAmountRef = useRef(0);
    const finalAutoFollowInFlightRef = useRef(false);
    const finalAutoFollowLastKeyRef = useRef("");

    // 當 minBid 變化時更新預設出價金額
    useEffect(() => {
        setBidAmount(minBid);
    }, [minBid]);

    useEffect(() => {
        if (!isGlobalLinkV2) return;

        let cancelled = false;
        setAutoFollowStateLoaded(false);
        setShowCouponPrompt(false);
        setCouponPromptDismissed(false);

        const loadAutoFollowState = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user || cancelled) {
                if (!cancelled) setAutoFollowStateLoaded(true);
                return;
            }

            const [{ data: coupon }, { data: setting }] = await Promise.all([
                supabase
                    .from("backpack_items")
                    .select("id")
                    .eq("user_id", user.id)
                    .eq("item_type", "auction_fee_rebate_30")
                    .eq("is_active", true)
                    .or("expires_at.is.null,expires_at.gt.now()")
                    .limit(1)
                    .maybeSingle(),
                supabase
                    .from("auction_auto_follow_settings")
                    .select("enabled, follow_increment")
                    .eq("auction_id", auctionId)
                    .eq("user_id", user.id)
                    .maybeSingle()
            ]);

            if (cancelled) return;

            setHasAuctionCoupon(Boolean(coupon));
            if (setting) {
                const autoSetting = setting as AutoFollowSetting;
                setAutoFollowEnabled(autoSetting.enabled);
                setFollowIncrement(normalizeAutoFollowIncrement(autoSetting.follow_increment ?? DEFAULT_AUTO_FOLLOW_INCREMENT));
            }
            setAutoFollowStateLoaded(true);
        };

        loadAutoFollowState();

        return () => {
            cancelled = true;
        };
    }, [auctionId, isGlobalLinkV2]);

    useEffect(() => {
        if (
            !isGlobalLinkV2 ||
            !autoFollowStateLoaded ||
            !hasAuctionCoupon ||
            autoFollowEnabled ||
            couponPromptDismissed
        ) {
            return;
        }

        setShowCouponPrompt(true);
    }, [
        autoFollowEnabled,
        autoFollowStateLoaded,
        couponPromptDismissed,
        hasAuctionCoupon,
        isGlobalLinkV2
    ]);

    const submitBid = useCallback(async (amount: number, source: "manual" | "auto" = "manual") => {
        if (source === "manual" && amount < minBid) {
            setError(`出價金額需 ≥ $${minBid.toLocaleString()}`);
            return false;
        }

        if (source === "auto" && amount <= Math.max(currentPrice, startingPrice)) {
            return false;
        }

        setLoading(source === "manual");
        setError("");
        setSuccess("");

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setError("請先登入");
                return false;
            }

            // 使用 RPC 函數出價
            const { data, error: rpcError } = await supabase
                .rpc("place_bid", {
                    p_auction_id: auctionId,
                    p_user_id: user.id,
                    p_amount: amount
                });

            if (rpcError) throw rpcError;

            const result = data as RpcResult | null;
            if (result && result.success === false) {
                setError(result.error || "出價失敗");
                return false;
            }

            setSuccess(source === "auto" ? `已自動跟標 $${amount.toLocaleString()}` : `成功出價 $${amount.toLocaleString()}！`);
            window.dispatchEvent(new CustomEvent("bidPlaced", { detail: { auctionId } }));
            router.refresh();
            return true;
        } catch (err) {
            console.error("Bid error:", err);
            setError("出價失敗，請稍後再試");
            return false;
        } finally {
            if (source === "manual") setLoading(false);
        }
    }, [auctionId, currentPrice, minBid, router, startingPrice]);

    useEffect(() => {
        if (!isGlobalLinkV2 || !autoFollowEnabled || autoFollowLoading || loading) return;

        const normalizedFollowIncrement = normalizeAutoFollowIncrement(followIncrement);
        const effectiveHighest = Math.max(currentPrice, simulatedHighest, startingPrice);
        const targetAmount = effectiveHighest + normalizedFollowIncrement;
        if (
            targetAmount <= currentPrice ||
            targetAmount > AUTO_FOLLOW_SYSTEM_MAX_BID ||
            targetAmount <= lastAutoBidAmountRef.current
        ) {
            return;
        }

        const timer = setTimeout(async () => {
            lastAutoBidAmountRef.current = targetAmount;
            const ok = await submitBid(targetAmount, "auto");
            if (!ok) lastAutoBidAmountRef.current = Math.max(lastAutoBidAmountRef.current, currentPrice);
        }, 0);

        return () => clearTimeout(timer);
    }, [
        autoFollowEnabled,
        autoFollowLoading,
        currentPrice,
        followIncrement,
        isGlobalLinkV2,
        loading,
        simulatedHighest,
        startingPrice,
        submitBid,
        lastAutoBidAmountRef
    ]);

    const finalizeAutoFollow = useCallback(async () => {
        if (!isGlobalLinkV2 || !autoFollowEnabled || finalAutoFollowInFlightRef.current) return;

        const virtualHighest = Math.max(simulatedHighest, startingPrice);
        const normalizedFollowIncrement = normalizeAutoFollowIncrement(followIncrement);
        const expectedAmount = virtualHighest + normalizedFollowIncrement;
        const attemptKey = `${auctionId}:${virtualHighest}:${expectedAmount}:${currentPrice}`;

        if (
            expectedAmount <= currentPrice ||
            expectedAmount > AUTO_FOLLOW_SYSTEM_MAX_BID ||
            attemptKey === finalAutoFollowLastKeyRef.current
        ) {
            return;
        }

        finalAutoFollowInFlightRef.current = true;
        finalAutoFollowLastKeyRef.current = attemptKey;

        try {
            const { data, error: rpcError } = await supabase.rpc("finalize_global_link_auto_follow", {
                p_auction_id: auctionId,
                p_virtual_highest: virtualHighest
            });

            if (rpcError) throw rpcError;

            const result = data as RpcResult | null;
            if (result && result.success === false) {
                if (result.error && result.error !== "尚未進入最終跟標時間") {
                    setError(result.error);
                }
                return;
            }

            if (result?.placed) {
                const placedAmount = Number(result.amount ?? expectedAmount);
                setSuccess(`已於最後一刻自動跟標 $${placedAmount.toLocaleString()}`);
                window.dispatchEvent(new CustomEvent("bidPlaced", { detail: { auctionId } }));
                router.refresh();
            }
        } catch (err) {
            console.error("Final auto-follow error:", err);
        } finally {
            finalAutoFollowInFlightRef.current = false;
        }
    }, [
        auctionId,
        autoFollowEnabled,
        currentPrice,
        followIncrement,
        isGlobalLinkV2,
        router,
        simulatedHighest,
        startingPrice
    ]);

    useEffect(() => {
        if (!isGlobalLinkV2 || !autoFollowEnabled || autoFollowLoading || loading) return;

        const endMs = new Date(endTime).getTime();
        if (!Number.isFinite(endMs)) return;

        const safeStopMs = Math.max(1, automationStopSeconds) * 1000;
        const finalWindowOffsets = [
            Math.floor(safeStopMs * 0.8),
            Math.floor(safeStopMs * 0.5),
            Math.floor(safeStopMs * 0.2),
        ]
            .filter((value, index, array) => value >= 120 && array.findIndex((v) => v === value) === index)
            .map((value) => Math.max(120, value));

        const timers = finalWindowOffsets.map((offsetMs) => {
            const delay = Math.max(0, endMs - Date.now() - offsetMs);
            return window.setTimeout(() => {
                void finalizeAutoFollow();
            }, delay);
        });

        return () => {
            timers.forEach((timer) => window.clearTimeout(timer));
        };
    }, [
        autoFollowEnabled,
        autoFollowLoading,
        endTime,
        finalizeAutoFollow,
        automationStopSeconds,
        isGlobalLinkV2,
        loading
    ]);

    const handleQuickBid = (extra: number) => {
        setBidAmount(minBid + extra);
    };

    const handleBid = async () => {
        await submitBid(bidAmount, "manual");
    };

    const handleEnableAutoFollow = async () => {
        setAutoFollowLoading(true);
        setError("");
        setSuccess("");
        const normalizedFollowIncrement = normalizeAutoFollowIncrement(followIncrement);
        setFollowIncrement(normalizedFollowIncrement);

        try {
            const { data, error: rpcError } = await supabase.rpc("configure_auction_auto_follow", {
                p_auction_id: auctionId,
                p_follow_increment: normalizedFollowIncrement,
                p_max_bid: AUTO_FOLLOW_SYSTEM_MAX_BID
            });

            if (rpcError) throw rpcError;

            const result = data as RpcResult | null;
            if (result && result.success === false) {
                setError(result.error || "自動跟標啟用失敗");
                return;
            }

            setAutoFollowEnabled(true);
            setHasAuctionCoupon(false);
            setShowCouponPrompt(false);
            setCouponPromptDismissed(true);
            setSuccess(autoFollowEnabled ? "自動跟標設定已更新" : result?.message || "自動跟標已啟用");
        } catch (err) {
            console.error("Auto follow error:", err);
            setError("自動跟標啟用失敗，請稍後再試");
        } finally {
            setAutoFollowLoading(false);
        }
    };

    const couponPrompt = showCouponPrompt && typeof document !== "undefined"
        ? createPortal(
            <div
                className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
                role="dialog"
                aria-modal="true"
                aria-labelledby="auction-coupon-prompt-title"
            >
                <div className="w-full max-w-md rounded-2xl border border-cyan-300/40 bg-slate-950 p-5 shadow-2xl shadow-cyan-950/40">
                    <div className="flex items-start gap-4">
                        <div className="relative shrink-0 overflow-hidden rounded-xl border border-amber-200/60 bg-gradient-to-br from-amber-200 via-yellow-400 to-orange-500 p-[1px] shadow-lg shadow-amber-950/30">
                            <div className="flex h-20 w-24 flex-col items-center justify-center rounded-[11px] border border-white/25 bg-slate-950/90 text-center">
                                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-100">Auction</span>
                                <span className="text-3xl font-black leading-none text-amber-200">30%</span>
                                <span className="text-[10px] font-semibold text-amber-100/85">抵用券</span>
                            </div>
                            <div className="absolute -left-2 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-slate-950" />
                            <div className="absolute -right-2 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-slate-950" />
                        </div>
                        <div className="space-y-2">
                            <p id="auction-coupon-prompt-title" className="text-lg font-bold text-cyan-50">
                                您有一張 30% 的優惠卷，是否使用？
                            </p>
                            <p className="text-sm leading-relaxed text-cyan-100/75">
                                使用本卷後成功得標後，自動套用本卷，若未得標則不影響卷的消耗，若於進場前未使用本卷，入場後不得再使用。
                            </p>
                        </div>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-2">
                        <button
                            onClick={() => {
                                setCouponPromptDismissed(true);
                                setShowCouponPrompt(false);
                            }}
                            disabled={autoFollowLoading}
                            className="rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm font-semibold text-white/80 transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            暫不使用
                        </button>
                        <button
                            onClick={handleEnableAutoFollow}
                            disabled={autoFollowLoading}
                            className="rounded-lg bg-cyan-400 px-3 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {autoFollowLoading ? "處理中..." : "使用並啟用"}
                        </button>
                    </div>
                </div>
            </div>,
            document.body
        )
        : null;

    return (
        <div className="space-y-3">
            {couponPrompt}

            {/* 錯誤/成功訊息 */}
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
                {[5, 10, 15].map((inc) => (
                    <button
                        key={inc}
                        onClick={() => handleQuickBid(inc)}
                        className="flex-1 rounded-lg border border-white/20 bg-white/10 py-2 text-sm font-medium text-white/90 transition hover:bg-white/20"
                    >
                        +${inc}
                    </button>
                ))}
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
                        data-bid-input
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

            {isGlobalLinkV2 && (
                <div className="rounded-xl border border-cyan-400/30 bg-cyan-400/10 p-3">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <p className="text-sm font-semibold text-cyan-100">30% 抵用券自動跟標</p>
                            <p className="mt-1 text-xs text-cyan-100/70">
                                使用後會立即啟用自動跟標，自動跟標會依據您的設定盡可能跟標，但不保證一定得標；加價數字越高，越有機會跟上競標節奏。
                            </p>
                        </div>
                        <span className={`rounded-full px-2 py-1 text-xs ${autoFollowEnabled ? "bg-green-500/20 text-green-100" : "bg-white/10 text-white/60"}`}>
                            {autoFollowEnabled ? "已啟用" : "未啟用"}
                        </span>
                    </div>

                    <div className="mt-3">
                        <label className="text-xs text-cyan-100/80">
                            跟標加價（最低 1 元）
                            <input
                                type="number"
                                min={MIN_AUTO_FOLLOW_INCREMENT}
                                max={MAX_AUTO_FOLLOW_INCREMENT}
                                value={followIncrement}
                                onChange={(e) => setFollowIncrement(normalizeAutoFollowIncrement(parseInt(e.target.value, 10)))}
                                disabled={autoFollowLoading}
                                className="mt-1 w-full rounded-lg border border-cyan-100/20 bg-black/20 px-3 py-2 text-sm text-white focus:border-cyan-100/50 focus:outline-none"
                            />
                        </label>
                    </div>

                    <div className="mt-3 space-y-2">
                        <button
                            onClick={handleEnableAutoFollow}
                            disabled={autoFollowLoading || (!autoFollowEnabled && !hasAuctionCoupon)}
                            className="w-full rounded-lg bg-cyan-400 px-3 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {autoFollowLoading
                                ? "處理中..."
                                : autoFollowEnabled
                                    ? "更新跟標設定"
                                    : hasAuctionCoupon
                                        ? "使用抵用券並啟用"
                                        : "未持有可用抵用券"}
                        </button>
                        {autoFollowEnabled && (
                            <p className="text-xs leading-relaxed text-cyan-100/70">
                                自動跟標已啟用。本場啟用後不可停用，可調整跟標金額。
                            </p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
