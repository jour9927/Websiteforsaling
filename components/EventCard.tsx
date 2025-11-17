import Link from "next/link";
import type { Route } from "next";
import type { FC } from "react";
import Image from "next/image";

export type EventSummary = {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  cover?: string;
  price?: number;
  is_free?: boolean;
  badgeLabel?: string;
};

type EventCardProps = {
  event: EventSummary;
};

export const EventCard: FC<EventCardProps> = ({ event }: EventCardProps) => {
  const { id, title, description, date, location, cover, price, is_free } = event;
  const eventHref = `/events/${id}` as Route;
  
  return (
    <Link href={eventHref} className="glass-card group relative flex flex-col overflow-hidden transition-all hover:scale-[1.02]">
      {event.badgeLabel && (
        <div className="absolute left-3 top-3 z-10 rounded-full border border-white/30 bg-black/70 px-3 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.35em] text-white shadow-lg">
          {event.badgeLabel}
        </div>
      )}
      <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-slate-800/50 to-slate-600/40">
        {cover ? (
          <Image
            src={cover}
            alt={title}
            fill
            className="object-cover transition-transform group-hover:scale-110"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-white/30">
            <svg className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        {/* 價格標籤 - 加大手機版顯示 */}
        {is_free !== undefined && (
          <div className="absolute right-2 top-2 sm:right-3 sm:top-3 rounded-full bg-black/70 px-3 py-1.5 sm:px-4 sm:py-2 text-sm sm:text-xs font-bold text-white backdrop-blur-sm shadow-lg border border-white/20">
            {is_free || price === 0 ? '免費' : `NT$ ${price?.toLocaleString()}`}
          </div>
        )}
      </div>
      <div className="p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-200/80">活動</p>
        <h2 className="mt-2 text-2xl font-semibold">{title}</h2>
        <p className="mt-2 line-clamp-2 text-sm text-slate-200/90">{description}</p>
        
        {/* 價格資訊 - 手機版額外顯示 */}
        {is_free !== undefined && (
          <div className="mt-3 inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-1.5 text-sm sm:hidden">
            <span className="text-lg">💰</span>
            <span className="font-semibold text-white">
              {is_free || price === 0 ? '免費參加' : `NT$ ${price?.toLocaleString()}`}
            </span>
          </div>
        )}
        
        <div className="mt-4 flex flex-col gap-1 text-xs text-slate-200/70">
          <span>⏰ {new Date(date).toLocaleDateString('zh-TW', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
          <span>📍 {location}</span>
        </div>
      </div>
    </Link>
  );
};
