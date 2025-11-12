import { NextResponse } from "next/server";
import { registerForEvent } from "@/lib/db";
import { createServerSupabaseClient } from "@/lib/auth";

type RouteContext = {
  params: { id: string };
};

export async function POST(request: Request, context: RouteContext) {
  const supabase = createServerSupabaseClient();
  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload = await request.json().catch(() => ({}));
    const result = await registerForEvent(context.params.id, session.user.id);
    return NextResponse.json({ registration: result, payload });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
