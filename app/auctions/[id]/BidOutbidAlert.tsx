"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

interface BidOutbidAlertProps {
    auctionId: string;
    isActive: boolean;
}

export default function BidOutbidAlert({ auctionId, isActive }: BidOutbidAlertProps) {
    const [outbid, setOutbid] = useState(false);
    const [newPrice, setNewPrice] = useState(0);
    const [newBidderName, setNewBidderName] = useState("");
    const [myUserId, setMyUserId] = useState<string | null>(null);
    const [wasBidder, setWasBidder] = useState(false);

    // 取得目前使用者 ID
    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (user) setMyUserId(user.id);
        });
    }, []);

    // 訂閱 auction 的即時更新
    useEffect(() => {
        if (!isActive || !myUserId) return;

        const channel = supabase
            .channel(`auction-outbid-${auctionId}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'auctions',
                    filter: `id=eq.${auctionId}`,
                },
                async (payload) => {
                    const updated = payload.new as {
                        current_price: number;
                        current_bidder_id: string;
                        end_time: string;
                    };

                    // 如果我之前是最高出價者，但現在不是了 → 被超價
                    if (wasBidder && updated.current_bidder_id !== myUserId) {
                        setNewPrice(updated.current_price);

                        // 取得新出價者名稱
                        const { data: profile } = await supabase
                            .from('profiles')
                            .select('full_name, email')
                            .eq('id', updated.current_bidder_id)
                            .single();

                        setNewBidderName(
                            profile?.full_name || profile?.email?.split('@')[0] || '其他人'
                        );
                        setOutbid(true);

                        // 10 秒後自動隱藏
                        setTimeout(() => setOutbid(false), 10000);
                    }

                    // 追蹤我是否為目前最高出價者
                    if (updated.current_bidder_id === myUserId) {
                        setWasBidder(true);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [auctionId, isActive, myUserId, wasBidder]);

    // 首次載入時檢查自己是否已經是最高出價者
    useEffect(() => {
        if (!myUserId || !isActive) return;

        supabase
            .from('auctions')
            .select('current_bidder_id')
            .eq('id', auctionId)
            .single()
            .then(({ data }) => {
                if (data?.current_bidder_id === myUserId) {
                    setWasBidder(true);
                }
            });
    }, [auctionId, myUserId, isActive]);

    // 出價成功後也標記 wasBidder
    useEffect(() => {
        const handleBidSuccess = () => setWasBidder(true);
        window.addEventListener('bid-success', handleBidSuccess);
        return () => window.removeEventListener('bid-success', handleBidSuccess);
    }, []);

    if (!outbid) return null;

    const scrollToBid = () => {
        document.querySelector('[data-bid-input]')?.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
        });
        setOutbid(false);
    };

    return (
        <div className="fixed top-20 left-1/2 z-50 -translate-x-1/2 w-[90%] max-w-md animate-bounce">
            <div className="rounded-2xl border border-red-500/50 bg-gradient-to-r from-red-900/95 to-orange-900/95 p-4 shadow-2xl shadow-red-500/20 backdrop-blur-md">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/30 text-xl">
                        ⚠️
                    </div>
                    <div className="flex-1">
                        <p className="text-sm font-bold text-red-200">你已被超價！</p>
                        <p className="text-xs text-red-300/70">
                            {newBidderName} 出價 <span className="font-bold text-yellow-300">${newPrice.toLocaleString()}</span>
                        </p>
                    </div>
                    <button
                        onClick={scrollToBid}
                        className="rounded-xl bg-red-500 px-4 py-2 text-sm font-bold text-white transition hover:bg-red-400"
                    >
                        立即加價
                    </button>
                </div>
            </div>
        </div>
    );
}
