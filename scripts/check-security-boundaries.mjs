import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const roots = ["app", "lib"];
const sourceExtensions = new Set([".ts", ".tsx", ".js", ".mjs"]);
const failures = [];

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...await walk(entryPath));
    } else if (sourceExtensions.has(path.extname(entry.name))) {
      files.push(entryPath);
    }
  }

  return files;
}

for (const root of roots) {
  for (const file of await walk(root)) {
    const source = await readFile(file, "utf8");
    if (source.includes(".auth.getSession(")) {
      failures.push(`${file}: server-side auth must use getUser(), not getSession()`);
    }
  }
}

const migrationPath = "supabase/migrations/20260816090000_secure_profiles_access.sql";
const migration = await readFile(migrationPath, "utf8");
const publicView = migration.match(/CREATE VIEW public\.public_profiles[\s\S]*?FROM public\.profiles;/)?.[0] || "";
const updateGrant = migration.match(/GRANT UPDATE \([\s\S]*?\) ON TABLE public\.profiles TO authenticated;/)?.[0] || "";
const sensitiveColumns = [
  "email",
  "role",
  "points",
  "lottery_tickets",
  "blindbox_coupons",
  "real_name",
  "notification_email",
  "discord_webhook_url",
  "ai_system_prompt",
  "ai_user_summary",
];
const systemManagedColumns = [
  "role",
  "points",
  "fortune_points",
  "lottery_tickets",
  "blindbox_coupons",
  "real_name_submitted_at",
  "ai_system_prompt",
  "ai_user_summary",
];

if (!publicView) failures.push(`${migrationPath}: public_profiles view not found`);
if (!updateGrant) failures.push(`${migrationPath}: profile UPDATE allow-list not found`);

for (const column of sensitiveColumns) {
  if (new RegExp(`\\b${column}\\b`).test(publicView)) {
    failures.push(`${migrationPath}: public_profiles exposes ${column}`);
  }
}

for (const column of systemManagedColumns) {
  if (new RegExp(`\\b${column}\\b`).test(updateGrant)) {
    failures.push(`${migrationPath}: authenticated users can directly update ${column}`);
  }
}

if (failures.length > 0) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log("Security boundary checks passed.");
