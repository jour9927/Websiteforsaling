import { NextResponse } from "next/server";
import { createAdminSupabaseClient, createServerSupabaseClient } from "@/lib/auth";
import {
  ANNIVERSARY_30TH_SLUG,
  CHALLENGE_META,
  UNLOCK_PARTNER_CONSECUTIVE_WINS,
  UNLOCK_SECOND_POKEMON_TOTAL_WINS,
  UNLOCK_TITLE_TOTAL_WINS,
  UNLOCK_THIRD_POKEMON_TOTAL_WINS,
  UNLOCK_MASTER_BALL_TOTAL_WINS,
  UNLOCK_LEGENDARY_TOTAL_WINS,
  generateDiceRoll,
  generateSlotResult,
  isBattleSessionExpired,
  pickTriviaQuestions,
  type AnniversaryBattle,
  type AnniversaryCampaign,
  type AnniversaryParticipant,
  type ChallengeType,
} from "@/lib/anniversary30th";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const supabase = createServerSupabaseClient();
  const adminSupabase = createAdminSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const battleId = typeof body.battleId === "string" ? body.battleId : "";
  const roundNo = Number(body.roundNo);

  if (!battleId || !Number.isInteger(roundNo) || roundNo <= 0) {
    return NextResponse.json({ error: "battleId 和 roundNo 必填。" }, { status: 400 });
  }

  // Load campaign + participant + battle
  const { data: campaignData } = await supabase
    .from("anniversary_campaigns")
    .select("*")
    .eq("slug", ANNIVERSARY_30TH_SLUG)
    .maybeSingle();

  const campaign = (campaignData || null) as AnniversaryCampaign | null;
  if (!campaign) {
    return NextResponse.json({ error: "活動未建立。" }, { status: 503 });
  }

  const { data: participantData } = await supabase
    .from("anniversary_participants")
    .select("*")
    .eq("campaign_id", campaign.id)
    .eq("user_id", session.user.id)
    .maybeSingle();

  const participant = (participantData || null) as AnniversaryParticipant | null;
  if (!participant) {
    return NextResponse.json({ error: "找不到參戰資料。" }, { status: 404 });
  }

  const { data: battleData } = await adminSupabase
    .from("anniversary_battles")
    .select("*")
    .eq("id", battleId)
    .eq("participant_id", participant.id)
    .maybeSingle();

  const battle = (battleData || null) as AnniversaryBattle | null;
  if (!battle) {
    return NextResponse.json({ error: "找不到這場對決。" }, { status: 404 });
  }

  if (battle.status === "won" || battle.status === "lost") {
    return NextResponse.json({ error: "這場對決已結束。" }, { status: 409 });
  }

  const now = new Date().toISOString();

  if (isBattleSessionExpired(battle.last_active_at || battle.started_at)) {
    await adminSupabase
      .from("anniversary_battles")
      .update({
        status: "lost",
        last_active_at: now,
        ended_at: now,
      })
      .eq("id", battle.id);

    return NextResponse.json({
      error: "這場對決已逾時，已自動結束，無法繼續。",
      battleExpired: true,
    }, { status: 409 });
  }

  const challengeType = battle.challenge_type as ChallengeType;
  const meta = CHALLENGE_META[challengeType];

  // Parse scripted outcomes
  let scriptedOutcomes: boolean[];
  try {
    scriptedOutcomes = typeof battle.scripted_outcomes === "string"
      ? JSON.parse(battle.scripted_outcomes)
      : battle.scripted_outcomes as unknown as boolean[];
  } catch {
    scriptedOutcomes = [];
  }

  if (roundNo > meta.totalRounds || roundNo - 1 >= scriptedOutcomes.length) {
    return NextResponse.json({ error: "回合超出範圍。" }, { status: 400 });
  }

  const shouldWin = scriptedOutcomes[roundNo - 1];
  const roundSeed = `${battle.id}:round:${roundNo}`;
  let roundPayload: Record<string, unknown> = {};
  let roundResult: "win" | "lose" = shouldWin ? "win" : "lose";

  // ─── Process by challenge type ───
  if (challengeType === "dice") {
    // Dice: player chooses "high" or "low" (but outcome is scripted)
    const diceResult = generateDiceRoll(shouldWin, roundSeed);
    roundPayload = {
      playerDice: diceResult.playerDice,
      opponentDice: diceResult.opponentDice,
      playerWins: shouldWin,
    };
  } else if (challengeType === "trivia") {
    // Trivia: player submits answer index
    const selectedAnswer = typeof body.selectedAnswer === "number" ? body.selectedAnswer : -1;
    const questions = pickTriviaQuestions(`${battle.id}:trivia`, 10);
    const question = questions[roundNo - 1];

    if (!question) {
      return NextResponse.json({ error: "題目載入失敗。" }, { status: 500 });
    }

    const isCorrect = selectedAnswer === question.correctIndex;
    // In scripted mode: if should win this round, player is "correct"
    // Opponent correctness is inverse of script
    const opponentCorrect = !shouldWin;
    roundResult = shouldWin ? "win" : "lose";

    roundPayload = {
      questionId: question.id,
      question: question.question,
      options: question.options,
      correctIndex: question.correctIndex,
      selectedAnswer,
      playerCorrect: isCorrect,
      opponentCorrect,
      scriptedResult: shouldWin, // the scripted battle result for this round
    };
  } else if (challengeType === "slots") {
    // Slots: just spin
    const slotResult = generateSlotResult(shouldWin, roundSeed);
    const opponentResult = generateSlotResult(!shouldWin, `${roundSeed}:opponent`);

    roundPayload = {
      playerReels: slotResult,
      opponentReels: opponentResult,
      playerWins: shouldWin,
    };
  }

  // Update scores
  let newPlayerScore = battle.player_score;
  let newOpponentScore = battle.opponent_score;
  if (roundResult === "win") {
    newPlayerScore += 1;
  } else {
    newOpponentScore += 1;
  }

  // Check if battle is finished
  const isLastRound = roundNo >= meta.totalRounds;
  const playerReachedWins = newPlayerScore >= meta.winsNeeded;
  const opponentReachedWins = newOpponentScore >= meta.winsNeeded;
  const battleFinished = isLastRound || playerReachedWins || opponentReachedWins;

  // Determine final result
  let finalStatus: "in_progress" | "won" | "lost" = "in_progress";
  if (battleFinished) {
    finalStatus = newPlayerScore > newOpponentScore ? "won" : "lost";
  }

  // Check if this round was already played (prevent double-click race condition)
  const { data: existingRound } = await adminSupabase
    .from("anniversary_battle_rounds")
    .select("id, round_result, payload")
    .eq("battle_id", battle.id)
    .eq("round_no", roundNo)
    .maybeSingle();

  if (existingRound) {
    // Round already recorded — return current battle state instead of inserting again
    return NextResponse.json({
      roundNo,
      roundResult: existingRound.round_result,
      roundPayload: existingRound.payload,
      playerScore: battle.player_score,
      opponentScore: battle.opponent_score,
      battleFinished: battle.status === "won" || battle.status === "lost",
      battleResult: battle.status === "won" || battle.status === "lost" ? battle.status : null,
      duplicate: true,
      challengeType,
      totalRounds: meta.totalRounds,
      winsNeeded: meta.winsNeeded,
      lastActiveAt: battle.last_active_at,
    });
  }

  // Insert round record
  const { error: roundInsertError } = await adminSupabase.from("anniversary_battle_rounds").insert({
    battle_id: battle.id,
    round_no: roundNo,
    round_result: roundResult,
    game_type: challengeType,
    scripted_outcome: roundResult,
    tug_delta: roundResult === "win" ? 1 : -1,
    payload: roundPayload,
  });

  if (roundInsertError) {
    // If insert fails due to race condition, return conflict
    return NextResponse.json({ error: "回合已記錄，請勿重複送出。", duplicate: true }, { status: 409 });
  }

  // Update battle
  await adminSupabase
    .from("anniversary_battles")
    .update({
      status: battleFinished ? finalStatus : "in_progress",
      current_round: roundNo,
      player_score: newPlayerScore,
      opponent_score: newOpponentScore,
      last_active_at: now,
      ended_at: battleFinished ? now : null,
    })
    .eq("id", battle.id);

  // If battle won, update win tracking
  let partnerJustUnlocked = false;
  let secondPokemonJustUnlocked = false;
  let titleJustUnlocked = false;
  let thirdPokemonJustUnlocked = false;
  let masterBallJustUnlocked = false;
  let legendaryJustUnlocked = false;

  if (battleFinished && (finalStatus as string) === "won") {
    const newTotalWins = (participant.total_wins ?? 0) + 1;
    const newWinStreak = (participant.win_streak ?? 0) + 1;
    const newMaxWinStreak = Math.max(participant.max_win_streak ?? 0, newWinStreak);

    partnerJustUnlocked = !participant.partner_unlocked && newWinStreak >= UNLOCK_PARTNER_CONSECUTIVE_WINS;
    secondPokemonJustUnlocked = !participant.second_pokemon_unlocked && newTotalWins >= UNLOCK_SECOND_POKEMON_TOTAL_WINS;
    titleJustUnlocked = !participant.title_unlocked && newTotalWins >= UNLOCK_TITLE_TOTAL_WINS;
    thirdPokemonJustUnlocked = !participant.third_pokemon_unlocked && newTotalWins >= UNLOCK_THIRD_POKEMON_TOTAL_WINS;
    masterBallJustUnlocked = !participant.master_ball_unlocked && newTotalWins >= UNLOCK_MASTER_BALL_TOTAL_WINS;
    legendaryJustUnlocked = !participant.legendary_unlocked && newTotalWins >= UNLOCK_LEGENDARY_TOTAL_WINS;

    await adminSupabase
      .from("anniversary_participants")
      .update({
        total_wins: newTotalWins,
        win_streak: newWinStreak,
        max_win_streak: newMaxWinStreak,
        partner_unlocked: participant.partner_unlocked || partnerJustUnlocked,
        second_pokemon_unlocked: participant.second_pokemon_unlocked || secondPokemonJustUnlocked,
        title_unlocked: participant.title_unlocked || titleJustUnlocked,
        third_pokemon_unlocked: participant.third_pokemon_unlocked || thirdPokemonJustUnlocked,
        master_ball_unlocked: participant.master_ball_unlocked || masterBallJustUnlocked,
        legendary_unlocked: participant.legendary_unlocked || legendaryJustUnlocked,
      })
      .eq("id", participant.id);
  }

  return NextResponse.json({
    roundNo,
    roundResult,
    roundPayload,
    playerScore: newPlayerScore,
    opponentScore: newOpponentScore,
    battleFinished,
    battleResult: battleFinished ? finalStatus : null,
    partnerJustUnlocked,
    secondPokemonJustUnlocked,
    titleJustUnlocked,
    thirdPokemonJustUnlocked,
    masterBallJustUnlocked,
    legendaryJustUnlocked,
    challengeType,
    totalRounds: meta.totalRounds,
    winsNeeded: meta.winsNeeded,
    lastActiveAt: now,
  });
}
