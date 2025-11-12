import Link from "next/link";
import type { Route } from "next";

const pendingDraws = [
  {
    id: "draw-302",
    event: "春日嘉年華",
    bucket: "VIP 盲盒",
    requested: 80,
    fulfilled: 60,
    deadline: "2025/02/19 12:00"
  },
  {
    id: "draw-417",
    event: "夏夜電音祭",
    bucket: "一般盲盒",
    requested: 120,
    fulfilled: 0,
    deadline: "2025/02/20 18:00"
  }
];

const recentLogs = [
  {
    id: "log-901",
    action: "完成抽選",
    actor: "alice@event.glass",
    event: "春日嘉年華",
    at: "2025/02/17 20:11"
  },
  {
    id: "log-902",
    action: "匯入參與者",
    actor: "ben@event.glass",
    event: "夏夜電音祭",
    at: "2025/02/17 18:46"
  }
];

export default function AdminRegistrationsPage() {
  return (
    <section className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold text-white/90">報名與抽選</h1>
        <p className="mt-1 text-sm text-white/60">管理報名名單、盲盒抽選與審計紀錄。</p>
      </header>

      <article className="glass-card p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white/90">待處理抽選</h2>
            <p className="text-xs text-white/60">建議在截止時間前完成抽選並寄送通知。</p>
          </div>
          <button className="rounded-xl bg-white/20 px-4 py-2 text-sm font-semibold text-white/90 transition hover:bg-white/30">
            立即抽選
          </button>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-white/10 text-sm text-white/80">
            <thead className="text-left text-xs uppercase tracking-[0.2em] text-white/60">
              <tr>
                <th className="px-4 py-3">活動</th>
                <th className="px-4 py-3">盲盒</th>
                <th className="px-4 py-3">申請名額</th>
                <th className="px-4 py-3">已抽出</th>
                <th className="px-4 py-3">截止時間</th>
                <th className="px-4 py-3">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {pendingDraws.map((draw) => (
                <tr key={draw.id}>
                  <td className="px-4 py-4 font-medium text-white/90">{draw.event}</td>
                  <td className="px-4 py-4 text-white/70">{draw.bucket}</td>
                  <td className="px-4 py-4 text-white/70">{draw.requested}</td>
                  <td className="px-4 py-4 text-white/70">{draw.fulfilled}</td>
                  <td className="px-4 py-4 text-white/70">{draw.deadline}</td>
                  <td className="px-4 py-4 text-xs text-sky-200 hover:text-sky-100">
                    <Link href={`/admin/registrations/${draw.id}` as Route}>詳細</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>

      <article className="glass-card grid gap-6 p-6 md:grid-cols-[1.5fr_1fr]">
        <form className="space-y-4">
          <h2 className="text-lg font-semibold text-white/90">匯入報名名單</h2>
          <p className="text-xs text-white/60">支援 CSV，欄位需含 email、電話與活動 ID。</p>
          <label className="flex flex-col gap-2 text-xs text-white/70">
            選擇檔案
            <input type="file" className="rounded-xl border border-dashed border-white/20 bg-white/5 px-4 py-6 text-sm text-white focus:border-white/30 focus:outline-none" />
          </label>
          <label className="flex flex-col gap-2 text-xs text-white/70">
            指定活動 ID
            <input className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none" placeholder="evt-2025-03" />
          </label>
          <button type="submit" className="rounded-xl bg-white/20 px-4 py-2 text-sm font-semibold text-white/90 transition hover:bg-white/30">
            上傳清單
          </button>
        </form>
        <div>
          <h2 className="text-lg font-semibold text-white/90">審計紀錄</h2>
          <ul className="mt-4 space-y-3 text-sm text-white/70">
            {recentLogs.map((log) => (
              <li key={log.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
                <p className="font-medium text-white/80">{log.action}</p>
                <p className="text-xs text-white/60">{log.actor}</p>
                <p className="text-xs text-white/50">{log.event} ・ {log.at}</p>
              </li>
            ))}
          </ul>
        </div>
      </article>
    </section>
  );
}
