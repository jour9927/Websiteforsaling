import { NextResponse } from "next/server";
import { createAdminSupabaseClient, createServerSupabaseClient } from "@/lib/auth";
import { ANNIVERSARY_30TH_SLUG } from "@/lib/anniversary30th";

export const dynamic = "force-dynamic";

export async function GET() {
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

  const { data: campaign } = await adminSupabase
    .from("anniversary_campaigns")
    .select("id, event_id, slug, title")
    .eq("slug", ANNIVERSARY_30TH_SLUG)
    .maybeSingle();

  if (!campaign) {
    return NextResponse.json({ participants: [] });
  }

  const { data: participants } = await adminSupabase
    .from("anniversary_participants")
    .select("*")
    .eq("campaign_id", campaign.id)
    .order("created_at", { ascending: false });

  if (!participants || participants.length === 0) {
    return NextResponse.json({ participants: [] });
  }

  const userIds = participants.map((participant) => participant.user_id);

  const { data: profiles } = await adminSupabase
    .from("profiles")
    .select("id, full_name, email")
    .in("id", userIds);

  const profileMap = new Map((profiles || []).map((entry) => [entry.id, entry]));

  const normalizedParticipants = participants.map((participant) => {
    return {
      participant,
      profile: profileMap.get(participant.user_id) || null,
    };
  });

  return NextResponse.json({
    campaign,
    participants: normalizedParticipants,
  });
}
