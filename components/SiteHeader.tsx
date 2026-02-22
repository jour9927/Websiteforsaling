"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Route } from "next";
import { NotificationBell } from "./NotificationBell";

type SiteHeaderProps = {
  displayName: string;
  isAuthenticated: boolean;
  isAdmin: boolean;
};

const primaryLinks = [
  { label: "主頁", href: "/" as Route },
  { label: "活動", href: "/events" as Route },
  { label: "競標", href: "/auctions" as Route },
  { label: "配布圖鑑", href: "/pokedex" as Route },
  { label: "📚 圖鑑書架", href: "/guides" as Route },
  // { label: "簽到", href: "/check-in" as Route }, // 暫時隱藏，開發中
  // { label: "公告", href: "/announcements" as Route }, // 已併入活動頁
  { label: "管理員平台", href: "/admin" as Route }
] as const;

const signedInLinks = [
  { label: "我的帳號", href: "/profile" as Route },
  // { label: "我的物品", href: "/items" as Route }, // 暫時隱藏
  { label: "我的付款", href: "/payments" as Route },
  { label: "交付紀錄", href: "/deliveries" as Route },
  { label: "參與紀錄", href: "/history" as Route },
  { label: "我的訊息", href: "/messages" as Route },
  { label: "登出", href: "/logout" as Route }
] as const;

const signedOutLinks = [
  { label: "登入", href: "/login" as Route },
  { label: "註冊", href: "/signup" as Route }
] as const;

function AccountDropdown({
  links,
  isActive,
  isAuthenticated,
}: {
  links: readonly { label: string; href: Route }[];
  isActive: (href: string) => boolean;
  isAuthenticated: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 whitespace-nowrap text-xs text-white/70 transition hover:text-white"
      >
        {isAuthenticated ? "我的帳號 ▾" : "登入 / 註冊"}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 min-w-[140px] rounded-xl border border-white/15 bg-midnight-900/95 py-2 shadow-xl backdrop-blur">
          {links.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={`block px-4 py-2 text-xs transition ${isActive(item.href)
                ? "bg-white/10 text-white"
                : "text-white/70 hover:bg-white/10 hover:text-white"
                }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function SiteHeader({ displayName, isAuthenticated, isAdmin }: SiteHeaderProps) {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  const closeMenu = () => setIsMenuOpen(false);

  const normalizedName = displayName && displayName.trim().length > 0 ? displayName.trim() : "訪客模式";
  const profileHref = (normalizedName === "訪客模式" ? "/login" : "/profile") as Route;

  // 根據是否為管理員過濾導航連結
  const visiblePrimaryLinks = primaryLinks.filter(link => {
    // 如果是管理員連結，只有管理員才能看到
    if (link.href === "/admin") {
      return isAdmin;
    }
    return true;
  });

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-midnight-900/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 md:px-6">
        <div className="flex items-center gap-3">
          <Link
            href={profileHref}
            className="flex items-center gap-3 rounded-full border border-white/20 px-3 py-2 text-left text-sm text-white transition hover:bg-white/10"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-xs font-semibold uppercase">
              {normalizedName.slice(0, 2)}
            </span>
            <span className="flex flex-col leading-tight">
              <span className="text-xs uppercase tracking-[0.35em] text-white/60">目前帳號</span>
              <span className="font-semibold text-white">{normalizedName}</span>
            </span>
          </Link>
          <NotificationBell isAuthenticated={isAuthenticated} />
        </div>
        <nav className="hidden items-center gap-4 text-sm text-white/80 lg:flex">
          {visiblePrimaryLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`whitespace-nowrap transition ${isActive(item.href) ? "text-white" : "hover:text-white"}`}
            >
              {item.label}
            </Link>
          ))}
          <div className="h-4 w-px bg-white/20" aria-hidden />
          <AccountDropdown
            links={isAuthenticated ? signedInLinks : signedOutLinks}
            isActive={isActive}
            isAuthenticated={isAuthenticated}
          />
        </nav>
        <button
          type="button"
          aria-expanded={isMenuOpen}
          aria-controls="mobile-menu"
          className="relative z-50 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-white lg:hidden"
          onClick={() => setIsMenuOpen((value) => !value)}
        >
          <span className="sr-only">切換選單</span>
          <span className="flex flex-col items-center justify-center gap-1">
            <span className={`h-0.5 w-5 bg-white transition ${isMenuOpen ? "translate-y-1.5 rotate-45" : ""}`} />
            <span className={`h-0.5 w-5 bg-white transition ${isMenuOpen ? "opacity-0" : ""}`} />
            <span className={`h-0.5 w-5 bg-white transition ${isMenuOpen ? "-translate-y-1.5 -rotate-45" : ""}`} />
          </span>
        </button>
      </div>
      <div
        id="mobile-menu"
        className={`lg:hidden ${isMenuOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"} absolute inset-x-0 top-full origin-top bg-midnight-900/95 backdrop-blur transition-opacity`}
      >
        <div className="space-y-6 px-6 py-8">
          <nav className="flex flex-col gap-4 text-lg text-white">
            {visiblePrimaryLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeMenu}
                className={`rounded-xl px-3 py-2 transition ${isActive(item.href) ? "bg-white/15" : "hover:bg-white/10"}`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="space-y-3 text-sm text-white/80">
            <p className="text-xs uppercase tracking-[0.25em] text-white/50">帳號</p>
            <div className="flex flex-col gap-2">
              {(isAuthenticated ? signedInLinks : signedOutLinks).map((item) => (
                <Link key={item.href} href={item.href} onClick={closeMenu} className="rounded-xl bg-white/10 px-3 py-2">
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
