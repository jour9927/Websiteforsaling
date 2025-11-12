import Link from "next/link";
import type { Route } from "next";

const announcements = [
  {
    id: "notice-001",
    title: "春日嘉年華報名截止提醒",
    excerpt: "3/15 晚上 23:59 截止，請盡速完成報名流程並上傳所需資料。",
    publishedAt: "2025/02/18",
    status: "發布中"
  },
  {
    id: "notice-002",
    title: "夏夜電音祭舞台揭露直播",
    excerpt: "3/01 20:00 將於官方頻道直播揭露舞台設計與 DJ 名單。",
    publishedAt: "2025/02/16",
    status: "預告"
  },
  {
    id: "notice-003",
    title: "系統維護通知",
    excerpt: "2/25 凌晨 01:00-03:00 將進行系統維護，期間暫停報名與抽選。",
    publishedAt: "2025/02/14",
    status: "重要"
  }
];

export default function AnnouncementsPage() {
  return (
    <div className="space-y-8">
      <header className="glass-card p-8">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-200/70">公告牆</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">最新活動公告</h1>
        <p className="mt-3 text-sm text-white/70">掌握活動最新消息、緊急通知與系統公告。</p>
      </header>
      <section className="space-y-4">
        {announcements.map((notice) => (
          <article key={notice.id} className="glass-card p-6">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs text-white/50">發布日期 {notice.publishedAt}</p>
                <h2 className="mt-1 text-xl font-semibold text-white/90">{notice.title}</h2>
              </div>
              <span className="w-fit rounded-full bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-white/80">
                {notice.status}
              </span>
            </div>
            <p className="mt-4 text-sm text-white/75">{notice.excerpt}</p>
            <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-sky-200">
              <Link href={`/announcements/${notice.id}` as Route} className="hover:text-sky-100">
                查看完整內容
              </Link>
              <span className="text-white/30">|</span>
              <a href="/events" className="hover:text-sky-100">
                查看相關活動
              </a>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
