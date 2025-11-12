import { Suspense } from "react";

export default function EventDrawPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-8 px-6 py-16">
      <section className="glass-card p-8">
        <h1 className="text-3xl font-semibold">線上抽選</h1>
        <p className="mt-3 text-sm text-slate-200/80">
          抽選由伺服器端以 crypto 隨機產生結果，並透過 Supabase Realtime 推播給參與者。
        </p>
      </section>

      <section className="glass-card p-8">
        <Suspense fallback={<p className="text-sm text-slate-200/70">抽選結果計算中...</p>}>
          <DrawClient />
        </Suspense>
      </section>
    </main>
  );
}

function DrawClient() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between rounded-xl bg-white/10 px-4 py-3 text-sm text-slate-200/90">
        <span>抽選號碼</span>
        <span className="text-lg font-semibold text-white">#0421</span>
      </div>
      <button className="rounded-xl bg-white/20 px-4 py-3 text-sm font-semibold text-white/90 transition hover:bg-white/30">
        重新抽選
      </button>
      <p className="text-xs text-slate-200/70">
        真實環境會呼叫 `/api/events/[id]/draw` 並透過 server action 或 RPC 完成交易。
      </p>
    </div>
  );
}
