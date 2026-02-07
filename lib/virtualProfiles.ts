// 虛擬用戶工具函數
// 用於模擬系統獲取虛擬用戶資料

import { supabase } from "@/lib/supabase";

export interface VirtualProfile {
    id: string;
    display_name: string;
    avatar_seed: string;
    member_since: string;
    collection_count: number;
    bid_count: number;
}

let cachedVirtualProfiles: VirtualProfile[] | null = null;

// 載入所有虛擬用戶（帶快取）
export async function loadVirtualProfiles(): Promise<VirtualProfile[]> {
    if (cachedVirtualProfiles) {
        return cachedVirtualProfiles;
    }

    const { data, error } = await supabase
        .from('virtual_profiles')
        .select('id, display_name, avatar_seed, member_since, collection_count, bid_count')
        .eq('is_virtual', true);

    if (error || !data) {
        console.error('載入虛擬用戶失敗:', error);
        return [];
    }

    cachedVirtualProfiles = data;
    return data;
}

// 隨機獲取一個虛擬用戶
export async function getRandomVirtualProfile(): Promise<VirtualProfile | null> {
    const profiles = await loadVirtualProfiles();
    if (profiles.length === 0) return null;
    return profiles[Math.floor(Math.random() * profiles.length)];
}

// 隨機獲取多個不重複的虛擬用戶
export async function getRandomVirtualProfiles(count: number): Promise<VirtualProfile[]> {
    const profiles = await loadVirtualProfiles();
    if (profiles.length === 0) return [];

    // 如果要求的數量超過可用數量，返回全部
    if (count >= profiles.length) {
        return [...profiles];
    }

    // Fisher-Yates 洗牌取前 N 個
    const shuffled = [...profiles];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled.slice(0, count);
}

// 清除快取（如果需要重新載入）
export function clearVirtualProfilesCache() {
    cachedVirtualProfiles = null;
}
