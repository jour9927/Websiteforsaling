"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Route } from "next";
import { NotificationBell } from "@/components/NotificationBell";
import { CommissionChatBell } from "@/components/CommissionChatBell";

type SiteHeaderV2Props = {
  displayName: string;
  isAuthenticated: boolean;
  isAdmin: boolean;
};

/* 導覽項目與 v1 的 SiteHeader 保持一致。
   刻意各留一份，改 v2 不會動到還在線上跑的 v1。 */
const primaryLinks = [
  { label: "主頁", href: "/" as Route },
  { label: "活動", href: "/events" as Route },
  { label: "競標", href: "/auctions" as Route },
  { label: "民間交易", href: "/community-market" as Route },
  { label: "委託", href: "/commissions" as Route },
  { label: "商店", href: "/store" as Route },
  { label: "配布圖鑑", href: "/pokedex" as Route },
  { label: "圖鑑書架", href: "/guides" as Route },
  { label: "管理員平台", href: "/admin" as Route },
] as const;

const signedInLinks = [
  { label: "我的帳號", href: "/profile" as Route },
  { label: "我的背包", href: "/backpack" as Route },
  { label: "獎勵兌換", href: "/rewards" as Route },
  { label: "我的付款", href: "/payments" as Route },
  { label: "交付紀錄", href: "/deliveries" as Route },
  { label: "參與紀錄", href: "/history" as Route },
  { label: "我的訊息", href: "/messages" as Route },
  { label: "登出", href: "/logout" as Route },
] as const;

const signedOutLinks = [
  { label: "登入", href: "/login" as Route },
  { label: "註冊", href: "/signup" as Route },
] as const;

function AccountMenu({
  links,
  isAuthenticated,
  displayName,
}: {
  links: readonly { label: string; href: Route }[];
  isAuthenticated: boolean;
  displayName: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  if (!isAuthenticated) {
    return (
      <div className="flex items-center gap-2">
        <Link href="/login" className="eg-btn eg-btn--ghost eg-btn--sm">
          登入
        </Link>
        <Link href="/signup" className="eg-btn eg-btn--primary eg-btn--sm">
          註冊
        </Link>
      </div>
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="eg-btn eg-btn--secondary eg-btn--sm max-w-[168px]"
      >
        <span
          className="flex h-5 w-5 flex-none items-center justify-center rounded-full text-[10px] font-semibold"
          style={{ background: "var(--eg-bg-inset)", color: "var(--eg-ink-2)" }}
          aria-hidden="true"
        >
          {displayName.slice(0, 1)}
        </span>
        <span className="truncate">{displayName}</span>
        <span aria-hidden="true" style={{ color: "var(--eg-ink-3)" }}>
          ▾
        </span>
      </button>
      {open && (
        <div
          role="menu"
          className="eg-card absolute right-0 top-full mt-2 min-w-[168px] overflow-hidden py-1"
          style={{ boxShadow: "var(--eg-shadow-lg)" }}
        >
          {links.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="eg-nav-link !h-auto w-full !rounded-none px-4 py-2"
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function SkinHeader({ displayName, isAuthenticated, isAdmin }: SiteHeaderV2Props) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const isTemporaryBattleRoute =
    pathname === "/random-distribution/battle" || pathname === "/anniversary-30th/battle";
  if (isTemporaryBattleRoute) return null;

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

  const name = displayName?.trim() || "訪客模式";
  const visibleLinks = primaryLinks.filter((l) => (l.href === "/admin" ? isAdmin : true));

  return (
    <header className="eg-header">
      <div className="eg-shell flex h-16 items-center justify-between gap-4">
        {/* 品牌 */}
        <Link href="/" className="flex flex-none items-baseline gap-2">
          <span className="eg-wordmark">Event&nbsp;Glass</span>
          <span className="hidden eg-meta sm:inline">寶可夢社群</span>
        </Link>

        {/* 主導覽 */}
        <nav className="eg-nav--bar hidden flex-1 items-center justify-center gap-0.5 lg:flex">
          {visibleLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              data-active={isActive(item.href)}
              className="eg-nav-link"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* 右側 */}
        <div className="flex flex-none items-center gap-2">
          {isAuthenticated && (
            <div className="eg-bells hidden items-center gap-2 sm:flex">
              <NotificationBell isAuthenticated={isAuthenticated} isAdmin={isAdmin} />
              <CommissionChatBell isAuthenticated={isAuthenticated} />
            </div>
          )}
          <div className="hidden lg:block">
            <AccountMenu
              links={isAuthenticated ? signedInLinks : signedOutLinks}
              isAuthenticated={isAuthenticated}
              displayName={name}
            />
          </div>
          {/* 包一層來控制顯示：.eg-btn 自帶 display:inline-flex，
              直接掛 lg:hidden 兩者同權重、順序又是 eg-btn 在後，桌機會關不掉 */}
          <div className="lg:hidden">
          <button
            type="button"
            aria-expanded={menuOpen}
            aria-controls="eg-mobile-menu"
            onClick={() => setMenuOpen((v) => !v)}
            className="eg-btn eg-btn--secondary eg-btn--sm"
            style={{ width: 38, paddingInline: 0 }}
          >
            <span className="sr-only">切換選單</span>
            <span className="flex flex-col items-center justify-center gap-[3px]" aria-hidden="true">
              <span
                className="h-[1.5px] w-4 transition"
                style={{
                  background: "currentColor",
                  transform: menuOpen ? "translateY(4.5px) rotate(45deg)" : undefined,
                }}
              />
              <span
                className="h-[1.5px] w-4 transition"
                style={{ background: "currentColor", opacity: menuOpen ? 0 : 1 }}
              />
              <span
                className="h-[1.5px] w-4 transition"
                style={{
                  background: "currentColor",
                  transform: menuOpen ? "translateY(-4.5px) rotate(-45deg)" : undefined,
                }}
              />
            </span>
          </button>
          </div>
        </div>
      </div>

      {/* 手機選單 */}
      {menuOpen && (
        <div
          id="eg-mobile-menu"
          className="lg:hidden"
          style={{ borderTop: "1px solid var(--eg-border)", background: "var(--eg-bg)" }}
        >
          <div className="eg-shell flex flex-col gap-1 py-4">
            {visibleLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                data-active={isActive(item.href)}
                className="eg-nav-link !h-auto !justify-start py-2.5 text-[15px]"
              >
                {item.label}
              </Link>
            ))}
            <hr className="eg-rule my-3" />
            <p className="eg-eyebrow mb-1">帳號</p>
            <div className="flex flex-col gap-1">
              {(isAuthenticated ? signedInLinks : signedOutLinks).map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className="eg-nav-link !h-auto !justify-start py-2.5 text-[15px]"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
