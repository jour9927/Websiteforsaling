import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/auth";

type PatchPayload = {
  nickname?: string;
  notification_preference?: string;
};

export async function PATCH(request: Request) {
  const supabase = createServerSupabaseClient();
  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = (await request.json().catch(() => ({}))) as PatchPayload;

  const { error } = await supabase
    .from("profiles")
    .upsert({
      id: session.user.id,
      nickname: payload.nickname,
      notification_preference: payload.notification_preference
    });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
