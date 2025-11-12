import Link from "next/link";
import type { Route } from "next";
import type { FC } from "react";

export type EventSummary = {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  cover?: string;
};

type EventCardProps = {
  event: EventSummary;
};

export const EventCard: FC<EventCardProps> = ({ event }: EventCardProps) => {
  const { id, title, description, date, location, cover } = event;
  const eventHref = `/events/${id}` as Route;
  return (
    <Link href={eventHref} className="glass-card flex flex-col overflow-hidden">
      <div className="aspect-video bg-gradient-to-br from-slate-800/50 to-slate-600/40" aria-hidden>
        {cover ? <span className="sr-only">{cover}</span> : null}
      </div>
      <div className="p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-200/80">活動</p>
        <h2 className="mt-2 text-2xl font-semibold">{title}</h2>
        <p className="mt-2 text-sm text-slate-200/90">{description}</p>
        <div className="mt-4 flex flex-col gap-1 text-xs text-slate-200/70">
          <span>時間：{date}</span>
          <span>地點：{location}</span>
        </div>
      </div>
    </Link>
  );
};
