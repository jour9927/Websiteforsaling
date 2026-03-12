"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <div className="glass-card max-w-md p-10">
        <p className="text-5xl">⚠️</p>
        <h1 className="mt-4 text-2xl font-bold text-white/90">發生了一些問題</h1>
        <p className="mt-3 text-sm text-white/50">
          頁面載入時出現錯誤，請嘗試重新整理。若問題持續，請聯絡管理員。
        </p>
        <button
          onClick={reset}
          className="mt-6 inline-block rounded-full bg-white/15 px-6 py-2.5 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/25"
        >
          重新嘗試
        </button>
      </div>
    </div>
  );
}
