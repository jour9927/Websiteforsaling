import Link from "next/link";
import Image from "next/image";
import type { Route } from "next";
import type { FC } from "react";
import type { EventSummary } from "@/components/EventCard";

type Props = {
  event: EventSummary;
  /** 已結束的活動：降低視覺重量，但不要糊到看不清楚 */
  dimmed?: boolean;
};

function formatDate(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("zh-TW", {
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const SkinEventCard: FC<Props> = ({ event, dimmed = false }) => {
  const { id, title, description, date, location, cover, imagePosition, price, is_free } = event;
  const href = `/events/${id}` as Route;
  const free = is_free || price === 0;

  return (
    <Link
      href={href}
      className="eg-card eg-card--interactive group flex flex-col overflow-hidden"
      style={dimmed ? { opacity: 0.72 } : undefined}
    >
      <div
        className="relative aspect-[16/9] overflow-hidden"
        style={{ background: "var(--eg-bg-muted)" }}
      >
        {cover ? (
          <Image
            src={cover}
            alt=""
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-[1.04]"
            style={{ objectPosition: imagePosition || "center" }}
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        ) : (
          <div
            className="flex h-full items-center justify-center"
            style={{ color: "var(--eg-ink-4)" }}
            aria-hidden="true"
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="5" width="18" height="16" rx="2" />
              <path d="M3 10h18M8 3v4M16 3v4" />
            </svg>
          </div>
        )}

        {event.badgeLabel && (
          <span
            className="eg-tag eg-tag--solid absolute left-3 top-3"
            style={{ boxShadow: "var(--eg-shadow-sm)" }}
          >
            {event.badgeLabel}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="eg-h3 text-[16px] leading-snug">{title}</h3>
          {is_free !== undefined && (
            <span className={`eg-tag flex-none ${free ? "eg-tag--success" : ""} eg-num`}>
              {free ? "免費" : `NT$ ${price?.toLocaleString()}`}
            </span>
          )}
        </div>

        <p className="eg-body mt-2 line-clamp-2 text-[13.5px]">{description}</p>

        <div
          className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 pt-3.5"
          style={{ borderTop: "1px solid var(--eg-border)" }}
        >
          <span className="eg-meta eg-num">{formatDate(date)}</span>
          <span className="eg-meta">{location}</span>
        </div>
      </div>
    </Link>
  );
};
