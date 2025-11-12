import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="mx-auto flex max-w-md flex-col gap-6">
      <section className="glass-card p-8">
        <h1 className="text-2xl font-semibold">登入</h1>
        <p className="mt-2 text-sm text-slate-200/70">歡迎回來，準備探索最新活動與抽選。</p>
        <form className="mt-6 flex flex-col gap-4">
          <label className="flex flex-col gap-2 text-sm">
            <span className="text-slate-200/80">Email</span>
            <input type="email" className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none" placeholder="you@example.com" />
          </label>
          <label className="flex flex-col gap-2 text-sm">
            <span className="text-slate-200/80">密碼</span>
            <input type="password" className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none" />
          </label>
          <button type="submit" className="rounded-xl bg-white/20 px-4 py-3 text-sm font-semibold text-white/90 transition hover:bg-white/30">
            登入
          </button>
        </form>
        <p className="mt-4 text-xs text-slate-200/70">
          還沒有帳號？<Link href="/signup" className="ml-2 text-white/90 hover:text-white">立即註冊</Link>
        </p>
      </section>
    </div>
  );
}
