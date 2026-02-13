"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Route } from "next";
import { supabase } from "@/lib/supabase";

interface Announcement {
  id: string;
  title: string;
  content: string;
  image_url: string | null;
  status: string;
  published_at: string | null;
  created_at: string;
}

type AdminAnnouncementEditPageProps = {
  params: { id: string };
};

export default function AdminAnnouncementEditPage({ params }: AdminAnnouncementEditPageProps) {
  const router = useRouter();
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    image_url: "",
    status: "draft",
    published_at: ""
  });

  // 載入公告
  useEffect(() => {
    const loadAnnouncement = async () => {
      try {
        const { data, error } = await supabase
          .from('announcements')
          .select('*')
          .eq('id', params.id)
          .single();

        if (error) throw error;
        if (!data) {
          setError("找不到此公告");
          return;
        }

        setAnnouncement(data);
        setFormData({
          title: data.title,
          content: data.content,
          image_url: data.image_url || "",
          status: data.status || "draft",
          published_at: data.published_at ? new Date(data.published_at).toISOString().slice(0, 16) : ""
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "載入失敗");
      } finally {
        setLoading(false);
      }
    };

    loadAnnouncement();
  }, [params.id]);

  // 圖片上傳
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("圖片大小不能超過 5MB");
      return;
    }
    if (!file.type.startsWith('image/')) {
      setError("請上傳圖片檔案");
      return;
    }

    setUploading(true);
    setError("");

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `announcement-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('events')
        .upload(filePath, file, { cacheControl: '3600', upsert: false });

      if (uploadError) throw new Error(`上傳失敗: ${uploadError.message}`);

      const { data: { publicUrl } } = supabase.storage
        .from('events')
        .getPublicUrl(filePath);

      setFormData({ ...formData, image_url: publicUrl });
    } catch (err) {
      setError(err instanceof Error ? err.message : '圖片上傳失敗');
    } finally {
      setUploading(false);
    }
  };

  // 儲存公告
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const { error } = await supabase
        .from('announcements')
        .update({
          title: formData.title,
          content: formData.content,
          image_url: formData.image_url || null,
          status: formData.status,
          published_at: formData.published_at || null
        })
        .eq('id', params.id);

      if (error) throw error;

      setSuccess("公告已更新！");
    } catch (err) {
      setError(err instanceof Error ? err.message : "儲存失敗");
    } finally {
      setSaving(false);
    }
  };

  // 刪除公告
  const handleDelete = async () => {
    if (!confirm("確定要刪除這則公告嗎？此操作無法復原。")) return;

    try {
      const { error } = await supabase
        .from('announcements')
        .delete()
        .eq('id', params.id);

      if (error) throw error;

      router.push('/admin/announcements');
    } catch (err) {
      setError(err instanceof Error ? err.message : "刪除失敗");
    }
  };

  if (loading) {
    return (
      <div className="glass-card p-8 text-center">
        <p className="text-white/60">載入中...</p>
      </div>
    );
  }

  if (!announcement) {
    return (
      <div className="glass-card p-8 text-center">
        <p className="text-white/60">{error || "找不到此公告"}</p>
        <Link href="/admin/announcements" className="mt-4 inline-block text-sky-200 hover:text-sky-100">
          返回公告列表
        </Link>
      </div>
    );
  }

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-white/60">公告編輯</p>
        <h1 className="text-2xl font-semibold text-white/90">{announcement.title}</h1>
        <p className="text-xs text-white/60">可調整內容、狀態與排程。儲存後會同步更新前台公告頁。</p>
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

      <form onSubmit={handleSubmit} className="glass-card grid gap-4 p-6 md:grid-cols-2">
        <label className="flex flex-col gap-2 text-xs text-white/70">
          公告標題 *
          <input
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
            className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white focus:border-white/40 focus:outline-none"
          />
        </label>

        <label className="flex flex-col gap-2 text-xs text-white/70">
          公告狀態
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white focus:border-white/40 focus:outline-none"
          >
            <option value="draft">草稿</option>
            <option value="scheduled">排程</option>
            <option value="published">立即發布</option>
          </select>
        </label>

        <label className="flex flex-col gap-2 text-xs text-white/70">
          排程時間
          <input
            type="datetime-local"
            value={formData.published_at}
            onChange={(e) => setFormData({ ...formData, published_at: e.target.value })}
            className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white focus:border-white/40 focus:outline-none"
          />
        </label>

        <label className="flex flex-col gap-2 text-xs text-white/70">
          建立時間
          <input
            type="text"
            value={new Date(announcement.created_at).toLocaleString('zh-TW')}
            disabled
            className="rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-sm text-white/50 cursor-not-allowed"
          />
        </label>

        <label className="flex flex-col gap-2 text-xs text-white/70 md:col-span-2">
          公告內容 *
          <textarea
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            required
            rows={8}
            className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white focus:border-white/40 focus:outline-none"
          />
        </label>

        <label className="flex flex-col gap-2 text-xs text-white/70 md:col-span-2">
          公告圖片
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            disabled={uploading}
            className="rounded-xl border border-dashed border-white/20 bg-white/5 px-4 py-4 text-sm text-white file:mr-4 file:rounded-full file:border-0 file:bg-white/20 file:px-4 file:py-2 file:text-sm file:text-white hover:file:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          {uploading && <p className="text-xs text-white/60">上傳中...</p>}
          <input
            value={formData.image_url}
            onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
            className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-xs text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none"
            placeholder="或貼上圖片網址 (https://...)"
          />
          {formData.image_url && (
            <div className="mt-1 flex items-center gap-3">
              <img src={formData.image_url} alt="預覽" className="h-24 rounded-lg object-cover" />
              <button
                type="button"
                onClick={() => setFormData({ ...formData, image_url: "" })}
                className="text-xs text-red-300 hover:text-red-200"
              >
                移除圖片
              </button>
            </div>
          )}
        </label>

        <div className="flex gap-3 md:col-span-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-white/20 px-4 py-2 text-sm font-semibold text-white/90 transition hover:bg-white/30 disabled:opacity-50"
          >
            {saving ? "儲存中..." : "儲存"}
          </button>
          <Link
            href={`/announcements/${params.id}` as Route}
            className="rounded-xl border border-white/30 px-4 py-2 text-sm text-white/80 transition hover:bg-white/10"
          >
            預覽公告
          </Link>
          <button
            type="button"
            onClick={handleDelete}
            className="rounded-xl border border-red-500/40 px-4 py-2 text-sm text-red-200 transition hover:bg-red-500/20"
          >
            刪除公告
          </button>
          <Link
            href="/admin/announcements"
            className="ml-auto rounded-xl border border-white/20 px-4 py-2 text-sm text-white/60 transition hover:bg-white/10"
          >
            返回列表
          </Link>
        </div>
      </form>
    </section>
  );
}
