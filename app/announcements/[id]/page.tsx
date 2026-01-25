import Link from "next/link";
import type { Route } from "next";
import { notFound } from "next/navigation";

const announcementDetail: Record<string, {
  title: string;
  publishedAt: string;
  body: string;
  status: string;
}> = {
  "notice-001": {
    title: "春日嘉年華報名截止提醒",
    publishedAt: "2025/02/18",
    status: "發布中",
    body: `親愛的參與者您好，春日嘉年華報名將於 3/15 晚上 23:59 截止。請務必於截止前完成以下事項：

1. 上傳報名所需個資與證件。
2. 於 Supabase 帳號確認付款狀態。
3. 若需更換聯絡人資訊，請於表單更新後再次保存。

感謝您的支持，現場見！`
  },
  "notice-002": {
    title: "夏夜電音祭舞台揭露直播",
    publishedAt: "2025/02/16",
    status: "預告",
    body: `夏夜電音祭將在 3/01 20:00 於官方頻道直播揭露舞台設計與 DJ 陣容。

直播後我們會釋出後台抽選體驗示範，並於當日晚間寄送抽選規則給所有報名者。`
  },
  "notice-003": {
    title: "系統維護通知",
    publishedAt: "2025/02/14",
    status: "重要",
    body: `為提升服務品質，系統將於 2/25 凌晨 01:00-03:00 進行維護。過程中將暫停以下功能：
- 新增活動與報名流程
- 抽選與兌換
- Storage 檔案上傳

維護完成後會透過站內公告與 Email 通知。如有緊急需求請與活動窗口聯繫。`
  }
};

type AnnouncementPageProps = {
  params: { id: string };
};

export default function AnnouncementDetailPage({ params }: AnnouncementPageProps) {
  const announcement = announcementDetail[params.id];

  if (!announcement) {
    notFound();
  }

  return (
    <article className="glass-card space-y-6 p-8">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs text-white/50">發布日期 {announcement.publishedAt}</p>
          <h1 className="mt-2 text-3xl font-semibold text-white">{announcement.title}</h1>
        </div>
        <span className="w-fit rounded-full bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-white/80">
          {announcement.status}
        </span>
      </div>
      <div className="space-y-4 whitespace-pre-wrap text-sm leading-relaxed text-white/80">
        {announcement.body.split("\n\n").map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </div>
      <div className="flex flex-wrap gap-3 text-xs text-sky-200">
        <Link href="/" className="hover:text-sky-100">
          返回主頁
        </Link>
        <span className="text-white/30">|</span>
        <Link href={"/events" as Route} className="hover:text-sky-100">
          探索活動
        </Link>
      </div>
    </article>
  );
}
