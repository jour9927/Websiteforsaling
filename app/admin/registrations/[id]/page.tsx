import { notFound } from "next/navigation";

const drawDetails: Record<string, {
  event: string;
  bucket: string;
  requested: number;
  fulfilled: number;
  deadline: string;
  participants: Array<{ email: string; status: "pending" | "won" | "waitlist" }>;
}> = {
  "draw-302": {
    event: "春日嘉年華",
    bucket: "VIP 盲盒",
    requested: 80,
    fulfilled: 60,
    deadline: "2025/02/19 12:00",
    participants: [
      { email: "mika@example.com", status: "pending" },
      { email: "andy@example.com", status: "won" },
      { email: "vera@example.com", status: "waitlist" }
    ]
  },
  "draw-417": {
    event: "夏夜電音祭",
    bucket: "一般盲盒",
    requested: 120,
    fulfilled: 0,
    deadline: "2025/02/20 18:00",
    participants: [
      { email: "zoe@example.com", status: "pending" },
      { email: "leo@example.com", status: "pending" }
    ]
  }
};

type AdminRegistrationDetailPageProps = {
  params: { id: string };
};

export default function AdminRegistrationDetailPage({ params }: AdminRegistrationDetailPageProps) {
  const detail = drawDetails[params.id];

  if (!detail) {
    notFound();
  }

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/60">盲盒抽選</p>
          <h1 className="text-2xl font-semibold text-white/90">{detail.event} ・ {detail.bucket}</h1>
          <p className="text-xs text-white/60">申請 {detail.requested} 名額，已抽出 {detail.fulfilled}，截止 {detail.deadline}</p>
        </div>
        <div className="flex gap-3 text-xs">
          <button className="rounded-xl bg-white/20 px-4 py-2 font-semibold text-white/90 transition hover:bg-white/30">
            立即抽選
          </button>
          <button className="rounded-xl border border-white/30 px-4 py-2 text-white/80 transition hover:bg-white/10">
            寄送通知
          </button>
        </div>
      </header>

      <article className="glass-card grid gap-6 p-6 md:grid-cols-[1.5fr_1fr]">
        <div>
          <h2 className="text-lg font-semibold text-white/90">參與者清單</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full divide-y divide-white/10 text-sm text-white/80">
              <thead className="text-left text-xs uppercase tracking-[0.2em] text-white/60">
                <tr>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">狀態</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {detail.participants.map((participant) => (
                  <tr key={participant.email}>
                    <td className="px-4 py-4">{participant.email}</td>
                    <td className="px-4 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs ${
                          participant.status === "won"
                            ? "bg-emerald-400/20 text-emerald-200"
                            : participant.status === "waitlist"
                            ? "bg-yellow-400/20 text-yellow-200"
                            : "bg-white/10 text-white/80"
                        }`}
                      >
                        {participant.status === "won" ? "中選" : participant.status === "waitlist" ? "候補" : "待抽選"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-white/70">
            <p className="font-semibold text-white/80">抽選設定</p>
            <ul className="mt-2 space-y-1">
              <li>・使用伺服器端加密亂數。</li>
              <li>・避免重複中選與作弊紀錄。</li>
              <li>・抽選後自動記錄審計 log。</li>
            </ul>
          </div>
          <form className="space-y-3 text-xs text-white/70">
            <h3 className="text-sm font-semibold text-white/80">預設通知訊息</h3>
            <textarea rows={6} className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none" defaultValue={`親愛的參與者您好，

恭喜您中選 ${detail.event} 的 ${detail.bucket}。請於 48 小時內完成兌換流程。`} />
            <button type="submit" className="w-full rounded-xl bg-white/20 px-4 py-2 font-semibold text-white/90 transition hover:bg-white/30">
              儲存通知模板
            </button>
          </form>
        </div>
      </article>
    </section>
  );
}
