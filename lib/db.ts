import crypto from "node:crypto";
import { createServerSupabaseClient } from "./auth";

export async function getEvents() {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase.from("events").select("id, title, summary, starts_at, location").order("starts_at", { ascending: true });

  if (error) {
    console.error("Failed to load events", error);
    return [];
  }

  return data ?? [];
}

export async function registerForEvent(eventId: string, userId: string) {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase.rpc("register_for_event", { p_event_id: eventId, p_user_id: userId });

  if (error) {
    throw error;
  }

  return data;
}

export async function drawBlindBox(eventId: string, userId: string) {
  const randomSeed = crypto.randomUUID();
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase.rpc("draw_blind_box", { p_event_id: eventId, p_user_id: userId, p_seed: randomSeed });

  if (error) {
    throw error;
  }

  return data;
}
