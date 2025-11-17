import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/auth";

export const dynamic = "force-dynamic";

const ALLOWED_STATUSES = ["confirmed", "cancelled"] as const;
type AllowedStatus = (typeof ALLOWED_STATUSES)[number];

type RouteContext = {
  params: { id: string };
};

export async function PATCH(request: Request, context: RouteContext) {
  const supabase = createServerSupabaseClient();
  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", session.user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let payload: { status?: string } = {};
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const requestedStatus = payload.status as AllowedStatus | undefined;

  if (!requestedStatus || !ALLOWED_STATUSES.includes(requestedStatus)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("registrations")
    .update({ status: requestedStatus })
    .eq("id", context.params.id)
    .select("id, status, updated_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: error.status ?? 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Registration not found" }, { status: 404 });
  }

  return NextResponse.json({ registration: data });
}
