"use client";

import { useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { SkinEventCard } from "@/components/skin/SkinEventCard";
import { SectionHead, EmptyState, LoginWall } from "@/components/skin/primitives";

type EventRow = {
  id: string;
  title: string;
  description: string | null;
  start_date: string;
  end_date: string;
  location: string | null;
  image_url: string | null;
  image_position: string | null;
  price: number | null;
  is_free: boolean;
};

type Announcement = {
  id: string;
  title: string;
  content: string;
  status: string;
  published_at: string | null;
  created_at: string;
};

type Props = {
  ongoingEvents: EventRow[] | null;
  upcomingEvents: EventRow[] | null;
  recentEvents: EventRow[] | null;
  announcements: Announcement[] | null;
  isLoggedIn: boolean;
};

function toSummary(e: EventRow, fallbackDescription: string) {
  return {
    id: e.id,
    title: e.title,
    description: e.description || fallbackDescription,
    date: e.start_date,
    location: e.location || "線上活動",
    cover: e.image_url && e.image_url.trim() !== "" ? e.image_url : undefined,
    imagePosition: e.image_position || "center",
    price: e.price || 0,
    is_free: e.is_free ?? true,
  };
}

function EventGrid({
  events,
  fallbackDescription,
  dimmed,
}: {
  events: EventRow[];
  fallbackDescription: string;
  dimmed?: boolean;
}) {
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      {events.map((e) => (
        <SkinEventCard key={e.id} event={toSummary(e, fallbackDescription)} dimmed={dimmed} />
      ))}
    </div>
  );
}

function AnnouncementList({
  announcements,
  isLoggedIn,
}: {
  announcements: Announcement[] | null;
  isLoggedIn: boolean;
}) {
  if (!isLoggedIn) {
    return (
      <LoginWall
        title="公告內容僅限會員查看"
        description="登入以查看最新活動公告、重要通知與獨家訊息"
        itemCount={3}
        redirect="/events"
      />
    );
  }

  if (!announcements || announcements.length === 0) {
    return <EmptyState title="目前沒有已發布的公告" hint="管理員可以在後台建立並發布公告" />;
  }

  return (
    <div className="flex flex-col gap-3">
      {announcements.map((notice) => (
        <article key={notice.id} className="eg-card p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="eg-h3 text-[16px]">{notice.title}</h3>
            <span className="eg-meta eg-num">
              {new Date(notice.published_at || notice.created_at).toLocaleDateString("zh-TW")}
            </span>
          </div>
          <p className="eg-body mt-2 whitespace-pre-wrap text-[13.5px]">
            {notice.content.length > 200 ? `${notice.content.slice(0, 200)}…` : notice.content}
          </p>
          <Link
            href={`/announcements/${notice.id}` as Route}
            className="eg-link mt-3 inline-block"
            style={{ color: "var(--eg-accent)" }}
          >
            查看完整內容 →
          </Link>
        </article>
      ))}
    </div>
  );
}

export function SkinEvents({
  ongoingEvents,
  upcomingEvents,
  recentEvents,
  announcements,
  isLoggedIn,
}: Props) {
  const [tab, setTab] = useState<"events" | "announcements">("events");

  const ongoing = ongoingEvents ?? [];
  const upcoming = upcomingEvents ?? [];
  const recent = recentEvents ?? [];

  return (
    <div className="flex flex-col gap-12">
      {/* Hero */}
      <header className="flex flex-col items-start gap-5">
        <p className="eg-eyebrow">Event Glass</p>
        <h1 className="eg-h1 max-w-2xl">活動與公告</h1>
        <p className="eg-lead max-w-xl">
          限定配布、抽選與盲盒活動即時同步，手機上就能完成報名。
        </p>
        <div className="flex flex-wrap items-center gap-2.5">
          {!isLoggedIn ? (
            <>
              <Link href="/login" className="eg-btn eg-btn--primary">
                登入參加
              </Link>
              <Link href="/signup" className="eg-btn eg-btn--secondary">
                立即註冊
              </Link>
            </>
          ) : (
            <Link href="/collection" className="eg-btn eg-btn--primary">
              瀏覽我的圖鑑
            </Link>
          )}
        </div>
      </header>

      {/* 分頁切換 */}
      <div
        className="inline-flex self-start gap-1 rounded-full p-1"
        style={{ background: "var(--eg-bg-muted)" }}
        role="tablist"
      >
        {(
          [
            ["events", "活動"],
            ["announcements", "公告"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className="eg-filter"
            style={
              tab === key
                ? { background: "var(--eg-bg)", borderColor: "var(--eg-border)", color: "var(--eg-ink)", boxShadow: "var(--eg-shadow-sm)" }
                : { background: "transparent", borderColor: "transparent" }
            }
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "events" ? (
        <div className="flex flex-col gap-12">
          <section>
            <SectionHead
              title="進行中"
              count={`${ongoing.length} 個活動`}
              countTone={ongoing.length > 0 ? "success" : "default"}
            />
            {!isLoggedIn ? (
              <LoginWall
                title="登入查看活動詳情"
                description="成為會員即可查看完整活動資訊並報名參加"
                itemCount={2}
                redirect="/events"
              />
            ) : ongoing.length > 0 ? (
              <EventGrid events={ongoing} fallbackDescription="精彩活動進行中" />
            ) : (
              <EmptyState title="目前沒有進行中的活動" hint="敬請期待即將推出的精彩活動" />
            )}
          </section>

          <section>
            <SectionHead
              title="即將開始"
              count={`${upcoming.length} 個活動`}
              countTone={upcoming.length > 0 ? "warn" : "default"}
            />
            {upcoming.length > 0 ? (
              <EventGrid events={upcoming} fallbackDescription="敬請期待" />
            ) : (
              <EmptyState title="目前沒有未來的活動" hint="請密切關注最新消息" />
            )}
          </section>

          {recent.length > 0 && (
            <section>
              <SectionHead title="已結束" count={`${recent.length} 場`} />
              <EventGrid events={recent} fallbackDescription="活動已結束" dimmed />
            </section>
          )}
        </div>
      ) : (
        <section>
          <SectionHead title="公告" count={isLoggedIn ? `${announcements?.length ?? 0} 則` : undefined} />
          <AnnouncementList announcements={announcements} isLoggedIn={isLoggedIn} />
        </section>
      )}
    </div>
  );
}
