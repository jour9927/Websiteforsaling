"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const STORAGE_KEY = "checkin_reminder_dismissed";

function getTodayKey(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getStorageKey(userId: string): string {
    return `${STORAGE_KEY}_${userId}`;
}

export function CheckInReminder() {
    const [show, setShow] = useState(false);

    useEffect(() => {
        fetch("/api/check-in")
            .then((res) => {
                if (res.status === 401) return null;
                return res.json();
            })
            .then((data) => {
                if (!data || !data.canCheckIn) return;

                // 帳號層級記錄：當天該帳號已關閉就不再顯示
                const today = getTodayKey();
                const key = getStorageKey(data.userId);
                if (localStorage.getItem(key) === today) return;

                setShow(true);
            })
            .catch(() => {});
    }, []);

    const handleDismiss = () => {
        // 需要重新 fetch 取得 userId 才能存對的 key
        fetch("/api/check-in")
            .then((res) => res.json())
            .then((data) => {
                if (data?.userId) {
                    localStorage.setItem(getStorageKey(data.userId), getTodayKey());
                }
            })
            .catch(() => {});
        setShow(false);
    };

    if (!show) return null;

    return (
        <div className="fixed top-36 left-1/2 -translate-x-1/2 z-40 w-full max-w-xl px-4 animate-slide-down">
            <div className="glass-card border border-amber-500/30 bg-gradient-to-r from-amber-500/10 to-orange-500/5 px-4 py-3 flex items-center justify-between gap-3 shadow-lg shadow-amber-500/10">
                <div className="flex items-center gap-2 min-w-0">
                    <span className="text-lg shrink-0">📅</span>
                    <p className="text-sm text-white/80 truncate">
                        今天還沒簽到！
                        <Link
                            href="/check-in"
                            className="text-amber-400 hover:text-amber-300 underline ml-1 font-medium"
                        >
                            立即簽到 →
                        </Link>
                    </p>
                </div>
                <button
                    onClick={handleDismiss}
                    className="shrink-0 text-white/40 hover:text-white/70 transition text-lg leading-none"
                    aria-label="關閉提醒"
                >
                    ✕
                </button>
            </div>
        </div>
    );
}
