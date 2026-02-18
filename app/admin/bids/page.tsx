"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

type Bid = {
    id: string;
    amount: number;
    created_at: string;
    user_id: string;
    auction_id: string;
    profiles?: {
        full_name: string | null;
        email: string | null;
        role: string;
    };
    auctions?: {
        title: string;
        status: string;
        current_price: number;
        starting_price: number;
        end_time: string;
    };
};

export default function AdminBidsPage() {
    const [bids, setBids] = useState<Bid[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [filter, setFilter] = useState<'today' | 'all' | 'active'>('today');
    const [searchTerm, setSearchTerm] = useState("");
    
    // 編輯狀態
    const [editingBidId, setEditingBidId] = useState<string | null>(null);
    const [editAmount, setEditAmount] = useState<number>(0);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadBids();
    }, [filter]);

    const loadBids = async () => {
        setLoading(true);
        try {
            let query = supabase
                .from('bids')
                .select('*, profiles(full_name, email, role), auctions(title, status, current_price, starting_price, end_time)')
                .order('created_at', { ascending: false })
                .limit(100);

            if (filter === 'today') {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                query = query.gte('created_at', today.toISOString());
            } else if (filter === 'active') {
                query = query.eq('auctions.status', 'active');
            }

            const { data, error: queryError } = await query;
            if (queryError) throw queryError;
            setBids(data || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : '載入失敗');
        } finally {
            setLoading(false);
        }
    };

    const filteredBids = bids.filter(bid => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return (
            bid.profiles?.full_name?.toLowerCase().includes(term) ||
            bid.profiles?.email?.toLowerCase().includes(term) ||
            bid.auctions?.title?.toLowerCase().includes(term) ||
            bid.amount.toString().includes(term)
        );
    });

    // 統計
    const uniqueUsers = new Set(bids.map(b => b.user_id));
    const uniqueAuctions = new Set(bids.map(b => b.auction_id));
    const totalBidAmount = bids.reduce((sum, b) => Math.max(sum, b.amount), 0);

    const getRoleLabel = (role?: string) => {
        const map: Record<string, { label: string; style: string }> = {
            admin: { label: '管理員', style: 'bg-purple-500/20 text-purple-200' },
            member: { label: '群內成員', style: 'bg-blue-500/20 text-blue-200' },
            user: { label: '一般會員', style: 'bg-white/10 text-white/60' },
        };
        return map[role || 'user'] || map.user;
    };

    const formatTime = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleString('zh-TW', { timeZone: 'Asia/Taipei', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
    };

    // 編輯處理函數
    const handleEditClick = (bid: Bid) => {
        setEditingBidId(bid.id);
        setEditAmount(bid.amount);
        setError("");
    };

    const handleCancelEdit = () => {
        setEditingBidId(null);
        setEditAmount(0);
    };

    const handleSaveEdit = async (bidId: string) => {
        setSaving(true);
        setError("");
        
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('未登入');

            // 呼叫資料庫函數更新出價金額
            const { data, error: rpcError } = await supabase.rpc('admin_update_bid_amount', {
                p_bid_id: bidId,
                p_new_amount: editAmount,
                p_admin_user_id: user.id
            });

            if (rpcError) throw rpcError;
            if (!data?.success) throw new Error(data?.error || '更新失敗');

            // 重新載入資料
            await loadBids();
            setEditingBidId(null);
            setEditAmount(0);
        } catch (err) {
            setError(err instanceof Error ? err.message : '儲存失敗');
        } finally {
            setSaving(false);
        }
    };

    return (
        <section className="space-y-8">
            <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-white/90">出價查詢</h1>
                    <p className="text-sm text-white/60">查看所有用戶的出價紀錄。</p>
                </div>
                <div className="flex gap-4 text-sm">
                    <div className="rounded-xl bg-yellow-500/20 px-4 py-2 text-yellow-200">
                        <span className="text-lg font-bold">{bids.length}</span> 筆出價
                    </div>
                    <div className="rounded-xl bg-blue-500/20 px-4 py-2 text-blue-200">
                        <span className="text-lg font-bold">{uniqueUsers.size}</span> 位用戶
                    </div>
                    <div className="rounded-xl bg-green-500/20 px-4 py-2 text-green-200">
                        <span className="text-lg font-bold">{uniqueAuctions.size}</span> 場競標
                    </div>
                </div>
            </header>

            {error && (
                <div className="rounded-lg bg-red-500/20 border border-red-500/50 px-4 py-3 text-sm text-red-100">
                    {error}
                </div>
            )}

            <article className="glass-card p-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex gap-2">
                        <button
                            onClick={() => setFilter('today')}
                            className={`rounded-full px-4 py-2 text-sm transition ${filter === 'today' ? 'bg-yellow-500/20 text-yellow-200' : 'text-white/60 hover:text-white'
                                }`}
                        >
                            今天
                        </button>
                        <button
                            onClick={() => setFilter('active')}
                            className={`rounded-full px-4 py-2 text-sm transition ${filter === 'active' ? 'bg-green-500/20 text-green-200' : 'text-white/60 hover:text-white'
                                }`}
                        >
                            進行中的競標
                        </button>
                        <button
                            onClick={() => setFilter('all')}
                            className={`rounded-full px-4 py-2 text-sm transition ${filter === 'all' ? 'bg-white/20 text-white' : 'text-white/60 hover:text-white'
                                }`}
                        >
                            全部
                        </button>
                    </div>
                    <input
                        type="text"
                        placeholder="搜尋用戶、競標、金額..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none md:w-64"
                    />
                </div>

                {loading ? (
                    <div className="mt-8 text-center text-white/60">載入中...</div>
                ) : filteredBids.length === 0 ? (
                    <div className="mt-8 text-center text-white/60">沒有符合條件的出價紀錄</div>
                ) : (
                    <div className="mt-6 overflow-x-auto">
                        <table className="min-w-full divide-y divide-white/10 text-sm text-white/80">
                            <thead className="text-left text-xs uppercase tracking-[0.2em] text-white/60">
                                <tr>
                                    <th className="px-4 py-3">時間</th>
                                    <th className="px-4 py-3">用戶</th>
                                    <th className="px-4 py-3">角色</th>
                                    <th className="px-4 py-3">競標項目</th>
                                    <th className="px-4 py-3">出價金額</th>
                                    <th className="px-4 py-3">競標狀態</th>
                                    <th className="px-4 py-3">操作</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/10">
                                {filteredBids.map((bid) => {
                                    const role = getRoleLabel(bid.profiles?.role);
                                    const isHighest = bid.amount === bid.auctions?.current_price;
                                    return (
                                        <tr key={bid.id} className={isHighest ? 'bg-yellow-500/5' : ''}>
                                            <td className="px-4 py-4 text-white/70 whitespace-nowrap">
                                                {formatTime(bid.created_at)}
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-xs font-semibold uppercase">
                                                        {(bid.profiles?.full_name || bid.profiles?.email || '?').slice(0, 2)}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-white/90">
                                                            {bid.profiles?.full_name || '(未設定)'}
                                                        </p>
                                                        <p className="text-xs text-white/50">
                                                            {bid.profiles?.email}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${role.style}`}>
                                                    {role.label}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 text-white/70 max-w-48 truncate">
                                                {bid.auctions?.title?.split('\n')[0] || '(未知)'}
                                            </td>
                                            <td className="px-4 py-4">
                                                {editingBidId === bid.id ? (
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-white/60 text-sm">$</span>
                                                        <input
                                                            type="number"
                                                            value={editAmount}
                                                            onChange={(e) => setEditAmount(parseInt(e.target.value) || 0)}
                                                            className="w-24 rounded-lg border border-yellow-500/50 bg-yellow-500/10 px-2 py-1 text-sm text-white focus:border-yellow-500 focus:outline-none"
                                                            min="1"
                                                            autoFocus
                                                        />
                                                    </div>
                                                ) : (
                                                    <>
                                                        <span className={`font-bold ${isHighest ? 'text-yellow-300' : 'text-white/70'}`}>
                                                            ${bid.amount.toLocaleString()}
                                                        </span>
                                                        {isHighest && (
                                                            <span className="ml-2 text-xs text-yellow-300/70">👑 最高</span>
                                                        )}
                                                    </>
                                                )}
                                            </td>
                                            <td className="px-4 py-4">
                                                {bid.auctions?.status === 'active' ? (
                                                    <span className="rounded-full bg-green-500/20 px-2 py-0.5 text-xs text-green-200">進行中</span>
                                                ) : bid.auctions?.status === 'ended' ? (
                                                    <span className="rounded-full bg-gray-500/20 px-2 py-0.5 text-xs text-gray-300">已結標</span>
                                                ) : (
                                                    <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-white/60">
                                                        {bid.auctions?.status || '-'}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-4">
                                                {editingBidId === bid.id ? (
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleSaveEdit(bid.id)}
                                                            disabled={saving}
                                                            className="rounded-lg bg-green-500/20 px-3 py-1 text-xs font-medium text-green-200 hover:bg-green-500/30 disabled:opacity-50"
                                                        >
                                                            {saving ? '儲存中...' : '儲存'}
                                                        </button>
                                                        <button
                                                            onClick={handleCancelEdit}
                                                            disabled={saving}
                                                            className="rounded-lg bg-white/10 px-3 py-1 text-xs font-medium text-white/70 hover:bg-white/20 disabled:opacity-50"
                                                        >
                                                            取消
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => handleEditClick(bid)}
                                                        className="rounded-lg bg-blue-500/20 px-3 py-1 text-xs font-medium text-blue-200 hover:bg-blue-500/30"
                                                    >
                                                        編輯
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </article>
        </section>
    );
}
