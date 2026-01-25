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
  offline_registrations: number;
  status: "draft" | "published" | "closed";
  description: string | null;
  image_url: string | null;
  organizer_category: "admin" | "vip";
  eligibility_requirements: string | null;
  location: string | null;
  price: number | null;
  is_free: boolean;
};

type EventFormState = {
  title: string;
  start_date: string;
  end_date: string;
  max_participants: string;
  offline_registrations: string;
  description: string;
  location: string;
  organizer_category: "admin" | "vip";
  eligibility_requirements: string;
  image_url: string;
  status: "draft" | "published" | "closed";
  price: string;
  is_free: boolean;
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
    offline_registrations: String(event.offline_registrations || 0),
    description: event.description || "",
    location: event.location || "",
    organizer_category: event.organizer_category,
    eligibility_requirements: event.eligibility_requirements || "",
    image_url: event.image_url || "",
    status: event.status,
    price: event.price !== null ? String(event.price) : "",
    is_free: event.is_free,
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const handleImageUpload = async (file: File) => {
    console.log("上傳檔案資訊:", {
      name: file.name,
      size: file.size,
      type: file.type,
      sizeInMB: (file.size / (1024 * 1024)).toFixed(2)
    });

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

      console.log("開始上傳到:", filePath);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("events")
        .upload(filePath, file, { 
          cacheControl: '3600',
          upsert: true 
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

      const { data } = supabase.storage.from("events").getPublicUrl(filePath);

      console.log("取得公開網址:", data.publicUrl);

      setFormData((prev) => ({ ...prev, image_url: data.publicUrl }));
      setSuccess("圖片上傳成功！");
    } catch (err) {
      console.error("上傳錯誤:", err);
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
        throw new Error('只有管理員可以編輯活動');
      }

      const updateData = {
        title: formData.title,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        max_participants: formData.max_participants.trim()
          ? Number(formData.max_participants)
          : null,
        offline_registrations: formData.offline_registrations.trim()
          ? Number(formData.offline_registrations)
          : 0,
        description: formData.description,
        location: formData.location.trim() || null,
        organizer_category: formData.organizer_category,
        eligibility_requirements: formData.eligibility_requirements.trim() || null,
        image_url: formData.image_url.trim() || null,
        status: formData.status,
        price: formData.price.trim() ? Number(formData.price) : null,
        is_free: formData.is_free,
      };

      console.log('準備更新資料:', updateData);
      console.log('活動 ID:', event.id);

      const { data, error: updateError } = await supabase
        .from("events")
        .update(updateData)
        .eq("id", event.id)
        .select();

      if (updateError) {
        console.error('更新錯誤:', updateError);
        throw new Error(`更新失敗: ${updateError.message} (code: ${updateError.code})`);
      }

      console.log('更新成功:', data);

      setSuccess("活動更新成功！");
      router.refresh();
    } catch (err) {
      console.error('編輯活動錯誤:', err);
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
        <div className="flex items-center gap-2">
          <span>線下報名人數</span>
          <span className="text-[10px] text-white/50">（手動調整）</span>
        </div>
        <input
          type="number"
          min={0}
          inputMode="numeric"
          placeholder="0"
          value={formData.offline_registrations}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, offline_registrations: e.target.value }))
          }
          className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white focus:border-white/40 focus:outline-none"
        />
        <span className="text-[10px] text-white/50">
          用於記錄線下報名人數，會計入總報名人數
        </span>
      </label>

      <label className="flex flex-col gap-2 text-xs text-white/70">
        活動價格 (NT$)
        <input
          type="number"
          min={0}
          inputMode="numeric"
          placeholder="0"
          value={formData.price}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, price: e.target.value }))
          }
          disabled={formData.is_free}
          className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white disabled:opacity-50 focus:border-white/40 focus:outline-none"
        />
      </label>

      <label className="flex items-center gap-2 text-xs text-white/70">
        <input
          type="checkbox"
          checked={formData.is_free}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, is_free: e.target.checked, price: e.target.checked ? "0" : prev.price }))
          }
          className="h-4 w-4 rounded border-white/20 bg-white/10 text-blue-500 focus:ring-blue-500"
        />
        免費活動
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
          <div className="space-y-3">
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
              </div>
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
