"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function SiteFooterV2() {
  const pathname = usePathname();
  const isTemporaryBattleRoute =
    pathname === "/random-distribution/battle" || pathname === "/anniversary-30th/battle";
  if (isTemporaryBattleRoute) return null;

  const year = new Date().getFullYear();

  return (
    <footer className="eg-footer mt-20">
      <div className="eg-shell flex flex-col gap-6 py-10 md:flex-row md:items-start md:justify-between">
        <div className="max-w-xs">
          <p className="text-[15px] font-semibold tracking-tight" style={{ color: "var(--eg-ink)" }}>
            Event Glass
          </p>
          <p className="eg-meta mt-2">
            寶可夢配布、競標與社群活動的一站式平台。
          </p>
        </div>

        <div className="flex gap-12">
          <nav className="flex flex-col gap-2">
            <p className="eg-eyebrow mb-1">逛逛</p>
            <Link href="/events" className="eg-link">
              活動
            </Link>
            <Link href="/auctions" className="eg-link">
              競標
            </Link>
            <Link href="/store" className="eg-link">
              商店
            </Link>
          </nav>
          <nav className="flex flex-col gap-2">
            <p className="eg-eyebrow mb-1">收藏</p>
            <Link href="/pokedex" className="eg-link">
              配布圖鑑
            </Link>
            <Link href="/guides" className="eg-link">
              圖鑑書架
            </Link>
            <Link href="/rankings" className="eg-link">
              排行榜
            </Link>
          </nav>
        </div>
      </div>

      <div style={{ borderTop: "1px solid var(--eg-border)" }}>
        <div className="eg-shell flex flex-col gap-2 py-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="eg-meta">© {year} Event Glass. All rights reserved.</p>
          <Link href="/privacy" className="eg-link">
            隱私權政策
          </Link>
        </div>
      </div>
    </footer>
  );
}
