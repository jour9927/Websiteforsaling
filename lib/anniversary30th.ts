// ─── 30th Anniversary Battle Event ───
// 7 days × 3 battles/day = 21 total
// 3 challenge types: dice, trivia, slots
// System guarantees real user always wins

export const ANNIVERSARY_30TH_SLUG = "guardian-trial-30th";
export const ANNIVERSARY_30TH_EVENT_TITLE = "30 週年寶可夢對決祭典";
export const ANNIVERSARY_30TH_TOTAL_DAYS = 7;
export const ANNIVERSARY_30TH_BATTLES_PER_DAY = 3;
export const ANNIVERSARY_30TH_MIN_DAILY = 1;
export const ANNIVERSARY_30TH_TOTAL_BATTLES = ANNIVERSARY_30TH_TOTAL_DAYS * ANNIVERSARY_30TH_BATTLES_PER_DAY; // 21
export const ANNIVERSARY_30TH_STARTS_AT = "2026-03-20T20:00:00+08:00";

// ─── Unlock Conditions ───
export const UNLOCK_PARTNER_CONSECUTIVE_WINS = 2; // 連贏2場 → 永久獲得伴侶
export const UNLOCK_SECOND_POKEMON_TOTAL_WINS = 5; // 總贏5場 → 第二隻相遇權

// ─── Partner Pokémon Selection Pool ───
export const PARTNER_POKEMON_POOL = [
  { id: "pikachu", name: "皮卡丘", sprite: "25", color: "#F5D442" },
  { id: "eevee", name: "伊布", sprite: "133", color: "#C4A76A" },
  { id: "charmander", name: "小火龍", sprite: "4", color: "#F08030" },
  { id: "squirtle", name: "傑尼龜", sprite: "7", color: "#6890F0" },
  { id: "bulbasaur", name: "妙蛙種子", sprite: "1", color: "#78C850" },
  { id: "jigglypuff", name: "胖丁", sprite: "39", color: "#EE99AC" },
] as const;

export type PartnerPokemonId = (typeof PARTNER_POKEMON_POOL)[number]["id"];

export function getPartnerPokemon(id: string) {
  return PARTNER_POKEMON_POOL.find((p) => p.id === id) ?? PARTNER_POKEMON_POOL[0];
}

export function getPokemonSpriteUrl(spriteId: string) {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${spriteId}.png`;
}

// ─── Virtual Opponent System ───
// 使用玩家風格暱稱，與真實用戶名無法區分
export const VIRTUAL_OPPONENTS = [
  { name: "阿翔", pokemon: "噴火龍", spriteId: "6" },
  { name: "MiYuki", pokemon: "水箭龜", spriteId: "9" },
  { name: "波波", pokemon: "鯉魚王", spriteId: "129" },
  { name: "KaitoX", pokemon: "大岩蛇", spriteId: "95" },
  { name: "小魚", pokemon: "妙蛙花", spriteId: "3" },
  { name: "BigD", pokemon: "烈咬陸鯊", spriteId: "445" },
  { name: "奶茶", pokemon: "波加曼", spriteId: "393" },
  { name: "Zack99", pokemon: "捷克羅姆", spriteId: "644" },
  { name: "嘎嘎", pokemon: "咚咚鼠", spriteId: "702" },
  { name: "Luna醬", pokemon: "六尾", spriteId: "37" },
  { name: "阿德", pokemon: "噴火龍", spriteId: "6" },
  { name: "Ryo", pokemon: "皮卡丘", spriteId: "25" },
  { name: "芒果乾", pokemon: "伊布", spriteId: "133" },
  { name: "xiao_J", pokemon: "暴鯉龍", spriteId: "130" },
  { name: "雪花", pokemon: "胖丁", spriteId: "39" },
  { name: "DarkSun", pokemon: "快龍", spriteId: "149" },
  { name: "阿肥", pokemon: "火焰雞", spriteId: "257" },
  { name: "K醬", pokemon: "路卡利歐", spriteId: "448" },
  { name: "柚子", pokemon: "沙奈朵", spriteId: "282" },
  { name: "Max_Pro", pokemon: "仙子伊布", spriteId: "700" },
  { name: "肉鬆", pokemon: "卡比獸", spriteId: "143" },
  { name: "TeddyBB", pokemon: "熊寶寶", spriteId: "216" },
  { name: "老K", pokemon: "班基拉斯", spriteId: "248" },
  { name: "阿寶", pokemon: "妙蛙種子", spriteId: "1" },
  { name: "Ray桑", pokemon: "烈空坐", spriteId: "384" },
] as const;

export function resolveVirtualOpponent(seed: string) {
  const hash = hashString(seed);
  return VIRTUAL_OPPONENTS[hash % VIRTUAL_OPPONENTS.length];
}

// ─── Challenge Types ───
export type ChallengeType = "dice" | "trivia" | "slots";

export const CHALLENGE_META: Record<ChallengeType, {
  label: string;
  description: string;
  totalRounds: number;
  winsNeeded: number;
  timeLimit: number; // seconds per round
}> = {
  dice: {
    label: "⚄ 骰子比大小",
    description: "和對手擲骰子比大小！10 戰 6 勝者獲勝。看誰運氣好！",
    totalRounds: 10,
    winsNeeded: 6,
    timeLimit: 10,
  },
  trivia: {
    label: "🧠 寶可夢常識問答",
    description: "考驗你的寶可夢知識！10 題四選一，答對最多者獲勝。",
    totalRounds: 10,
    winsNeeded: 6, // need more correct than opponent
    timeLimit: 15,
  },
  slots: {
    label: "🎰 拉霸機決鬥",
    description: "火紅葉綠風格拉霸機！3 局 2 勝，三格連線為勝！",
    totalRounds: 3,
    winsNeeded: 2,
    timeLimit: 12,
  },
};

// ─── Script Mode (A = 逆轉勝, B = 先順後逆再勝) ───
export type ScriptMode = "A" | "B";

/**
 * Generate scripted outcomes for a challenge.
 * Mode A: user loses early rounds, then makes a comeback
 * Mode B: user wins early, struggles mid, wins at end
 * Both guarantee user wins overall.
 */
export function generateScriptedOutcomes(
  challengeType: ChallengeType,
  mode: ScriptMode,
  seed: string,
): boolean[] {
  const meta = CHALLENGE_META[challengeType];
  const total = meta.totalRounds;
  const winsNeeded = meta.winsNeeded;
  const rng = createSeededRng(hashString(seed) + 1);

  if (challengeType === "trivia") {
    // For trivia: generate user correct/wrong pattern
    // Mode A: mostly wrong at start, then right → final score user > opponent
    // Mode B: right at start, wrong in middle, right at end
    return generateTriviaScript(total, mode, rng);
  }

  if (challengeType === "slots") {
    // 3 rounds, 2 wins needed
    if (mode === "A") {
      return [true, false, false]; // win first, lose last two
    } else {
      return [false, true, false]; // lose, win, lose
    }
  }

  // Dice: 10 rounds, 6 wins needed
  return generateDiceScript(total, winsNeeded, mode, rng);
}

function generateDiceScript(
  total: number,
  winsNeeded: number,
  mode: ScriptMode,
  rng: () => number,
): boolean[] {
  const results: boolean[] = [];

  // Random results
  for (let i = 0; i < total; i++) {
    results.push(rng() < 0.4); // 40% win rate per round
  }

  // Safety: guarantee player loses (wins < winsNeeded)
  let winCount = results.filter(Boolean).length;
  if (winCount >= winsNeeded) {
    for (let i = results.length - 1; i >= 0 && winCount >= winsNeeded; i--) {
      if (results[i]) {
        results[i] = false;
        winCount--;
      }
    }
  }

  return results;
}

function generateTriviaScript(
  total: number,
  mode: ScriptMode,
  rng: () => number,
): boolean[] {
  const results: boolean[] = [];

  // Random results
  for (let i = 0; i < total; i++) {
    results.push(rng() < 0.4);
  }

  // Guarant user has less than 6 correct
  let correct = results.filter(Boolean).length;
  if (correct >= 6) {
    for (let i = results.length - 1; i >= 0 && correct >= 6; i--) {
      if (results[i]) {
        results[i] = false;
        correct--;
      }
    }
  }

  return results;
}

// ─── Trivia Question Bank ───
export type TriviaQuestion = {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  category: string;
};

export const TRIVIA_QUESTIONS: TriviaQuestion[] = [
  { id: 1, question: "皮卡丘的屬性是什麼？", options: ["火", "水", "電", "草"], correctIndex: 2, category: "基礎" },
  { id: 2, question: "小火龍最終進化形態是？", options: ["火恐龍", "噴火龍", "烈焰猴", "火焰雞"], correctIndex: 1, category: "進化" },
  { id: 3, question: "第一世代有幾隻寶可夢？", options: ["100", "120", "151", "200"], correctIndex: 2, category: "圖鑑" },
  { id: 4, question: "伊布共有幾種進化形態？（截至第九世代）", options: ["6 種", "7 種", "8 種", "9 種"], correctIndex: 2, category: "進化" },
  { id: 5, question: "哪一招是皮卡丘的招牌招式？", options: ["十萬伏特", "打雷", "電擊", "瘋狂伏特"], correctIndex: 0, category: "招式" },
  { id: 6, question: "寶可夢的英文名稱 Pokémon 是什麼的縮寫？", options: ["Pocket Monster", "Pokemon Star", "Power Monster", "Pocket Magic"], correctIndex: 0, category: "常識" },
  { id: 7, question: "喵喵是哪個反派組織的寶可夢？", options: ["銀河隊", "火岩隊", "火箭隊", "等離子隊"], correctIndex: 2, category: "劇情" },
  { id: 8, question: "妙蛙種子的雙屬性是？", options: ["草/毒", "草/水", "草/地面", "草/蟲"], correctIndex: 0, category: "屬性" },
  { id: 9, question: "哪一代首次引入了 Mega 進化？", options: ["第四世代", "第五世代", "第六世代", "第七世代"], correctIndex: 2, category: "系統" },
  { id: 10, question: "卡比獸最喜歡做什麼？", options: ["戰鬥", "睡覺", "游泳", "飛行"], correctIndex: 1, category: "常識" },
  { id: 11, question: "鯉魚王進化後是？", options: ["巨翅飛魚", "暴鯉龍", "鯊魚", "水箭龜"], correctIndex: 1, category: "進化" },
  { id: 12, question: "超夢是由哪隻寶可夢的基因改造的？", options: ["皮卡丘", "夢幻", "伊布", "百變怪"], correctIndex: 1, category: "劇情" },
  { id: 13, question: "哪個屬性對龍屬性有效？", options: ["火", "水", "冰", "草"], correctIndex: 2, category: "屬性" },
  { id: 14, question: "寶可夢最多可以學會幾個招式？", options: ["2", "4", "6", "8"], correctIndex: 1, category: "系統" },
  { id: 15, question: "阿爾宙斯被稱為什麼？", options: ["夢之使者", "創世神", "時間之王", "空間之王"], correctIndex: 1, category: "常識" },
  { id: 16, question: "寶可夢紅版的封面寶可夢是？", options: ["噴火龍", "水箭龜", "妙蛙花", "皮卡丘"], correctIndex: 0, category: "歷史" },
  { id: 17, question: "木守宮最終進化形態是？", options: ["蜥蜴王", "森林蜥蜴", "木守宮", "大竺葵"], correctIndex: 0, category: "進化" },
  { id: 18, question: "火系對什麼屬性有效？", options: ["水", "岩石", "草", "電"], correctIndex: 2, category: "屬性" },
  { id: 19, question: "哪個地區是第一世代的舞台？", options: ["豐緣", "城都", "關都", "神奧"], correctIndex: 2, category: "地區" },
  { id: 20, question: "旋轉球的英文名是？", options: ["Ultra Ball", "Great Ball", "Spin Ball", "Premier Ball"], correctIndex: 3, category: "道具" },
  { id: 21, question: "百變怪的特殊能力是？", options: ["飛行", "變身", "隱身", "透視"], correctIndex: 1, category: "特性" },
  { id: 22, question: "可達鴨頭痛時會使用什麼力量？", options: ["超能力", "火焰", "電力", "念力"], correctIndex: 0, category: "常識" },
  { id: 23, question: "第二世代新增了什麼屬性？", options: ["妖精和暗", "鋼和暗", "龍和冰", "飛行和蟲"], correctIndex: 1, category: "系統" },
  { id: 24, question: "皮卡丘在動畫中屬於誰的寶可夢？", options: ["小茂", "小智", "小霞", "小剛"], correctIndex: 1, category: "動畫" },
  { id: 25, question: "月亮球最適合捕捉什麼？", options: ["月亮石進化的寶可夢", "夜行性寶可夢", "飛行系寶可夢", "水系寶可夢"], correctIndex: 0, category: "道具" },
  { id: 26, question: "鬼斯通是什麼屬性？", options: ["鬼/毒", "暗/鬼", "鬼/超能力", "毒/暗"], correctIndex: 0, category: "屬性" },
  { id: 27, question: "寶可夢中心可以做什麼？", options: ["購買道具", "免費治療寶可夢", "捕捉寶可夢", "訓練寶可夢"], correctIndex: 1, category: "常識" },
  { id: 28, question: "六尾（阿羅拉形態）是什麼屬性？", options: ["火", "冰", "水", "仙"], correctIndex: 1, category: "屬性" },
  { id: 29, question: "呆呆獸進化成呆殼獸需要什麼？", options: ["水之石", "大舌貝咬住尾巴", "升級", "通信交換"], correctIndex: 1, category: "進化" },
  { id: 30, question: "寶可夢總共有多少種屬性？", options: ["15", "16", "17", "18"], correctIndex: 3, category: "系統" },
  { id: 31, question: "閃光寶可夢的出現機率大約是？", options: ["1/100", "1/512", "1/4096", "1/8192"], correctIndex: 2, category: "系統" },
  { id: 32, question: "哪隻寶可夢被稱為「不敗冠軍」？", options: ["阿馴的烈咬陸鯊", "丹帝的噴火龍", "赤的皮卡丘", "大吾的巨金怪"], correctIndex: 1, category: "動畫" },
  { id: 33, question: "寶可夢劍盾的地區名稱是？", options: ["帕底亞", "伽勒爾", "阿羅拉", "卡洛斯"], correctIndex: 1, category: "地區" },
  { id: 34, question: "哪一招可以讓速度最慢的寶可夢先攻？", options: ["電光一閃", "欺騙空間", "保護", "高速移動"], correctIndex: 1, category: "招式" },
  { id: 35, question: "伊布進化成太陽伊布需要什麼條件？", options: ["使用日之石", "白天高親密度升級", "使用雷之石", "晚上高親密度升級"], correctIndex: 1, category: "進化" },
  { id: 36, question: "多邊獸最終進化是？", options: ["多邊獸 II", "多邊獸 Z", "多邊獸 X", "多邊獸 3D"], correctIndex: 1, category: "進化" },
  { id: 37, question: "瑪夏多的隱藏特性是？", options: ["技術高手", "散氣", "變幻自如", "鐵拳"], correctIndex: 0, category: "特性" },
  { id: 38, question: "太陽與月亮的傳說寶可夢是？", options: ["哲爾尼亞斯和伊裴爾塔爾", "索爾迦雷歐和露奈雅拉", "帝牙盧卡和帕路奇亞", "萊希拉姆和捷克羅姆"], correctIndex: 1, category: "傳說" },
  { id: 39, question: "化石翼龍是什麼屬性？", options: ["岩石/飛行", "岩石/龍", "飛行/龍", "岩石/地面"], correctIndex: 0, category: "屬性" },
  { id: 40, question: "最初的御三家組合是？", options: ["火/水/草", "電/水/草", "火/水/地面", "火/草/冰"], correctIndex: 0, category: "常識" },
  { id: 41, question: "黏美龍是什麼屬性的寶可夢？", options: ["水", "龍", "毒", "草"], correctIndex: 1, category: "屬性" },
  { id: 42, question: "誰是動畫中火箭隊的老大？", options: ["武藏", "小次郎", "坂木", "阿波羅"], correctIndex: 2, category: "動畫" },
  { id: 43, question: "寶可夢世界中的貨幣單位是？", options: ["圓", "金幣", "寶可幣", "水晶"], correctIndex: 2, category: "常識" },
  { id: 44, question: "妖精屬性是在第幾世代加入的？", options: ["第四世代", "第五世代", "第六世代", "第七世代"], correctIndex: 2, category: "系統" },
  { id: 45, question: "快龍進化前是什麼？", options: ["迷你龍", "哈克龍", "暴飛龍", "鯉魚王"], correctIndex: 1, category: "進化" },
  { id: 46, question: "哪隻寶可夢能在水面上行走？", options: ["暴鯉龍", "蚊香蝌蚪", "蓮帽小童", "拉普拉斯"], correctIndex: 2, category: "常識" },
  { id: 47, question: "寶可夢鑽石珍珠的地區是？", options: ["豐緣", "神奧", "合眾", "城都"], correctIndex: 1, category: "地區" },
  { id: 48, question: "火焰雞是哪個地區的火系御三家最終進化？", options: ["關都", "城都", "豐緣", "神奧"], correctIndex: 2, category: "進化" },
  { id: 49, question: "代歐奇希斯有幾種形態？", options: ["2 種", "3 種", "4 種", "5 種"], correctIndex: 2, category: "傳說" },
  { id: 50, question: "太晶化是哪一世代的新機制？", options: ["第七世代", "第八世代", "第九世代", "第六世代"], correctIndex: 2, category: "系統" },
];

export function pickTriviaQuestions(seed: string, count = 10): TriviaQuestion[] {
  const rng = createSeededRng(hashString(seed));
  const shuffled = [...TRIVIA_QUESTIONS].sort(() => rng() - 0.5);
  return shuffled.slice(0, count);
}

// ─── Slot Machine (FRLG Style) ───
export type SlotSymbol = "7" | "R" | "PIKA" | "PSY" | "MAG" | "SHELL" | "CHERRY";

export const SLOT_FACES: SlotSymbol[] = ["7", "R", "PIKA", "PSY", "MAG", "SHELL", "CHERRY"];

export const SLOT_FACE_META: Record<SlotSymbol, { glyph: string; label: string; tone: string }> = {
  "7": { glyph: "7", label: "SEVEN", tone: "from-amber-300/45 to-orange-400/35" },
  R: { glyph: "R", label: "ROCKET", tone: "from-rose-500/45 to-red-600/30" },
  PIKA: { glyph: "⚡", label: "PIKA", tone: "from-yellow-300/45 to-amber-400/30" },
  PSY: { glyph: "🦆", label: "PSY", tone: "from-cyan-300/45 to-sky-400/30" },
  MAG: { glyph: "🧲", label: "MAG", tone: "from-slate-300/40 to-zinc-400/30" },
  SHELL: { glyph: "🐚", label: "SHELL", tone: "from-violet-300/40 to-indigo-400/30" },
  CHERRY: { glyph: "🍒", label: "CHERRY", tone: "from-pink-300/40 to-rose-400/30" },
};

/**
 * Generate slot result. If shouldWin=true, produce a matching line.
 */
export function generateSlotResult(shouldWin: boolean, seed: string): SlotSymbol[] {
  const rng = createSeededRng(hashString(seed));

  if (shouldWin) {
    // Pick a matching triple
    const winningSymbol = SLOT_FACES[Math.floor(rng() * SLOT_FACES.length)];
    return [winningSymbol, winningSymbol, winningSymbol];
  }

  // Generate non-matching
  let reels: SlotSymbol[];
  do {
    reels = [
      SLOT_FACES[Math.floor(rng() * SLOT_FACES.length)],
      SLOT_FACES[Math.floor(rng() * SLOT_FACES.length)],
      SLOT_FACES[Math.floor(rng() * SLOT_FACES.length)],
    ];
  } while (reels[0] === reels[1] && reels[1] === reels[2]);

  return reels;
}

export function isSlotWin(reels: SlotSymbol[]): boolean {
  return reels.length === 3 && reels[0] === reels[1] && reels[1] === reels[2];
}

// ─── Dice Game ───
export type DiceRoll = {
  playerDice: number;
  opponentDice: number;
  playerWins: boolean;
};

export function generateDiceRoll(shouldPlayerWin: boolean, seed: string): DiceRoll {
  const rng = createSeededRng(hashString(seed));
  const playerDice = 1 + Math.floor(rng() * 6);
  let opponentDice = 1 + Math.floor(rng() * 6);

  if (shouldPlayerWin) {
    // Ensure player wins
    if (opponentDice >= playerDice) {
      opponentDice = Math.max(1, playerDice - (1 + Math.floor(rng() * 2)));
    }
  } else {
    // Ensure opponent wins
    if (opponentDice <= playerDice) {
      opponentDice = Math.min(6, playerDice + (1 + Math.floor(rng() * 2)));
    }
  }

  return {
    playerDice,
    opponentDice,
    playerWins: playerDice > opponentDice,
  };
}

// ─── Types ───
export type AnniversaryCampaign = {
  id: string;
  slug: string;
  event_id: string | null;
  title: string;
  description: string | null;
  starts_at: string | null;
  ends_at: string | null;
  total_days: number;
  battles_per_day: number;
  top_cut: number;
  entry_fee: number;
  additional_fee: number;
  status: "draft" | "active" | "ended";
};

export type AnniversaryParticipant = {
  id: string;
  campaign_id: string;
  user_id: string;
  target_pokemon: string;
  partner_pokemon: string | null;
  entry_fee_amount: number;
  entry_fee_paid_at: string;
  current_rank: number | null;
  best_rank: number | null;
  final_rank: number | null;
  total_battles_used: number;
  today_battles_used: number;
  last_battle_day: string | null;
  has_entered_top_cut: boolean;
  total_wins: number;
  win_streak: number;
  max_win_streak: number;
  partner_unlocked: boolean;
  second_pokemon_unlocked: boolean;
  created_at: string;
};

export type AnniversaryContract = {
  id: string;
  participant_id: string;
  contract_type: "main" | "additional";
  pokemon_name: string | null;
  price: number;
  payment_record_id: string | null;
  delivery_record_id: string | null;
  status:
    | "pending"
    | "holding"
    | "unlocked"
    | "priced"
    | "secured"
    | "paid"
    | "delivered"
    | "refunded"
    | "forfeited";
  revealed_at: string | null;
  paid_at: string | null;
  delivered_at: string | null;
  refunded_at?: string | null;
  notes: string | null;
};

export type AnniversaryBattle = {
  id: string;
  participant_id: string;
  battle_day: number;
  battle_no: number;
  challenge_type: ChallengeType;
  script_mode: ScriptMode;
  scripted_outcomes: boolean[]; // JSON array in DB
  opponent_name: string;
  opponent_pokemon: string;
  opponent_sprite_id: string;
  status: "pending" | "in_progress" | "won" | "lost";
  current_round: number;
  player_score: number;
  opponent_score: number;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
};

export type AnniversaryBattleRound = {
  id: string;
  battle_id: string;
  round_no: number;
  round_result: "win" | "lose" | null;
  payload: Record<string, unknown>;
  created_at: string;
};

// ─── Utility Functions ───
export function hashString(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) % 2147483647;
  }
  return Math.abs(hash);
}

function createSeededRng(seed: number) {
  let state = seed % 2147483647;
  if (state <= 0) state += 2147483646;
  return () => {
    state = (state * 48271) % 2147483647;
    return state / 2147483647;
  };
}

export function resolveTaipeiDateKey(date = new Date()) {
  // Shift by 20 hours so that a new day begins at 20:00
  const shiftedDate = new Date(date.getTime() - 20 * 60 * 60 * 1000);
  const formatted = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(shiftedDate);
  return `${formatted}-v2`;
}

export function resolveBattlesRemaining(
  participant: AnniversaryParticipant | null,
  battlesPerDay: number,
): number {
  if (!participant) return battlesPerDay;
  const todayKey = resolveTaipeiDateKey();
  if (participant.last_battle_day !== todayKey) {
    return battlesPerDay;
  }
  return Math.max(0, battlesPerDay - participant.today_battles_used);
}

export function formatDateRange(startsAt: string | null, endsAt: string | null) {
  if (!startsAt || !endsAt) return "活動時間待設定";
  const start = new Date(startsAt).toLocaleDateString("zh-TW");
  const end = new Date(endsAt).toLocaleDateString("zh-TW");
  return `${start} - ${end}`;
}

export function isEventStarted(startsAt: string | null): boolean {
  if (!startsAt) return false;
  return new Date() >= new Date(startsAt);
}

export function getCountdownTo(targetDate: string): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isStarted: boolean;
} {
  const now = new Date();
  const target = new Date(targetDate);
  const diff = target.getTime() - now.getTime();

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isStarted: true };
  }

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    isStarted: false,
  };
}

export function resolveNarrativeBattleDay(
  totalBattlesUsed: number,
  battlesPerDay: number,
  totalDays: number,
): number {
  return Math.min(totalDays, Math.floor(totalBattlesUsed / battlesPerDay) + 1);
}

export function getContractByType(contracts: AnniversaryContract[], contractType: "main" | "additional") {
  return contracts.find((contract) => contract.contract_type === contractType) ?? null;
}

export function isMainContractSecuredStatus(status: AnniversaryContract["status"] | null | undefined) {
  return status === "secured" || status === "paid" || status === "delivered";
}

// ─── Old compat exports ───
export const ANNIVERSARY_30TH_TOTAL_ROUNDS = 7;
export const ANNIVERSARY_30TH_TUG_MIN = -4;
export const ANNIVERSARY_30TH_TUG_MAX = 4;

export const defaultCampaignCopy = {
  title: "30 週年寶可夢對決祭典",
  subtitle: "選擇你的夥伴寶可夢，在七天對決中並肩作戰！",
};

export type AnniversaryRevealState = {
  id?: string;
  participant_id: string;
  additional_unlocked_at: string | null;
  revealed_pokemon: string | null;
  price_resolved: number | null;
  price_resolved_at: string | null;
};

export type AnniversaryCuratedRoute = {
  participant_id: string;
  force_final_top_cut: boolean;
  force_additional_pokemon: string | null;
  force_additional_price: number | null;
  preferred_templates: string[];
};

export type AnniversaryBattleRoundPayload = Record<string, unknown>;
