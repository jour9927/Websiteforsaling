import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

type DeliveryChannel = "email" | "discord";

type DeliveryRow = {
  id: string;
  channel: DeliveryChannel;
  title: string;
  body: string;
  inbox_path: string | null;
  provider_target: string | null;
  payload: Record<string, unknown> | null;
  status: string;
  attempt_count: number;
};

const MAX_ATTEMPTS = 5;
const BATCH_SIZE = 25;

function getSiteUrl() {
  const candidates = [
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
    process.env.VERCEL_URL,
    "https://eventglass.vercel.app",
  ];

  for (const candidate of candidates) {
    if (!candidate) {
      continue;
    }

    const normalized = candidate.startsWith("http") ? candidate : `https://${candidate}`;
    return normalized.replace(/\/$/, "");
  }

  return "https://eventglass.vercel.app";
}

function getInboxUrl(siteUrl: string, inboxPath: string | null) {
  if (!inboxPath) {
    return siteUrl;
  }

  return `${siteUrl}${inboxPath.startsWith("/") ? inboxPath : `/${inboxPath}`}`;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unknown delivery error";
}

async function sendEmailDelivery({
  row,
  siteUrl,
}: {
  row: DeliveryRow;
  siteUrl: string;
}) {
  const resendApiKey = process.env.RESEND_API_KEY;
  const resendFromEmail = process.env.RESEND_FROM_EMAIL;

  if (!resendApiKey || !resendFromEmail) {
    throw new Error("Missing RESEND_API_KEY or RESEND_FROM_EMAIL");
  }

  if (!row.provider_target) {
    throw new Error("Missing notification email target");
  }

  const inboxUrl = getInboxUrl(siteUrl, row.inbox_path);
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: resendFromEmail,
      to: [row.provider_target],
      subject: row.title,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
          <h2 style="margin-bottom: 12px;">${row.title}</h2>
          <p style="white-space: pre-line; margin-bottom: 16px;">${row.body}</p>
          <p style="margin-bottom: 0;">
            <a href="${inboxUrl}" style="display: inline-block; padding: 10px 16px; border-radius: 999px; background: #2563eb; color: #ffffff; text-decoration: none;">
              前往查看
            </a>
          </p>
        </div>
      `,
      text: `${row.title}\n\n${row.body}\n\n查看連結：${inboxUrl}`,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Resend delivery failed: ${errorBody}`);
  }
}

async function sendDiscordDelivery({
  row,
  siteUrl,
}: {
  row: DeliveryRow;
  siteUrl: string;
}) {
  if (!row.provider_target) {
    throw new Error("Missing Discord webhook target");
  }

  const inboxUrl = getInboxUrl(siteUrl, row.inbox_path);
  const response = await fetch(row.provider_target, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      allowed_mentions: {
        parse: [],
      },
      embeds: [
        {
          title: row.title,
          description: row.body,
          color: 3447003,
          url: inboxUrl,
          footer: {
            text: "EventGlass 通知中心",
          },
        },
      ],
      components: [
        {
          type: 1,
          components: [
            {
              type: 2,
              style: 5,
              label: "前往查看",
              url: inboxUrl,
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Discord delivery failed: ${errorBody}`);
  }
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
    const { data, error } = await supabase
      .from("notification_deliveries")
      .select(
        "id, channel, title, body, inbox_path, provider_target, payload, status, attempt_count",
      )
      .in("status", ["pending", "failed"])
      .lt("attempt_count", MAX_ATTEMPTS)
      .order("created_at", { ascending: true })
      .limit(BATCH_SIZE);

    if (error) {
      throw error;
    }

    const deliveries = (data ?? []) as DeliveryRow[];
    const siteUrl = getSiteUrl();
    const summary = {
      processed: 0,
      sent: 0,
      failed: 0,
      skipped: 0,
      siteUrl,
    };

    for (const row of deliveries) {
      const { data: claimedRow, error: claimError } = await supabase
        .from("notification_deliveries")
        .update({
          status: "processing",
          processing_started_at: new Date().toISOString(),
        })
        .eq("id", row.id)
        .eq("status", row.status)
        .select("id")
        .maybeSingle();

      if (claimError) {
        throw claimError;
      }

      if (!claimedRow) {
        summary.skipped += 1;
        continue;
      }

      summary.processed += 1;

      try {
        if (row.channel === "email") {
          await sendEmailDelivery({ row, siteUrl });
        } else if (row.channel === "discord") {
          await sendDiscordDelivery({ row, siteUrl });
        } else {
          throw new Error(`Unsupported delivery channel: ${row.channel}`);
        }

        const { error: updateError } = await supabase
          .from("notification_deliveries")
          .update({
            status: "sent",
            sent_at: new Date().toISOString(),
            attempt_count: row.attempt_count + 1,
            last_error: null,
            processing_started_at: null,
          })
          .eq("id", row.id);

        if (updateError) {
          throw updateError;
        }

        summary.sent += 1;
      } catch (error) {
        const { error: updateError } = await supabase
          .from("notification_deliveries")
          .update({
            status: "failed",
            attempt_count: row.attempt_count + 1,
            last_error: getErrorMessage(error),
            processing_started_at: null,
          })
          .eq("id", row.id);

        if (updateError) {
          throw updateError;
        }

        summary.failed += 1;
      }
    }

    return NextResponse.json({
      success: true,
      ...summary,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: getErrorMessage(error),
      },
      { status: 500 },
    );
  }
}
