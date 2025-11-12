import Link from "next/link";
import type { Route } from "next";
import { notFound } from "next/navigation";

const editableEvents: Record<string, {
  title: string;
  startsAt: string;
  endsAt: string;
  location: string;
  capacity: number;
  publishAt: string;
  summary: string;
  description: string;
  coverUrl?: string;
}> = {
  "evt-2025-03": {
    title: "春日嘉年華",
    startsAt: "2025-03-21T14:00",
    endsAt: "2025-03-21T20:00",
    location: "松菸文創園區",
    capacity: 300,
    publishAt: "2025-03-01T10:00",
    summary: "城市春季限定活動，結合手作市集、舞台表演與盲盒抽選。",
    description: "以玻璃擬態風格打造沉浸式現場，參與者可透過行動網站完成報名、抽選及兌換。",
    coverUrl: "https://example.com/carnival-cover.jpg"
  },
  "evt-2025-07": {
    title: "夏夜電音祭",
    startsAt: "2025-07-05T18:00",
    endsAt: "2025-07-06T02:00",
    location: "高雄流行音樂中心",
    capacity: 500,
    publishAt: "2025-05-15T12:00",
    summary: "戶外電音派對與燈光演出，結合現場盲盒抽選。",
    description: "邀請國內外 DJ、打造沉浸式燈光秀，支援現場即時抽選與派獎。"
  }
};

type AdminEventEditPageProps = {
  params: { id: string };
};

export default function AdminEventEditPage({ params }: AdminEventEditPageProps) {
  const event = editableEvents[params.id];

  if (!event) {
    notFound();
  }

  const previewHref = `/events/${params.id}` as Route;

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/60">活動設定</p>
          <h1 className="text-2xl font-semibold text-white/90">{event.title}</h1>
          <p className="text-xs text-white/60">調整活動資訊、封面與排程，儲存後會同步更新前台頁面。</p>
        </div>
        <Link href={previewHref} className="rounded-xl border border-white/30 px-4 py-2 text-xs text-white/80 transition hover:bg-white/10">
          前台預覽
        </Link>
      </header>

      <form className="glass-card grid gap-4 p-6 md:grid-cols-2">
        <label className="flex flex-col gap-2 text-xs text-white/70">
          活動名稱
          <input defaultValue={event.title} className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white focus:border-white/40 focus:outline-none" />
        </label>
        <label className="flex flex-col gap-2 text-xs text-white/70">
          活動地點
          <input defaultValue={event.location} className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white focus:border-white/40 focus:outline-none" />
        </label>
        <label className="flex flex-col gap-2 text-xs text-white/70">
          活動開始
          <input type="datetime-local" defaultValue={event.startsAt} className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white focus:border-white/40 focus:outline-none" />
        </label>
        <label className="flex flex-col gap-2 text-xs text-white/70">
          活動結束
          <input type="datetime-local" defaultValue={event.endsAt} className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white focus:border-white/40 focus:outline-none" />
        </label>
        <label className="flex flex-col gap-2 text-xs text-white/70">
          可報名名額
          <input type="number" defaultValue={event.capacity} className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white focus:border-white/40 focus:outline-none" />
        </label>
        <label className="flex flex-col gap-2 text-xs text-white/70">
          排程發布時間
          <input type="datetime-local" defaultValue={event.publishAt} className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white focus:border-white/40 focus:outline-none" />
        </label>
        <label className="flex flex-col gap-2 text-xs text-white/70 md:col-span-2">
          活動摘要
          <textarea defaultValue={event.summary} rows={3} className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white focus:border-white/40 focus:outline-none" />
        </label>
        <label className="flex flex-col gap-2 text-xs text-white/70 md:col-span-2">
          活動內文
          <textarea defaultValue={event.description} rows={6} className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white focus:border-white/40 focus:outline-none" />
        </label>
        <label className="flex flex-col gap-2 text-xs text-white/70 md:col-span-2">
          封面圖片
          <div className="flex flex-col gap-3 rounded-xl border border-dashed border-white/20 bg-white/5 p-4">
            {event.coverUrl ? (
              <div className="rounded-lg border border-white/10 bg-white/5 p-4 text-xs text-white/70">
                <p className="font-semibold text-white/80">目前封面</p>
                <p className="mt-1 break-all text-white/60">{event.coverUrl}</p>
              </div>
            ) : null}
            <input type="file" className="rounded-xl border border-white/10 bg-white/10 px-4 py-6 text-sm text-white focus:border-white/30 focus:outline-none" />
          </div>
        </label>
        <div className="flex flex-wrap gap-3 md:col-span-2">
          <button type="submit" className="rounded-xl bg-white/20 px-4 py-2 text-sm font-semibold text-white/90 transition hover:bg-white/30">
            儲存設定
          </button>
          <button type="button" className="rounded-xl border border-white/30 px-4 py-2 text-sm text-white/80 transition hover:bg-white/10">
            建立草稿
          </button>
          <button type="button" className="rounded-xl border border-sky-400/40 px-4 py-2 text-sm text-sky-200 transition hover:bg-sky-400/20">
            發送測試公告
          </button>
        </div>
      </form>

      <article className="glass-card p-6">
        <h2 className="text-lg font-semibold text-white/90">排程紀錄</h2>
        <ul className="mt-4 space-y-3 text-sm text-white/70">
          <li>・2025/02/10 10:30 更新發布排程為 {new Date(event.publishAt).toLocaleString("zh-TW")}。</li>
          <li>・2025/02/08 14:05 匯入 200 筆預購名單。</li>
          <li>・2025/02/07 09:20 更新活動封面與抽選規則。</li>
        </ul>
      </article>
    </section>
  );
}
