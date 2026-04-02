"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import Image from "next/image";

interface ChatItem {
  id: string;
  pokemon_name: string;
  status: string;
  poster_id: string | null;
  executor_id: string | null;
  poster: { id: string; display_name: string } | null;
  executor: { id: string; display_name: string } | null;
  distributions: {
    pokemon_name: string;
    pokemon_name_en: string | null;
    pokemon_sprite_url: string | null;
  } | null;
  latest_message: {
    id: string;
    content: string;
    sender_id: string;
    created_at: string;
  } | null;
  message_count: number;
  last_activity: string;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  accepted: { label: "執行中", color: "bg-blue-500/20 text-blue-300" },
  proof_submitted: {
    label: "已交付證明",
    color: "bg-yellow-500/20 text-yellow-300",
  },
  proof_approved: {
    label: "證明通過",
    color: "bg-emerald-500/20 text-emerald-300",
  },
  completed: { label: "已完成", color: "bg-green-500/20 text-green-300" },
};

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffMin < 1) return "剛剛";
  if (diffMin < 60) return `${diffMin} 分鐘前`;
  if (diffHour < 24) return `${diffHour} 小時前`;
  if (diffDay < 7) return `${diffDay} 天前`;
  return date.toLocaleDateString("zh-TW");
}

function SkeletonCard() {
  return (
    <div className="glass-card animate-pulse p-4">
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-full bg-white/10" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-32 rounded bg-white/10" />
          <div className="h-3 w-48 rounded bg-white/5" />
        </div>
        <div className="h-3 w-16 rounded bg-white/5" />
      </div>
    </div>
  );
}

export default function CommissionChatsPage() {
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchChats() {
      try {
        const res = await fetch("/api/commission-chats");
        if (!res.ok) {
          const data = await res.json();
          setError(data.error || "載入失敗");
          return;
        }
        const data = await res.json();
        setChats(data.chats || []);
      } catch {
        setError("網路錯誤，請稍後再試");
      } finally {
        setLoading(false);
      }
    }
    fetchChats();
  }, []);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <header className="glass-card p-6">
        <h1 className="text-2xl font-semibold text-white/90">
          委託對話
        </h1>
        <p className="mt-2 text-sm text-white/60">
          與刊登者或執行者的私密對話
        </p>
      </header>

      {/* Error state */}
      {error && (
        <div className="glass-card border border-red-500/20 bg-red-500/5 p-4 text-center">
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="flex flex-col gap-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && chats.length === 0 && (
        <div className="glass-card p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/5">
            <svg
              className="h-8 w-8 text-white/30"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z"
              />
            </svg>
          </div>
          <p className="text-white/50">目前沒有進行中的委託對話</p>
          <p className="mt-2 text-xs text-white/30">
            接受或刊登委託後，對話將顯示在此處
          </p>
        </div>
      )}

      {/* Chat list */}
      {!loading && chats.length > 0 && (
        <div className="flex flex-col gap-3">
          {chats.map((chat) => {
            const statusInfo = STATUS_LABELS[chat.status] || {
              label: chat.status,
              color: "bg-white/10 text-white/60",
            };
            const spriteUrl =
              chat.distributions?.pokemon_sprite_url || null;

            return (
              <Link
                key={chat.id}
                href={`/commissions/${chat.id}` as Route}
                className="glass-card block p-4 transition-all hover:bg-white/[0.06] hover:shadow-lg"
              >
                <div className="flex items-center gap-4">
                  {/* Pokemon sprite */}
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-white/5">
                    {spriteUrl ? (
                      <Image
                        src={spriteUrl}
                        alt={chat.pokemon_name}
                        width={40}
                        height={40}
                        className="h-10 w-10 object-contain"
                        unoptimized
                      />
                    ) : (
                      <span className="text-lg">?</span>
                    )}
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-medium text-white/90">
                        {chat.pokemon_name}
                      </span>
                      <span
                        className={`inline-flex flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${statusInfo.color}`}
                      >
                        {statusInfo.label}
                      </span>
                    </div>

                    {/* Other party */}
                    <p className="mt-0.5 text-xs text-white/40">
                      {chat.poster && chat.executor
                        ? `${chat.poster.display_name} / ${chat.executor.display_name}`
                        : (chat.poster?.display_name ||
                          chat.executor?.display_name ||
                          "匿名")}
                    </p>

                    {/* Latest message preview */}
                    {chat.latest_message && (
                      <p className="mt-1 truncate text-sm text-white/50">
                        {chat.latest_message.content}
                      </p>
                    )}
                  </div>

                  {/* Right side: time + count */}
                  <div className="flex flex-shrink-0 flex-col items-end gap-1">
                    {chat.last_activity && (
                      <span className="text-[11px] text-white/30">
                        {formatTime(chat.last_activity)}
                      </span>
                    )}
                    {chat.message_count > 0 && (
                      <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-indigo-500/20 px-1.5 text-[10px] font-medium text-indigo-300">
                        {chat.message_count}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
