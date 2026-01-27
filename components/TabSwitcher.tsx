"use client";

import { useState } from "react";

type TabSwitcherProps = {
    eventsContent: React.ReactNode;
    announcementsContent: React.ReactNode;
};

export function TabSwitcher({ eventsContent, announcementsContent }: TabSwitcherProps) {
    const [activeTab, setActiveTab] = useState<"events" | "announcements">("events");

    return (
        <div className="space-y-6">
            {/* 切換開關 */}
            <div className="flex justify-center">
                <div className="inline-flex rounded-2xl bg-white/10 p-1">
                    <button
                        onClick={() => setActiveTab("events")}
                        className={`rounded-xl px-6 py-2.5 text-sm font-medium transition-all ${activeTab === "events"
                                ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg"
                                : "text-white/60 hover:text-white"
                            }`}
                    >
                        🎯 活動
                    </button>
                    <button
                        onClick={() => setActiveTab("announcements")}
                        className={`rounded-xl px-6 py-2.5 text-sm font-medium transition-all ${activeTab === "announcements"
                                ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg"
                                : "text-white/60 hover:text-white"
                            }`}
                    >
                        📢 公告
                    </button>
                </div>
            </div>

            {/* 內容區域 */}
            <div>
                {activeTab === "events" && eventsContent}
                {activeTab === "announcements" && announcementsContent}
            </div>
        </div>
    );
}
