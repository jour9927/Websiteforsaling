"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { EEVEE_DAY_CONFIG } from "@/lib/eevee-day-questions";

type QuizQuestion = {
    id: number;
    question: string;
    options: string[];
    category: string;
};

type QuizResult = {
    questionId: number;
    correct: boolean;
    correctAnswer: number;
};

type QuizResponse = {
    score: number;
    total: number;
    passed: boolean;
    results: QuizResult[];
    stamps: number;
    stampsRequired: number;
    remainingAttempts: number;
    message: string;
};

export default function QuizPage() {
    const router = useRouter();
    const [questions, setQuestions] = useState<QuizQuestion[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState<{ questionId: number; selected: number }[]>([]);
    const [timeLeft, setTimeLeft] = useState(EEVEE_DAY_CONFIG.timePerQuestion);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState<QuizResponse | null>(null);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [showFeedback, setShowFeedback] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // 載入題目
    useEffect(() => {
        async function loadQuestions() {
            try {
                const res = await fetch("/api/eevee-day/quiz");
                const data = await res.json();
                if (data.error) {
                    setError(data.error);
                    setLoading(false);
                    return;
                }
                setQuestions(data.questions);
            } catch {
                setError("載入題目失敗");
            } finally {
                setLoading(false);
            }
        }
        loadQuestions();
    }, []);

    // 提交答案
    const submitAnswers = useCallback(
        async (finalAnswers: { questionId: number; selected: number }[]) => {
            if (submitting) return;
            setSubmitting(true);

            try {
                const res = await fetch("/api/eevee-day/quiz", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ answers: finalAnswers }),
                });
                const data = await res.json();
                setResult(data);
            } catch {
                setError("提交失敗");
            } finally {
                setSubmitting(false);
            }
        },
        [submitting]
    );

    // 前往下一題或提交
    const goNext = useCallback(
        (answer: { questionId: number; selected: number }) => {
            const newAnswers = [...answers, answer];
            setAnswers(newAnswers);

            if (currentIndex + 1 >= questions.length) {
                // 最後一題，提交
                submitAnswers(newAnswers);
            } else {
                // 下一題
                setTimeout(() => {
                    setCurrentIndex((prev) => prev + 1);
                    setSelectedOption(null);
                    setShowFeedback(false);
                    setTimeLeft(EEVEE_DAY_CONFIG.timePerQuestion);
                }, 800);
            }
        },
        [answers, currentIndex, questions.length, submitAnswers]
    );

    // 倒計時
    useEffect(() => {
        if (loading || result || questions.length === 0 || showFeedback) return;

        timerRef.current = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    // 時間到，自動跳題（算錯）
                    clearInterval(timerRef.current!);
                    const q = questions[currentIndex];
                    setSelectedOption(-1);
                    setShowFeedback(true);
                    goNext({ questionId: q.id, selected: -1 });
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [loading, result, questions, currentIndex, showFeedback, goNext]);

    // 選擇選項
    const handleSelect = (optionIndex: number) => {
        if (showFeedback || selectedOption !== null) return;
        if (timerRef.current) clearInterval(timerRef.current);

        setSelectedOption(optionIndex);
        setShowFeedback(true);

        const q = questions[currentIndex];
        goNext({ questionId: q.id, selected: optionIndex });
    };

    // 載入中
    if (loading) {
        return (
            <section className="glass-card p-8 text-center">
                <img
                    src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/133.png"
                    alt="伊布"
                    className="w-16 h-16 mx-auto mb-3 animate-bounce drop-shadow-lg"
                />
                <div className="animate-pulse text-white/60">準備題目中...</div>
            </section>
        );
    }

    // 錯誤
    if (error) {
        return (
            <section className="space-y-4">
                <div className="glass-card p-8 text-center">
                    <p className="text-red-400 mb-4">{error}</p>
                    <button
                        onClick={() => router.push("/eevee-day")}
                        className="px-6 py-2 rounded-xl bg-white/10 text-white/70 hover:bg-white/20 transition"
                    >
                        返回活動頁面
                    </button>
                </div>
            </section>
        );
    }

    // 結果頁面
    if (result) {
        return (
            <section className="space-y-6">
                <div className="glass-card p-6 text-center">
                    <div className="text-5xl mb-3">{result.passed ? "🎉" : "😢"}</div>
                    <h2 className={`text-2xl font-bold mb-2 ${result.passed ? "text-emerald-400" : "text-red-400"}`}>
                        {result.passed ? "通過！" : "未通過"}
                    </h2>
                    <p className="text-white/70 text-lg mb-1">
                        {result.score} / {result.total} 題答對
                    </p>
                    <p className="text-sm text-white/50 whitespace-pre-line">{result.message}</p>

                    {result.passed && (
                        <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                            <p className="text-sm text-emerald-400">
                                ⭐ 集點 +1！目前 {result.stamps}/{result.stampsRequired}
                            </p>
                        </div>
                    )}

                    <div className="mt-4 text-xs text-white/40">
                        今日剩餘 {result.remainingAttempts} 次
                    </div>
                </div>

                {/* 答題詳情 */}
                <div className="glass-card p-4">
                    <h3 className="text-sm font-semibold text-white/80 mb-3">📋 答題詳情</h3>
                    <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                        {result.results.map((r, i) => (
                            <div
                                key={i}
                                className={`w-full aspect-square rounded-lg flex items-center justify-center text-sm font-bold ${r.correct
                                    ? "bg-emerald-500/20 text-emerald-400"
                                    : "bg-red-500/20 text-red-400"
                                    }`}
                            >
                                {r.correct ? "✓" : "✗"}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex gap-3">
                    {result.remainingAttempts > 0 && (
                        <button
                            onClick={() => window.location.reload()}
                            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-black font-bold hover:scale-[1.02] active:scale-95 transition"
                        >
                            🔄 再挑戰一次
                        </button>
                    )}
                    <button
                        onClick={() => router.push("/eevee-day")}
                        className="flex-1 py-3 rounded-xl bg-white/10 text-white/70 font-medium hover:bg-white/20 transition"
                    >
                        返回活動頁面
                    </button>
                </div>
            </section>
        );
    }

    // 答題中
    const question = questions[currentIndex];
    const progress = ((currentIndex) / questions.length) * 100;
    const timePercent = (timeLeft / EEVEE_DAY_CONFIG.timePerQuestion) * 100;

    return (
        <section className="space-y-4">
            {/* 進度條 */}
            <div className="glass-card p-3">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-white/50">
                        第 {currentIndex + 1} / {questions.length} 題
                    </span>
                    <span className="text-xs text-white/50">{question.category}</span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-300"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            {/* 倒計時 */}
            <div className="glass-card p-4">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-white/50">⏱️ 剩餘時間</span>
                    <span className={`text-lg font-bold ${timeLeft <= 5 ? "text-red-400 animate-pulse" : "text-white/80"}`}>
                        {timeLeft}s
                    </span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all duration-1000 ${timeLeft <= 5
                            ? "bg-red-500"
                            : timeLeft <= 10
                                ? "bg-amber-500"
                                : "bg-emerald-500"
                            }`}
                        style={{ width: `${timePercent}%` }}
                    />
                </div>
            </div>

            {/* 題目 */}
            <div className="glass-card p-6">
                <h2 className="text-lg font-semibold text-white/90 leading-relaxed">
                    {question.question}
                </h2>
            </div>

            {/* 選項 */}
            <div className="space-y-3">
                {question.options.map((option, idx) => {
                    let optionClass = "glass-card p-4 text-left hover:bg-white/10 hover:scale-[1.01] active:scale-95 transition cursor-pointer border border-white/10";

                    if (showFeedback) {
                        if (idx === selectedOption) {
                            optionClass = "glass-card p-4 text-left border border-amber-500/50 bg-amber-500/10";
                        } else {
                            optionClass = "glass-card p-4 text-left opacity-50 cursor-default border border-white/10";
                        }
                    }

                    return (
                        <button
                            key={idx}
                            onClick={() => handleSelect(idx)}
                            disabled={showFeedback}
                            className={`w-full ${optionClass}`}
                        >
                            <div className="flex items-center gap-3">
                                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${showFeedback && idx === selectedOption
                                    ? "bg-amber-500 text-black"
                                    : "bg-white/10 text-white/60"
                                    }`}>
                                    {String.fromCharCode(65 + idx)}
                                </span>
                                <span className="text-sm text-white/80">{option}</span>
                            </div>
                        </button>
                    );
                })}
            </div>
        </section>
    );
}
