import Link from "next/link";
import type { Route } from "next";

const scheduledAnnouncements = [
  {
    id: "notice-004",
    title: "春日嘉年華舞台示意曝光",
    publishAt: "2025/02/22 10:00",
    status: "排程"
  },
  {
    id: "notice-005",
    title: "夏夜電音祭合作品牌名單",
    publishAt: "2025/02/28 15:00",
    status: "草稿"
  }
];

export default function AdminAnnouncementsPage() {
  return (
    <section className="space-y-8">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white/90">公告管理</h1>
          <p className="text-sm text-white/60">建立公告、排程發布並同步到首頁公告牆。</p>
        </div>
        <button className="rounded-xl bg-white/20 px-4 py-2 text-sm font-semibold text-white/90 transition hover:bg-white/30">
          匯入公告模板
        </button>
      </header>

      <article className="glass-card p-6">
        <h2 className="text-lg font-semibold text-white/90">建立公告</h2>
        <form className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-xs text-white/70">
            公告標題
            <input className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none" placeholder="輸入公告標題" />
          </label>
          <label className="flex flex-col gap-2 text-xs text-white/70">
            發布排程
            <input type="datetime-local" className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white focus:border-white/40 focus:outline-none" />
          </label>
          <label className="flex flex-col gap-2 text-xs text-white/70 md:col-span-2">
            公告內容
            <textarea rows={6} className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none" placeholder="可使用 Markdown 撰寫公告內容" />
          </label>
          <label className="flex flex-col gap-2 text-xs text-white/70 md:col-span-2">
            附件 / 圖片
            <input type="file" className="rounded-xl border border-dashed border-white/20 bg-white/5 px-4 py-6 text-sm text-white focus:border-white/30 focus:outline-none" />
          </label>
          <div className="flex gap-3 md:col-span-2">
            <button type="submit" className="rounded-xl bg-white/20 px-4 py-2 text-sm font-semibold text-white/90 transition hover:bg-white/30">
              儲存公告
            </button>
            <button type="button" className="rounded-xl border border-white/30 px-4 py-2 text-sm text-white/80 transition hover:bg-white/10">
              發布草稿
            </button>
          </div>
        </form>
      </article>

      <article className="glass-card p-6">
        <h2 className="text-lg font-semibold text-white/90">排程與草稿</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-white/10 text-sm text-white/80">
            <thead className="text-left text-xs uppercase tracking-[0.2em] text-white/60">
              <tr>
                <th className="px-4 py-3">公告</th>
                <th className="px-4 py-3">排程時間</th>
                <th className="px-4 py-3">狀態</th>
                <th className="px-4 py-3">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {scheduledAnnouncements.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-4 font-medium text-white/90">{item.title}</td>
                  <td className="px-4 py-4 text-white/70">{item.publishAt}</td>
                  <td className="px-4 py-4">
                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/80">{item.status}</span>
                  </td>
                  <td className="px-4 py-4 text-xs text-sky-200 hover:text-sky-100">
                    <Link href={`/admin/announcements/${item.id}` as Route}>編輯</Link>
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
