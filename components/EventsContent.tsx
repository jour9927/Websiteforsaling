import { EventCard } from "@/components/EventCard";

type Event = {
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

type EventsContentProps = {
    ongoingEvents?: Event[] | null;
    upcomingEvents: Event[] | null;
    recentEvents: Event[] | null;
};

export function EventsContent({ ongoingEvents, upcomingEvents, recentEvents }: EventsContentProps) {
    return (
        <div className="space-y-8">
            {/* 進行中的活動 */}
            <section>
                <div className="mb-4 flex items-center gap-3">
                    <h2 className="text-xl font-semibold text-white/90">🎯 進行中的活動</h2>
                    <span className="rounded-full bg-green-500/20 px-3 py-1 text-xs text-green-200">
                        {ongoingEvents?.length || 0} 個活動
                    </span>
                </div>
                {ongoingEvents && ongoingEvents.length > 0 ? (
                    <div className="grid gap-6 md:grid-cols-2">
                        {ongoingEvents.map((event) => (
                            <EventCard
                                key={event.id}
                                event={{
                                    id: event.id,
                                    title: event.title,
                                    description: event.description || "精彩活動進行中",
                                    date: event.start_date,
                                    location: event.location || "線上活動",
                                    cover: event.image_url && event.image_url.trim() !== '' ? event.image_url : undefined,
                                    imagePosition: event.image_position || "center",
                                    price: event.price || 0,
                                    is_free: event.is_free ?? true
                                }}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="glass-card p-8 text-center">
                        <p className="text-white/60">目前沒有進行中的活動</p>
                        <p className="mt-2 text-sm text-white/40">敬請期待即將推出的精彩活動</p>
                    </div>
                )}
            </section>

            {/* 未來的活動 */}
            <section>
                <div className="mb-4 flex items-center gap-3">
                    <h2 className="text-xl font-semibold text-white/90">🚀 未來的活動</h2>
                    <span className="rounded-full bg-amber-500/20 px-3 py-1 text-xs text-amber-200">
                        {upcomingEvents?.length || 0} 個活動
                    </span>
                </div>
                {upcomingEvents && upcomingEvents.length > 0 ? (
                    <div className="grid gap-6 md:grid-cols-2">
                        {upcomingEvents.map((event) => (
                            <EventCard
                                key={event.id}
                                event={{
                                    id: event.id,
                                    title: event.title,
                                    description: event.description || "敬請期待",
                                    date: event.start_date,
                                    location: event.location || "線上活動",
                                    cover: event.image_url && event.image_url.trim() !== '' ? event.image_url : undefined,
                                    imagePosition: event.image_position || "center",
                                    price: event.price || 0,
                                    is_free: event.is_free ?? true
                                }}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="glass-card p-8 text-center">
                        <p className="text-white/60">目前沒有未來的活動</p>
                        <p className="mt-2 text-sm text-white/40">請密切關注最新消息</p>
                    </div>
                )}
            </section>

            {/* 近期舉辦 */}
            {recentEvents && recentEvents.length > 0 && (
                <section>
                    <div className="mb-4 flex items-center gap-3">
                        <h2 className="text-xl font-semibold text-white/90">📅 已結束的活動</h2>
                        <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/60">
                            已結束
                        </span>
                    </div>
                    <div className="grid gap-6 md:grid-cols-2 opacity-75">
                        {recentEvents.map((event) => (
                            <EventCard
                                key={event.id}
                                event={{
                                    id: event.id,
                                    title: event.title,
                                    description: event.description || "活動已結束",
                                    date: event.start_date,
                                    location: event.location || "線上活動",
                                    cover: event.image_url && event.image_url.trim() !== '' ? event.image_url : undefined,
                                    imagePosition: event.image_position || "center",
                                    price: event.price || 0,
                                    is_free: event.is_free ?? true
                                }}
                            />
                        ))}
                    </div>
                </section>
            )}

        </div>
    );
}
