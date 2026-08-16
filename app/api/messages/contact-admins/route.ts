import { NextResponse } from "next/server";
import { createAdminSupabaseClient, createServerSupabaseClient } from "@/lib/auth";

const MAX_SUBJECT_LENGTH = 160;
const MAX_BODY_LENGTH = 5000;

export async function POST(request: Request) {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json().catch(() => null);
  const subject = typeof payload?.subject === "string" ? payload.subject.trim() : "";
  const body = typeof payload?.body === "string" ? payload.body.trim() : "";

  if (!subject || !body || subject.length > MAX_SUBJECT_LENGTH || body.length > MAX_BODY_LENGTH) {
    return NextResponse.json({ error: "Invalid message" }, { status: 400 });
  }

  const adminSupabase = createAdminSupabaseClient();
  const { data: admins, error: adminError } = await adminSupabase
    .from("profiles")
    .select("id")
    .eq("role", "admin");

  if (adminError) {
    return NextResponse.json({ error: "Unable to find recipients" }, { status: 500 });
  }

  if (!admins || admins.length === 0) {
    return NextResponse.json({ error: "No recipients" }, { status: 503 });
  }

  const { error: insertError } = await adminSupabase.from("messages").insert(
    admins.map((admin) => ({
      sender_id: user.id,
      recipient_id: admin.id,
      subject,
      body,
    })),
  );

  if (insertError) {
    return NextResponse.json({ error: "Unable to send message" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
