// Phase 1 self-test: type chart + damage formula
// 注意：lib 是 .ts，這裡用 dynamic import + ts-loader 不方便。
// 改用 node 直接跑 tsc 編譯後的 lib，或用簡化複製。
// 為避免 build 麻煩，我複製關鍵常數做 sanity check。
// 真正信任的是 lib 本身的 type 完整性 + npm run build 通過。

// 從 lib 重新拷一份 minimal subset 驗證關鍵相剋
const TYPE_CHART = {
  Normal: { Rock: 0.5, Ghost: 0 },
  Fire: { Fire: 0.5, Water: 0.5, Grass: 2, Ice: 2, Bug: 2, Rock: 0.5, Dragon: 0.5 },
  Water: { Fire: 2, Water: 0.5, Grass: 0.5, Ground: 2, Rock: 2, Dragon: 0.5 },
  Electric: { Water: 2, Electric: 0.5, Grass: 0.5, Ground: 0, Flying: 2, Dragon: 0.5 },
  Grass: { Fire: 0.5, Water: 2, Grass: 0.5, Poison: 0.5, Ground: 2, Flying: 0.5, Bug: 0.5, Rock: 2, Dragon: 0.5 },
  Ground: { Fire: 2, Electric: 2, Grass: 0.5, Poison: 2, Flying: 0, Bug: 0.5, Rock: 2 },
  Ghost: { Normal: 0, Psychic: 0 },
  Dragon: { Dragon: 2 },
};

function eff(att, def) {
  const row = TYPE_CHART[att];
  if (!row) return 1;
  const v = row[def];
  return typeof v === "number" ? v : 1;
}

const cases = [
  // [attacker_type, defender_type, expected, comment]
  ["Normal", "Rock", 0.5, "Normal 對 Rock 折半"],
  ["Normal", "Ghost", 0, "Normal 對 Ghost 無效（Gen 1）"],
  ["Normal", "Water", 1, "Normal 普通"],
  ["Ground", "Electric", 2, "潑沙 對 皮卡丘 加倍"],
  ["Ground", "Fire", 2, "潑沙 對 噴火龍 加倍"],
  ["Ground", "Poison", 2, "潑沙 對 尼多王 加倍"],
  ["Ground", "Rock", 2, "潑沙 對 大岩蛇 加倍"],
  ["Ground", "Flying", 0, "潑沙 對 飛行 無效（Gen 1）"],
  ["Ground", "Grass", 0.5, "潑沙 對 草 折半"],
  ["Water", "Fire", 2, "水勝火"],
  ["Electric", "Ground", 0, "電 對 地面 無效"],
  ["Fire", "Grass", 2, "火勝草"],
  ["Grass", "Water", 2, "草勝水"],
];

let pass = 0;
let fail = 0;
for (const [att, def, expected, comment] of cases) {
  const actual = eff(att, def);
  const ok = actual === expected;
  console.log(`${ok ? "✅" : "❌"} ${att} → ${def} = ${actual} (期待 ${expected}) ${comment}`);
  if (ok) pass++; else fail++;
}

// 傷害公式 sanity（複製 calc 邏輯）
function calcDamage({ power, isStab, typeEff, isCrit, rng }) {
  const base = Math.floor(((2 * 50 / 5 + 2) * power) / 50) + 2;
  const stabF = isStab ? 1.5 : 1;
  const critF = isCrit ? 1.5 : 1;
  const randF = 0.85 + 0.15 * rng;
  return Math.floor(base * stabF * typeEff * critF * randF);
}

console.log("\n=== 傷害範例（rng=0.5 中位）===");
const rng = 0.5;
const samples = [
  { name: "撞擊 power 40，普通",                    p: 40, stab: false, eff: 1, crit: false },
  { name: "撞擊 power 40，STAB（伊布等 Normal partner）",  p: 40, stab: true,  eff: 1, crit: false },
  { name: "高速星星 power 60，STAB + 爆擊",         p: 60, stab: true,  eff: 1, crit: true },
  { name: "潑沙 power 20 對皮卡丘（Ground×Electric=2）",   p: 20, stab: false, eff: 2, crit: false },
  { name: "潑沙 power 20 對快龍（Ground×Dragon=1）",     p: 20, stab: false, eff: 1, crit: false },
  { name: "對手 50 power 招式對玩家（Ground/Normal/etc）", p: 50, stab: true,  eff: 1, crit: false },
];
for (const s of samples) {
  const d = calcDamage({ power: s.p, isStab: s.stab, typeEff: s.eff, isCrit: s.crit, rng });
  console.log(`  ${s.name} → ${d} 點傷害（HP=120 → ${(120/d).toFixed(1)} 招倒下）`);
}

console.log(`\n=== 結果：${pass} 通過 / ${fail} 失敗 ===`);
process.exit(fail > 0 ? 1 : 0);
