"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

type Announcement = {
    id: string;
    title: string;
    content: string;
    image_url?: string | null;
    published_at: string;
};

export default function GlobalAnnouncementOverlay() {
    const [announcement, setAnnouncement] = useState<Announcement | null>(null);
    const [visible, setVisible] = useState(false);
    const [fadeOut, setFadeOut] = useState(false);

    useEffect(() => {
        loadLatestAnnouncement();
    }, []);

    const loadLatestAnnouncement = async () => {
        try {
            const { data, error } = await supabase
                .from("announcements")
                .select("id, title, content, image_url, published_at")
                .eq("status", "published")
                .not("published_at", "is", null)
                .order("published_at", { ascending: false })
                .limit(1)
                .single();

            if (error || !data) return;

            // 檢查 localStorage 是否已讀過
            const dismissedKey = `announcement_dismissed_${data.id}`;
            if (localStorage.getItem(dismissedKey)) return;

            setAnnouncement(data);
            // 延遲顯示（讓頁面先載入）
            setTimeout(() => setVisible(true), 300);
        } catch {
            // 靜默失敗
        }
    };

    const handleDismiss = () => {
        if (!announcement) return;
        setFadeOut(true);
        // 記住已讀（localStorage）
        localStorage.setItem(`announcement_dismissed_${announcement.id}`, "true");
        // 記錄已讀到資料庫
        fetch("/api/announcements/read", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ announcement_id: announcement.id }),
        }).catch(() => { });
        setTimeout(() => {
            setVisible(false);
            setAnnouncement(null);
        }, 300);
    };

    if (!announcement || !visible) return null;

    return (
        <div
            className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 transition-all duration-300 ${fadeOut ? "opacity-0" : "opacity-100"
                }`}
        >
            {/* 半透明背景 */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={handleDismiss}
            />

            {/* 公告卡片 */}
            <div
                className={`relative w-full max-w-lg transform transition-all duration-300 ${fadeOut ? "scale-95 opacity-0" : "scale-100 opacity-100"
                    }`}
            >
                <div className="rounded-2xl border border-white/20 bg-gradient-to-b from-slate-800/95 to-slate-900/95 shadow-2xl overflow-hidden">
                    {/* 關閉按鈕 */}
                    <button
                        onClick={handleDismiss}
                        className="absolute top-4 right-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/60 transition hover:bg-white/20 hover:text-white"
                        aria-label="關閉"
                    >
                        ✕
                    </button>

                    {/* 圖片 */}
                    {announcement.image_url && (
                        <div className="relative h-48 w-full overflow-hidden">
                            <img
                                src={announcement.image_url}
                                alt={announcement.title}
                                className="h-full w-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
                        </div>
                    )}

                    {/* 內容 */}
                    <div className="p-6">
                        <div className="mb-2 flex items-center gap-2">
                            <span className="inline-block rounded-full bg-amber-500/20 px-2.5 py-0.5 text-xs font-medium text-amber-400">
                                📢 公告
                            </span>
                            <span className="text-xs text-white/40">
                                {new Date(announcement.published_at).toLocaleDateString("zh-TW")}
                            </span>
                        </div>

                        <h2 className="mb-3 text-xl font-bold text-white">
                            {announcement.title}
                        </h2>

                        <div className="mb-6 text-sm leading-relaxed text-white/70 whitespace-pre-wrap max-h-60 overflow-y-auto">
                            {announcement.content}
                        </div>

                        <button
                            onClick={handleDismiss}
                            className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-3 text-sm font-semibold text-white transition hover:from-amber-600 hover:to-orange-600"
                        >
                            我知道了
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
