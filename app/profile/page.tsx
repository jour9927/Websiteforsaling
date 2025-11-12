export default function ProfilePage() {
  return (
    <div className="flex flex-col gap-8">
      <section className="glass-card p-8">
        <h1 className="text-3xl font-semibold">個人設定</h1>
        <p className="mt-2 text-sm text-slate-200/70">管理你的基本資料與通知偏好。</p>
      </section>

      <section className="glass-card p-8">
        <form className="grid gap-6 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm">
            <span className="text-slate-200/80">暱稱</span>
            <input className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none" defaultValue="Glass Lover" />
          </label>
          <label className="flex flex-col gap-2 text-sm">
            <span className="text-slate-200/80">Email</span>
            <input type="email" className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none" defaultValue="you@example.com" />
          </label>
          <label className="flex flex-col gap-2 text-sm md:col-span-2">
            <span className="text-slate-200/80">通知設定</span>
            <select className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white focus:border-white/40 focus:outline-none">
              <option>所有活動通知</option>
              <option>僅限報名成功</option>
              <option>僅限抽選結果</option>
            </select>
          </label>
          <button type="submit" className="md:col-span-2 rounded-xl bg-white/20 px-4 py-3 text-sm font-semibold text-white/90 transition hover:bg-white/30">
            儲存變更
          </button>
        </form>
      </section>
    </div>
  );
}
