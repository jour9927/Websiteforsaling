"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import RiskBoxGame from "@/components/games/RiskBoxGame";

export default function RiskBoxWrapper({ user, initialPoints }: { user: { id: string, name: string } | null, initialPoints: number }) {
    const [currentPoints, setCurrentPoints] = useState(initialPoints);

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
        <RiskBoxGame
            user={user}
            userPoints={currentPoints}
            onPointsChange={refreshPoints}
        />
    );
}
