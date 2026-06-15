const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

export const CHECK_IN_TIME_ZONE = "Asia/Taipei";
export const CHECK_IN_RESET_HOUR_TAIPEI = 8;
export const CHECK_IN_RESET_NOTICE = "每日簽到於台灣時間 08:00 刷新，計算區間為當日 08:00 至隔日 07:59。";

const TAIPEI_UTC_OFFSET_HOURS = 8;

function getResetBoundaryUtcOffsetMs(): number {
    return (CHECK_IN_RESET_HOUR_TAIPEI - TAIPEI_UTC_OFFSET_HOURS) * HOUR_MS;
}

export function createTaipeiCheckInResetDate(year: number, monthIndex: number, day: number): Date {
    return new Date(Date.UTC(year, monthIndex, day, CHECK_IN_RESET_HOUR_TAIPEI - TAIPEI_UTC_OFFSET_HOURS));
}

export function getTaipeiCheckInDayKey(date: Date): number {
    return Math.floor((date.getTime() - getResetBoundaryUtcOffsetMs()) / DAY_MS);
}

export function getCheckInDaysBetween(date1: Date, date2: Date): number {
    return getTaipeiCheckInDayKey(date2) - getTaipeiCheckInDayKey(date1);
}

export function hasCheckedInForTaipeiDay(
    lastCheckIn: string | Date | null | undefined,
    now: Date = new Date()
): boolean {
    if (!lastCheckIn) {
        return false;
    }

    return getTaipeiCheckInDayKey(new Date(lastCheckIn)) >= getTaipeiCheckInDayKey(now);
}

export function canCheckInForTaipeiDay(
    lastCheckIn: string | Date | null | undefined,
    now: Date = new Date()
): boolean {
    return !hasCheckedInForTaipeiDay(lastCheckIn, now);
}
