import { createServerSupabaseClient } from "@/lib/auth";
import ScratchWrapper from "./ScratchWrapper";
import Link from "next/link";

export const metadata = {
    title: "🎫 奇蹟刮刮樂 | 遊樂場",
    description: "永遠都是差一點點就中大獎的最刺激！要不要再來一張？",
};

export const dynamic = "force-dynamic";

export default async function ScratchPage() {
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
                <div className="text-sm font-semibold text-emerald-300 bg-emerald-500/10 px-4 py-2 rounded-full border border-emerald-500/20">
                    目前點數：{userPoints.toLocaleString()} 點
                </div>
            </div>

            <header className="mb-8 p-6 glass-card border-emerald-500/30">
                <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
                    🎫 奇蹟刮刮樂 (Scratch & Win)
                </h1>
                <p className="text-white/60 text-sm">
                    購買一張刮刮樂，將九宮格全部刮開。<br />
                    只要找到 <span className="text-emerald-400 font-bold tracking-wider">3 個完全相同的圖案</span> 即可獲得對應倍率的巨額獎金！
                </p>
            </header>

            <ScratchWrapper
                user={user ? { id: user.id, name: userName } : null}
                initialPoints={userPoints}
            />
        </div>
    );
}
