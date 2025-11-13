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
  organizer_category: 'admin' | 'vip';
  eligibility_requirements: string | null;
  location: string | null;
  created_at: string;
};

export default function AdminEventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [registrationCounts, setRegistrationCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  const [formData, setFormData] = useState({
    title: "",
    start_date: "",
    end_date: "",
    max_participants: 100,
    description: "",
    location: "",
    organizer_category: "admin" as 'admin' | 'vip',
    eligibility_requirements: "",
    image_url: "",
    status: "draft" as 'draft' | 'published' | 'closed'
  });

  // 載入活動列表
  useEffect(() => {
    loadEvents();
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    console.log("上傳檔案資訊:", {
      name: file.name,
      size: file.size,
      type: file.type,
      sizeInMB: (file.size / (1024 * 1024)).toFixed(2)
    });

    // 檢查檔案大小 (限制 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("圖片大小不能超過 5MB");
      return;
    }

    // 檢查檔案類型
    if (!file.type.startsWith('image/')) {
      setError("請上傳圖片檔案");
      return;
    }

    setUploading(true);
    setError("");

    try {
      // 生成唯一檔名
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `event-images/${fileName}`;

      console.log("開始上傳到:", filePath);

      // 上傳到 Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('events')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      console.log("上傳結果:", { uploadData, uploadError });

      if (uploadError) {
        console.error("上傳錯誤詳情:", uploadError);
        
        // 提供更友善的錯誤訊息
        if (uploadError.message?.includes('Bucket not found')) {
          throw new Error(
            '❌ Storage bucket 未建立！\n' +
            '請前往 Supabase Dashboard → Storage → 建立名為 "events" 的 bucket\n' +
            '詳細步驟請參考 URGENT_STORAGE_SETUP.md'
          );
        }
        
        throw new Error(`上傳失敗: ${uploadError.message}`);
      }

      // 取得公開 URL
      const { data: { publicUrl } } = supabase.storage
        .from('events')
        .getPublicUrl(filePath);

      console.log("取得公開網址:", publicUrl);

      setFormData({ ...formData, image_url: publicUrl });
      setSuccess("圖片上傳成功！");
    } catch (err) {
      console.error("上傳錯誤:", err);
      setError(err instanceof Error ? err.message : '圖片上傳失敗');
    } finally {
      setUploading(false);
    }
  };

  const loadEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setEvents(data || []);
      
      // Load registration counts for each event
      if (data && data.length > 0) {
        const counts: Record<string, number> = {};
        for (const event of data) {
          const { count } = await supabase
            .from('registrations')
            .select('*', { count: 'exact', head: true })
            .eq('event_id', event.id);
          counts[event.id] = count || 0;
        }
        setRegistrationCounts(counts);
      }
    } catch (err) {
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
          location: formData.location,
          organizer_category: formData.organizer_category,
          eligibility_requirements: formData.eligibility_requirements,
          image_url: formData.image_url || null,
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
        location: "",
        organizer_category: "admin",
        eligibility_requirements: "",
        image_url: "",
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
          <label className="flex flex-col gap-2 text-xs text-white/70">
            主辦類別 *
            <select
              value={formData.organizer_category}
              onChange={(e) => setFormData({...formData, organizer_category: e.target.value as 'admin' | 'vip'})}
              required
              className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white focus:border-white/40 focus:outline-none"
            >
              <option value="admin">管理員</option>
              <option value="vip">大佬</option>
            </select>
          </label>
          <label className="flex flex-col gap-2 text-xs text-white/70 md:col-span-2">
            活動地點
            <input 
              type="text" 
              value={formData.location}
              onChange={(e) => setFormData({...formData, location: e.target.value})}
              className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none" 
              placeholder="例如：台北市信義區..." 
            />
          </label>
          <label className="flex flex-col gap-2 text-xs text-white/70 md:col-span-2">
            參與資格
            <textarea 
              value={formData.eligibility_requirements || ""}
              onChange={(e) => setFormData({...formData, eligibility_requirements: e.target.value})}
              rows={3} 
              className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none" 
              placeholder="例如：需年滿18歲、具備基本程式能力..." 
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
          <label className="flex flex-col gap-2 text-xs text-white/70 md:col-span-2">
            活動封面圖片
            <input 
              type="file" 
              accept="image/*"
              onChange={handleImageUpload}
              disabled={uploading}
              className="rounded-xl border border-dashed border-white/20 bg-white/5 px-4 py-6 text-sm text-white file:mr-4 file:rounded-full file:border-0 file:bg-white/20 file:px-4 file:py-2 file:text-sm file:text-white hover:file:bg-white/30 focus:border-white/30 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed" 
            />
            {uploading && <p className="text-xs text-white/60">上傳中...</p>}
            {formData.image_url && (
              <div className="mt-2 flex items-center gap-3">
                <img src={formData.image_url} alt="預覽" className="h-20 w-20 rounded-lg object-cover" />
                <button 
                  type="button"
                  onClick={() => setFormData({...formData, image_url: ""})}
                  className="text-xs text-red-300 hover:text-red-200"
                >
                  移除圖片
                </button>
              </div>
            )}
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
                  <th className="px-4 py-3">封面</th>
                  <th className="px-4 py-3">活動</th>
                  <th className="px-4 py-3">主辦</th>
                  <th className="px-4 py-3">地點</th>
                  <th className="px-4 py-3">日期</th>
                  <th className="px-4 py-3">報名/名額</th>
                  <th className="px-4 py-3">狀態</th>
                  <th className="px-4 py-3">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {events.map((event) => (
                  <tr key={event.id}>
                    <td className="px-4 py-4">
                      {event.image_url ? (
                        <img src={event.image_url} alt={event.title} className="h-12 w-12 rounded-lg object-cover" />
                      ) : (
                        <div className="h-12 w-12 rounded-lg bg-white/10 flex items-center justify-center text-xs text-white/40">
                          無圖
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4 font-medium text-white/90">{event.title}</td>
                    <td className="px-4 py-4 text-white/70">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs ${event.organizer_category === 'vip' ? 'bg-yellow-500/20 text-yellow-200' : 'bg-blue-500/20 text-blue-200'}`}>
                        {event.organizer_category === 'vip' ? '大佬' : '管理員'}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-white/70">{event.location || '-'}</td>
                    <td className="px-4 py-4 text-white/70">
                      {new Date(event.start_date).toLocaleDateString('zh-TW')}
                    </td>
                    <td className="px-4 py-4 text-white/70">
                      <span className={(event.max_participants && registrationCounts[event.id] >= event.max_participants) ? 'text-red-300' : ''}>
                        {registrationCounts[event.id] || 0} / {event.max_participants || '∞'}
                      </span>
                    </td>
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
