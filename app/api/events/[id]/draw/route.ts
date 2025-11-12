import { NextResponse } from "next/server";
import { drawBlindBox } from "@/lib/db";
import { createServerSupabaseClient } from "@/lib/auth";

type RouteContext = {
  params: { id: string };
};

export async function POST(_request: Request, context: RouteContext) {
  const supabase = createServerSupabaseClient();
  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await drawBlindBox(context.params.id, session.user.id);
    return NextResponse.json({ draw: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
