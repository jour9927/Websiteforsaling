"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import ScratchGame from "@/components/games/ScratchGame";

export default function ScratchWrapper({ user, initialPoints }: { user: { id: string, name: string } | null, initialPoints: number }) {
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
        <ScratchGame
            user={user}
            userPoints={currentPoints}
            onPointsChange={refreshPoints}
        />
    );
}
