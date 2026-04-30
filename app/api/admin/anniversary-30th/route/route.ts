import { NextResponse } from "next/server";
import { createAdminSupabaseClient, createServerSupabaseClient } from "@/lib/auth";
import {
  resolveRetroForcedOutcome,
  withRetroForcedOutcomeTemplate,
  type RetroForcedOutcome,
} from "@/lib/anniversary30th";

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
  const { data: existingRoute } = await adminSupabase
    .from("anniversary_curated_routes")
    .select("force_final_top_cut, force_additional_pokemon, force_additional_price, preferred_templates")
    .eq("participant_id", participantId)
    .maybeSingle();
  const forceBattleOutcome: RetroForcedOutcome | null = "forceBattleOutcome" in payload
    ? payload.forceBattleOutcome === "win" || payload.forceBattleOutcome === "lose"
      ? payload.forceBattleOutcome
      : null
    : resolveRetroForcedOutcome(existingRoute?.preferred_templates);

  const { data: route, error } = await adminSupabase
    .from("anniversary_curated_routes")
    .upsert(
      {
        participant_id: participantId,
        force_final_top_cut: "forceFinalTopCut" in payload
          ? Boolean(payload.forceFinalTopCut)
          : Boolean(existingRoute?.force_final_top_cut),
        force_additional_pokemon: "forceAdditionalPokemon" in payload
          ? forceAdditionalPokemon
          : existingRoute?.force_additional_pokemon ?? null,
        force_additional_price: "forceAdditionalPrice" in payload
          ? Number.isFinite(forceAdditionalPrice) ? forceAdditionalPrice : null
          : existingRoute?.force_additional_price ?? null,
        preferred_templates: withRetroForcedOutcomeTemplate(
          existingRoute?.preferred_templates,
          forceBattleOutcome,
        ),
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
