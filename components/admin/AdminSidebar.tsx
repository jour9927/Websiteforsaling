"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { Route } from "next";

export const adminNavItems = [
  { href: "/admin" as Route, label: "儀表板", icon: "📊" },
  { href: "/admin/events" as Route, label: "活動管理", icon: "📅" },
  { href: "/admin/auctions" as Route, label: "競標管理", icon: "🔨" },
  { href: "/admin/commissions" as Route, label: "委託管理", icon: "📋" },
  { href: "/admin/bids" as Route, label: "出價查詢", icon: "💰" },
  { href: "/admin/members" as Route, label: "會員管理", icon: "👥" },
  { href: "/admin/registrations" as Route, label: "報名/抽選", icon: "🎫" },
  { href: "/admin/announcements" as Route, label: "公告管理", icon: "📢" },
  { href: "/admin/items" as Route, label: "物品管理", icon: "🎁" },
  { href: "/admin/payments" as Route, label: "付款管理", icon: "💳" },
  { href: "/admin/deliveries" as Route, label: "交付紀錄", icon: "📦" },
  { href: "/admin/notifications" as Route, label: "通知中心", icon: "🔔" },
  { href: "/admin/messages" as Route, label: "會員訊息", icon: "✉️" },
  { href: "/admin/backpack" as Route, label: "背包管理", icon: "🎒" },
  { href: "/admin/virtual-commission-chats" as Route, label: "虛擬委託對話", icon: "💬" },
  { href: "/admin/virtual-comments" as Route, label: "水軍留言", icon: "🤖" },
  { href: "/admin/ai-settings" as Route, label: "AI 個人化", icon: "🧠" },
  { href: "/admin/public-image" as Route, label: "公眾形象", icon: "🎭" },
  { href: "/admin/eevee-day" as Route, label: "伊步集點日", icon: "🎯" },
  // { href: "/admin/anniversary-30th" as Route, label: "30週年守護戰", icon: "🦊" }, // [30週年活動] 活動已結束
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
  const [isOpen, setIsOpen] = useState(false);

  const toggleNav = () => setIsOpen((value) => !value);

  return (
    <nav className="lg:hidden bg-midnight-900/80 border-b border-white/10 text-xs overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3">
        <span className="text-xs uppercase tracking-[0.3em] text-white/60">管理選單</span>
        <button
          type="button"
          onClick={toggleNav}
          aria-expanded={isOpen}
          className="flex items-center gap-2 rounded-full border border-white/20 px-3 py-1 text-xs font-semibold text-white/80 transition hover:bg-white/10"
        >
          {isOpen ? "收合" : "展開"}
          <span className={`transition ${isOpen ? "rotate-180" : ""}`}>▾</span>
        </button>
      </div>
      {isOpen && (
        <div className="px-3 pb-3">
          <div className="flex flex-wrap gap-2 max-w-full">
            {adminNavItems.map((item) => {
              const href = item.href as string;
              const active = pathname === href || (href !== "/admin" && pathname.startsWith(href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 rounded-2xl border border-white/10 px-3 py-2 text-xs transition ${active ? "bg-white/10 text-white" : "bg-white/5 text-white/70 hover:bg-white/10"
                    }`}
                >
                  <span className="text-sm">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
}
