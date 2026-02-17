"use client";

import { useState, useEffect } from "react";

interface CountdownTimerProps {
    endTime: string;
    isEnded: boolean;
}

export default function CountdownTimer({ endTime, isEnded }: CountdownTimerProps) {
    const [remainingTime, setRemainingTime] = useState("");
    const [isExpired, setIsExpired] = useState(isEnded);
    const [isUrgent, setIsUrgent] = useState(false);
    const [wasExtended, setWasExtended] = useState(false);
    const [prevEndTime, setPrevEndTime] = useState(endTime);

    // 偵測 endTime 被延長
    useEffect(() => {
        if (endTime !== prevEndTime && !isEnded) {
            setWasExtended(true);
            setPrevEndTime(endTime);
            // 3 秒後隱藏延長提示
            const timeout = setTimeout(() => setWasExtended(false), 5000);
            return () => clearTimeout(timeout);
        }
    }, [endTime, prevEndTime, isEnded]);

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
                setIsUrgent(false);
                return;
            }

            // 最後 60 秒進入緊急模式
            setIsUrgent(diff <= 60000);

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
        <div className={`text-center ${isExpired ? 'text-gray-400' : isUrgent ? 'text-red-400' : 'text-yellow-400'}`}>
            <div className="text-xs text-white/60 mb-1">
                {isExpired ? '已結標' : isUrgent ? '⚡ 即將結束！' : '結束倒數'}
            </div>
            <div className={`text-2xl font-bold font-mono ${isExpired ? '' : isUrgent ? 'animate-pulse text-red-400' : 'animate-pulse'
                }`}>
                {remainingTime || '計算中...'}
            </div>
            {wasExtended && (
                <div className="mt-2 animate-bounce rounded-full bg-orange-500/20 px-3 py-1 text-xs font-medium text-orange-300">
                    ⏰ 有人出價！計時延長 2 分鐘
                </div>
            )}
            {isUrgent && !isExpired && !wasExtended && (
                <div className="mt-2 text-xs text-red-300/70">
                    最後一分鐘出價將延長時間
                </div>
            )}
        </div>
    );
}
