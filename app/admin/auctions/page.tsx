"use client";

import Link from "next/link";
import type { Route } from "next";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

type Distribution = {
    id: string;
    pokemon_name: string;
    pokemon_name_en: string | null;
    pokemon_sprite_url: string | null;
    generation: number;
    event_name: string | null;
};

type Auction = {
    id: string;
    distribution_id: string | null;
    title: string;
    description: string | null;
    image_url: string | null;
    starting_price: number;
    min_increment: number;
    current_price: number;
    current_bidder_id: string | null;
    start_time: string;
    end_time: string;
    status: 'draft' | 'active' | 'ended' | 'cancelled';
    bid_count: number;
    created_at: string;
    distributions?: Distribution;
};

export default function AdminAuctionsPage() {
    const [auctions, setAuctions] = useState<Auction[]>([]);
    const [distributions, setDistributions] = useState<Distribution[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [formData, setFormData] = useState({
        distribution_id: "",
        title: "",
        description: "",
        image_url: "",
        min_increment: 20,
        status: "active" as 'draft' | 'active'  // 預設立即開始
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            // 載入競標列表
            const { data: auctionsData, error: auctionsError } = await supabase
                .from('auctions')
                .select('*, distributions(id, pokemon_name, pokemon_name_en, pokemon_sprite_url)')
                .order('created_at', { ascending: false });

            if (auctionsError) throw auctionsError;
            setAuctions(auctionsData || []);

            // 載入配布圖鑑列表
            const { data: distData, error: distError } = await supabase
                .from('distributions')
                .select('id, pokemon_name, pokemon_name_en, pokemon_sprite_url, generation, event_name')
                .order('generation', { ascending: false })
                .order('pokemon_name', { ascending: true });

            if (distError) throw distError;
            setDistributions(distData || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : '載入失敗');
        } finally {
            setLoading(false);
        }
    };

    const handleDistributionSelect = (distId: string) => {
        const dist = distributions.find(d => d.id === distId);
        if (dist) {
            // 標題格式：第X世代+寶可夢名稱 / 活動名稱
            const genLabel = `第${dist.generation}世代`;
            const pokemonName = dist.pokemon_name + (dist.pokemon_name_en ? ` (${dist.pokemon_name_en})` : '');
            const eventName = dist.event_name || '';
            const title = eventName
                ? `${genLabel} ${pokemonName}\n${eventName}`
                : `${genLabel} ${pokemonName}`;

            setFormData({
                ...formData,
                distribution_id: distId,
                title: title,
                image_url: dist.pokemon_sprite_url || ""
            });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError("");
        setSuccess("");

        try {
            const { data: { user } } = await supabase.auth.getUser();

            // 固定設定：起標價 $20，結束時間為建立後 10 分鐘
            const startTime = new Date();
            const endTime = new Date(startTime.getTime() + 10 * 60 * 1000); // +10 分鐘

            const { error } = await supabase
                .from('auctions')
                .insert([{
                    distribution_id: formData.distribution_id || null,
                    title: formData.title,
                    description: formData.description || null,
                    image_url: formData.image_url || null,
                    starting_price: 20,  // 固定 $20
                    min_increment: formData.min_increment,
                    current_price: 0,
                    start_time: startTime.toISOString(),
                    end_time: endTime.toISOString(),  // 自動 +10 分鐘
                    status: formData.status,
                    created_by: user?.id
                }]);

            if (error) throw error;

            setSuccess("競標建立成功！將在 10 分鐘後結標");
            setFormData({
                distribution_id: "",
                title: "",
                description: "",
                image_url: "",
                min_increment: 20,
                status: "active"
            });
            loadData();
        } catch (err) {
            setError(err instanceof Error ? err.message : '建立失敗');
        } finally {
            setSaving(false);
        }
    };

    const handleStatusChange = async (id: string, newStatus: 'draft' | 'active' | 'ended' | 'cancelled') => {
        try {
            const { error } = await supabase
                .from('auctions')
                .update({ status: newStatus })
                .eq('id', id);

            if (error) throw error;
            setSuccess("狀態已更新");
            loadData();
        } catch (err) {
            setError(err instanceof Error ? err.message : '更新失敗');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('確定要刪除此競標嗎？')) return;

        try {
            const { error } = await supabase
                .from('auctions')
                .delete()
                .eq('id', id);

            if (error) throw error;
            setSuccess("競標已刪除");
            loadData();
        } catch (err) {
            setError(err instanceof Error ? err.message : '刪除失敗');
        }
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            draft: 'bg-gray-500/20 text-gray-200',
            active: 'bg-green-500/20 text-green-200',
            ended: 'bg-blue-500/20 text-blue-200',
            cancelled: 'bg-red-500/20 text-red-200'
        };
        const labels: Record<string, string> = {
            draft: '草稿',
            active: '進行中',
            ended: '已結標',
            cancelled: '已取消'
        };
        return (
            <span className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${styles[status]}`}>
                {labels[status]}
            </span>
        );
    };

    const getRemainingTime = (endTime: string) => {
        const now = new Date();
        const end = new Date(endTime);
        const diff = end.getTime() - now.getTime();

        if (diff <= 0) return '已結束';

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        if (days > 0) return `${days}天 ${hours}小時`;
        if (hours > 0) return `${hours}小時 ${minutes}分`;
        return `${minutes}分鐘`;
    };

    return (
        <section className="space-y-8">
            <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-white/90">競標管理</h1>
                    <p className="text-sm text-white/60">建立並管理配布圖鑑寶可夢的競標。</p>
                </div>
            </header>

            {error && (
                <div className="rounded-lg bg-red-500/20 border border-red-500/50 px-4 py-3 text-sm text-red-100">
                    {error}
                </div>
            )}

            {success && (
                <div className="rounded-lg bg-green-500/20 border border-green-500/50 px-4 py-3 text-sm text-green-100">
                    {success}
                </div>
            )}

            {/* 建立競標表單 */}
            <article className="glass-card p-6">
                <h2 className="text-lg font-semibold text-white/90">建立競標</h2>
                <p className="mt-1 text-xs text-white/60">選擇配布圖鑑中的寶可夢來進行競標。</p>

                <form onSubmit={handleSubmit} className="mt-4 grid gap-4 md:grid-cols-2">
                    <label className="flex flex-col gap-2 text-xs text-white/70 md:col-span-2">
                        選擇配布寶可夢
                        <select
                            value={formData.distribution_id}
                            onChange={(e) => handleDistributionSelect(e.target.value)}
                            className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white focus:border-white/40 focus:outline-none"
                        >
                            <option value="">-- 選擇寶可夢 --</option>
                            {distributions.map((dist) => (
                                <option key={dist.id} value={dist.id}>
                                    [第{dist.generation}世代] {dist.pokemon_name} {dist.pokemon_name_en ? `(${dist.pokemon_name_en})` : ''} {dist.event_name ? `- ${dist.event_name}` : ''}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className="flex flex-col gap-2 text-xs text-white/70">
                        競標標題 *
                        <input
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            required
                            className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none"
                            placeholder="例如：色違超夢配布"
                        />
                    </label>

                    <label className="flex flex-col gap-2 text-xs text-white/70">
                        圖片網址
                        <input
                            value={formData.image_url}
                            onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                            className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none"
                            placeholder="https://..."
                        />
                    </label>

                    {/* 固定設定說明 */}
                    <div className="flex flex-col gap-2 text-xs text-white/70 md:col-span-2">
                        <div className="rounded-xl border border-white/20 bg-white/5 px-4 py-3">
                            <p className="font-medium text-white/90">📋 競標設定（固定）</p>
                            <ul className="mt-2 space-y-1 text-white/60">
                                <li>• 起標價：<span className="text-yellow-300 font-medium">$20</span></li>
                                <li>• 最低加價：<span className="text-yellow-300 font-medium">$20</span></li>
                                <li>• 競標時長：<span className="text-green-300 font-medium">10 分鐘</span>（建立後自動開始倒數）</li>
                            </ul>
                        </div>
                    </div>

                    <label className="flex flex-col gap-2 text-xs text-white/70 md:col-span-2">
                        競標說明
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={3}
                            className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none"
                            placeholder="輸入競標說明..."
                        />
                    </label>

                    <div className="md:col-span-2">
                        <button
                            type="submit"
                            disabled={saving}
                            className="rounded-xl bg-white/20 px-6 py-2 text-sm font-semibold text-white/90 transition hover:bg-white/30 disabled:opacity-50"
                        >
                            {saving ? "建立中..." : "建立競標"}
                        </button>
                    </div>
                </form>
            </article>

            {/* 競標清單 */}
            <article className="glass-card p-6">
                <h2 className="text-lg font-semibold text-white/90">競標清單</h2>

                {loading ? (
                    <div className="mt-4 text-center text-white/60">載入中...</div>
                ) : auctions.length === 0 ? (
                    <div className="mt-4 text-center text-white/60">尚無競標，請建立第一個競標</div>
                ) : (
                    <div className="mt-4 overflow-x-auto">
                        <table className="min-w-full divide-y divide-white/10 text-sm text-white/80">
                            <thead className="text-left text-xs uppercase tracking-[0.2em] text-white/60">
                                <tr>
                                    <th className="px-4 py-3">圖片</th>
                                    <th className="px-4 py-3">標題</th>
                                    <th className="px-4 py-3">起標價</th>
                                    <th className="px-4 py-3">目前最高</th>
                                    <th className="px-4 py-3">出價數</th>
                                    <th className="px-4 py-3">剩餘時間</th>
                                    <th className="px-4 py-3">狀態</th>
                                    <th className="px-4 py-3">操作</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/10">
                                {auctions.map((auction) => (
                                    <tr key={auction.id}>
                                        <td className="px-4 py-4">
                                            {auction.image_url ? (
                                                <img src={auction.image_url} alt={auction.title} className="h-12 w-12 rounded-lg object-cover" />
                                            ) : (
                                                <div className="h-12 w-12 rounded-lg bg-white/10 flex items-center justify-center text-xs text-white/40">
                                                    無圖
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-4 py-4 font-medium text-white/90">{auction.title}</td>
                                        <td className="px-4 py-4 text-white/70">${auction.starting_price}</td>
                                        <td className="px-4 py-4">
                                            {auction.current_price > 0 ? (
                                                <span className="text-green-200 font-semibold">${auction.current_price}</span>
                                            ) : (
                                                <span className="text-white/50">-</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-4 text-white/70">{auction.bid_count}</td>
                                        <td className="px-4 py-4 text-white/70">{getRemainingTime(auction.end_time)}</td>
                                        <td className="px-4 py-4">{getStatusBadge(auction.status)}</td>
                                        <td className="px-4 py-4">
                                            <div className="flex gap-2 text-xs">
                                                <select
                                                    value={auction.status}
                                                    onChange={(e) => handleStatusChange(auction.id, e.target.value as 'draft' | 'active' | 'ended' | 'cancelled')}
                                                    className="rounded-lg bg-white/10 px-2 py-1 text-xs text-white/80 border-none focus:outline-none"
                                                >
                                                    <option value="draft">草稿</option>
                                                    <option value="active">進行中</option>
                                                    <option value="ended">已結標</option>
                                                    <option value="cancelled">已取消</option>
                                                </select>
                                                <span className="text-white/40">|</span>
                                                <Link href={`/auctions/${auction.id}` as Route} className="text-sky-200 hover:text-sky-100">
                                                    預覽
                                                </Link>
                                                <span className="text-white/40">|</span>
                                                <button
                                                    onClick={() => handleDelete(auction.id)}
                                                    className="text-red-300 hover:text-red-200"
                                                >
                                                    刪除
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </article>
        </section>
    );
}
