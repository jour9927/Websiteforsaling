import SkinAuctionCard, { type SkinAuction } from "@/components/skin/SkinAuctionCard";
import { SectionHead, EmptyState } from "@/components/skin/primitives";

type Props = {
  activeAuctions: SkinAuction[];
  endedAuctions: SkinAuction[];
  upcomingAuction?: { title: string; start_time: string } | null;
  /** 已結標總數（畫面只列出前幾張，數字要講實話） */
  endedTotal: number;
};

const ENDED_PREVIEW = 6;

export function SkinAuctions({ activeAuctions, endedAuctions, upcomingAuction, endedTotal }: Props) {
  return (
    <div className="flex flex-col gap-12">
      <header className="flex flex-col items-start gap-4">
        <p className="eg-eyebrow">Auctions</p>
        <h1 className="eg-h1">競標專區</h1>
        <p className="eg-lead max-w-xl">
          群內成員專屬的限時競標，把握機會贏得珍貴的配布寶可夢。
        </p>
      </header>

      <section>
        <SectionHead
          title="進行中"
          count={`${activeAuctions.length} 場`}
          countTone={activeAuctions.length > 0 ? "success" : "default"}
        />
        {activeAuctions.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {activeAuctions.map((a) => (
              <SkinAuctionCard key={a.id} auction={a} />
            ))}
          </div>
        ) : upcomingAuction ? (
          <EmptyState
            title={`下一場：${upcomingAuction.title}`}
            hint={`預計 ${new Date(upcomingAuction.start_time).toLocaleString("zh-TW", {
              timeZone: "Asia/Taipei",
              month: "numeric",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })} 開始`}
          />
        ) : (
          <EmptyState title="目前沒有進行中的競標" hint="新的場次開始時會顯示在這裡" />
        )}
      </section>

      {endedAuctions.length > 0 && (
        <section>
          <SectionHead
            title="已結標"
            count={
              endedTotal > ENDED_PREVIEW
                ? `顯示最近 ${endedAuctions.length} / 共 ${endedTotal.toLocaleString()} 場`
                : `${endedTotal} 場`
            }
          />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {endedAuctions.map((a) => (
              <div key={a.id} style={{ opacity: 0.72 }}>
                <SkinAuctionCard auction={a} />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
