"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";

interface GlobalMessageToastProps {
  isAuthenticated: boolean;
}

export function GlobalMessageToast({ isAuthenticated }: GlobalMessageToastProps) {
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const [prevCount, setPrevCount] = useState(0);
  const isTemporaryBattleRoute =
    pathname === "/random-distribution/battle" || pathname === "/anniversary-30th/battle";

  useEffect(() => {
    if (!isAuthenticated || isTemporaryBattleRoute) return;

    let channel: ReturnType<typeof supabase.channel> | null = null;

    const loadUnread = async (userId: string) => {
      const { count } = await supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("recipient_id", userId)
        .eq("is_read", false);

      const newCount = count || 0;
      setUnreadCount(newCount);

      // 有新訊息進來時重新顯示（即使之前 dismissed）
      setPrevCount((prev) => {
        if (newCount > prev) setDismissed(false);
        return newCount;
      });
    };

    const init = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      await loadUnread(user.id);

      channel = supabase
        .channel(`global-message-toast:${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "messages",
            filter: `recipient_id=eq.${user.id}`,
          },
          () => void loadUnread(user.id),
        )
        .subscribe();
    };

    void init();

    return () => {
      if (channel) void supabase.removeChannel(channel);
    };
  }, [isAuthenticated, isTemporaryBattleRoute]);

  // prevCount 只是輔助追蹤，不影響渲染
  void prevCount;

  if (isTemporaryBattleRoute || !isAuthenticated || unreadCount === 0 || dismissed) return null;

  return (
    <div className="fixed bottom-20 right-4 z-50 animate-fadeIn">
      <div className="relative">
        {/* 兩則以上：右上角紅色數字 */}
        {unreadCount >= 2 && (
          <span className="absolute -right-1.5 -top-1.5 z-10 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}

        <Link
          href="/messages"
          onClick={() => setDismissed(true)}
          className="flex items-center gap-3 rounded-2xl border border-white/15 bg-midnight-900/95 px-4 py-3 shadow-xl backdrop-blur transition hover:bg-white/10"
        >
          <span className="text-lg">✉️</span>
          <div>
            <p className="text-sm font-medium text-white/90">您有一則新訊息</p>
            <p className="text-[10px] text-white/50">點擊前往查看</p>
          </div>
        </Link>

        {/* 關閉按鈕 */}
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-xs text-white transition hover:bg-white/40"
          aria-label="關閉訊息提示"
        >
          ×
        </button>
      </div>
    </div>
  );
}
