"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type EditableEvent = {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
  max_participants: number | null;
  status: "draft" | "published" | "closed";
  description: string | null;
  image_url: string | null;
  organizer_category: "admin" | "vip";
  eligibility_requirements: string | null;
  location: string | null;
};

type EventFormState = {
  title: string;
  start_date: string;
  end_date: string;
  max_participants: string;
  description: string;
  location: string;
  organizer_category: "admin" | "vip";
  eligibility_requirements: string;
  image_url: string;
  status: "draft" | "published" | "closed";
};

interface EventEditFormProps {
  event: EditableEvent;
}

export default function EventEditForm({ event }: EventEditFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState<EventFormState>({
    title: event.title || "",
    start_date: event.start_date ? event.start_date.slice(0, 16) : "",
    end_date: event.end_date ? event.end_date.slice(0, 16) : "",
    max_participants: event.max_participants !== null ? String(event.max_participants) : "",
    description: event.description || "",
    location: event.location || "",
    organizer_category: event.organizer_category,
    eligibility_requirements: event.eligibility_requirements || "",
    image_url: event.image_url || "",
    status: event.status,
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const handleImageUpload = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      setError("圖片大小不能超過 5MB");
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("請上傳圖片檔案");
      return;
    }

    setUploading(true);
    setError("");
    setSuccess("");

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${event.id}-${Date.now()}.${fileExt}`;
      const filePath = `event-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("events")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("events").getPublicUrl(filePath);

      setFormData((prev) => ({ ...prev, image_url: data.publicUrl }));
      setSuccess("圖片上傳成功！");
    } catch (err) {
      setError(err instanceof Error ? err.message : "圖片上傳失敗");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (formEvent: React.FormEvent<HTMLFormElement>) => {
    formEvent.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    const start = formData.start_date ? new Date(formData.start_date).toISOString() : null;
    const end = formData.end_date ? new Date(formData.end_date).toISOString() : null;

    if (!start || !end) {
      setError("請輸入完整的活動時間");
      setSaving(false);
      return;
    }

    try {
      const { error: updateError } = await supabase
        .from("events")
        .update({
          title: formData.title,
          start_date: start,
          end_date: end,
          max_participants: formData.max_participants.trim()
            ? Number(formData.max_participants)
            : null,
          description: formData.description,
          location: formData.location.trim() || null,
          organizer_category: formData.organizer_category,
          eligibility_requirements: formData.eligibility_requirements.trim() || null,
          image_url: formData.image_url.trim() || null,
          status: formData.status,
        })
        .eq("id", event.id);

      if (updateError) throw updateError;

      setSuccess("活動更新成功！");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "更新失敗，請稍後再試");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="glass-card grid gap-4 p-6 md:grid-cols-2">
      {error ? (
        <div className="md:col-span-2 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-xs text-red-200">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="md:col-span-2 rounded-lg border border-green-500/40 bg-green-500/10 px-4 py-3 text-xs text-green-200">
          {success}
        </div>
      ) : null}

      <label className="flex flex-col gap-2 text-xs text-white/70">
        活動名稱 *
        <input
          value={formData.title}
          onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
          required
          className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white focus:border-white/40 focus:outline-none"
        />
      </label>

      <label className="flex flex-col gap-2 text-xs text-white/70">
        活動地點
        <input
          value={formData.location}
          onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
          className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white focus:border-white/40 focus:outline-none"
        />
      </label>

      <label className="flex flex-col gap-2 text-xs text-white/70">
        開始時間 *
        <input
          type="datetime-local"
          value={formData.start_date}
          onChange={(e) => setFormData((prev) => ({ ...prev, start_date: e.target.value }))}
          required
          className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white focus:border-white/40 focus:outline-none"
        />
      </label>

      <label className="flex flex-col gap-2 text-xs text-white/70">
        結束時間 *
        <input
          type="datetime-local"
          value={formData.end_date}
          onChange={(e) => setFormData((prev) => ({ ...prev, end_date: e.target.value }))}
          required
          className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white focus:border-white/40 focus:outline-none"
        />
      </label>

      <label className="flex flex-col gap-2 text-xs text-white/70">
        容納人數上限
        <input
          type="number"
          min={0}
          inputMode="numeric"
          placeholder="留空表示不限"
          value={formData.max_participants}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, max_participants: e.target.value }))
          }
          className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white focus:border-white/40 focus:outline-none"
        />
      </label>

      <label className="flex flex-col gap-2 text-xs text-white/70">
        活動狀態
        <select
          value={formData.status}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, status: e.target.value as EventFormState["status"] }))
          }
          className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white focus:border-white/40 focus:outline-none"
        >
          <option value="draft" className="text-gray-900">
            草稿
          </option>
          <option value="published" className="text-gray-900">
            公開報名
          </option>
          <option value="closed" className="text-gray-900">
            已結束
          </option>
        </select>
      </label>

      <label className="flex flex-col gap-2 text-xs text-white/70">
        主辦單位分類
        <select
          value={formData.organizer_category}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              organizer_category: e.target.value as EventFormState["organizer_category"],
            }))
          }
          className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white focus:border-white/40 focus:outline-none"
        >
          <option value="admin" className="text-gray-900">
            內部主辦
          </option>
          <option value="vip" className="text-gray-900">
            合作夥伴
          </option>
        </select>
      </label>

      <label className="md:col-span-2 flex flex-col gap-2 text-xs text-white/70">
        活動簡介
        <textarea
          rows={4}
          value={formData.description}
          onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
          className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white focus:border-white/40 focus:outline-none"
        />
      </label>

      <label className="md:col-span-2 flex flex-col gap-2 text-xs text-white/70">
        參加資格說明
        <textarea
          rows={3}
          value={formData.eligibility_requirements}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, eligibility_requirements: e.target.value }))
          }
          className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white focus:border-white/40 focus:outline-none"
        />
      </label>

      <div className="md:col-span-2 flex flex-col gap-3 text-xs text-white/70">
        <span>活動主視覺</span>
        {formData.image_url ? (
          <div className="flex items-start gap-4">
            <img
              src={formData.image_url}
              alt="活動主視覺"
              className="h-32 w-48 rounded-xl object-cover"
            />
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, image_url: "" }))}
                className="self-start rounded-full border border-white/30 px-4 py-2 text-xs text-white transition hover:border-white/60 hover:bg-white/10"
              >
                移除圖片
              </button>
              <span className="text-[10px] text-white/50">重新上傳會自動覆蓋原圖</span>
            </div>
          </div>
        ) : null}
        <label className="flex w-full cursor-pointer flex-col items-start gap-2 rounded-xl border border-dashed border-white/30 bg-white/5 p-4 text-white/70 hover:border-white/60 hover:bg-white/10">
          <span>{uploading ? "上傳中..." : "點擊或拖曳圖片上傳"}</span>
          <input
            type="file"
            accept="image/*"
            onChange={(uploadEvent) => {
              const file = uploadEvent.target.files?.[0];
              if (file) handleImageUpload(file);
            }}
            disabled={uploading}
            className="hidden"
          />
          <span className="text-[10px] text-white/40">建議尺寸 1200x630，檔案大小 5MB 以內</span>
        </label>
        {formData.image_url ? (
          <input
            value={formData.image_url}
            onChange={(e) => setFormData((prev) => ({ ...prev, image_url: e.target.value }))}
            className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white focus:border-white/40 focus:outline-none"
            placeholder="或貼上圖片網址"
          />
        ) : null}
      </div>

      <div className="md:col-span-2 flex justify-end gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-white px-6 py-2 text-sm font-medium text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {saving ? "儲存中..." : "儲存變更"}
        </button>
      </div>
    </form>
  );
}
