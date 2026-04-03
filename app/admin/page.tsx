const stats = [
  { label: "本週新報名", value: 128, delta: "+18%", note: "相較上週" },
  { label: "待審核活動", value: 3, delta: "今日", note: "含合作活動" },
  { label: "抽選待處理", value: 42, delta: "3 小時內", note: "建議立即處理" }
];

const latestActivities = [
  {
    id: "evt-2025-03",
    title: "春日嘉年華",
    stage: "報名中",
    owner: "Alice",
    updatedAt: "2025/02/18 14:30"
  },
  {
    id: "evt-2025-07",
    title: "夏夜電音祭",
    stage: "場地確認",
    owner: "Ben",
    updatedAt: "2025/02/17 12:10"
  },
  {
    id: "evt-2025-09",
    title: "秋色設計展",
    stage: "草稿",
    owner: "Claire",
    updatedAt: "2025/02/15 09:45"
  }
];

export default function AdminDashboardPage() {
  return (
    <section className="space-y-8">
      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((item) => (
          <article key={item.label} className="glass-card space-y-2 p-5">
            <p className="text-xs uppercase tracking-[0.3em] text-white/60">{item.label}</p>
            <div className="flex items-baseline gap-3">
              <p className="text-3xl font-semibold text-white">{item.value}</p>
              <span className="text-xs text-sky-200">{item.delta}</span>
            </div>
            <p className="text-xs text-white/50">{item.note}</p>
          </article>
        ))}
      </div>

      <article className="glass-card p-6">
        <header className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white/90">最新活動進度</h2>
            <p className="text-xs text-white/60">快速檢視正在籌備或待審核的項目</p>
          </div>
          <a href="/admin/events" className="text-xs text-sky-200 hover:text-sky-100">
            檢視全部
          </a>
        </header>
        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full divide-y divide-white/10 text-sm text-white/80">
            <thead className="text-left text-xs uppercase tracking-[0.2em] text-white/60">
              <tr>
                <th className="px-4 py-3">活動</th>
                <th className="px-4 py-3">狀態</th>
                <th className="px-4 py-3">負責人</th>
                <th className="px-4 py-3">更新時間</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {latestActivities.map((activity) => (
                <tr key={activity.id}>
                  <td className="px-4 py-4 font-medium text-white/90">{activity.title}</td>
                  <td className="px-4 py-4">
                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/80">{activity.stage}</span>
                  </td>
                  <td className="px-4 py-4 text-white/70">{activity.owner}</td>
                  <td className="px-4 py-4 text-white/60">{activity.updatedAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>

      <article className="glass-card grid gap-6 p-6 md:grid-cols-[2fr_1fr]">
        <div>
          <h2 className="text-lg font-semibold text-white/90">系統提醒</h2>
          <ul className="mt-4 space-y-3 text-sm text-white/70">
            <li>・上傳夏夜電音祭的新舞台藍圖至 Storage。</li>
            <li>・更新春日嘉年華的抽選場次與可用名額。</li>
            <li>・審核合作廠商提交的活動素材。</li>
          </ul>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-white/60">
          <p className="font-semibold text-white/80">快速設定</p>
          <p className="mt-2 leading-relaxed">可在活動管理頁直接建立新活動、設定抽選規則與匯入參與者清單。</p>
        </div>
      </article>
    </section>
  );
}
