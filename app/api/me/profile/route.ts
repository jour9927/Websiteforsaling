import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/auth";

type PatchPayload = {
  notification_preference?: string;
};

const NOTIFICATION_PREFERENCES = new Set(["site_only", "site_email", "site_discord", "all"]);

export async function PATCH(request: Request) {
  const supabase = createServerSupabaseClient();
  const {
    data: { user: verifiedUser },
  } = await supabase.auth.getUser();
  const session = verifiedUser ? { user: verifiedUser } : null;

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = (await request.json().catch(() => ({}))) as PatchPayload;

  if (!payload.notification_preference || !NOTIFICATION_PREFERENCES.has(payload.notification_preference)) {
    return NextResponse.json({ error: "Invalid notification preference" }, { status: 400 });
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      notification_preference: payload.notification_preference
    })
    .eq("id", session.user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
