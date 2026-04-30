import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const env = readFileSync(join(__dirname, "..", ".env.local"), "utf8");
const get = (k) => env.split("\n").find((l) => l.startsWith(k + "="))?.split("=").slice(1).join("=").trim().replace(/^["']|["']$/g, "");

const url = get("NEXT_PUBLIC_SUPABASE_URL");
const key = get("SUPABASE_SERVICE_ROLE_KEY");
const supabase = createClient(url, key, { auth: { persistSession: false } });

const NAME = process.argv[2] || "羅生門";
const SLUG = "random-distribution-eevee-2026";

const taipeiKey = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Taipei", year: "numeric", month: "2-digit", day: "2-digit",
}).format(new Date());
console.log(`今日台北 todayKey = ${taipeiKey}`);

const { data: profiles } = await supabase
  .from("profiles")
  .select("id, username, full_name, email")
  .or(`username.eq.${NAME},full_name.eq.${NAME}`);

if (!profiles?.length) {
  console.log(`找不到 username/full_name = "${NAME}" 的使用者`);
  // 列 profiles 欄位
  const { data: oneProfile } = await supabase.from("profiles").select("*").limit(1);
  console.log("profiles 欄位:", oneProfile?.[0] ? Object.keys(oneProfile[0]) : "(empty)");
  // 模糊
  const { data: like } = await supabase
    .from("profiles")
    .select("id, username, full_name")
    .or(`username.ilike.%${NAME}%,full_name.ilike.%${NAME}%,username.ilike.%rashomon%,full_name.ilike.%rashomon%`)
    .limit(20);
  console.log("模糊比對：", like);
  // 列最近報名 anniversary 的所有 participant + 他們的 profile
  const { data: cmp } = await supabase.from("anniversary_campaigns").select("id").eq("slug", SLUG).maybeSingle();
  const { data: parts } = await supabase
    .from("anniversary_participants")
    .select("user_id, today_battles_used, total_battles_used, last_battle_day, created_at")
    .eq("campaign_id", cmp.id)
    .order("created_at", { ascending: false }).limit(30);
  const userIds = parts.map(p => p.user_id);
  const { data: profs } = await supabase.from("profiles").select("id, username, full_name").in("id", userIds);
  const map = Object.fromEntries(profs.map(p => [p.id, p]));
  console.log("\n所有 30 週年活動報名者：");
  parts.forEach(p => {
    const pr = map[p.user_id] || {};
    console.log(`  - ${pr.full_name || ""} / ${pr.username || ""} (uid=${p.user_id.slice(0,8)}) today=${p.today_battles_used} total=${p.total_battles_used} last=${p.last_battle_day}`);
  });
  process.exit(0);
}

const { data: campaign } = await supabase
  .from("anniversary_campaigns").select("id, battles_per_day").eq("slug", SLUG).maybeSingle();
console.log(`campaign.battles_per_day = ${campaign?.battles_per_day}`);

for (const p of profiles) {
  console.log("\n=== 使用者 ===");
  console.log(p);
  const { data: part } = await supabase
    .from("anniversary_participants")
    .select("id, today_battles_used, total_battles_used, last_battle_day, total_wins, win_streak, partner_pokemon, partner_unlocked, created_at")
    .eq("campaign_id", campaign.id).eq("user_id", p.id).maybeSingle();
  if (!part) { console.log("尚未報名 anniversary_participants"); continue; }
  console.log("participant:", part);
  const fresh = part.last_battle_day !== taipeiKey;
  const remaining = fresh ? campaign.battles_per_day : Math.max(0, campaign.battles_per_day - part.today_battles_used);
  console.log(`>>> 預期 battlesRemaining = ${remaining} (${fresh ? "跨日 reset" : "同日扣場"})`);

  const { data: recent } = await supabase
    .from("anniversary_battles")
    .select("id, status, battle_day, battle_no, started_at, ended_at, last_active_at, player_score, opponent_score")
    .eq("participant_id", part.id).order("started_at", { ascending: false }).limit(5);
  console.log("近 5 場 battles:", recent);
}
