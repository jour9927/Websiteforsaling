"use client";

import { useState } from "react";
import CrashGame from "@/components/games/CrashGame";
import { supabase } from "@/lib/supabase";

export default function CrashGameWrapper({ user, initialPoints }: { user: { id: string, name: string } | null, initialPoints: number }) {
    const [currentPoints, setCurrentPoints] = useState(initialPoints);

    // 當遊戲內下注或贏錢時呼叫此函式去後端同步目前真正的點數
    // （在完美的實作中，下注與結算的動作會直接寫成後端 API 以防作弊，
    // 這裡我們先用 client-side fetch 來更新畫面的餘額）
    const refreshPoints = async () => {
        if (!user) return;
        const { data } = await supabase
            .from('profiles')
            .select('points')
            .eq('id', user.id)
            .single();

        if (data) {
            setCurrentPoints(data.points || 0);
        }
    };

    return (
        <CrashGame
            user={user}
            userPoints={currentPoints}
            onPointsChange={refreshPoints}
        />
    );
}
