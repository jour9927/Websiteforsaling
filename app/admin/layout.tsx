import type { ReactNode } from "react";
import Link from "next/link";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-midnight-900 text-white">
      <AdminSidebar />
      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-white/10 bg-white/5 px-6 py-4 backdrop-blur">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-slate-300">控制中心</p>
            <h1 className="text-lg font-semibold text-white">Event Glass 後台</h1>
          </div>
          <div className="flex items-center gap-3 text-xs text-white/70">
            <Link href="/" className="rounded-full border border-white/20 px-4 py-2 transition hover:bg-white/10">
              返回前台
            </Link>
            <Link href="/logout" className="rounded-full bg-white/20 px-4 py-2 transition hover:bg-white/30">
              登出
            </Link>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto bg-midnight-900/60 px-6 py-8">
          <div className="mx-auto flex max-w-5xl flex-col gap-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
