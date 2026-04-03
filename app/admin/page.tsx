import Link from "next/link";
import {
  createAdminSupabaseClient,
  createServerSupabaseClient,
} from "@/lib/auth";
import {
  getCommissionDepositReminderStatus,
  getCommissionDepositReturnDueAt,
  type CommissionDepositReminderStatus,
} from "@/lib/commissions";

export const dynamic = "force-dynamic";

type Relation<T> = T | T[] | null;

type ProfileRelation = {
  full_name: string | null;
  email: string | null;
};

type DistributionRelation = {
  pokemon_name: string | null;
  pokemon_name_en: string | null;
};

type CommissionRow = {
  id: string;
  title: string;
  created_at: string;
  completed_at: string | null;
  deposit_returned_at: string | null;
  is_first_time_client: boolean;
  deposit_details: string | null;
  distribution: Relation<DistributionRelation>;
  creator: Relation<ProfileRelation>;
  executor: Relation<ProfileRelation>;
};

type ActiveCommissionDepositReminderStatus = Exclude<
  CommissionDepositReminderStatus,
  "not_applicable" | "returned"
>;

type DepositTodoItem = {
  id: string;
  title: string;
  distributionName: string;
  creatorName: string;
  executorName: string | null;
  createdAt: string;
  completedAt: string | null;
  dueAt: string | null;
  reminderStatus: ActiveCommissionDepositReminderStatus;
};

const dateTimeFormatter = new Intl.DateTimeFormat("zh-TW", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const reminderPriority: Record<ActiveCommissionDepositReminderStatus, number> = {
  overdue: 0,
  ready: 1,
  due_soon: 2,
  tracking: 3,
};

const reminderBadgeClasses: Record<ActiveCommissionDepositReminderStatus, string> = {
  overdue: "border-rose-400/30 bg-rose-400/10 text-rose-100",
  ready: "border-cyan-300/30 bg-cyan-400/10 text-cyan-100",
  due_soon: "border-amber-300/30 bg-amber-400/10 text-amber-100",
  tracking: "border-white/15 bg-white/5 text-white/75",
};

function pickRelation<T>(value: Relation<T>) {
  return Array.isArray(value) ? value[0] ?? null : value;
}

function getDisplayName(profile: ProfileRelation | null) {
  return profile?.full_name?.trim() || profile?.email || "未提供";
}

function formatDateTime(value: string | null) {
  if (!value) {
    return "未排定";
  }

  return dateTimeFormatter.format(new Date(value));
}

function getReminderLabel(status: ActiveCommissionDepositReminderStatus) {
  switch (status) {
    case "overdue":
      return "已逾期";
    case "ready":
      return "可歸還";
    case "due_soon":
      return "48 小時內到期";
    case "tracking":
      return "保留中";
    default:
      return "保留中";
  }
}

function isDepositTodoItem(item: DepositTodoItem | null): item is DepositTodoItem {
  return item !== null;
}

function getReminderDescription(item: DepositTodoItem) {
  switch (item.reminderStatus) {
    case "overdue":
      return `原定 ${formatDateTime(item.dueAt)} 可歸還，請優先確認。`;
    case "ready":
      return `已於 ${formatDateTime(item.dueAt)} 到達歸還時間，可立即處理。`;
    case "due_soon":
      return `預計 ${formatDateTime(item.dueAt)} 到期，請先確認案件是否無異常。`;
    case "tracking":
      return `完成後仍在保留期內，預計 ${formatDateTime(item.dueAt)} 可歸還。`;
    default:
      return "目前沒有待辦。";
  }
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "default" | "rose" | "cyan" | "amber";
}) {
  const toneClasses = {
    default: "border-white/10 bg-white/[0.04] text-white",
    rose: "border-rose-400/20 bg-rose-400/[0.08] text-rose-50",
    cyan: "border-cyan-300/20 bg-cyan-400/[0.08] text-cyan-50",
    amber: "border-amber-300/20 bg-amber-400/[0.08] text-amber-50",
  }[tone];

  return (
    <article className={`rounded-3xl border p-5 ${toneClasses}`}>
      <p className="text-xs uppercase tracking-[0.26em] text-white/55">{label}</p>
      <p className="mt-3 text-3xl font-semibold">{value}</p>
    </article>
  );
}

function TodoSection({
  title,
  description,
  items,
}: {
  title: string;
  description: string;
  items: DepositTodoItem[];
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <section className="glass-card p-6">
      <div className="flex flex-col gap-3 border-b border-white/10 pb-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-white/45">Deposit Queue</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">{title}</h2>
          <p className="mt-2 text-sm leading-7 text-white/70">{description}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/75">
          共 {items.length} 件
        </div>
      </div>

      <div className="mt-5 space-y-4">
        {items.map((item) => (
          <article
            key={item.id}
            className="rounded-3xl border border-white/10 bg-white/[0.035] p-5"
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                  <span
                    className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${reminderBadgeClasses[item.reminderStatus]}`}
                  >
                    {getReminderLabel(item.reminderStatus)}
                  </span>
                </div>
                <p className="text-sm text-white/70">{item.distributionName}</p>
                <p className="text-sm leading-7 text-white/80">{getReminderDescription(item)}</p>
                <div className="grid gap-2 text-sm text-white/60 md:grid-cols-2">
                  <p>委託人：{item.creatorName}</p>
                  <p>承接者：{item.executorName ?? "尚未指定"}</p>
                  <p>建立時間：{formatDateTime(item.createdAt)}</p>
                  <p>完成時間：{formatDateTime(item.completedAt)}</p>
                </div>
              </div>

              <div className="flex shrink-0 flex-col gap-3 sm:flex-row lg:flex-col">
                <a
                  href={`/commissions#commission-${item.id}`}
                  className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
                >
                  查看案件
                </a>
                <Link
                  href="/admin/notifications"
                  className="inline-flex items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-400/10 px-4 py-3 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-400/15"
                >
                  前往通知中心
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default async function AdminDashboardPage() {
  const supabase = process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createAdminSupabaseClient()
    : createServerSupabaseClient();

  const { data, error } = await supabase
    .from("commissions")
    .select(
      `
        id,
        title,
        created_at,
        completed_at,
        deposit_returned_at,
        is_first_time_client,
        deposit_details,
        distribution:distributions!commissions_distribution_id_fkey (
          pokemon_name,
          pokemon_name_en
        ),
        creator:profiles!commissions_created_by_fkey (
          full_name,
          email
        ),
        executor:profiles!commissions_accepted_by_fkey (
          full_name,
          email
        )
      `,
    )
    .eq("status", "completed")
    .eq("is_first_time_client", true)
    .is("deposit_returned_at", null)
    .not("deposit_details", "is", null)
    .order("completed_at", { ascending: true });

  if (error) {
    console.error("[admin] failed to fetch commission deposit todos:", error.message);
  }

  const todoItems = ((data ?? []) as CommissionRow[])
    .map((row) => {
      const distribution = pickRelation(row.distribution);
      const creator = pickRelation(row.creator);
      const executor = pickRelation(row.executor);
      const reminderStatus = getCommissionDepositReminderStatus({
        completedAt: row.completed_at,
        depositReturnedAt: row.deposit_returned_at,
        requiresDeposit: row.is_first_time_client && Boolean(row.deposit_details),
      });

      if (reminderStatus === "not_applicable" || reminderStatus === "returned") {
        return null;
      }

      return {
        id: row.id,
        title: row.title,
        distributionName:
          distribution?.pokemon_name ||
          distribution?.pokemon_name_en ||
          "未指定配布圖鑑資料",
        creatorName: getDisplayName(creator),
        executorName: executor ? getDisplayName(executor) : null,
        createdAt: row.created_at,
        completedAt: row.completed_at,
        dueAt: getCommissionDepositReturnDueAt(row.completed_at),
        reminderStatus,
      } satisfies DepositTodoItem;
    })
    .filter(isDepositTodoItem)
    .sort((left, right) => {
      const priorityGap =
        reminderPriority[left.reminderStatus] - reminderPriority[right.reminderStatus];

      if (priorityGap !== 0) {
        return priorityGap;
      }

      const leftTime = left.dueAt ? new Date(left.dueAt).getTime() : Number.MAX_SAFE_INTEGER;
      const rightTime = right.dueAt ? new Date(right.dueAt).getTime() : Number.MAX_SAFE_INTEGER;

      return leftTime - rightTime;
    });

  const overdueItems = todoItems.filter((item) => item.reminderStatus === "overdue");
  const readyItems = todoItems.filter((item) => item.reminderStatus === "ready");
  const dueSoonItems = todoItems.filter((item) => item.reminderStatus === "due_soon");
  const trackingItems = todoItems.filter((item) => item.reminderStatus === "tracking");
  const urgentCount = overdueItems.length + readyItems.length + dueSoonItems.length;

  return (
    <div className="space-y-8">
      <section className="glass-card overflow-hidden">
        <div className="grid gap-6 border-b border-white/10 px-6 py-6 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div>
            <p className="text-xs uppercase tracking-[0.32em] text-cyan-200/70">Admin Focus</p>
            <h1 className="mt-3 text-3xl font-semibold text-white">押底歸還待辦板</h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/75">
              管理端首頁現在直接聚焦場外委託的押底保留期。逾期、可歸還、即將到期案件都會集中顯示，
              方便你從這裡直接跳到前台案件或通知中心。
            </p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
            <p className="text-xs uppercase tracking-[0.26em] text-white/45">今日優先處理</p>
            <p className="mt-3 text-4xl font-semibold text-white">{urgentCount}</p>
            <p className="mt-2 text-sm leading-7 text-white/65">
              {urgentCount > 0
                ? "請優先清空逾期與已可歸還案件，再回頭確認即將到期項目。"
                : "目前沒有急件，僅需持續追蹤仍在保留期中的案件。"}
            </p>
          </div>
        </div>

        <div className="grid gap-4 px-6 py-6 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="待歸還總數" value={todoItems.length} tone="default" />
          <StatCard label="已逾期" value={overdueItems.length} tone="rose" />
          <StatCard label="可立即歸還" value={readyItems.length} tone="cyan" />
          <StatCard label="48 小時內到期" value={dueSoonItems.length} tone="amber" />
        </div>
      </section>

      {error ? (
        <section className="glass-card p-6 text-sm leading-7 text-rose-100">
          後台首頁暫時無法讀取押底待辦資料，請稍後重整，或確認
          <span className="px-1 text-white">`SUPABASE_SERVICE_ROLE_KEY`</span>
          是否已正確設定。
        </section>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-5">
          <p className="text-xs uppercase tracking-[0.24em] text-white/45">Quick Access</p>
          <h2 className="mt-2 text-xl font-semibold text-white">通知與案件入口</h2>
          <p className="mt-3 text-sm leading-7 text-white/70">
            每日押底提醒會同步送進通知中心；待辦板則保留可操作的案件清單。
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/admin/notifications"
              className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
            >
              打開通知中心
            </Link>
            <Link
              href="/commissions"
              className="inline-flex items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-400/10 px-4 py-3 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-400/15"
            >
              前往委託安排
            </Link>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-5">
          <p className="text-xs uppercase tracking-[0.24em] text-white/45">保留期追蹤</p>
          <h2 className="mt-2 text-xl font-semibold text-white">仍在保留期中的案件</h2>
          <p className="mt-3 text-sm leading-7 text-white/70">
            目前共有 {trackingItems.length} 件案件仍在等待滿 10 天。這些案件不需要立即操作，
            但每日提醒會在 48 小時內到期時自動送出。
          </p>
        </div>
      </section>

      {todoItems.length === 0 ? (
        <section className="glass-card p-8 text-center">
          <p className="text-lg font-semibold text-white">目前沒有待歸還押底案件</p>
          <p className="mt-3 text-sm leading-7 text-white/65">
            後續只要有首次委託完成，系統會在保留期接近結束時自動送提醒進通知中心。
          </p>
        </section>
      ) : null}

      <TodoSection
        title="已逾期待處理"
        description="這些案件已超過原定歸還時間，應優先確認並處理押底歸還。"
        items={overdueItems}
      />
      <TodoSection
        title="可立即歸還"
        description="保留期已滿，可以直接到前台案件卡片執行押底歸還。"
        items={readyItems}
      />
      <TodoSection
        title="48 小時內到期"
        description="這些案件很快就會進入可歸還狀態，建議先預檢是否仍有爭議。"
        items={dueSoonItems}
      />
      <TodoSection
        title="保留中追蹤"
        description="這些案件仍在保留期，暫時不需要操作。"
        items={trackingItems}
      />
    </div>
  );
}
