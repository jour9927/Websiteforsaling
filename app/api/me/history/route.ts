import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/auth";

export async function GET() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user: verifiedUser },
  } = await supabase.auth.getUser();
  const session = verifiedUser ? { user: verifiedUser } : null;

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("registrations")
    .select("id, status, reward, updated_at, events(title)")
    .eq("user_id", session.user.id)
    .order("updated_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ history: data ?? [] });
}
