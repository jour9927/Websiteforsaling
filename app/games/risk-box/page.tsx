import { createServerSupabaseClient } from "@/lib/auth";
import RiskBoxWrapper from "./RiskBoxWrapper";
import Link from "next/link";

export const metadata = {
    title: "⚡ 步步驚心 | 遊樂場",
    description: "經典的沈沒成本考驗！每一關卡都要在拿走獎金和賭命開箱之間做出抉擇。",
};

export const dynamic = "force-dynamic";

export default async function RiskBoxPage() {
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    let userPoints = 0;
    let userName = "訪客";

    if (user) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('points, full_name')
            .eq('id', user.id)
            .single();

        if (profile) {
            userPoints = profile.points || 0;
            userName = profile.full_name || "會員";
        }
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-5xl">
            <div className="mb-6 flex items-center justify-between">
                <Link href="/games" className="text-sm text-slate-200/80 hover:text-white flex items-center gap-2">
                    ← 返回遊樂場大廳
                </Link>
                <div className="text-sm font-semibold text-yellow-300 bg-yellow-500/10 px-4 py-2 rounded-full border border-yellow-500/20">
                    目前點數：{userPoints.toLocaleString()} 點
                </div>
            </div>

            <header className="mb-8 p-6 glass-card border-yellow-500/30">
                <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
                    ⚡ 洛托姆的步步驚心 (Risk Box)
                </h1>
                <p className="text-white/60 text-sm">
                    每關有三個箱子，其中包含獎勵倍率，以及一個<span className="text-red-400">會讓獎金歸零的雷電球</span>。<br />
                    你可以隨時見好就收，但只要貪心開錯箱子，所有累積的獎勵將會瞬間化為烏有！
                </p>
            </header>

            <RiskBoxWrapper
                user={user ? { id: user.id, name: userName } : null}
                initialPoints={userPoints}
            />
        </div>
    );
}
