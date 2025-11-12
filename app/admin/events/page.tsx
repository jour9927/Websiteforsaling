"use client";

import Link from "next/link";
import type { Route } from "next";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

type Event = {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
  max_participants: number | null;
  status: 'draft' | 'published' | 'closed';
  description: string | null;
  image_url: string | null;
  created_at: string;
};

export default function AdminEventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  const [formData, setFormData] = useState({
    title: "",
    start_date: "",
    end_date: "",
    max_participants: 100,
    description: "",
    status: "draft" as 'draft' | 'published' | 'closed'
  });

  // 載入活動列表
  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEvents(data || []);
    } catch (err) {
      console.error('載入活動失敗:', err);
      setError(err instanceof Error ? err.message : '載入失敗');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const { error } = await supabase
        .from('events')
        .insert([{
          title: formData.title,
          start_date: formData.start_date,
          end_date: formData.end_date,
          max_participants: formData.max_participants,
          description: formData.description,
          status: formData.status
        }]);

      if (error) throw error;

      setSuccess("活動建立成功！");
      setFormData({
        title: "",
        start_date: "",
        end_date: "",
        max_participants: 100,
        description: "",
        status: "draft"
      });
      
      // 重新載入列表
      loadEvents();
    } catch (err) {
      setError(err instanceof Error ? err.message : '建立失敗');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('確定要刪除此活動嗎？')) return;

    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setSuccess("活動已刪除");
      loadEvents();
    } catch (err) {
      setError(err instanceof Error ? err.message : '刪除失敗');
    }
  };

  const handleStatusChange = async (id: string, newStatus: 'draft' | 'published' | 'closed') => {
    try {
      const { error } = await supabase
        .from('events')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;
      
      setSuccess("狀態已更新");
      loadEvents();
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新失敗');
    }
  };

  return (
    <section className="space-y-8">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white/90">活動管理</h1>
          <p className="text-sm text-white/60">建立活動、設定可報名名額與發布狀態。</p>
        </div>
      </header>

      {error && (
        <div className="rounded-lg bg-red-500/20 border border-red-500/50 px-4 py-3 text-sm text-red-100">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-lg bg-green-500/20 border border-green-500/50 px-4 py-3 text-sm text-green-100">
          {success}
        </div>
      )}

      <article className="glass-card p-6">
        <h2 className="text-lg font-semibold text-white/90">快速建立活動</h2>
        <p className="mt-1 text-xs text-white/60">提交後可在列表中編輯進階設定。</p>
        <form onSubmit={handleSubmit} className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-xs text-white/70">
            活動名稱 *
            <input 
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              required
              className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none" 
              placeholder="e.g. 春日嘉年華" 
            />
          </label>
          <label className="flex flex-col gap-2 text-xs text-white/70">
            活動日期 *
            <input 
              type="datetime-local" 
              value={formData.start_date}
              onChange={(e) => setFormData({...formData, start_date: e.target.value})}
              required
              className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white focus:border-white/40 focus:outline-none" 
            />
          </label>
          <label className="flex flex-col gap-2 text-xs text-white/70">
            結束日期 *
            <input 
              type="datetime-local" 
              value={formData.end_date}
              onChange={(e) => setFormData({...formData, end_date: e.target.value})}
              required
              className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white focus:border-white/40 focus:outline-none" 
            />
          </label>
          <label className="flex flex-col gap-2 text-xs text-white/70">
            最大名額
            <input 
              type="number" 
              value={formData.max_participants}
              onChange={(e) => setFormData({...formData, max_participants: parseInt(e.target.value)})}
              className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white focus:border-white/40 focus:outline-none" 
            />
          </label>
          <label className="flex flex-col gap-2 text-xs text-white/70 md:col-span-2">
            活動說明
            <textarea 
              value={formData.description || ""}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              rows={5} 
              className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none" 
              placeholder="輸入活動介紹、流程、抽選規則等" 
            />
          </label>
          <label className="flex flex-col gap-2 text-xs text-white/70">
            狀態
            <select
              value={formData.status}
              onChange={(e) => setFormData({...formData, status: e.target.value as 'draft' | 'published' | 'closed'})}
              className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white focus:border-white/40 focus:outline-none"
            >
              <option value="draft">草稿</option>
              <option value="published">已發布</option>
              <option value="closed">已關閉</option>
            </select>
          </label>
          <div className="md:col-span-2 flex gap-3">
            <button 
              type="submit" 
              disabled={saving}
              className="rounded-xl bg-white/20 px-4 py-2 text-sm font-semibold text-white/90 transition hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "建立中..." : "建立活動"}
            </button>
          </div>
        </form>
      </article>

      <article className="glass-card p-6">
        <h2 className="text-lg font-semibold text-white/90">活動清單</h2>
        
        {loading ? (
          <div className="mt-4 text-center text-white/60">載入中...</div>
        ) : events.length === 0 ? (
          <div className="mt-4 text-center text-white/60">尚無活動，請建立第一個活動</div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full divide-y divide-white/10 text-sm text-white/80">
              <thead className="text-left text-xs uppercase tracking-[0.2em] text-white/60">
                <tr>
                  <th className="px-4 py-3">活動</th>
                  <th className="px-4 py-3">日期</th>
                  <th className="px-4 py-3">名額</th>
                  <th className="px-4 py-3">狀態</th>
                  <th className="px-4 py-3">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {events.map((event) => (
                  <tr key={event.id}>
                    <td className="px-4 py-4 font-medium text-white/90">{event.title}</td>
                    <td className="px-4 py-4 text-white/70">
                      {new Date(event.start_date).toLocaleDateString('zh-TW')}
                    </td>
                    <td className="px-4 py-4 text-white/70">{event.max_participants || '無限制'}</td>
                    <td className="px-4 py-4">
                      <select
                        value={event.status}
                        onChange={(e) => handleStatusChange(event.id, e.target.value as 'draft' | 'published' | 'closed')}
                        className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/80 border-none focus:outline-none focus:ring-2 focus:ring-white/30"
                      >
                        <option value="draft">草稿</option>
                        <option value="published">已發布</option>
                        <option value="closed">已關閉</option>
                      </select>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex gap-2 text-xs">
                        <Link href={`/events/${event.id}` as Route} className="text-sky-200 hover:text-sky-100">
                          預覽
                        </Link>
                        <span className="text-white/40">|</span>
                        <Link href={`/admin/events/${event.id}` as Route} className="text-white/70 hover:text-white/90">
                          編輯
                        </Link>
                        <span className="text-white/40">|</span>
                        <button 
                          onClick={() => handleDelete(event.id)}
                          className="text-red-300 hover:text-red-200"
                        >
                          刪除
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </article>
    </section>
  );
}
