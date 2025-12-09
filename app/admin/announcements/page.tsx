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
    published_at: ""
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
      // 取得當前使用者
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) {
        console.error('取得使用者錯誤:', userError);
        throw new Error(`取得使用者失敗: ${userError.message}`);
      }
      if (!user) {
        throw new Error('未登入');
      }

      console.log('當前使用者:', user.id);
      
      // 檢查使用者是否為管理員
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      
      if (profileError) {
        console.error('取得身份錯誤:', profileError);
        throw new Error(`取得身份失敗: ${profileError.message}`);
      }
      
      console.log('使用者身份:', profile);
      
      if (profile?.role !== 'admin') {
        throw new Error('只有管理員可以建立公告');
      }

      const insertData = {
        title: formData.title,
        content: formData.content,
        published_at: formData.published_at || null,
        created_by: user.id
      };
      
      console.log('準備插入資料:', insertData);

      const { data, error } = await supabase
        .from('announcements')
        .insert([insertData])
        .select();

      if (error) {
        console.error('插入錯誤:', error);
        throw new Error(`插入失敗: ${error.message} (code: ${error.code})`);
      }
      
      console.log('插入成功:', data);

      setSuccess("公告建立成功！");
      setFormData({
        title: "",
        content: "",
        published_at: ""
      });
      loadAnnouncements();
    } catch (err) {
      console.error('建立公告錯誤:', err);
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
