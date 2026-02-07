"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

interface NotificationBellProps {
    isAuthenticated: boolean;
}

export function NotificationBell({ isAuthenticated }: NotificationBellProps) {
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [announcements, setAnnouncements] = useState<Array<{
        id: string;
        title: string;
        created_at: string;
    }>>([]);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // 載入未讀公告數量
    useEffect(() => {
        if (!isAuthenticated) return;

        const loadUnreadCount = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                // 取得用戶最後已讀時間
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('last_read_announcements_at')
                    .eq('id', user.id)
                    .single();

                const lastRead = profile?.last_read_announcements_at || '2020-01-01';

                // 計算未讀公告數量
                const { data: newAnnouncements, count } = await supabase
                    .from('announcements')
                    .select('id, title, created_at', { count: 'exact' })
                    .eq('status', 'published')
                    .gt('created_at', lastRead)
                    .order('created_at', { ascending: false })
                    .limit(5);

                setUnreadCount(count || 0);
                setAnnouncements(newAnnouncements || []);
            } catch (error) {
                console.error('載入未讀公告失敗:', error);
            }
        };

        loadUnreadCount();

        // 訂閱新公告
        const channel = supabase
            .channel('announcements_changes')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'announcements'
            }, () => {
                loadUnreadCount();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [isAuthenticated]);

    // 標記全部已讀
    const markAllAsRead = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            await supabase
                .from('profiles')
                .update({ last_read_announcements_at: new Date().toISOString() })
                .eq('id', user.id);

            setUnreadCount(0);
            setIsOpen(false);
        } catch (error) {
            console.error('標記已讀失敗:', error);
        }
    };

    // 點擊外部關閉
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (!isAuthenticated) return null;

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-white transition hover:bg-white/10"
                aria-label={`通知 ${unreadCount > 0 ? `(${unreadCount} 則未讀)` : ''}`}
            >
                {/* 鈴鐺圖標 */}
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-5 w-5"
                >
                    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                </svg>

                {/* 未讀徽章 */}
                {unreadCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* 下拉選單 */}
            {isOpen && (
                <div className="absolute left-0 top-full mt-2 w-72 origin-top-left rounded-xl border border-white/10 bg-midnight-900/95 p-3 shadow-xl backdrop-blur animate-fadeIn z-50">
                    <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2">
                        <span className="text-xs font-semibold text-white/80">通知</span>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllAsRead}
                                className="text-[10px] text-sky-300 hover:text-sky-200"
                            >
                                全部標記已讀
                            </button>
                        )}
                    </div>

                    {announcements.length === 0 ? (
                        <p className="py-4 text-center text-xs text-white/50">
                            沒有新通知
                        </p>
                    ) : (
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                            {announcements.map((item) => (
                                <Link
                                    key={item.id}
                                    href={`/announcements/${item.id}`}
                                    onClick={() => setIsOpen(false)}
                                    className="block rounded-lg bg-white/5 p-2 transition hover:bg-white/10"
                                >
                                    <p className="text-sm text-white/90 line-clamp-1">
                                        {item.title}
                                    </p>
                                    <p className="text-[10px] text-white/50 mt-1">
                                        {new Date(item.created_at).toLocaleDateString('zh-TW')}
                                    </p>
                                </Link>
                            ))}
                        </div>
                    )}

                    <div className="mt-2 pt-2 border-t border-white/10">
                        <Link
                            href="/announcements"
                            onClick={() => { setIsOpen(false); markAllAsRead(); }}
                            className="block text-center text-xs text-sky-300 hover:text-sky-200"
                        >
                            查看全部公告
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
