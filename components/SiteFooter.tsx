"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function SiteFooter() {
  const pathname = usePathname();
  const isTemporaryBattleRoute =
    pathname === "/random-distribution/battle" || pathname === "/anniversary-30th/battle";

  if (isTemporaryBattleRoute) return null;

  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-white/10 bg-midnight-900/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-3 px-4 py-6 text-xs text-white/40 sm:flex-row sm:justify-between md:px-6">
        <p>© {year} Event Glass. All rights reserved.</p>
        <nav className="flex items-center gap-4">
          <Link href="/privacy" className="transition hover:text-white/70">
            隱私權政策
          </Link>
          <Link href="/events" className="transition hover:text-white/70">
            活動
          </Link>
          <Link href="/guides" className="transition hover:text-white/70">
            圖鑑書架
          </Link>
        </nav>
      </div>
    </footer>
  );
}
