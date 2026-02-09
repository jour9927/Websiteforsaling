"use client";

import { useState, useEffect } from "react";
import { PopularityWidget } from "./PopularityWidget";

export function PopularityWidgetToggle() {
    const [isVisible, setIsVisible] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);

    // 從 localStorage 讀取用戶偏好
    useEffect(() => {
        const saved = localStorage.getItem("showPopularityWidget");
        setIsVisible(saved === "true");
        setIsLoaded(true);
    }, []);

    const handleToggle = () => {
        const newValue = !isVisible;
        setIsVisible(newValue);
        localStorage.setItem("showPopularityWidget", String(newValue));
    };

    // 避免 SSR hydration 不匹配
    if (!isLoaded) {
        return null;
    }

    return (
        <div className="space-y-2">
            {/* 開關 */}
            <div className="flex items-center justify-between px-1">
                <span className="text-sm text-white/60">🔥 人氣排行榜</span>
                <button
                    onClick={handleToggle}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${isVisible ? "bg-amber-500" : "bg-white/20"
                        }`}
                    aria-label={isVisible ? "隱藏人氣排行榜" : "顯示人氣排行榜"}
                >
                    <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${isVisible ? "translate-x-6" : "translate-x-1"
                            }`}
                    />
                </button>
            </div>

            {/* 人氣小組件 */}
            {isVisible && <PopularityWidget />}
        </div>
    );
}
