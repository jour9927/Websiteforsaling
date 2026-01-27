"use client";

import { useState } from "react";

export function MaintenanceBanner() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="relative bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 text-white">
      <div className="mx-auto max-w-5xl px-4 py-3 md:px-6">
        <div className="flex items-center justify-center gap-3 text-center">
          {/* 維護圖示 */}
          <svg
            className="h-5 w-5 flex-shrink-0 animate-pulse"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          
          {/* 公告內容 */}
          <p className="text-sm font-medium md:text-base">
            <span className="font-bold">⚠️ 系統維護通知：</span>
            系統將進行 2.0 大型升級，將導入資產管理與博物館展示功能，預計維護 96 小時。
          </p>
          
          {/* 關閉按鈕 */}
          <button
            type="button"
            onClick={() => setIsVisible(false)}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 transition hover:bg-white/20 md:right-4"
            aria-label="關閉公告"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
