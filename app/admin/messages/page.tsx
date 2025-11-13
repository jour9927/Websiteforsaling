"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

type User = {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
};

type Message = {
  id: string;
  sender_id: string;
  recipient_id: string;
  subject: string;
  body: string;
  is_read: boolean;
  created_at: string;
  read_at: string | null;
  recipient?: User;
};

export default function AdminMessagesPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [sentMessages, setSentMessages] = useState<Message[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
    loadSentMessages();
  }, []);

  const loadUsers = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, role')
      .order('full_name');

    if (!error && data) {
      setUsers(data);
    }
  };

  const loadSentMessages = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        recipient:recipient_id (
          id,
          email,
          full_name,
          role
        )
      `)
      .eq('sender_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setSentMessages(data as Message[]);
    }
    
    setLoading(false);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedUser || !subject.trim() || !body.trim()) {
      setError("請填寫所有欄位");
      return;
    }

    setSending(true);
    setError("");
    setSuccess("");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("請先登入");
      }

      const { error: insertError } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          recipient_id: selectedUser,
          subject: subject.trim(),
          body: body.trim()
        });

      if (insertError) throw insertError;

      setSuccess("訊息已發送！");
      setSelectedUser("");
      setSubject("");
      setBody("");
      
      // 重新載入已發送訊息
      loadSentMessages();
    } catch (err) {
      setError(err instanceof Error ? err.message : "發送失敗");
    } finally {
      setSending(false);
    }
  };

  const deleteMessage = async (id: string) => {
    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', id);

    if (!error) {
      setSentMessages(prev => prev.filter(m => m.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      <header className="glass-card p-6">
        <h1 className="text-2xl font-semibold text-white">會員訊息系統</h1>
        <p className="mt-1 text-sm text-white/60">發送訊息給個別會員</p>
      </header>

      {/* 發送訊息表單 */}
      <article className="glass-card p-6">
        <h2 className="text-lg font-semibold text-white/90">發送新訊息</h2>
        
        <form onSubmit={handleSendMessage} className="mt-4 space-y-4">
          {error && (
            <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-lg border border-green-500/40 bg-green-500/10 px-4 py-3 text-sm text-green-200">
              {success}
            </div>
          )}

          <label className="flex flex-col gap-2 text-sm text-white/70">
            收件人 *
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              required
              className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white focus:border-white/40 focus:outline-none"
            >
              <option value="" className="text-gray-900">選擇收件人</option>
              {users.map((user) => (
                <option key={user.id} value={user.id} className="text-gray-900">
                  {user.full_name || user.email} ({user.role === 'admin' ? '管理員' : user.role === 'vip' ? 'VIP' : '一般會員'})
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2 text-sm text-white/70">
            主旨 *
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
              placeholder="輸入訊息主旨"
              className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm text-white/70">
            內容 *
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              required
              rows={6}
              placeholder="輸入訊息內容"
              className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none"
            />
          </label>

          <button
            type="submit"
            disabled={sending}
            className="rounded-xl bg-white/20 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/30 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {sending ? "發送中..." : "發送訊息"}
          </button>
        </form>
      </article>

      {/* 已發送訊息列表 */}
      <article className="glass-card p-6">
        <h2 className="text-lg font-semibold text-white/90">已發送訊息</h2>
        
        {loading ? (
          <div className="mt-4 text-center text-white/60">載入中...</div>
        ) : sentMessages.length === 0 ? (
          <div className="mt-4 text-center text-white/60">尚未發送任何訊息</div>
        ) : (
          <div className="mt-4 space-y-3">
            {sentMessages.map((message) => (
              <div
                key={message.id}
                className="rounded-xl border border-white/10 bg-white/5 p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-white">{message.subject}</h3>
                      {message.is_read && (
                        <span className="rounded-full bg-green-500/20 px-2 py-0.5 text-xs text-green-200">
                          已讀
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-white/60">
                      收件人: {message.recipient?.full_name || message.recipient?.email}
                    </p>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-white/80">
                      {message.body}
                    </p>
                    <p className="mt-2 text-xs text-white/50">
                      {new Date(message.created_at).toLocaleString('zh-TW')}
                      {message.read_at && ` · 已於 ${new Date(message.read_at).toLocaleString('zh-TW')} 閱讀`}
                    </p>
                  </div>
                  
                  <button
                    onClick={() => deleteMessage(message.id)}
                    className="text-xs text-red-300 hover:text-red-200"
                  >
                    刪除
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </article>
    </div>
  );
}
