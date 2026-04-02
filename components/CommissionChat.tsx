/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface CommissionChatProps {
  commissionId: string;
  currentUserId: string;
  isPoster: boolean;
  isExecutor: boolean;
}

interface ChatMessage {
  id: string;
  sender_id: string;
  sender_name: string;
  content: string;
  is_system: boolean;
  created_at: string;
}

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffSec = Math.floor((now - then) / 1000);

  if (diffSec < 60) return "剛剛";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}分鐘前`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}小時前`;
  const diffDay = Math.floor(diffHour / 24);
  return `${diffDay}天前`;
}

export default function CommissionChat({
  commissionId,
  currentUserId,
  isPoster,
  isExecutor,
}: CommissionChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const canAccess = isPoster || isExecutor;

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/commissions/${commissionId}/messages`);
      if (res.ok) {
        const data = await res.json();
        // Map API response to ChatMessage format
        const mapped: ChatMessage[] = (data.messages ?? []).map((m: any) => {
          const isSystem = m.sender_type === "system";
          let senderName = "系統";
          if (!isSystem) {
            if (m.profiles?.display_name) senderName = m.profiles.display_name;
            else if (m.virtual_profiles?.display_name) senderName = m.virtual_profiles.display_name;
            else if (m.profiles?.full_name) senderName = m.profiles.full_name;
            else senderName = "匿名";
          }
          return {
            id: m.id,
            sender_id: m.sender_id || "",
            sender_name: senderName,
            content: m.content,
            is_system: isSystem,
            created_at: m.created_at,
          };
        });
        setMessages(mapped);
      }
    } catch {
      // silently ignore polling errors
    }
  }, [commissionId]);

  // Initial fetch on mount
  useEffect(() => {
    if (!canAccess) return;
    setLoading(true);
    fetchMessages().finally(() => setLoading(false));
  }, [canAccess, fetchMessages]);

  // Poll every 10 seconds
  useEffect(() => {
    if (!canAccess || !expanded) return;
    const interval = setInterval(fetchMessages, 10000);
    return () => clearInterval(interval);
  }, [canAccess, expanded, fetchMessages]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!canAccess) return null;

  async function handleSend() {
    const trimmed = input.trim();
    if (!trimmed || sending) return;

    setSending(true);
    try {
      const res = await fetch(`/api/commissions/${commissionId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: trimmed }),
      });

      if (res.ok) {
        const data = await res.json();
        // Optimistically add message to local state
        const newMsg: ChatMessage = data.message ?? {
          id: crypto.randomUUID(),
          sender_id: currentUserId,
          sender_name: isPoster ? "刊登者" : "執行者",
          content: trimmed,
          is_system: false,
          created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, newMsg]);
        setInput("");
      }
    } catch {
      // ignore send error
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mt-4 rounded-xl border border-amber-500/20 bg-white/5 backdrop-blur-md">
      {/* Toggle button */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-white/5"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">🔒</span>
          <span className="font-semibold text-white">臨時匿名對話</span>
          <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-xs text-amber-300">
            僅限匯款與配布交換
          </span>
        </div>
        <svg
          className={`h-5 w-5 text-gray-400 transition-transform ${expanded ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Collapsible content */}
      {expanded && (
        <div className="border-t border-white/10 px-4 pb-4 pt-3">
          {/* Warning notice */}
          <div className="mb-3 rounded-lg bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
            ⚠️ 此對話僅限刊登者與執行者，用於完成後提供匯款帳號、安排配布交換時間（朱紫／劍盾）。請勿閒聊，違規將被禁止使用。
          </div>

          {/* Message list */}
          <div className="mb-3 max-h-[300px] overflow-y-auto rounded-lg bg-black/20 p-3">
            {loading && (
              <p className="text-center text-sm text-gray-500">載入中...</p>
            )}
            {!loading && messages.length === 0 && (
              <p className="text-center text-sm text-gray-500">尚無訊息</p>
            )}
            {messages.map((msg) => {
              if (msg.is_system) {
                return (
                  <div key={msg.id} className="my-2 flex items-center justify-center gap-1 text-center">
                    <svg className="h-3 w-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span className="text-xs text-gray-500">{msg.content}</span>
                  </div>
                );
              }

              const isMe = msg.sender_id === currentUserId;

              return (
                <div
                  key={msg.id}
                  className={`my-1.5 flex flex-col ${isMe ? "items-end" : "items-start"}`}
                >
                  <span className="mb-0.5 text-xs text-gray-500">
                    {msg.sender_name}
                  </span>
                  <div
                    className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                      isMe
                        ? "bg-amber-500/20 text-amber-100"
                        : "bg-white/10 text-gray-200"
                    }`}
                  >
                    {msg.content}
                  </div>
                  <span className="mt-0.5 text-[10px] text-gray-600">
                    {relativeTime(msg.created_at)}
                  </span>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => {
                if (e.target.value.length <= 500) setInput(e.target.value);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="輸入匯款帳號或安排交換時間..."
              maxLength={500}
              className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-amber-500/40"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || sending}
              className="rounded-lg bg-amber-500/20 px-4 py-2 text-sm font-medium text-amber-300 transition-colors hover:bg-amber-500/30 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {sending ? "傳送中..." : "傳送"}
            </button>
          </div>
          <p className="mt-1 text-right text-[10px] text-gray-600">
            {input.length}/500
          </p>
        </div>
      )}
    </div>
  );
}
