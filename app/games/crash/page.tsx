import { createServerSupabaseClient } from "@/lib/auth";
import CrashGameWrapper from "./CrashGameWrapper";
import Link from "next/link";

export const metadata = {
    title: "🎈 膽小鬼測試 | 遊樂場",
    description: "倍率無限飆升，但也隨時可能爆炸歸零！考驗貪婪與恐懼的極限拉扯。",
};

export const dynamic = "force-dynamic";

export default async function CrashGamePage() {
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    // 如果未登入或無法取得狀態，提供基礎 UI，遊戲內會被擋下
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

            <header className="mb-8 p-6 glass-card border-purple-500/30">
                <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
                    🎈 膽小鬼測試 (Crash)
                </h1>
                <p className="text-white/60 text-sm">
                    數字隨著時間呈指數飆升！在數字變成紅色爆炸前，點擊「逃生」即可拿走當下倍率的獎金。<br />
                    <span className="text-red-400">警告：如果來不及逃生就爆炸了，你的下注點數將會歸零！</span>
                </p>
            </header>

            <CrashGameWrapper
                user={user ? { id: user.id, name: userName } : null}
                initialPoints={userPoints}
            />
        </div>
    );
}
