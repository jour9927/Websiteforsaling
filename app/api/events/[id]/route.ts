import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/auth";

type RouteContext = {
  params: { id: string };
};

export async function GET(_request: Request, context: RouteContext) {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("events")
    .select("id, title, summary, description, starts_at, location")
    .eq("id", context.params.id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  return NextResponse.json({ event: data });
}
