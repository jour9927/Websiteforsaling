"use client";

import { useMaintenanceMode } from "./MaintenanceContext";

export function MaintenanceToggle() {
    const { maintenanceMode, toggleMaintenance, isAdmin } = useMaintenanceMode();

    // 非管理員不顯示
    if (!isAdmin) return null;

    return (
        <div className="glass-card p-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-sm">🔧</span>
                    <span className="text-sm text-white/70">維護遮罩</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${maintenanceMode
                            ? "bg-amber-500/20 text-amber-400"
                            : "bg-green-500/20 text-green-400"
                        }`}>
                        {maintenanceMode ? "開啟中" : "已解除"}
                    </span>
                </div>
                <button
                    onClick={toggleMaintenance}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${maintenanceMode ? "bg-amber-500" : "bg-white/20"
                        }`}
                    aria-label={maintenanceMode ? "解除維護遮罩" : "開啟維護遮罩"}
                >
                    <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${maintenanceMode ? "translate-x-6" : "translate-x-1"
                            }`}
                    />
                </button>
            </div>
            {!maintenanceMode && (
                <p className="mt-1.5 text-xs text-white/40">
                    ⚠️ 僅管理員可見，一般用戶仍看到維護遮罩
                </p>
            )}
        </div>
    );
}
