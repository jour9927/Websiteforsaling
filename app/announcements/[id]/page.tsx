import Link from "next/link";
import type { Route } from "next";
import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/auth";

export const dynamic = 'force-dynamic';

type AnnouncementPageProps = {
  params: { id: string };
};

export default async function AnnouncementDetailPage({ params }: AnnouncementPageProps) {
  const supabase = createServerSupabaseClient();

  // 從資料庫讀取公告
  const { data: announcement, error } = await supabase
    .from('announcements')
    .select('*')
    .eq('id', params.id)
    .single();

  if (error || !announcement) {
    notFound();
  }

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'published': return '發布中';
      case 'scheduled': return '已排程';
      case 'draft': return '草稿';
      default: return status;
    }
  };

  return (
    <article className="glass-card space-y-6 p-8">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs text-white/50">
            發布日期 {new Date(announcement.published_at || announcement.created_at).toLocaleDateString('zh-TW')}
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-white">{announcement.title}</h1>
        </div>
        <span className="w-fit rounded-full bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-white/80">
          {getStatusDisplay(announcement.status)}
        </span>
      </div>
      <div className="space-y-4 whitespace-pre-wrap text-sm leading-relaxed text-white/80">
        {announcement.content.split("\n\n").map((paragraph: string, index: number) => (
          <p key={index}>{paragraph}</p>
        ))}
      </div>
      <div className="flex flex-wrap gap-3 text-xs text-sky-200">
        <Link href="/announcements" className="hover:text-sky-100">
          返回公告列表
        </Link>
        <span className="text-white/30">|</span>
        <Link href={"/" as Route} className="hover:text-sky-100">
          返回主頁
        </Link>
      </div>
    </article>
  );
}
