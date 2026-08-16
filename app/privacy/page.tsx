const sections = [
  {
    title: "資料蒐集",
    body: "我們會蒐集帳號 Email、公開名稱、活動與交易紀錄。申請民間交易資格時，另會蒐集真實姓名及身分證正反面影像；使用新台幣交易時，會保存賣家提供的收款說明、買家付款證明與交易備註。未申請交易資格者不需要提供證件。"
  },
  {
    title: "資料使用",
    body: "一般資料用於帳號、活動、通知與交易服務；身分證資料只用於管理員人工確認交易會員身分，不會顯示在公開頁面或提供給其他會員。收款說明與付款證明只提供該筆交易雙方、管理員及必要的系統服務查看。"
  },
  {
    title: "證件安全與保存",
    body: "證件存放於非公開的私人空間，只限資料本人、管理員及必要的系統服務存取。審核連結採短效授權；審核完成 30 天後會自動刪除正反面影像，只保留認證狀態與必要的審核紀錄。"
  },
  {
    title: "查詢與補件",
    body: "你可以在「我的帳號」查看認證狀態。資料遭駁回時可重新上傳補件；若要詢問、更正或撤回尚未完成的申請，請透過站內訊息聯絡管理員。"
  },
  {
    title: "付款資料安全",
    body: "付款證明存放於非公開空間並使用短效預覽連結，交易確認完成 180 天後自動刪除影像，只保留必要的交易與審核紀錄。平台不會自動從銀行帳戶扣款，也不會保存網路銀行密碼、信用卡安全碼或其他登入憑證；請勿把這類資料填入付款備註。"
  }
];

export default function PrivacyPage() {
  return (
    <div className="flex flex-col gap-8">
      <header className="glass-card p-8">
        <h1 className="text-3xl font-semibold">隱私權政策</h1>
        <p className="mt-2 text-sm text-slate-200/70">保障個資安全是我們的首要任務。</p>
        <p className="mt-1 text-xs text-slate-200/45">最後更新：2026 年 8 月 16 日</p>
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
