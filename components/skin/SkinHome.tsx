import Link from "next/link";
import type { ReactNode } from "react";
import SkinAuctionCard, { type SkinAuction } from "@/components/skin/SkinAuctionCard";
import { SkinEventCard } from "@/components/skin/SkinEventCard";
import { SectionHead, StatTile, LegacyPanel } from "@/components/skin/primitives";
import {
  CommunityMarketRankingsWidget,
  type CommunityMarketRankings,
} from "@/components/CommunityMarketRankingsWidget";

type HomeStats = {
  openCommissions: number | null;
  distributions: number | null;
  storeItems: number | null;
};

type EventRow = {
  id: string;
  title: string;
  description: string | null;
  start_date: string;
  location: string | null;
  image_url: string | null;
  image_position: string | null;
  price: number | null;
  is_free: boolean;
};

type Props = {
  isAuthenticated: boolean;
  displayName: string;
  hotAuctions: SkinAuction[];
  recentEvents: EventRow[];
  stats: HomeStats;
  marketRankings: CommunityMarketRankings;
  /** 登入後才有：還沒改版的個人空間，包在 legacy 島裡 */
  legacyContent?: ReactNode;
};

const HIGHLIGHTS = [
  {
    title: "限定配布活動",
    body: "盲盒、抽選與指定排除，活動資訊即時同步。",
    href: "/events" as const,
    cta: "看活動",
  },
  {
    title: "社群競標",
    body: "群內成員專屬的限時競標，把握機會贏得珍貴配布。",
    href: "/auctions" as const,
    cta: "看競標",
  },
  {
    title: "場外委託",
    body: "嚴格合法性審核與押金保護，刊登或接下委託都安心。",
    href: "/commissions" as const,
    cta: "看委託",
  },
  {
    title: "配布圖鑑書架",
    body: "一到九世代的配布收藏，用圖鑑冊的方式收好收滿。",
    href: "/guides" as const,
    cta: "看書架",
  },
];

function StatRow({ stats }: { stats: HomeStats }) {
  const tiles = [
    stats.openCommissions !== null && {
      label: "刊登中的委託",
      value: stats.openCommissions.toLocaleString(),
      hint: "場外委託區",
    },
    stats.distributions !== null && {
      label: "收錄的配布",
      value: stats.distributions.toLocaleString(),
      hint: "配布圖鑑",
    },
    stats.storeItems !== null && {
      label: "商店上架中",
      value: stats.storeItems.toLocaleString(),
      hint: "道具商店",
    },
  ].filter(Boolean) as { label: string; value: string; hint: string }[];

  if (tiles.length === 0) return null;

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {tiles.map((t) => (
        <StatTile key={t.label} label={t.label} value={t.value} hint={t.hint} />
      ))}
    </div>
  );
}

export function SkinHome({
  isAuthenticated,
  displayName,
  hotAuctions,
  recentEvents,
  stats,
  marketRankings,
  legacyContent,
}: Props) {
  return (
    <div className="flex flex-col gap-16">
      {/* Hero */}
      <header className="flex flex-col items-start gap-5">
        <p className="eg-eyebrow">Event Glass</p>
        {isAuthenticated ? (
          <>
            <h1 className="eg-h1 max-w-3xl">歡迎回來，{displayName}</h1>
            <p className="eg-lead max-w-xl">
              看看今天有什麼新的配布、競標與委託。
            </p>
            <div className="flex flex-wrap items-center gap-2.5">
              <Link href="/events" className="eg-btn eg-btn--primary">
                瀏覽活動
              </Link>
              <Link href="/backpack" className="eg-btn eg-btn--secondary">
                我的背包
              </Link>
            </div>
          </>
        ) : (
          <>
            <h1 className="eg-h1 max-w-3xl">
              寶可夢配布、競標與社群活動，
              <br className="hidden sm:block" />
              都在同一個地方。
            </h1>
            <p className="eg-lead max-w-xl">
              參加限定配布與抽獎、在社群競標裡出價、把收藏收進專屬圖鑑書架。
            </p>
            <div className="flex flex-wrap items-center gap-2.5">
              <Link href="/signup" className="eg-btn eg-btn--primary eg-btn--lg">
                免費註冊
              </Link>
              <Link href="/events" className="eg-btn eg-btn--secondary eg-btn--lg">
                先逛逛活動
              </Link>
            </div>
          </>
        )}

        <div className="w-full pt-4">
          <CommunityMarketRankingsWidget rankings={marketRankings} skin />
        </div>
      </header>

      <StatRow stats={stats} />

      {/* 熱門競標 */}
      {hotAuctions.length > 0 && (
        <section>
          <SectionHead
            title="熱門競標"
            count={`${hotAuctions.length} 場進行中`}
            countTone="success"
            action={{ label: "全部競標", href: "/auctions" }}
          />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {hotAuctions.map((a) => (
              <SkinAuctionCard key={a.id} auction={a} />
            ))}
          </div>
        </section>
      )}

      {/* 近期活動 */}
      {recentEvents.length > 0 && (
        <section>
          <SectionHead title="近期活動" action={{ label: "全部活動", href: "/events" }} />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {recentEvents.map((e) => (
              <SkinEventCard
                key={e.id}
                event={{
                  id: e.id,
                  title: e.title,
                  description: e.description || "精彩活動",
                  date: e.start_date,
                  location: e.location || "線上活動",
                  cover: e.image_url && e.image_url.trim() !== "" ? e.image_url : undefined,
                  imagePosition: e.image_position || "center",
                  price: e.price || 0,
                  is_free: e.is_free ?? true,
                }}
              />
            ))}
          </div>
        </section>
      )}

      {/* 站內導覽（訪客才需要） */}
      {!isAuthenticated && (
        <section>
          <SectionHead title="你可以在這裡做什麼" />
          <div className="grid gap-5 sm:grid-cols-2">
            {HIGHLIGHTS.map((h) => (
              <Link key={h.href} href={h.href} className="eg-card eg-card--interactive group p-5">
                <h3 className="eg-h3">{h.title}</h3>
                <p className="eg-body mt-2 text-[13.5px]">{h.body}</p>
                <span
                  className="eg-link mt-3 inline-block"
                  style={{ color: "var(--eg-accent)" }}
                >
                  {h.cta} →
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 尚未改版的個人空間 */}
      {legacyContent && (
        <section>
          <SectionHead title="個人空間" />
          <LegacyPanel note="個人空間還沒改版，這一區暫時維持原本的介面，功能完全一樣">
            {legacyContent}
          </LegacyPanel>
        </section>
      )}
    </div>
  );
}
