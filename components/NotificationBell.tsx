"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { supabase } from "@/lib/supabase";

type AnnouncementRow = {
  id: string;
  title: string;
  created_at: string;
};

type NotificationRow = {
  id: string;
  title: string;
  message: string | null;
  created_at: string;
  type: string | null;
};

type MessageRow = {
  id: string;
  subject: string | null;
  body: string;
  created_at: string;
};

type FeedItem = {
  id: string;
  category: "announcement" | "notification" | "message";
  title: string;
  description: string;
  createdAt: string;
  href: Route;
  badge: string;
};

interface NotificationBellProps {
  isAuthenticated: boolean;
  isAdmin: boolean;
}

function formatTimestamp(value: string) {
  return new Date(value).toLocaleString("zh-TW", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getNotificationHref(type: string | null, isAdmin: boolean): Route {
  if (type?.startsWith("commission_deposit_")) {
    return isAdmin ? "/admin" : "/profile";
  }

  return isAdmin ? "/admin/notifications" : "/profile";
}

function buildFeedItems({
  announcements,
  notifications,
  messages,
  isAdmin,
}: {
  announcements: AnnouncementRow[];
  notifications: NotificationRow[];
  messages: MessageRow[];
  isAdmin: boolean;
}) {
  const items: FeedItem[] = [
    ...announcements.map((item) => ({
      id: `announcement-${item.id}`,
      category: "announcement" as const,
      title: item.title,
      description: "最新公告更新",
      createdAt: item.created_at,
      href: `/announcements/${item.id}` as Route,
      badge: "公告",
    })),
    ...notifications.map((item) => ({
      id: `notification-${item.id}`,
      category: "notification" as const,
      title: item.title,
      description: item.message ?? "你有新的站內通知",
      createdAt: item.created_at,
      href: getNotificationHref(item.type, isAdmin),
      badge: "通知",
    })),
    ...messages.map((item) => ({
      id: `message-${item.id}`,
      category: "message" as const,
      title: item.subject || "新的站內訊息",
      description: item.body,
      createdAt: item.created_at,
      href: "/messages" as Route,
      badge: "私訊",
    })),
  ];

  return items
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
    .slice(0, 8);
}

export function NotificationBell({ isAuthenticated, isAdmin }: NotificationBellProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      setFeedItems([]);
      return;
    }

    let isMounted = true;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const loadBellData = async (userId: string) => {
      try {
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("last_read_announcements_at")
          .eq("id", userId)
          .single();

        if (profileError) {
          throw profileError;
        }

        const lastRead = profile?.last_read_announcements_at || "2020-01-01T00:00:00.000Z";

        const [
          { data: announcements, count: announcementCount, error: announcementError },
          { data: notifications, count: notificationCount, error: notificationError },
          { data: messages, count: messageCount, error: messageError },
        ] = await Promise.all([
          supabase
            .from("announcements")
            .select("id, title, created_at", { count: "exact" })
            .eq("status", "published")
            .gt("created_at", lastRead)
            .order("created_at", { ascending: false })
            .limit(4),
          supabase
            .from("notifications")
            .select("id, title, message, created_at, type", { count: "exact" })
            .eq("user_id", userId)
            .eq("is_read", false)
            .order("created_at", { ascending: false })
            .limit(4),
          supabase
            .from("messages")
            .select("id, subject, body, created_at", { count: "exact" })
            .eq("recipient_id", userId)
            .eq("is_read", false)
            .order("created_at", { ascending: false })
            .limit(4),
        ]);

        if (announcementError) {
          throw announcementError;
        }

        if (notificationError) {
          throw notificationError;
        }

        if (messageError) {
          throw messageError;
        }

        if (!isMounted) {
          return;
        }

        const items = buildFeedItems({
          announcements: (announcements ?? []) as AnnouncementRow[],
          notifications: (notifications ?? []) as NotificationRow[],
          messages: (messages ?? []) as MessageRow[],
          isAdmin,
        });

        setFeedItems(items);
        setUnreadCount((announcementCount || 0) + (notificationCount || 0) + (messageCount || 0));
      } catch (error) {
        console.error("載入通知鈴鐺資料失敗:", error);
      }
    };

    const initialize = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return;
      }

      await loadBellData(user.id);

      channel = supabase
        .channel(`notification-bell:${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "announcements",
          },
          () => {
            void loadBellData(user.id);
          },
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            void loadBellData(user.id);
          },
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "messages",
            filter: `recipient_id=eq.${user.id}`,
          },
          () => {
            void loadBellData(user.id);
          },
        )
        .subscribe();
    };

    void initialize();

    return () => {
      isMounted = false;
      if (channel) {
        void supabase.removeChannel(channel);
      }
    };
  }, [isAuthenticated, isAdmin]);

  const markAllAsRead = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return;
    }

    const nowIso = new Date().toISOString();

    await Promise.all([
      supabase.from("profiles").update({ last_read_announcements_at: nowIso }).eq("id", user.id),
      supabase
        .from("notifications")
        .update({ is_read: true, read_at: nowIso })
        .eq("user_id", user.id)
        .eq("is_read", false),
      supabase
        .from("messages")
        .update({ is_read: true, read_at: nowIso })
        .eq("recipient_id", user.id)
        .eq("is_read", false),
    ]);

    setUnreadCount(0);
    setFeedItems([]);
    setIsOpen(false);
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        className="relative flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-white transition hover:bg-white/10"
        aria-label={`通知 ${unreadCount > 0 ? `(${unreadCount} 則未讀)` : ''}`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5"
        >
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-14 z-50 w-80 rounded-2xl border border-white/10 bg-midnight-900/95 p-3 shadow-xl backdrop-blur animate-fadeIn">
          <div className="mb-2 flex items-center justify-between border-b border-white/10 pb-2">
            <div>
              <p className="text-xs font-semibold text-white/80">通知中心</p>
              <p className="text-[10px] text-white/45">公告、站內通知與私訊會統一顯示在這裡</p>
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="text-[10px] text-sky-300 transition hover:text-sky-200"
              >
                全部標記已讀
              </button>
            )}
          </div>

          {feedItems.length === 0 ? (
            <p className="py-5 text-center text-xs text-white/50">目前沒有未讀通知</p>
          ) : (
            <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
              {feedItems.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className="block rounded-xl bg-white/5 p-3 transition hover:bg-white/10"
                >
                  <div className="mb-1 flex items-start justify-between gap-3">
                    <p className="line-clamp-1 text-sm font-medium text-white/90">{item.title}</p>
                    <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-white/60">
                      {item.badge}
                    </span>
                  </div>
                  <p className="line-clamp-2 text-xs text-white/55">{item.description}</p>
                  <p className="mt-2 text-[10px] text-white/40">{formatTimestamp(item.createdAt)}</p>
                </Link>
              ))}
            </div>
          )}

          <div className="mt-3 grid grid-cols-3 gap-2 border-t border-white/10 pt-3 text-[11px]">
            <Link
              href="/announcements"
              onClick={() => setIsOpen(false)}
              className="rounded-lg bg-white/5 px-2 py-2 text-center text-white/70 transition hover:bg-white/10 hover:text-white"
            >
              公告區
            </Link>
            <Link
              href={isAdmin ? "/admin/notifications" : "/profile"}
              onClick={() => setIsOpen(false)}
              className="rounded-lg bg-white/5 px-2 py-2 text-center text-white/70 transition hover:bg-white/10 hover:text-white"
            >
              站內通知
            </Link>
            <Link
              href="/messages"
              onClick={() => setIsOpen(false)}
              className="rounded-lg bg-white/5 px-2 py-2 text-center text-white/70 transition hover:bg-white/10 hover:text-white"
            >
              我的訊息
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
