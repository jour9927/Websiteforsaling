import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import {
  COMMISSION_DEPOSIT_NOTIFICATION_TYPES,
  type CommissionDepositNotificationType,
  getCommissionDepositReminderStatus,
} from "@/lib/commissions";

type Relation<T> = T | T[] | null;

type DistributionRelation = {
  pokemon_name: string | null;
  pokemon_name_en: string | null;
};

type CommissionRow = {
  id: string;
  title: string;
  completed_at: string | null;
  deposit_returned_at: string | null;
  is_first_time_client: boolean;
  deposit_details: string | null;
  distribution: Relation<DistributionRelation>;
};

type NotificationRow = {
  user_id: string;
  type: CommissionDepositNotificationType;
};

type NotificationDraft = {
  type: CommissionDepositNotificationType;
  title: string;
  message: string;
};

function pickRelation<T>(value: Relation<T>) {
  return Array.isArray(value) ? value[0] ?? null : value;
}

function getTaipeiDayBounds(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);

  const year = Number(parts.find((part) => part.type === "year")?.value ?? "0");
  const month = Number(parts.find((part) => part.type === "month")?.value ?? "0");
  const day = Number(parts.find((part) => part.type === "day")?.value ?? "0");

  const startMs = Date.UTC(year, month - 1, day) - 8 * 60 * 60 * 1000;
  const endMs = startMs + 24 * 60 * 60 * 1000;

  return {
    dateKey: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
    startIso: new Date(startMs).toISOString(),
    endIso: new Date(endMs).toISOString(),
  };
}

function getCommissionLabel(row: CommissionRow) {
  const distribution = pickRelation(row.distribution);
  return row.title || distribution?.pokemon_name || distribution?.pokemon_name_en || row.id;
}

function buildTitleSuffix(rows: CommissionRow[]) {
  if (rows.length === 0) {
    return "";
  }

  const titles = rows.slice(0, 3).map((row) => getCommissionLabel(row));

  if (rows.length <= 3) {
    return `：${titles.join("、")}。`;
  }

  return `：${titles.join("、")} 等 ${rows.length} 件。`;
}

function buildNotificationDraft(
  type: CommissionDepositNotificationType,
  rows: CommissionRow[],
): NotificationDraft | null {
  if (rows.length === 0) {
    return null;
  }

  if (type === COMMISSION_DEPOSIT_NOTIFICATION_TYPES.dueSoon) {
    return {
      type,
      title: "押底歸還即將到期",
      message: `48 小時內有 ${rows.length} 件押底即將到期${buildTitleSuffix(rows)}請先確認案件是否可順利歸還。`,
    };
  }

  if (type === COMMISSION_DEPOSIT_NOTIFICATION_TYPES.ready) {
    return {
      type,
      title: "押底歸還待處理",
      message: `目前有 ${rows.length} 件押底已可歸還${buildTitleSuffix(rows)}請至管理端待辦板確認。`,
    };
  }

  if (type === COMMISSION_DEPOSIT_NOTIFICATION_TYPES.overdue) {
    return {
      type,
      title: "押底歸還已逾期",
      message: `目前有 ${rows.length} 件押底逾期待歸還${buildTitleSuffix(rows)}請優先處理。`,
    };
  }

  return null;
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      { error: "Supabase environment variables are missing" },
      { status: 500 },
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  try {
    const [{ data: adminRows, error: adminError }, { data: commissionData, error: commissionError }] =
      await Promise.all([
        supabase.from("profiles").select("id").eq("role", "admin"),
        supabase
          .from("commissions")
          .select(
            `
              id,
              title,
              completed_at,
              deposit_returned_at,
              is_first_time_client,
              deposit_details,
              distribution:distributions!commissions_distribution_id_fkey (
                pokemon_name,
                pokemon_name_en
              )
            `,
          )
          .eq("status", "completed")
          .eq("is_first_time_client", true)
          .is("deposit_returned_at", null)
          .not("deposit_details", "is", null),
      ]);

    if (adminError) {
      throw adminError;
    }

    if (commissionError) {
      throw commissionError;
    }

    const adminIds = (adminRows ?? []).map((row) => row.id).filter(Boolean);
    if (adminIds.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No admins found",
        created: 0,
      });
    }

    const commissionRows = (commissionData ?? []) as CommissionRow[];
    const dueSoonRows = commissionRows.filter(
      (row) =>
        getCommissionDepositReminderStatus({
          completedAt: row.completed_at,
          depositReturnedAt: row.deposit_returned_at,
          requiresDeposit: row.is_first_time_client && Boolean(row.deposit_details),
        }) === "due_soon",
    );
    const readyRows = commissionRows.filter(
      (row) =>
        getCommissionDepositReminderStatus({
          completedAt: row.completed_at,
          depositReturnedAt: row.deposit_returned_at,
          requiresDeposit: row.is_first_time_client && Boolean(row.deposit_details),
        }) === "ready",
    );
    const overdueRows = commissionRows.filter(
      (row) =>
        getCommissionDepositReminderStatus({
          completedAt: row.completed_at,
          depositReturnedAt: row.deposit_returned_at,
          requiresDeposit: row.is_first_time_client && Boolean(row.deposit_details),
        }) === "overdue",
    );

    const drafts = [
      buildNotificationDraft(COMMISSION_DEPOSIT_NOTIFICATION_TYPES.dueSoon, dueSoonRows),
      buildNotificationDraft(COMMISSION_DEPOSIT_NOTIFICATION_TYPES.ready, readyRows),
      buildNotificationDraft(COMMISSION_DEPOSIT_NOTIFICATION_TYPES.overdue, overdueRows),
    ].filter((draft): draft is NotificationDraft => Boolean(draft));

    if (drafts.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No commission deposit reminders for today",
        created: 0,
      });
    }

    const { startIso, endIso, dateKey } = getTaipeiDayBounds();
    const notificationTypes = drafts.map((draft) => draft.type);
    const { data: existingRows, error: existingError } = await supabase
      .from("notifications")
      .select("user_id, type")
      .in("user_id", adminIds)
      .in("type", notificationTypes)
      .gte("created_at", startIso)
      .lt("created_at", endIso);

    if (existingError) {
      throw existingError;
    }

    const existingKeys = new Set(
      ((existingRows ?? []) as NotificationRow[]).map(
        (row) => `${row.user_id}:${row.type}:${dateKey}`,
      ),
    );

    const inserts = adminIds.flatMap((adminId) =>
      drafts
        .filter((draft) => !existingKeys.has(`${adminId}:${draft.type}:${dateKey}`))
        .map((draft) => ({
          user_id: adminId,
          type: draft.type,
          title: draft.title,
          message: draft.message,
          related_event_id: null,
          related_user_id: null,
        })),
    );

    if (inserts.length === 0) {
      return NextResponse.json({
        success: true,
        message: "Today notifications already sent",
        created: 0,
      });
    }

    const { error: insertError } = await supabase.from("notifications").insert(inserts);
    if (insertError) {
      throw insertError;
    }

    return NextResponse.json({
      success: true,
      date: dateKey,
      created: inserts.length,
      summaries: {
        dueSoon: dueSoonRows.length,
        ready: readyRows.length,
        overdue: overdueRows.length,
      },
    });
  } catch (error) {
    console.error("[cron] commission deposit reminders failed:", error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 },
    );
  }
}
