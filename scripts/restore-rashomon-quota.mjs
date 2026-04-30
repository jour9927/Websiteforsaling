import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const env = readFileSync(join(__dirname, "..", ".env.local"), "utf8");
const get = (k) => env.split("\n").find((l) => l.startsWith(k + "="))?.split("=").slice(1).join("=").trim().replace(/^["']|["']$/g, "");

const supabase = createClient(get("NEXT_PUBLIC_SUPABASE_URL"), get("SUPABASE_SERVICE_ROLE_KEY"), { auth: { persistSession: false } });

const PARTICIPANT_ID = "edfd4067-92c7-4272-a4b5-827c6faa3548"; // 蘿生門 / kotori940803

const { data: pBefore } = await supabase
  .from("anniversary_participants")
  .select("id, today_battles_used, total_battles_used, last_battle_day, total_wins, win_streak")
  .eq("id", PARTICIPANT_ID).maybeSingle();
console.log("BEFORE:", pBefore);

const { data: inFlight } = await supabase
  .from("anniversary_battles")
  .select("id, status, started_at")
  .eq("participant_id", PARTICIPANT_ID)
  .in("status", ["pending", "in_progress"]);
console.log("in-progress battles:", inFlight);
if (inFlight?.length) {
  console.log("⚠️ 有 in-progress 場次，先不動。請手動處理或等他結束。");
  process.exit(1);
}

// 把 last_battle_day 退到昨天 → SSR + start API 都會視為「跨日」自動 reset today=0
const yesterday = "2026-04-25";
const { data: pAfter, error } = await supabase
  .from("anniversary_participants")
  .update({ today_battles_used: 0, last_battle_day: yesterday })
  .eq("id", PARTICIPANT_ID)
  .select("id, today_battles_used, total_battles_used, last_battle_day, total_wins, win_streak")
  .single();

if (error) { console.error("UPDATE ERROR:", error); process.exit(1); }
console.log("AFTER:", pAfter);
console.log("✓ 已清 today 額度。total_battles_used / total_wins / win_streak 未動。");
