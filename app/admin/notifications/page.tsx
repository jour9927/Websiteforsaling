"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import type { Route } from "next";

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

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    loadNotifications();

    // 訂閱新通知
    const channel = supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications'
        },
        (payload) => {
          setNotifications(prev => [payload.new as Notification, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadNotifications = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('載入通知失敗:', error);
    } else {
      setNotifications(data || []);
    }
    
    setLoading(false);
  };

  const markAsRead = async (id: string) => {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', id);

    if (!error) {
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n)
      );
    }
  };

  const markAllAsRead = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .eq('is_read', false);

    if (!error) {
      loadNotifications();
    }
  };

  const deleteNotification = async (id: string) => {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id);

    if (!error) {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }
  };

  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.is_read)
    : notifications;

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'registration': return '✅';
      case 'cancellation': return '❌';
      default: return '🔔';
    }
  };

  return (
    <div className="space-y-6">
      <header className="glass-card p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-white">通知中心</h1>
            <p className="mt-1 text-sm text-white/60">
              {unreadCount > 0 ? `您有 ${unreadCount} 則未讀通知` : '沒有未讀通知'}
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="rounded-lg bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/20"
            >
              全部標為已讀
            </button>
          )}
        </div>

        <div className="mt-4 flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`rounded-lg px-4 py-2 text-sm transition ${
              filter === 'all'
                ? 'bg-white/20 text-white'
                : 'bg-white/5 text-white/60 hover:bg-white/10'
            }`}
          >
            全部 ({notifications.length})
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`rounded-lg px-4 py-2 text-sm transition ${
              filter === 'unread'
                ? 'bg-white/20 text-white'
                : 'bg-white/5 text-white/60 hover:bg-white/10'
            }`}
          >
            未讀 ({unreadCount})
          </button>
        </div>
      </header>

      {loading ? (
        <div className="glass-card p-12 text-center text-white/60">載入中...</div>
      ) : filteredNotifications.length === 0 ? (
        <div className="glass-card p-12 text-center text-white/60">
          {filter === 'unread' ? '沒有未讀通知' : '沒有通知'}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((notification) => (
            <article
              key={notification.id}
              className={`glass-card p-4 transition hover:bg-white/5 ${
                !notification.is_read ? 'border-l-4 border-blue-500' : ''
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="text-2xl">{getNotificationIcon(notification.type)}</div>
                
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-white">{notification.title}</h3>
                      <p className="mt-1 text-sm text-white/70">{notification.message}</p>
                      <p className="mt-2 text-xs text-white/50">
                        {new Date(notification.created_at).toLocaleString('zh-TW')}
                      </p>
                    </div>
                    
                    <div className="flex gap-2">
                      {!notification.is_read && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="text-xs text-blue-300 hover:text-blue-200"
                        >
                          標為已讀
                        </button>
                      )}
                      <button
                        onClick={() => deleteNotification(notification.id)}
                        className="text-xs text-red-300 hover:text-red-200"
                      >
                        刪除
                      </button>
                    </div>
                  </div>
                  
                  {notification.related_event_id && (
                    <Link
                      href={`/events/${notification.related_event_id}` as Route}
                      className="mt-3 inline-block rounded-lg bg-white/10 px-3 py-1.5 text-xs text-white hover:bg-white/20"
                    >
                      查看活動 →
                    </Link>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
