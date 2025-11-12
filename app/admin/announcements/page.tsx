"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { Route } from "next";
import { supabase } from "@/lib/supabase";

interface Announcement {
  id: string;
  title: string;
  content: string;
  published_at: string | null;
  status: 'draft' | 'scheduled' | 'published';
  created_at: string;
}

export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    published_at: "",
    status: "draft" as 'draft' | 'scheduled' | 'published'
  });

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setAnnouncements(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : '載入失敗');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const { error } = await supabase
        .from('announcements')
        .insert([{
          title: formData.title,
          content: formData.content,
          published_at: formData.published_at || null,
          status: formData.status
        }]);

      if (error) throw error;

      setSuccess("公告建立成功！");
      setFormData({
        title: "",
        content: "",
        published_at: "",
        status: "draft"
      });
      loadAnnouncements();
    } catch (err) {
      setError(err instanceof Error ? err.message : '建立失敗');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("確定要刪除這則公告嗎？")) return;

    try {
      const { error } = await supabase
        .from('announcements')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setSuccess("公告已刪除");
      loadAnnouncements();
    } catch (err) {
      setError(err instanceof Error ? err.message : '刪除失敗');
    }
  };

  const handleStatusChange = async (id: string, newStatus: 'draft' | 'scheduled' | 'published') => {
    try {
      const { error } = await supabase
        .from('announcements')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;
      
      setSuccess("狀態已更新");
      loadAnnouncements();
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新失敗');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-500/20 text-green-200';
      case 'scheduled': return 'bg-blue-500/20 text-blue-200';
      case 'draft': return 'bg-gray-500/20 text-gray-200';
      default: return 'bg-white/10 text-white/80';
    }
  };

  return (
    <section className="space-y-8">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white/90">公告管理</h1>
          <p className="text-sm text-white/60">建立公告、排程發布並同步到首頁公告牆。</p>
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
        <h2 className="text-lg font-semibold text-white/90">建立公告</h2>
        <form onSubmit={handleSubmit} className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-xs text-white/70">
            公告標題 *
            <input 
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              required
              className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none" 
              placeholder="輸入公告標題" 
            />
          </label>
          <label className="flex flex-col gap-2 text-xs text-white/70">
            發布排程
            <input 
              type="datetime-local" 
              value={formData.published_at}
              onChange={(e) => setFormData({...formData, published_at: e.target.value})}
              className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white focus:border-white/40 focus:outline-none" 
            />
          </label>
          <label className="flex flex-col gap-2 text-xs text-white/70 md:col-span-2">
            公告內容 *
            <textarea 
              rows={6} 
              value={formData.content}
              onChange={(e) => setFormData({...formData, content: e.target.value})}
              required
              className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none" 
              placeholder="可使用 Markdown 撰寫公告內容" 
            />
          </label>
          <label className="flex flex-col gap-2 text-xs text-white/70">
            狀態
            <select
              value={formData.status}
              onChange={(e) => setFormData({...formData, status: e.target.value as 'draft' | 'scheduled' | 'published'})}
              className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white focus:border-white/40 focus:outline-none"
            >
              <option value="draft">草稿</option>
              <option value="scheduled">已排程</option>
              <option value="published">立即發布</option>
            </select>
          </label>
          <div className="flex gap-3 md:col-span-2">
            <button 
              type="submit" 
              disabled={saving}
              className="rounded-xl bg-white/20 px-4 py-2 text-sm font-semibold text-white/90 transition hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "建立中..." : "建立公告"}
            </button>
          </div>
        </form>
      </article>

      <article className="glass-card p-6">
        <h2 className="text-lg font-semibold text-white/90">公告清單</h2>
        
        {loading ? (
          <div className="mt-4 text-center text-white/60">載入中...</div>
        ) : announcements.length === 0 ? (
          <div className="mt-4 text-center text-white/60">尚無公告，請建立第一則公告</div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full divide-y divide-white/10 text-sm text-white/80">
              <thead className="text-left text-xs uppercase tracking-[0.2em] text-white/60">
                <tr>
                  <th className="px-4 py-3">公告</th>
                  <th className="px-4 py-3">發布時間</th>
                  <th className="px-4 py-3">狀態</th>
                  <th className="px-4 py-3">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {announcements.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-4 font-medium text-white/90">{item.title}</td>
                    <td className="px-4 py-4 text-white/70">
                      {item.published_at ? new Date(item.published_at).toLocaleString('zh-TW') : '-'}
                    </td>
                    <td className="px-4 py-4">
                      <select
                        value={item.status}
                        onChange={(e) => handleStatusChange(item.id, e.target.value as 'draft' | 'scheduled' | 'published')}
                        className={`rounded-full px-3 py-1 text-xs border-none focus:outline-none focus:ring-2 focus:ring-white/30 ${getStatusColor(item.status)}`}
                      >
                        <option value="draft">草稿</option>
                        <option value="scheduled">已排程</option>
                        <option value="published">已發布</option>
                      </select>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex gap-2 text-xs">
                        <Link href={`/announcements/${item.id}` as Route} className="text-sky-200 hover:text-sky-100">
                          預覽
                        </Link>
                        <span className="text-white/40">|</span>
                        <Link href={`/admin/announcements/${item.id}` as Route} className="text-white/70 hover:text-white/90">
                          編輯
                        </Link>
                        <span className="text-white/40">|</span>
                        <button 
                          onClick={() => handleDelete(item.id)}
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
