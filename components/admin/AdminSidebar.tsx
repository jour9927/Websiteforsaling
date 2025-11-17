"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Route } from "next";

export const adminNavItems = [
  { href: "/admin" as Route, label: "儀表板", icon: "📊" },
  { href: "/admin/events" as Route, label: "活動管理", icon: "📅" },
  { href: "/admin/registrations" as Route, label: "報名/抽選", icon: "🎫" },
  { href: "/admin/announcements" as Route, label: "公告管理", icon: "📢" },
  { href: "/admin/notifications" as Route, label: "通知中心", icon: "🔔" },
  { href: "/admin/messages" as Route, label: "會員訊息", icon: "✉️" }
] as const;

const baseLinkClasses = "flex items-center justify-between rounded-xl px-4 py-2 text-sm transition";

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 flex-col border-r border-white/10 bg-midnight-900/60 p-4 backdrop-blur lg:flex">
      <div className="mb-8 px-2">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-300">Admin</p>
        <h2 className="mt-2 text-xl font-semibold text-white">Event Glass</h2>
      </div>
      <nav className="flex flex-1 flex-col gap-2">
        {adminNavItems.map((item) => {
          const href = item.href as string;
          const active = pathname === href || (href !== "/admin" && pathname.startsWith(href));
          return (
            <Link
              key={item.href}
                href={item.href}
              className={`${baseLinkClasses} ${active ? "bg-white/20 text-white" : "text-white/70 hover:bg-white/10"}`}
            >
              <span className="flex items-center gap-2">
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </span>
              {active ? <span className="text-xs uppercase text-white/80">Now</span> : null}
            </Link>
          );
        })}
      </nav>
      <div className="mt-10 rounded-xl border border-white/10 bg-white/5 p-4 text-xs text-white/60">
        <p className="font-semibold text-white/80">提醒</p>
        <p className="mt-2 leading-relaxed">設定抽選截止時間，並確認新活動資產已上傳至 Storage。</p>
      </div>
    </aside>
  );
}

export function AdminMobileNav() {
  const pathname = usePathname();

  return (
    <nav className="lg:hidden border-b border-white/10 bg-midnight-900/70 text-xs">
      <div className="flex items-center gap-2 overflow-x-auto px-4 py-3">
        {adminNavItems.map((item) => {
          const href = item.href as string;
          const active = pathname === href || (href !== "/admin" && pathname.startsWith(href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 rounded-2xl border border-white/10 px-3 py-2 transition ${
                active ? "bg-white/10 text-white" : "bg-white/5 text-white/70 hover:bg-white/10"
              }`}
            >
              <span className="text-sm">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
