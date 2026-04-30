import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const env = readFileSync(join(__dirname, "..", ".env.local"), "utf8");
const get = (k) => env.split("\n").find((l) => l.startsWith(k + "="))?.split("=").slice(1).join("=").trim().replace(/^["']|["']$/g, "");
const supabase = createClient(get("NEXT_PUBLIC_SUPABASE_URL"), get("SUPABASE_SERVICE_ROLE_KEY"), { auth: { persistSession: false } });

const SLUG = "random-distribution-eevee-2026";

const { data: campaign } = await supabase.from("anniversary_campaigns").select("id").eq("slug", SLUG).maybeSingle();

const { data: parts } = await supabase
  .from("anniversary_participants")
  .select("id, user_id, total_battles_used, today_battles_used, total_wins, win_streak")
  .eq("campaign_id", campaign.id);

const participantIds = parts.map(p => p.id);

// 全部 battles，依 status 分組
const { data: allBattles } = await supabase
  .from("anniversary_battles")
  .select("participant_id, status")
  .in("participant_id", participantIds);

const statusCounts = {};
for (const b of allBattles) statusCounts[b.status] = (statusCounts[b.status] || 0) + 1;
console.log("\n所有 battles 依 status 分佈：");
console.log(statusCounts);
console.log(`合計：${allBattles.length} 場`);

// 每位玩家的 total_battles_used 對照實際 battles
const profileIds = parts.map(p => p.user_id);
const { data: profs } = await supabase.from("profiles").select("id, full_name, username").in("id", profileIds);
const pmap = Object.fromEntries(profs.map(p => [p.id, p]));

const perPart = {};
for (const b of allBattles) {
  const k = b.participant_id;
  if (!perPart[k]) perPart[k] = { won: 0, lost: 0, in_progress: 0, pending: 0, other: 0 };
  if (perPart[k][b.status] !== undefined) perPart[k][b.status]++;
  else perPart[k].other++;
}

console.log("\n=== 每位玩家 total_battles_used vs 實際 battles ===");
console.log("name | total_used | won+lost(已完成顯示) | in_progress | pending | total_actual | mismatch?");
for (const p of parts) {
  const c = perPart[p.id] || { won: 0, lost: 0, in_progress: 0, pending: 0, other: 0 };
  const completed = c.won + c.lost;
  const totalActual = c.won + c.lost + c.in_progress + c.pending + c.other;
  const pr = pmap[p.user_id] || {};
  const name = pr.full_name || pr.username || p.user_id.slice(0, 8);
  const mismatch = (p.total_battles_used !== totalActual) || (completed !== totalActual);
  console.log(`${name.padEnd(12)} | ${String(p.total_battles_used).padStart(3)} | ${String(completed).padStart(3)} (won=${c.won} lost=${c.lost}) | ${c.in_progress} | ${c.pending} | ${totalActual} | ${mismatch ? "⚠️ YES" : "OK"}`);
}
