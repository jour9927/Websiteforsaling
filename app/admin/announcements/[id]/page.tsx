import { notFound } from "next/navigation";

const editableAnnouncements: Record<string, {
  title: string;
  body: string;
  publishAt: string;
  status: "排程" | "草稿" | "發布";
}> = {
  "notice-004": {
    title: "春日嘉年華舞台示意曝光",
    body: "釋出全新舞台配置與互動裝置。",
    publishAt: "2025-02-22T10:00",
    status: "排程"
  },
  "notice-005": {
    title: "夏夜電音祭合作品牌名單",
    body: "公布合作品牌名單與聯合活動。",
    publishAt: "2025-02-28T15:00",
    status: "草稿"
  }
};

type AdminAnnouncementEditPageProps = {
  params: { id: string };
};

export default function AdminAnnouncementEditPage({ params }: AdminAnnouncementEditPageProps) {
  const announcement = editableAnnouncements[params.id];

  if (!announcement) {
    notFound();
  }

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-white/60">公告編輯</p>
        <h1 className="text-2xl font-semibold text-white/90">{announcement.title}</h1>
        <p className="text-xs text-white/60">可調整排程、內容與附件。儲存後會同步更新前台公告頁。</p>
      </header>

      <form className="glass-card grid gap-4 p-6 md:grid-cols-2">
        <label className="flex flex-col gap-2 text-xs text-white/70">
          公告標題
          <input defaultValue={announcement.title} className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white focus:border-white/40 focus:outline-none" />
        </label>

        <label className="flex flex-col gap-2 text-xs text-white/70">
          公告狀態
          <select defaultValue={announcement.status} className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white focus:border-white/40 focus:outline-none">
            <option value="草稿">草稿</option>
            <option value="排程">排程</option>
            <option value="發布">立即發布</option>
          </select>
        </label>

        <label className="flex flex-col gap-2 text-xs text-white/70">
          排程時間
          <input type="datetime-local" defaultValue={announcement.publishAt} className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white focus:border-white/40 focus:outline-none" />
        </label>

        <label className="flex flex-col gap-2 text-xs text-white/70">
          附件 / 圖片
          <input type="file" className="rounded-xl border border-dashed border-white/20 bg-white/5 px-4 py-6 text-sm text-white focus:border-white/30 focus:outline-none" />
        </label>

        <label className="flex flex-col gap-2 text-xs text-white/70 md:col-span-2">
          公告內容
          <textarea defaultValue={announcement.body} rows={8} className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white focus:border-white/40 focus:outline-none" />
        </label>

        <div className="flex gap-3 md:col-span-2">
          <button type="submit" className="rounded-xl bg-white/20 px-4 py-2 text-sm font-semibold text-white/90 transition hover:bg-white/30">
            儲存
          </button>
          <button type="button" className="rounded-xl border border-white/30 px-4 py-2 text-sm text-white/80 transition hover:bg-white/10">
            預覽公告
          </button>
          <button type="button" className="rounded-xl border border-red-500/40 px-4 py-2 text-sm text-red-200 transition hover:bg-red-500/20">
            刪除公告
          </button>
        </div>
      </form>
    </section>
  );
}
