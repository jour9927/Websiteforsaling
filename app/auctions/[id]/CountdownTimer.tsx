"use client";

import { useState, useEffect } from "react";

interface CountdownTimerProps {
    endTime: string;
    isEnded: boolean;
}

export default function CountdownTimer({ endTime, isEnded }: CountdownTimerProps) {
    const [remainingTime, setRemainingTime] = useState("");
    const [isExpired, setIsExpired] = useState(isEnded);

    useEffect(() => {
        if (isEnded) {
            setRemainingTime("已結束");
            setIsExpired(true);
            return;
        }

        const updateTime = () => {
            const now = new Date();
            const end = new Date(endTime);
            const diff = end.getTime() - now.getTime();

            if (diff <= 0) {
                setRemainingTime("已結束");
                setIsExpired(true);
                return;
            }

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            if (days > 0) {
                setRemainingTime(`${days}天 ${hours}小時 ${minutes}分`);
            } else if (hours > 0) {
                setRemainingTime(`${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
            } else {
                setRemainingTime(`${minutes}:${seconds.toString().padStart(2, '0')}`);
            }
        };

        updateTime();
        const interval = setInterval(updateTime, 1000);
        return () => clearInterval(interval);
    }, [endTime, isEnded]);

    return (
        <div className={`text-center ${isExpired ? 'text-gray-400' : 'text-yellow-400'}`}>
            <div className="text-xs text-white/60 mb-1">
                {isExpired ? '已結標' : '結束倒數'}
            </div>
            <div className={`text-2xl font-bold font-mono ${!isExpired && 'animate-pulse'}`}>
                {remainingTime || '計算中...'}
            </div>
        </div>
    );
}
