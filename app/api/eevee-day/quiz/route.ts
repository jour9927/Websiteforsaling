import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/auth";
import { QUESTIONS, EEVEE_DAY_CONFIG } from "@/lib/eevee-day-questions";

export const dynamic = "force-dynamic";

// GET: 取得隨機題目（不含答案）
export async function GET() {
    const supabase = createServerSupabaseClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 檢查活動期間
    const now = new Date();
    const start = new Date(EEVEE_DAY_CONFIG.startDate);
    const end = new Date(EEVEE_DAY_CONFIG.endDate + "T23:59:59");
    if (now < start || now > end) {
        return NextResponse.json({ error: "活動尚未開始或已結束" }, { status: 400 });
    }

    // 檢查今日剩餘次數
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const { count } = await supabase
        .from("eevee_day_quiz_attempts")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("attempted_at", today.toISOString())
        .lt("attempted_at", tomorrow.toISOString());

    const attemptsToday = count || 0;
    if (attemptsToday >= EEVEE_DAY_CONFIG.dailyAttempts) {
        return NextResponse.json({ error: "今日嘗試次數已用完" }, { status: 400 });
    }

    // 隨機抽取題目
    const shuffled = [...QUESTIONS].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, EEVEE_DAY_CONFIG.questionsPerQuiz);

    // 回傳不含答案的題目
    const questionsWithoutAnswers = selected.map((q) => ({
        id: q.id,
        question: q.question,
        options: q.options,
        category: q.category,
    }));

    return NextResponse.json({
        questions: questionsWithoutAnswers,
        timePerQuestion: EEVEE_DAY_CONFIG.timePerQuestion,
        passingScore: EEVEE_DAY_CONFIG.passingScore,
        remainingAttempts: EEVEE_DAY_CONFIG.dailyAttempts - attemptsToday,
    });
}

// POST: 提交答案
export async function POST(request: Request) {
    const supabase = createServerSupabaseClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 檢查活動期間
    const now = new Date();
    const start = new Date(EEVEE_DAY_CONFIG.startDate);
    const end = new Date(EEVEE_DAY_CONFIG.endDate + "T23:59:59");
    if (now < start || now > end) {
        return NextResponse.json({ error: "活動尚未開始或已結束" }, { status: 400 });
    }

    // 檢查今日剩餘次數
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const { count } = await supabase
        .from("eevee_day_quiz_attempts")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("attempted_at", today.toISOString())
        .lt("attempted_at", tomorrow.toISOString());

    const attemptsToday = count || 0;
    if (attemptsToday >= EEVEE_DAY_CONFIG.dailyAttempts) {
        return NextResponse.json({ error: "今日嘗試次數已用完" }, { status: 400 });
    }

    const body = await request.json();
    const { answers } = body as { answers: { questionId: number; selected: number }[] };

    if (!answers || !Array.isArray(answers)) {
        return NextResponse.json({ error: "Invalid answers format" }, { status: 400 });
    }

    // 計算分數
    let score = 0;
    const results = answers.map(({ questionId, selected }) => {
        const question = QUESTIONS.find((q) => q.id === questionId);
        if (!question) return { questionId, correct: false, correctAnswer: -1 };
        const correct = question.answer === selected;
        if (correct) score++;
        return { questionId, correct, correctAnswer: question.answer };
    });

    const passed = score >= EEVEE_DAY_CONFIG.passingScore;

    // 記錄嘗試
    await supabase.from("eevee_day_quiz_attempts").insert({
        user_id: user.id,
        score,
        passed,
    });

    // 若通過，自動集點
    if (passed) {
        await supabase.from("eevee_day_stamps").insert({
            user_id: user.id,
            quiz_score: score,
            quiz_total: EEVEE_DAY_CONFIG.questionsPerQuiz,
        });
    }

    // 查詢目前集點數
    const { count: stampCount } = await supabase
        .from("eevee_day_stamps")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

    return NextResponse.json({
        score,
        total: EEVEE_DAY_CONFIG.questionsPerQuiz,
        passed,
        results,
        stamps: stampCount || 0,
        stampsRequired: EEVEE_DAY_CONFIG.stampsRequired,
        remainingAttempts: EEVEE_DAY_CONFIG.dailyAttempts - attemptsToday - 1,
        message: passed
            ? `🎉 答對 ${score}/${EEVEE_DAY_CONFIG.questionsPerQuiz} 題，成功集得 1 點！`
            : `答對 ${score}/${EEVEE_DAY_CONFIG.questionsPerQuiz} 題，需答對 ${EEVEE_DAY_CONFIG.passingScore} 題才能集點。`,
    });
}
