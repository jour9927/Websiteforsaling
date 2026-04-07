"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createBrowserClient } from "@supabase/ssr";

/* eslint-disable @typescript-eslint/no-explicit-any */

interface Commission {
  id: string;
  pokemon_name: string;
  status: string;
  base_price: number;
  price_type: string;
  poster_virtual_id: string;
  poster_virtual: { display_name: string } | null;
  executor: { display_name: string; full_name?: string } | null;
  accepted_at: string | null;
  lastMessage?: string;
  lastMessageAt?: string;
  messageCount?: number;
}

interface ChatMessage {
  id: string;
  sender_type: string;
  sender_id?: string;
  sender_virtual_id?: string;
  sender_name: string;
  content: string;
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
  return `${Math.floor(diffHour / 24)}天前`;
}

export default function VirtualCommissionChatsPage() {
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [filterHasMessages, setFilterHasMessages] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const fetchCommissions = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("commissions")
      .select(
        `id, pokemon_name, status, base_price, price_type, poster_virtual_id, accepted_at,
         poster_virtual:virtual_profiles!commissions_poster_virtual_id_fkey(display_name),
         executor:profiles!commissions_executor_id_fkey(display_name, full_name)`
      )
      .eq("poster_type", "virtual")
      .eq("executor_type", "user")
      .not("executor_id", "is", null)
      .in("status", ["accepted", "proof_submitted", "proof_approved", "completed"])
      .order("accepted_at", { ascending: false })
      .limit(100);

    if (!data) {
      setLoading(false);
      return;
    }

    // Fetch message counts for each commission
    const ids = data.map((c: any) => c.id);
    const { data: msgData } = await supabase
      .from("commission_messages")
      .select("commission_id, content, created_at, sender_type")
      .in("commission_id", ids)
      .order("created_at", { ascending: false });

    // Group by commission_id
    const msgMap: Record<string, { count: number; lastMessage: string; lastMessageAt: string }> = {};
    if (msgData) {
      for (const m of msgData) {
        if (!msgMap[m.commission_id]) {
          msgMap[m.commission_id] = {
            count: 0,
            lastMessage: m.content,
            lastMessageAt: m.created_at,
          };
        }
        msgMap[m.commission_id].count++;
      }
    }

    const enriched: Commission[] = data.map((c: any) => ({
      ...c,
      messageCount: msgMap[c.id]?.count || 0,
      lastMessage: msgMap[c.id]?.lastMessage || "",
      lastMessageAt: msgMap[c.id]?.lastMessageAt || "",
    }));

    setCommissions(enriched);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchCommissions();
  }, [fetchCommissions]);

  const fetchMessages = useCallback(async (commissionId: string) => {
    setChatLoading(true);
    const res = await fetch(`/api/commissions/${commissionId}/messages`);
    if (res.ok) {
      const data = await res.json();
      const mapped: ChatMessage[] = (data.messages ?? []).map((m: any) => {
        let senderName = "系統";
        if (m.sender_type !== "system") {
          if (m.virtual_profiles?.display_name) senderName = `🤖 ${m.virtual_profiles.display_name}`;
          else if (m.profiles?.display_name) senderName = m.profiles.display_name;
          else if (m.profiles?.full_name) senderName = m.profiles.full_name;
          else senderName = "匿名";
        }
        return {
          id: m.id,
          sender_type: m.sender_type,
          sender_id: m.sender_id,
          sender_virtual_id: m.sender_virtual_id,
          sender_name: senderName,
          content: m.content,
          created_at: m.created_at,
        };
      });
      setMessages(mapped);
    }
    setChatLoading(false);
  }, []);

  useEffect(() => {
    if (selectedId) {
      fetchMessages(selectedId);
    }
  }, [selectedId, fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    const trimmed = input.trim();
    if (!trimmed || sending || !selectedId) return;
    setSending(true);
    const res = await fetch(`/api/commissions/${selectedId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: trimmed, as_virtual: true }),
    });
    if (res.ok) {
      setInput("");
      await fetchMessages(selectedId);
      await fetchCommissions();
    } else {
      const err = await res.json();
      alert(err.error || "傳送失敗");
    }
    setSending(false);
  }

  const selected = commissions.find((c) => c.id === selectedId);
  const displayList = filterHasMessages
    ? commissions.filter((c) => (c.messageCount || 0) > 0)
    : commissions;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white/90">💬 虛擬委託對話</h1>
          <p className="mt-1 text-sm text-white/50">以虛擬用戶名義回覆真實接單者的訊息</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-white/60">
            <input
              type="checkbox"
              checked={filterHasMessages}
              onChange={(e) => setFilterHasMessages(e.target.checked)}
              className="rounded"
            />
            只顯示有訊息
          </label>
          <button
            onClick={fetchCommissions}
            className="rounded-lg bg-white/10 px-3 py-1.5 text-sm text-white/70 hover:bg-white/20"
          >
            重新整理
          </button>
        </div>
      </div>

      <div className="flex gap-4 min-h-[600px]">
        {/* Left: commission list */}
        <div className="w-72 flex-shrink-0 flex flex-col gap-2 overflow-y-auto">
          {loading ? (
            <p className="text-center text-sm text-white/40 py-10">載入中...</p>
          ) : displayList.length === 0 ? (
            <p className="text-center text-sm text-white/40 py-10">目前沒有符合條件的委託</p>
          ) : (
            displayList.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedId(c.id)}
                className={`flex flex-col gap-1 rounded-xl border px-4 py-3 text-left transition ${
                  selectedId === c.id
                    ? "border-indigo-500/60 bg-indigo-600/20"
                    : "border-white/10 bg-white/5 hover:bg-white/10"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-white/90 text-sm truncate">{c.pokemon_name}</span>
                  {(c.messageCount || 0) > 0 && (
                    <span className="ml-2 flex-shrink-0 rounded-full bg-indigo-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                      {c.messageCount}
                    </span>
                  )}
                </div>
                <div className="text-xs text-white/40 truncate">
                  接單者：{c.executor?.display_name || c.executor?.full_name || "—"}
                </div>
                <div className="text-xs text-white/40">
                  虛擬：{c.poster_virtual?.display_name || "—"}
                </div>
                {c.lastMessage && (
                  <p className="text-xs text-white/30 truncate">{c.lastMessage}</p>
                )}
                <span className={`text-xs font-medium ${
                  c.status === "accepted" ? "text-amber-400" :
                  c.status === "completed" ? "text-green-400" : "text-white/50"
                }`}>
                  {c.status === "accepted" ? "進行中" :
                   c.status === "proof_submitted" ? "已提交證明" :
                   c.status === "proof_approved" ? "證明通過" :
                   c.status === "completed" ? "已完成" : c.status}
                </span>
              </button>
            ))
          )}
        </div>

        {/* Right: chat panel */}
        <div className="flex-1 flex flex-col rounded-xl border border-white/10 bg-white/5 overflow-hidden">
          {!selectedId ? (
            <div className="flex flex-1 items-center justify-center text-sm text-white/30">
              選擇左側委託查看對話
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
                <div>
                  <p className="font-semibold text-white/90">{selected?.pokemon_name}</p>
                  <p className="text-xs text-white/40">
                    虛擬發布者：{selected?.poster_virtual?.display_name}
                    　接單者：{selected?.executor?.display_name || selected?.executor?.full_name}
                  </p>
                </div>
                <span className="text-xs text-indigo-300 bg-indigo-500/20 rounded-full px-3 py-1">
                  以虛擬用戶名義回覆
                </span>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {chatLoading ? (
                  <p className="text-center text-sm text-white/40">載入中...</p>
                ) : messages.length === 0 ? (
                  <p className="text-center text-sm text-white/30">尚無訊息</p>
                ) : (
                  messages.map((msg) => {
                    if (msg.sender_type === "system") {
                      return (
                        <div key={msg.id} className="flex justify-center">
                          <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-white/30">
                            {msg.content}
                          </span>
                        </div>
                      );
                    }
                    const isVirtual = msg.sender_type === "virtual";
                    return (
                      <div key={msg.id} className={`flex flex-col ${isVirtual ? "items-end" : "items-start"}`}>
                        <span className="mb-0.5 text-xs text-white/40">{msg.sender_name}</span>
                        <div className={`max-w-[75%] rounded-xl px-3 py-2 text-sm ${
                          isVirtual
                            ? "bg-indigo-600/30 text-indigo-100"
                            : "bg-white/10 text-white/80"
                        }`}>
                          {msg.content}
                        </div>
                        <span className="mt-0.5 text-[10px] text-white/20">{relativeTime(msg.created_at)}</span>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="border-t border-white/10 p-4">
                <div className="mb-2 rounded-lg bg-indigo-500/10 px-3 py-1.5 text-xs text-indigo-300">
                  你正在以「{selected?.poster_virtual?.display_name}」（虛擬用戶）的名義回覆
                </div>
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
                    placeholder="輸入回覆內容..."
                    className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-indigo-500/40"
                  />
                  <button
                    onClick={handleSend}
                    disabled={!input.trim() || sending}
                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {sending ? "傳送中..." : "傳送"}
                  </button>
                </div>
                <p className="mt-1 text-right text-[10px] text-white/20">{input.length}/500</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
