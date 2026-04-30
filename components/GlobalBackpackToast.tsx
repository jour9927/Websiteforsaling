"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";

interface GlobalBackpackToastProps {
  isAuthenticated: boolean;
}

export function GlobalBackpackToast({
  isAuthenticated,
}: GlobalBackpackToastProps) {
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
      const { data: profile } = await supabase
        .from("profiles")
        .select("last_read_backpack_items_at")
        .eq("id", userId)
        .single();

      const lastRead =
        profile?.last_read_backpack_items_at || "2020-01-01T00:00:00.000Z";

      const { count } = await supabase
        .from("backpack_items")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("is_active", true)
        .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
        .gt("created_at", lastRead);

      const newCount = count || 0;
      setUnreadCount(newCount);

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
        .channel(`global-backpack-toast:${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "backpack_items",
            filter: `user_id=eq.${user.id}`,
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

  void prevCount;

  async function markBackpackRead() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    await supabase
      .from("profiles")
      .update({ last_read_backpack_items_at: new Date().toISOString() })
      .eq("id", user.id);

    setUnreadCount(0);
    setDismissed(true);
  }

  if (isTemporaryBattleRoute || !isAuthenticated || unreadCount === 0 || dismissed) return null;

  return (
    <div className="fixed bottom-40 right-4 z-50 animate-fadeIn">
      <div className="relative">
        {unreadCount >= 2 && (
          <span className="absolute -right-1.5 -top-1.5 z-10 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}

        <Link
          href="/backpack"
          onClick={() => void markBackpackRead()}
          className="flex items-center gap-3 rounded-2xl border border-white/15 bg-midnight-900/95 px-4 py-3 shadow-xl backdrop-blur transition hover:bg-white/10"
        >
          <span className="text-lg">🎒</span>
          <div>
            <p className="text-sm font-medium text-white/90">你有新的道具放入背包</p>
            <p className="text-[10px] text-white/50">點擊前往查看</p>
          </div>
        </Link>

        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-xs text-white transition hover:bg-white/40"
          aria-label="關閉背包提示"
        >
          ×
        </button>
      </div>
    </div>
  );
}
