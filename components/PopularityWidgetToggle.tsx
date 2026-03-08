"use client";

import { PopularityWidget } from "./PopularityWidget";

export function PopularityWidgetToggle() {
    return (
        <div className="space-y-2">
            {/* [開關] 已註解，預設永遠開啟 */}
            {/* <div className="flex items-center justify-between px-1">
                <span className="text-sm text-white/60">🔥 人氣排行榜</span>
                <button>...</button>
            </div> */}

            {/* 人氣小組件 - 永遠顯示 */}
            <PopularityWidget />
        </div>
    );
}
