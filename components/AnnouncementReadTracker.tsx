"use client";

import { useEffect, useRef } from "react";

type Props = {
    announcementId: string;
};

export function AnnouncementReadTracker({ announcementId }: Props) {
    const tracked = useRef(false);

    useEffect(() => {
        if (tracked.current) return;
        tracked.current = true;

        fetch("/api/announcements/read", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ announcement_id: announcementId }),
        }).catch(() => {
            // 靜默失敗 — 不影響使用者體驗
        });
    }, [announcementId]);

    return null;
}
