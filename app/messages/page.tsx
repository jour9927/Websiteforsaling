"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

type Message = {
  id: string;
  sender_id: string;
  recipient_id: string;
  subject: string;
  body: string;
  is_read: boolean;
  created_at: string;
  read_at: string | null;
  sender?: {
    id: string;
    email: string;
    full_name: string | null;
    role: string;
  };
};

export default function MessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [loading, setLoading] = useState(true);
  const [showComposeForm, setShowComposeForm] = useState(false);
  const [composing, setComposing] = useState(false);
  const [composeData, setComposeData] = useState({
    subject: "",
    body: ""
  });

  useEffect(() => {
    loadMessages();

    // 訂閱新訊息
    const channel = supabase
      .channel('messages-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        () => {
          loadMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadMessages = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      setLoading(false);
      return;
    }

    console.log('載入收到的訊息，當前用戶:', user.id);

    // 先查询消息
    const { data: receivedMessages, error: messagesError } = await supabase
      .from('messages')
      .select('*')
      .eq('recipient_id', user.id)
      .order('created_at', { ascending: false });

    console.log('查詢訊息結果:', { receivedMessages, messagesError });

    if (messagesError) {
      console.error('載入訊息錯誤:', messagesError);
      setLoading(false);
      return;
    }

    if (receivedMessages && receivedMessages.length > 0) {
      // 获取所有发件人的信息
      const senderIds = receivedMessages.map(m => m.sender_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email, full_name, role')
        .in('id', senderIds);

      console.log('查詢發件人結果:', profiles);

      // 将发件人信息合并到消息中
      const messagesWithSenders = receivedMessages.map(msg => ({
        ...msg,
        sender: profiles?.find(p => p.id === msg.sender_id)
      }));

      setMessages(messagesWithSenders as Message[]);
    } else {
      setMessages([]);
    }
    
    setLoading(false);
  };

  const markAsRead = async (message: Message) => {
    if (!message.is_read) {
      const { error } = await supabase
        .from('messages')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', message.id);

      if (!error) {
        setMessages(prev =>
          prev.map(m => m.id === message.id ? { ...m, is_read: true, read_at: new Date().toISOString() } : m)
        );
      }
    }
    setSelectedMessage(message);
  };

  const deleteMessage = async (id: string) => {
    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', id);

    if (!error) {
      setMessages(prev => prev.filter(m => m.id !== id));
      if (selectedMessage?.id === id) {
        setSelectedMessage(null);
      }
    }
  };

  const sendMessageToAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setComposing(true);

    try {
      // 取得當前用戶
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert("請先登入");
        return;
      }

      // 取得所有管理員
      const { data: admins } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'admin');

      if (!admins || admins.length === 0) {
        alert("找不到管理員");
        return;
      }

      // 發送訊息給所有管理員
      const messagesToInsert = admins.map(admin => ({
        sender_id: user.id,
        recipient_id: admin.id,
        subject: composeData.subject,
        body: composeData.body
      }));

      const { error } = await supabase
        .from('messages')
        .insert(messagesToInsert);

      if (error) {
        console.error("發送訊息錯誤:", error);
        alert("發送失敗，請稍後再試");
        return;
      }

      // 成功後重置表單
      setComposeData({ subject: "", body: "" });
      setShowComposeForm(false);
      alert("訊息已發送給管理員！");

    } catch (error) {
      console.error("發送訊息錯誤:", error);
      alert("發送失敗");
    } finally {
      setComposing(false);
    }
  };

  const unreadCount = messages.filter(m => !m.is_read).length;

  return (
    <div className="space-y-6">
      <header className="glass-card p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-white">我的訊息</h1>
            <p className="mt-1 text-sm text-white/60">
              {unreadCount > 0 ? `您有 ${unreadCount} 則未讀訊息` : '沒有未讀訊息'}
            </p>
          </div>
          <button
            onClick={() => setShowComposeForm(!showComposeForm)}
            className="rounded-xl bg-blue-500/80 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500"
          >
            {showComposeForm ? '取消' : '✉️ 寫信給管理員'}
          </button>
        </div>
      </header>

      {/* 寫信表單 */}
      {showComposeForm && (
        <article className="glass-card p-6">
          <h2 className="text-lg font-semibold text-white/90">寫信給管理員</h2>
          <p className="mt-1 text-xs text-white/60">訊息將發送給所有管理員</p>
          
          <form onSubmit={sendMessageToAdmin} className="mt-4 space-y-4">
            <div>
              <label className="block text-sm text-white/70">主旨</label>
              <input
                type="text"
                value={composeData.subject}
                onChange={(e) => setComposeData(prev => ({ ...prev, subject: e.target.value }))}
                required
                placeholder="請輸入主旨..."
                className="mt-1 w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white placeholder-white/40 focus:border-white/40 focus:outline-none"
              />
            </div>
            
            <div>
              <label className="block text-sm text-white/70">內容</label>
              <textarea
                value={composeData.body}
                onChange={(e) => setComposeData(prev => ({ ...prev, body: e.target.value }))}
                required
                rows={6}
                placeholder="請輸入訊息內容..."
                className="mt-1 w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white placeholder-white/40 focus:border-white/40 focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowComposeForm(false);
                  setComposeData({ subject: "", body: "" });
                }}
                className="rounded-xl border border-white/30 px-4 py-2 text-sm text-white/80 transition hover:bg-white/10"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={composing}
                className="rounded-xl bg-blue-500/80 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {composing ? "發送中..." : "發送"}
              </button>
            </div>
          </form>
        </article>
      )}

      <div className="grid gap-6 md:grid-cols-[1fr_2fr]">
        {/* 訊息列表 */}
        <article className="glass-card p-4">
          <h2 className="mb-4 text-lg font-semibold text-white/90">收件箱</h2>
          
          {loading ? (
            <div className="text-center text-white/60">載入中...</div>
          ) : messages.length === 0 ? (
            <div className="text-center text-white/60">沒有訊息</div>
          ) : (
            <div className="space-y-2">
              {messages.map((message) => (
                <button
                  key={message.id}
                  onClick={() => markAsRead(message)}
                  className={`w-full rounded-lg p-3 text-left transition ${
                    selectedMessage?.id === message.id
                      ? 'bg-white/20'
                      : 'bg-white/5 hover:bg-white/10'
                  } ${!message.is_read ? 'border-l-4 border-blue-500' : ''}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className={`text-sm font-semibold ${!message.is_read ? 'text-white' : 'text-white/80'}`}>
                          {message.subject}
                        </h3>
                        {!message.is_read && (
                          <span className="h-2 w-2 rounded-full bg-blue-500" />
                        )}
                      </div>
                      <p className="mt-1 text-xs text-white/60">
                        來自: {message.sender?.full_name || message.sender?.email}
                      </p>
                      <p className="mt-1 text-xs text-white/50">
                        {new Date(message.created_at).toLocaleString('zh-TW')}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </article>

        {/* 訊息內容 */}
        <article className="glass-card p-6">
          {selectedMessage ? (
            <div>
              <div className="flex items-start justify-between border-b border-white/10 pb-4">
                <div>
                  <h2 className="text-xl font-semibold text-white">{selectedMessage.subject}</h2>
                  <p className="mt-2 text-sm text-white/60">
                    來自: {selectedMessage.sender?.full_name || selectedMessage.sender?.email}
                    {selectedMessage.sender?.role === 'admin' && (
                      <span className="ml-2 rounded-full bg-purple-500/20 px-2 py-0.5 text-xs text-purple-200">
                        管理員
                      </span>
                    )}
                  </p>
                  <p className="mt-1 text-xs text-white/50">
                    {new Date(selectedMessage.created_at).toLocaleString('zh-TW')}
                  </p>
                </div>
                
                <button
                  onClick={() => deleteMessage(selectedMessage.id)}
                  className="text-sm text-red-300 hover:text-red-200"
                >
                  刪除
                </button>
              </div>

              <div className="mt-6 whitespace-pre-wrap text-white/90">
                {selectedMessage.body}
              </div>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center text-white/60">
              選擇一則訊息來閱讀
            </div>
          )}
        </article>
      </div>
    </div>
  );
}
