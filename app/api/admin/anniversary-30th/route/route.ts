import { NextResponse } from "next/server";
import { createAdminSupabaseClient, createServerSupabaseClient } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const supabase = createServerSupabaseClient();
  const adminSupabase = createAdminSupabaseClient();
  const {
    data: { session },
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

  const payload = await request.json().catch(() => ({}));
  const participantId = typeof payload.participantId === "string" ? payload.participantId : "";

  if (!participantId) {
    return NextResponse.json({ error: "participantId is required" }, { status: 400 });
  }

  const forceAdditionalPokemon =
    typeof payload.forceAdditionalPokemon === "string" && payload.forceAdditionalPokemon.trim()
      ? payload.forceAdditionalPokemon.trim()
      : null;
  const forceAdditionalPrice =
    payload.forceAdditionalPrice === null || payload.forceAdditionalPrice === ""
      ? null
      : Number(payload.forceAdditionalPrice);

  const { data: route, error } = await adminSupabase
    .from("anniversary_curated_routes")
    .upsert(
      {
        participant_id: participantId,
        force_final_top_cut: Boolean(payload.forceFinalTopCut),
        force_additional_pokemon: forceAdditionalPokemon,
        force_additional_price: Number.isFinite(forceAdditionalPrice) ? forceAdditionalPrice : null,
        preferred_templates: [],
      },
      { onConflict: "participant_id" },
    )
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ route });
}
