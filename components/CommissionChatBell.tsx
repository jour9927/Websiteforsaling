"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import type { Route } from "next";

/* eslint-disable @typescript-eslint/no-explicit-any */

interface CommissionChatBellProps {
    isAuthenticated: boolean;
}

export function CommissionChatBell({ isAuthenticated }: CommissionChatBellProps) {
    const [chats, setChats] = useState<any[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [activeCount, setActiveCount] = useState(0);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isAuthenticated) return;

        async function loadChats() {
            try {
                const res = await fetch("/api/commission-chats");
                if (!res.ok) return;
                const data = await res.json();
                const chatList = data.chats || [];
                setChats(chatList.slice(0, 5));
                // 有訊息的進行中委託數
                setActiveCount(chatList.filter((c: any) => c.status !== "completed").length);
            } catch {
                // ignore
            }
        }
        loadChats();

        // 每 30 秒刷新
        const interval = setInterval(loadChats, 30000);
        return () => clearInterval(interval);
    }, [isAuthenticated]);

    // 點外面關閉
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    if (!isAuthenticated) return null;

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-white transition hover:bg-white/10"
                aria-label={`委託對話 ${activeCount > 0 ? `(${activeCount} 則進行中)` : ""}`}
            >
                {/* 訊息圖標 */}
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
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>

                {/* 進行中徽章 */}
                {activeCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white">
                        {activeCount > 9 ? "9+" : activeCount}
                    </span>
                )}
            </button>

            {/* 下拉選單 */}
            {isOpen && (
                <div className="absolute left-0 top-full mt-2 w-80 origin-top-left rounded-xl border border-white/10 bg-midnight-900/95 p-3 shadow-xl backdrop-blur z-50">
                    <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2">
                        <h3 className="text-sm font-semibold text-white/80">💬 委託對話</h3>
                        <Link
                            href={"/commission-chats" as Route}
                            className="text-xs text-indigo-400 hover:underline"
                            onClick={() => setIsOpen(false)}
                        >
                            查看全部
                        </Link>
                    </div>

                    {chats.length === 0 ? (
                        <p className="py-4 text-center text-xs text-white/40">目前沒有委託對話</p>
                    ) : (
                        <div className="flex flex-col gap-1">
                            {chats.map((chat: any) => (
                                <Link
                                    key={chat.id}
                                    href={`/commissions/${chat.id}` as Route}
                                    className="flex items-center gap-2.5 rounded-lg px-2 py-2 transition hover:bg-white/5"
                                    onClick={() => setIsOpen(false)}
                                >
                                    {chat.distributions?.pokemon_sprite_url ? (
                                        <img
                                            src={chat.distributions.pokemon_sprite_url}
                                            alt={chat.pokemon_name}
                                            className="h-8 w-8 rounded-md bg-white/5 object-contain p-0.5"
                                        />
                                    ) : (
                                        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-white/5 text-sm">
                                            🎴
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-white/80 truncate">{chat.pokemon_name}</span>
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                                                chat.status === "completed"
                                                    ? "bg-gray-500/20 text-gray-400"
                                                    : "bg-green-500/20 text-green-400"
                                            }`}>
                                                {chat.status === "completed" ? "已完成" : "進行中"}
                                            </span>
                                        </div>
                                        {chat.latest_message?.content && (
                                            <p className="text-[10px] text-white/40 truncate">
                                                {chat.latest_message.content}
                                            </p>
                                        )}
                                    </div>
                                    {chat.message_count > 0 && (
                                        <span className="text-[10px] text-white/30">
                                            {chat.message_count} 則
                                        </span>
                                    )}
                                </Link>
                            ))}
                        </div>
                    )}

                    <div className="mt-2 border-t border-white/10 pt-2">
                        <Link
                            href={"/commission-chats" as Route}
                            className="block rounded-lg py-2 text-center text-xs text-white/50 transition hover:bg-white/5 hover:text-white/70"
                            onClick={() => setIsOpen(false)}
                        >
                            查看所有委託對話 →
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
