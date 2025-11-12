import Link from "next/link";
import type { Route } from "next";

const draftEvents = [
  {
    id: "evt-2025-03",
    title: "春日嘉年華",
    startsAt: "2025/03/21",
    location: "松菸文創園區",
    status: "報名中",
    capacity: 300,
    publishAt: "2025/02/20 10:00"
  },
  {
    id: "evt-2025-07",
    title: "夏夜電音祭",
    startsAt: "2025/07/05",
    location: "高雄流行音樂中心",
    status: "草稿",
    capacity: 500,
    publishAt: "2025/04/15 18:00"
  }
];

const formDefaults = {
  title: "",
  startsAt: "",
  endsAt: "",
  capacity: 100,
  location: "",
  publishAt: "",
  summary: "",
  description: ""
};

export default function AdminEventsPage() {
  return (
    <section className="space-y-8">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white/90">活動管理</h1>
          <p className="text-sm text-white/60">建立活動、設定可報名名額與發布狀態。</p>
        </div>
        <button className="rounded-xl bg-white/20 px-4 py-2 text-sm font-semibold text-white/90 transition hover:bg-white/30">
          匯入 CSV
        </button>
      </header>

      <article className="glass-card p-6">
        <h2 className="text-lg font-semibold text-white/90">快速建立活動</h2>
        <p className="mt-1 text-xs text-white/60">提交後可在列表中編輯進階設定或上傳素材。</p>
        <form className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-xs text-white/70">
            活動名稱
            <input defaultValue={formDefaults.title} className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none" placeholder="e.g. 春日嘉年華" />
          </label>
          <label className="flex flex-col gap-2 text-xs text-white/70">
            活動日期
            <input type="date" defaultValue={formDefaults.startsAt} className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white focus:border-white/40 focus:outline-none" />
          </label>
          <label className="flex flex-col gap-2 text-xs text-white/70">
            結束日期
            <input type="date" defaultValue={formDefaults.endsAt} className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white focus:border-white/40 focus:outline-none" />
          </label>
          <label className="flex flex-col gap-2 text-xs text-white/70">
            最大名額
            <input type="number" defaultValue={formDefaults.capacity} className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white focus:border-white/40 focus:outline-none" />
          </label>
          <label className="flex flex-col gap-2 text-xs text-white/70">
            地點
            <input defaultValue={formDefaults.location} className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none" placeholder="松菸文創園區" />
          </label>
          <label className="flex flex-col gap-2 text-xs text-white/70">
            排程發布時間
            <input type="datetime-local" defaultValue={formDefaults.publishAt} className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white focus:border-white/40 focus:outline-none" />
          </label>
          <label className="flex flex-col gap-2 text-xs text-white/70 md:col-span-2">
            封面圖片
            <input type="file" className="rounded-xl border border-dashed border-white/20 bg-white/5 px-4 py-6 text-sm text-white focus:border-white/30 focus:outline-none" />
          </label>
          <label className="flex flex-col gap-2 text-xs text-white/70 md:col-span-2">
            活動摘要
            <textarea defaultValue={formDefaults.summary} rows={3} className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none" placeholder="亮點、合作品牌、抽選規則..." />
          </label>
          <label className="flex flex-col gap-2 text-xs text-white/70 md:col-span-2">
            活動內文
            <textarea defaultValue={formDefaults.description} rows={5} className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none" placeholder="輸入活動介紹、流程、抽選規則等" />
          </label>
          <div className="md:col-span-2 flex gap-3">
            <button type="submit" className="rounded-xl bg-white/20 px-4 py-2 text-sm font-semibold text-white/90 transition hover:bg-white/30">
              建立活動
            </button>
            <button type="button" className="rounded-xl border border-white/30 px-4 py-2 text-sm text-white/80 transition hover:bg-white/10">
              儲存草稿
            </button>
          </div>
        </form>
      </article>

      <article className="glass-card p-6">
        <h2 className="text-lg font-semibold text-white/90">活動清單</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-white/10 text-sm text-white/80">
            <thead className="text-left text-xs uppercase tracking-[0.2em] text-white/60">
              <tr>
                <th className="px-4 py-3">活動</th>
                <th className="px-4 py-3">日期</th>
                <th className="px-4 py-3">地點</th>
                <th className="px-4 py-3">名額</th>
                <th className="px-4 py-3">狀態</th>
                <th className="px-4 py-3">排程</th>
                <th className="px-4 py-3">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {draftEvents.map((event) => (
                <tr key={event.id}>
                  <td className="px-4 py-4 font-medium text-white/90">{event.title}</td>
                  <td className="px-4 py-4 text-white/70">{event.startsAt}</td>
                  <td className="px-4 py-4 text-white/70">{event.location}</td>
                  <td className="px-4 py-4 text-white/70">{event.capacity}</td>
                  <td className="px-4 py-4">
                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/80">{event.status}</span>
                  </td>
                  <td className="px-4 py-4 text-white/60">{event.publishAt}</td>
                  <td className="px-4 py-4">
                    <div className="flex gap-2 text-xs">
                      <Link href={`/events/${event.id}` as Route} className="text-sky-200 hover:text-sky-100">
                        預覽
                      </Link>
                      <span className="text-white/40">|</span>
                      <Link href={`/admin/events/${event.id}` as Route} className="text-white/70 hover:text-white/90">
                        編輯
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
}
