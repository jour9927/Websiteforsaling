import { NextResponse } from "next/server";
import { createAdminSupabaseClient, createServerSupabaseClient } from "@/lib/auth";
import {
  ANNIVERSARY_30TH_EEVEE_POINT_GOAL,
  ANNIVERSARY_30TH_LOSS_POINTS,
  ANNIVERSARY_30TH_SLUG,
  ANNIVERSARY_30TH_WIN_POINTS,
  CHALLENGE_META,
  calculateAnniversaryEventPoints,
  generateDiceRoll,
  generateRetroBattleRound,
  generateSlotResult,
  isRetroMoveId,
  isBattleSessionExpired,
  pickTriviaQuestions,
  resolveRetroBattleTurn,
  type AnniversaryBattle,
  type AnniversaryCampaign,
  type AnniversaryParticipant,
  type ChallengeType,
  type RetroBattleState,
} from "@/lib/anniversary30th";

export const dynamic = "force-dynamic";

function parseScriptedOutcomes(value: AnniversaryBattle["scripted_outcomes"]): boolean[] {
  try {
    return typeof value === "string" ? JSON.parse(value) : value as unknown as boolean[];
  } catch {
    return [];
  }
}

async function countCompletedBattles(
  adminSupabase: ReturnType<typeof createAdminSupabaseClient>,
  participantId: string,
) {
  const { count } = await adminSupabase
    .from("anniversary_battles")
    .select("id", { count: "exact", head: true })
    .eq("participant_id", participantId)
    .in("status", ["won", "lost"]);

  return count ?? 0;
}

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
  const submittedAction = typeof body.action === "string" ? body.action : "";
  const isForfeit = submittedAction === "timeout" || submittedAction === "forfeit";

  if (!battleId || !Number.isInteger(roundNo) || roundNo <= 0) {
    return NextResponse.json({ error: "battleId 和 roundNo 必填。" }, { status: 400 });
  }

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
    return NextResponse.json({ error: "找不到對戰。" }, { status: 404 });
  }

  const challengeType = (battle.challenge_type || "retro") as ChallengeType;
  const meta = CHALLENGE_META[challengeType];
  if (!meta) {
    return NextResponse.json({ error: "不支援的對戰類型。" }, { status: 400 });
  }
  const battleState = battle.battle_state as RetroBattleState | null;
  const usesRetroState = challengeType === "retro" && battleState !== null;
  const retroOpponentCount = Array.isArray(battleState?.opponent.team)
    ? battleState.opponent.team.length
    : meta.winsNeeded;
  const totalRounds = usesRetroState ? Math.max(meta.totalRounds, roundNo) : meta.totalRounds;
  const winsNeeded = usesRetroState ? Math.max(1, retroOpponentCount) : meta.winsNeeded;

  if ((battle.status as string) === "won" || (battle.status as string) === "lost") {
    const completedBattles = await countCompletedBattles(adminSupabase, participant.id);
    return NextResponse.json({
      roundNo,
      roundResult: null,
      roundPayload: null,
      playerScore: battle.player_score,
      opponentScore: battle.opponent_score,
      battleFinished: true,
      battleResult: battle.status,
      duplicate: true,
      challengeType,
      totalRounds,
      winsNeeded,
      battleState: battle.battle_state ?? null,
      eventPoints: calculateAnniversaryEventPoints(completedBattles, participant.total_wins ?? 0),
      pointsEarned: 0,
      lastActiveAt: battle.last_active_at,
    });
  }

  const { data: existingRound } = await adminSupabase
    .from("anniversary_battle_rounds")
    .select("id, round_result, payload")
    .eq("battle_id", battle.id)
    .eq("round_no", roundNo)
    .maybeSingle();

  if (existingRound) {
    const completedBattles = await countCompletedBattles(adminSupabase, participant.id);
    return NextResponse.json({
      roundNo,
      roundResult: existingRound.round_result,
      roundPayload: existingRound.payload,
      playerScore: battle.player_score,
      opponentScore: battle.opponent_score,
      battleFinished: (battle.status as string) === "won" || (battle.status as string) === "lost",
      battleResult: (battle.status as string) === "won" || (battle.status as string) === "lost" ? (battle.status as "won" | "lost") : null,
      duplicate: true,
      challengeType,
      totalRounds,
      winsNeeded,
      battleState: battle.battle_state ?? null,
      eventPoints: calculateAnniversaryEventPoints(completedBattles, participant.total_wins ?? 0),
      pointsEarned: 0,
      lastActiveAt: battle.last_active_at,
    });
  }

  const now = new Date().toISOString();

  if (!isForfeit && isBattleSessionExpired(battle.last_active_at || battle.started_at)) {
    await adminSupabase
      .from("anniversary_battles")
      .update({
        status: "lost",
        last_active_at: now,
        ended_at: now,
      })
      .eq("id", battle.id);

    const completedBattles = await countCompletedBattles(adminSupabase, participant.id);
    const eventPoints = calculateAnniversaryEventPoints(completedBattles, participant.total_wins ?? 0);
    const partnerJustUnlocked = !participant.partner_unlocked && eventPoints >= ANNIVERSARY_30TH_EEVEE_POINT_GOAL;
    await adminSupabase
      .from("anniversary_participants")
      .update({
        win_streak: 0,
        partner_unlocked: participant.partner_unlocked || partnerJustUnlocked,
      })
      .eq("id", participant.id);

    return NextResponse.json({
      error: "這場對決已逾時，已自動結束，無法繼續。",
      battleExpired: true,
      eventPoints,
      pointsEarned: ANNIVERSARY_30TH_LOSS_POINTS,
      partnerJustUnlocked,
      challengeType,
      totalRounds,
      winsNeeded,
      battleState: battle.battle_state ?? null,
    }, { status: 409 });
  }

  let roundPayload: Record<string, unknown>;
  let roundResult: "win" | "lose";
  let nextBattleState: RetroBattleState | null = battleState;
  let retroPlayerTeamDefeated = false;
  let retroOpponentTeamDefeated = false;
  let playerScoreDelta = 0;
  let opponentScoreDelta = 0;

  if (isForfeit) {
    roundResult = "lose";
    roundPayload = {
      forfeit: true,
      reason: submittedAction === "timeout" ? "timeout" : "forfeit",
      message: "倒數結束，這場對戰判定為棄權。",
    };
    opponentScoreDelta = 1;
  } else {
    const roundSeed = `${battle.id}:round:${roundNo}`;

    if (usesRetroState && battleState) {
      if (!isRetroMoveId(submittedAction)) {
        return NextResponse.json({ error: "請選擇可用的復古招式。" }, { status: 400 });
      }

      try {
        const turn = resolveRetroBattleTurn(battleState, submittedAction, roundSeed);
        nextBattleState = turn.battleState;
        retroPlayerTeamDefeated = turn.playerTeamDefeated;
        retroOpponentTeamDefeated = turn.opponentTeamDefeated;
        roundPayload = turn.resolution as unknown as Record<string, unknown>;
        roundResult = turn.resolution.playerWins ? "win" : "lose";
        playerScoreDelta = turn.resolution.opponentFainted ? 1 : 0;
        opponentScoreDelta = turn.resolution.playerFainted ? 1 : 0;
      } catch (error) {
        return NextResponse.json({
          error: error instanceof Error ? error.message : "招式無法使用。",
        }, { status: 400 });
      }
    } else {
      const scriptedOutcomes = parseScriptedOutcomes(battle.scripted_outcomes);
      if (roundNo > meta.totalRounds || roundNo - 1 >= scriptedOutcomes.length) {
        return NextResponse.json({ error: "回合超出範圍。" }, { status: 400 });
      }

      const shouldWin = scriptedOutcomes[roundNo - 1];
      roundResult = shouldWin ? "win" : "lose";

      if (challengeType === "retro") {
        roundPayload = generateRetroBattleRound(shouldWin, roundSeed, submittedAction, roundNo);
      } else if (challengeType === "dice") {
        const diceResult = generateDiceRoll(shouldWin, roundSeed);
        roundPayload = {
          playerDice: diceResult.playerDice,
          opponentDice: diceResult.opponentDice,
          playerWins: shouldWin,
        };
      } else if (challengeType === "trivia") {
        const selectedAnswer = typeof body.selectedAnswer === "number" ? body.selectedAnswer : -1;
        const questions = pickTriviaQuestions(`${battle.id}:trivia`, 10);
        const question = questions[roundNo - 1];

        if (!question) {
          return NextResponse.json({ error: "題目載入失敗。" }, { status: 500 });
        }

        roundPayload = {
          questionId: question.id,
          question: question.question,
          options: question.options,
          correctIndex: question.correctIndex,
          selectedAnswer,
          playerCorrect: selectedAnswer === question.correctIndex,
          opponentCorrect: !shouldWin,
          scriptedResult: shouldWin,
        };
      } else {
        const slotResult = generateSlotResult(shouldWin, roundSeed);
        const opponentResult = generateSlotResult(!shouldWin, `${roundSeed}:opponent`);
        roundPayload = {
          playerReels: slotResult,
          opponentReels: opponentResult,
          playerWins: shouldWin,
        };
      }

      playerScoreDelta = roundResult === "win" ? 1 : 0;
      opponentScoreDelta = roundResult === "lose" ? 1 : 0;
    }
  }

  let newPlayerScore = battle.player_score;
  let newOpponentScore = battle.opponent_score;
  if (isForfeit) {
    newOpponentScore = Math.max(winsNeeded, battle.opponent_score + opponentScoreDelta);
  } else {
    newPlayerScore += playerScoreDelta;
    newOpponentScore += opponentScoreDelta;
  }

  const isLastRound = !usesRetroState && roundNo >= meta.totalRounds;
  const playerReachedWins = !usesRetroState && newPlayerScore >= meta.winsNeeded;
  const opponentReachedWins = !usesRetroState && newOpponentScore >= meta.winsNeeded;
  const battleFinished = isForfeit
    || isLastRound
    || playerReachedWins
    || opponentReachedWins
    || retroPlayerTeamDefeated
    || retroOpponentTeamDefeated;
  const finalStatus: "in_progress" | "won" | "lost" = battleFinished
    ? retroOpponentTeamDefeated
      ? "won"
      : retroPlayerTeamDefeated
        ? "lost"
        : newPlayerScore > newOpponentScore ? "won" : "lost"
    : "in_progress";

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
    return NextResponse.json({ error: "回合已記錄，請勿重複送出。", duplicate: true }, { status: 409 });
  }

  await adminSupabase
    .from("anniversary_battles")
    .update({
      status: battleFinished ? finalStatus : "in_progress",
      current_round: roundNo,
      player_score: newPlayerScore,
      opponent_score: newOpponentScore,
      last_active_at: now,
      ended_at: battleFinished ? now : null,
      battle_state: nextBattleState,
    })
    .eq("id", battle.id);

  let partnerJustUnlocked = false;
  let updatedTotalWins = participant.total_wins ?? 0;
  let updatedWinStreak = participant.win_streak ?? 0;
  let updatedMaxWinStreak = participant.max_win_streak ?? 0;
  let eventPoints = calculateAnniversaryEventPoints(
    await countCompletedBattles(adminSupabase, participant.id),
    updatedTotalWins,
  );

  if (battleFinished) {
    if (finalStatus === "won") {
      updatedTotalWins += 1;
      updatedWinStreak += 1;
      updatedMaxWinStreak = Math.max(updatedMaxWinStreak, updatedWinStreak);
    } else {
      updatedWinStreak = 0;
    }

    eventPoints = calculateAnniversaryEventPoints(
      await countCompletedBattles(adminSupabase, participant.id),
      updatedTotalWins,
    );
    partnerJustUnlocked = !participant.partner_unlocked && eventPoints >= ANNIVERSARY_30TH_EEVEE_POINT_GOAL;

    await adminSupabase
      .from("anniversary_participants")
      .update({
        total_wins: updatedTotalWins,
        win_streak: updatedWinStreak,
        max_win_streak: updatedMaxWinStreak,
        partner_unlocked: participant.partner_unlocked || partnerJustUnlocked,
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
    secondPokemonJustUnlocked: false,
    titleJustUnlocked: false,
    thirdPokemonJustUnlocked: false,
    masterBallJustUnlocked: false,
    legendaryJustUnlocked: false,
    challengeType,
    totalRounds,
    winsNeeded,
    battleState: nextBattleState,
    eventPoints,
    pointsEarned: battleFinished ? finalStatus === "won" ? ANNIVERSARY_30TH_WIN_POINTS : ANNIVERSARY_30TH_LOSS_POINTS : 0,
    lastActiveAt: now,
  });
}
