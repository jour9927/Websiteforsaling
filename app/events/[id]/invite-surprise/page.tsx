"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function InviteSurprisePage() {
  const params = useParams();
  const eventId = params.id as string;
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; points?: number } | null>(null);
  const [error, setError] = useState("");

  const handleClaim = async () => {
    setLoading(true);
    setError("");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError("請先登入");
        return;
      }

      const res = await fetch(`/api/events/${eventId}/invite-surprise`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const data = await res.json();
      if (res.ok) {
        setResult(data);
      } else {
        setError(data.error || "領取失敗");
      }
    } catch {
      setError("系統異常，請稍後再試");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="glass-card max-w-md w-full p-8 text-center space-y-6">
        <h1 className="text-2xl font-bold text-white">🎁 邀請碼驚喜</h1>

        {!result ? (
          <>
            <p className="text-sm text-slate-200/80">
              感謝你使用邀請碼參與活動！點擊下方按鈕領取隨機驚喜點數 🎉
            </p>
            <button
              onClick={handleClaim}
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-pink-500/60 to-purple-500/60 px-4 py-3 text-center text-sm font-semibold text-white transition hover:from-pink-500/80 hover:to-purple-500/80 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "領取中..." : "🎁 領取驚喜"}
            </button>
            {error && <p className="text-xs text-red-300">{error}</p>}
          </>
        ) : (
          <div className="space-y-4">
            <div className="rounded-xl bg-gradient-to-r from-pink-500/20 to-purple-500/20 p-6 border border-pink-500/30">
              <p className="text-4xl mb-2">🎉</p>
              <p className="text-lg font-bold text-white">{result.message}</p>
              {result.points && (
                <p className="text-3xl font-bold text-yellow-400 mt-2">
                  +{result.points.toLocaleString()} 點
                </p>
              )}
            </div>
            <Link
              href={`/events/${eventId}`}
              className="block rounded-xl border border-white/30 px-4 py-3 text-center text-sm font-semibold text-white/90 transition hover:bg-white/5"
            >
              ← 返回活動頁面
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
