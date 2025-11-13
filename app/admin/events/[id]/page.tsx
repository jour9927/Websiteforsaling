import Link from "next/link";
import type { Route } from "next";
import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/auth";
import EventEditForm from "./EventEditForm";

export const dynamic = "force-dynamic";

interface AdminEventEditPageProps {
  params: { id: string };
}

export default async function AdminEventEditPage({ params }: AdminEventEditPageProps) {
  const supabase = createServerSupabaseClient();

  const { data: event, error } = await supabase
    .from("events")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error || !event) {
    notFound();
  }

  const previewHref = `/events/${params.id}` as Route;

  return (
    <section className="space-y-8">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/60">活動設定</p>
          <h1 className="text-2xl font-semibold text-white/90">{event.title}</h1>
          <p className="text-xs text-white/60">調整活動資訊、封面與排程，儲存後會同步更新前台頁面。</p>
        </div>
        <Link
          href={previewHref}
          className="rounded-xl border border-white/30 px-4 py-2 text-xs text-white/80 transition hover:bg-white/10"
        >
          前台預覽
        </Link>
      </header>

      <EventEditForm event={event} />
    </section>
  );
}
