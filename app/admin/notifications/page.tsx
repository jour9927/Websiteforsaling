"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  COMMISSION_DEPOSIT_NOTIFICATION_TYPES,
  isCommissionDepositNotificationType,
} from "@/lib/commissions";

type Notification = {
  id: string;
  type: string;
  title: string;
  message: string;
  related_event_id: string | null;
  related_user_id: string | null;
  is_read: boolean;
  created_at: string;
  read_at: string | null;
};

type NotificationFilter = "all" | "unread";

const dateTimeFormatter = new Intl.DateTimeFormat("zh-TW", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

function sortByCreatedAt(items: Notification[]) {
  return [...items].sort(
    (left, right) =>
      new Date(right.created_at).getTime() - new Date(left.created_at).getTime(),
  );
}

function getNotificationIcon(type: string) {
  switch (type) {
    case "registration":
      return "✅";
    case "cancellation":
      return "❌";
    case COMMISSION_DEPOSIT_NOTIFICATION_TYPES.dueSoon:
      return "⏳";
    case COMMISSION_DEPOSIT_NOTIFICATION_TYPES.ready:
      return "📦";
    case COMMISSION_DEPOSIT_NOTIFICATION_TYPES.overdue:
      return "⚠️";
    default:
      return "🔔";
  }
}

function getNotificationToneClasses(type: string) {
  if (type === COMMISSION_DEPOSIT_NOTIFICATION_TYPES.overdue) {
    return "border-rose-400/25 bg-rose-400/[0.08]";
  }

  if (type === COMMISSION_DEPOSIT_NOTIFICATION_TYPES.ready) {
    return "border-cyan-300/25 bg-cyan-400/[0.08]";
  }

  if (type === COMMISSION_DEPOSIT_NOTIFICATION_TYPES.dueSoon) {
    return "border-amber-300/25 bg-amber-400/[0.08]";
  }

  if (type === "registration") {
    return "border-emerald-300/20 bg-emerald-400/[0.08]";
  }

  if (type === "cancellation") {
    return "border-rose-300/20 bg-rose-400/[0.08]";
  }

  return "border-white/10 bg-white/[0.04]";
}

function getNotificationTag(type: string) {
  if (isCommissionDepositNotificationType(type)) {
    return "押底提醒";
  }

  if (type === "registration") {
    return "報名通知";
  }

  if (type === "cancellation") {
    return "取消通知";
  }

  return "系統通知";
}

function getNotificationAction(notification: Notification) {
  if (isCommissionDepositNotificationType(notification.type)) {
    return {
      href: "/admin",
      label: "查看押底待辦",
    };
  }

  if (notification.related_event_id) {
    return {
      href: `/events/${notification.related_event_id}`,
      label: "查看活動",
    };
  }

  return null;
}

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<NotificationFilter>("all");
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    let activeChannel: ReturnType<typeof supabase.channel> | null = null;

    async function init() {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!mounted) {
        return;
      }

      if (!user) {
        setUserId(null);
        setNotifications([]);
        setLoading(false);
        return;
      }

      setUserId(user.id);

      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!mounted) {
        return;
      }

      if (error) {
        console.error("載入通知失敗:", error);
        setNotifications([]);
      } else {
        setNotifications((data ?? []) as Notification[]);
      }

      activeChannel = supabase
        .channel(`admin-notifications-${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            const nextNotification = payload.new as Notification;
            setNotifications((current) => {
              if (current.some((item) => item.id === nextNotification.id)) {
                return current;
              }

              return sortByCreatedAt([nextNotification, ...current]);
            });
          },
        )
        .subscribe();

      setLoading(false);
    }

    init();

    return () => {
      mounted = false;
      if (activeChannel) {
        supabase.removeChannel(activeChannel);
      }
    };
  }, []);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.is_read).length,
    [notifications],
  );
  const readCount = notifications.length - unreadCount;
  const filteredNotifications =
    filter === "unread"
      ? notifications.filter((notification) => !notification.is_read)
      : notifications;

  async function markAsRead(id: string) {
    setActiveAction(`read:${id}`);

    const readAt = new Date().toISOString();
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true, read_at: readAt })
      .eq("id", id);

    if (error) {
      console.error("標記通知為已讀失敗:", error);
      setActiveAction(null);
      return;
    }

    setNotifications((current) =>
      current.map((notification) =>
        notification.id === id
          ? { ...notification, is_read: true, read_at: readAt }
          : notification,
      ),
    );
    setActiveAction(null);
  }

  async function markAllAsRead() {
    if (!userId || unreadCount === 0) {
      return;
    }

    setActiveAction("read-all");
    const readAt = new Date().toISOString();
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true, read_at: readAt })
      .eq("user_id", userId)
      .eq("is_read", false);

    if (error) {
      console.error("標記全部通知為已讀失敗:", error);
      setActiveAction(null);
      return;
    }

    setNotifications((current) =>
      current.map((notification) => ({
        ...notification,
        is_read: true,
        read_at: notification.read_at ?? readAt,
      })),
    );
    setActiveAction(null);
  }

  async function deleteNotification(id: string) {
    setActiveAction(`delete:${id}`);

    const { error } = await supabase.from("notifications").delete().eq("id", id);
    if (error) {
      console.error("刪除通知失敗:", error);
      setActiveAction(null);
      return;
    }

    setNotifications((current) => current.filter((notification) => notification.id !== id));
    setActiveAction(null);
  }

  async function deleteAllRead() {
    if (!userId || readCount === 0) {
      return;
    }

    setActiveAction("delete-read");
    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("user_id", userId)
      .eq("is_read", true);

    if (error) {
      console.error("刪除已讀通知失敗:", error);
      setActiveAction(null);
      return;
    }

    setNotifications((current) => current.filter((notification) => !notification.is_read));
    setActiveAction(null);
  }

  return (
    <div className="space-y-8">
      <section className="glass-card overflow-hidden">
        <div className="grid gap-6 border-b border-white/10 px-6 py-6 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div>
            <p className="text-xs uppercase tracking-[0.32em] text-cyan-200/70">
              Notification Center
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-white">通知中心</h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/75">
              這裡集中管理活動報名、取消與押底歸還提醒。押底類通知會直接帶你回到後台待辦板，
              不需要再自行搜尋案件。
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
            <p className="text-xs uppercase tracking-[0.26em] text-white/45">未讀通知</p>
            <p className="mt-3 text-4xl font-semibold text-white">{unreadCount}</p>
            <p className="mt-2 text-sm leading-7 text-white/65">
              {unreadCount > 0
                ? "建議先處理押底逾期與可歸還提醒，再回頭查看一般活動通知。"
                : "目前沒有新的未讀通知。"}
            </p>
          </div>
        </div>

        <div className="grid gap-4 px-6 py-6 md:grid-cols-3">
          <article className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
            <p className="text-xs uppercase tracking-[0.26em] text-white/45">全部通知</p>
            <p className="mt-3 text-3xl font-semibold text-white">{notifications.length}</p>
          </article>
          <article className="rounded-3xl border border-cyan-300/20 bg-cyan-400/[0.08] p-5 text-cyan-50">
            <p className="text-xs uppercase tracking-[0.26em] text-white/55">未讀</p>
            <p className="mt-3 text-3xl font-semibold">{unreadCount}</p>
          </article>
          <article className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
            <p className="text-xs uppercase tracking-[0.26em] text-white/45">已讀</p>
            <p className="mt-3 text-3xl font-semibold text-white">{readCount}</p>
          </article>
        </div>
      </section>

      <section className="glass-card p-6">
        <div className="flex flex-col gap-4 border-b border-white/10 pb-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setFilter("all")}
              className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                filter === "all"
                  ? "bg-white text-slate-950"
                  : "border border-white/15 bg-white/5 text-white/75 hover:bg-white/10"
              }`}
            >
              全部 ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter("unread")}
              className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                filter === "unread"
                  ? "bg-white text-slate-950"
                  : "border border-white/15 bg-white/5 text-white/75 hover:bg-white/10"
              }`}
            >
              未讀 ({unreadCount})
            </button>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={markAllAsRead}
              disabled={activeAction === "read-all" || unreadCount === 0}
              className="rounded-2xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white/80 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {activeAction === "read-all" ? "處理中..." : "全部標為已讀"}
            </button>
            <button
              type="button"
              onClick={deleteAllRead}
              disabled={activeAction === "delete-read" || readCount === 0}
              className="rounded-2xl border border-rose-300/20 bg-rose-400/10 px-4 py-2 text-sm font-semibold text-rose-100 transition hover:bg-rose-400/15 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {activeAction === "delete-read" ? "刪除中..." : "刪除全部已讀"}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-sm text-white/60">載入中...</div>
        ) : filteredNotifications.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-lg font-semibold text-white">
              {filter === "unread" ? "目前沒有未讀通知" : "目前沒有通知"}
            </p>
            <p className="mt-3 text-sm leading-7 text-white/65">
              新的押底提醒或活動動態進來時，這裡會自動更新。
            </p>
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            {filteredNotifications.map((notification) => {
              const action = getNotificationAction(notification);
              const isBusy =
                activeAction === `read:${notification.id}` ||
                activeAction === `delete:${notification.id}`;

              return (
                <article
                  key={notification.id}
                  className={`rounded-3xl border p-5 transition ${getNotificationToneClasses(notification.type)}`}
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex min-w-0 gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-2xl">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-3">
                          <h2 className="text-lg font-semibold text-white">{notification.title}</h2>
                          <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs text-white/70">
                            {getNotificationTag(notification.type)}
                          </span>
                          {!notification.is_read ? (
                            <span className="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 text-xs text-cyan-100">
                              未讀
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-3 text-sm leading-7 text-white/80">
                          {notification.message}
                        </p>
                        <p className="mt-3 text-xs text-white/50">
                          {dateTimeFormatter.format(new Date(notification.created_at))}
                        </p>
                        {action ? (
                          <a
                            href={action.href}
                            className="mt-4 inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15"
                          >
                            {action.label}
                          </a>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-wrap gap-3">
                      {!notification.is_read ? (
                        <button
                          type="button"
                          onClick={() => markAsRead(notification.id)}
                          disabled={isBusy}
                          className="rounded-2xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white/80 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {activeAction === `read:${notification.id}` ? "處理中..." : "標為已讀"}
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => deleteNotification(notification.id)}
                        disabled={isBusy}
                        className="rounded-2xl border border-rose-300/20 bg-rose-400/10 px-4 py-2 text-sm font-semibold text-rose-100 transition hover:bg-rose-400/15 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {activeAction === `delete:${notification.id}` ? "刪除中..." : "刪除"}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
