const sections = [
  {
    title: "資料蒐集",
    body: "我們僅蒐集活動報名與抽選所需的基本資料，包含 Email、暱稱與參與紀錄。"
  },
  {
    title: "資料使用",
    body: "資料僅用於活動管理、推播通知與抽選驗證，不會提供給第三方。"
  },
  {
    title: "資料保存",
    body: "若帳號超過 12 個月未使用，系統將自動刪除您的個人資料。"
  }
];

export default function PrivacyPage() {
  return (
    <div className="flex flex-col gap-8">
      <header className="glass-card p-8">
        <h1 className="text-3xl font-semibold">隱私權政策</h1>
        <p className="mt-2 text-sm text-slate-200/70">保障個資安全是我們的首要任務。</p>
      </header>
      <section className="space-y-6">
        {sections.map((section) => (
          <article key={section.title} className="glass-card p-8">
            <h2 className="text-xl font-semibold text-white/90">{section.title}</h2>
            <p className="mt-3 text-sm text-slate-200/80">{section.body}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
