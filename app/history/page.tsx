const demoHistory = [
  {
    id: "reg-001",
    event: "春日嘉年華",
    status: "報名成功",
    reward: "VIP 入場券",
    date: "2025-03-01"
  },
  {
    id: "reg-002",
    event: "夏夜電音祭",
    status: "抽選中",
    reward: "-",
    date: "2025-07-01"
  }
];

export default function HistoryPage() {
  return (
    <div className="flex flex-col gap-8">
      <section className="glass-card p-8">
        <h1 className="text-3xl font-semibold">參與紀錄</h1>
        <p className="mt-2 text-sm text-slate-200/70">查看已報名活動與抽選結果。</p>
      </section>
      <section className="glass-card overflow-hidden">
        <table className="min-w-full divide-y divide-white/10 text-sm text-white/80">
          <thead className="bg-white/10 text-left text-xs uppercase tracking-[0.2em]">
            <tr>
              <th className="px-6 py-4">活動名稱</th>
              <th className="px-6 py-4">狀態</th>
              <th className="px-6 py-4">獎勵</th>
              <th className="px-6 py-4">更新日期</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {demoHistory.map((item) => (
              <tr key={item.id}>
                <td className="px-6 py-4">{item.event}</td>
                <td className="px-6 py-4 text-sky-200">{item.status}</td>
                <td className="px-6 py-4">{item.reward}</td>
                <td className="px-6 py-4">{item.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
