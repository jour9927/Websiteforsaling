/**
 * 語種檢測與標籤工具函數
 * 用於檢測配布的親名 (Original Trainer) 語種
 */

export type Language = 'Korean' | 'Japanese' | 'Chinese' | 'Other';

/**
 * 根據親名檢測語種
 * 優先級：韓文 > 日文(含假名) > 中文(純漢字) > 英文/其他
 * @param originalTrainer 親名字串
 * @returns 語種類型
 */
export function detectLanguage(originalTrainer?: string): Language {
    if (!originalTrainer) return 'Other';

    // 檢測韓文（Hangul）
    if (/[가-힣]/.test(originalTrainer)) return 'Korean';

    // 檢測日文 — 必須包含假名（平假名或片假名）才算日文
    if (/[ぁ-んァ-ヶー]/.test(originalTrainer)) return 'Japanese';

    // 檢測中文 — 包含 CJK 漢字但不含假名（已被上面過濾）
    if (/[\u4e00-\u9fff]/.test(originalTrainer)) return 'Chinese';

    // 預設為英文/其他（包含全形英數字）
    return 'Other';
}

/**
 * 獲取語種標籤顯示文字
 * @param lang 語種類型
 * @returns 標籤文字
 */
export function getLanguageTag(lang: Language): string {
    switch (lang) {
        case 'Korean':
            return '韓';
        case 'Japanese':
            return '日';
        case 'Chinese':
            return '中';
        case 'Other':
            return '英';
    }
}

/**
 * 獲取語種標籤 pill 徽章的樣式
 * @param lang 語種類型
 * @returns Tailwind CSS class string
 */
export function getLanguageStyle(lang: Language): string {
    switch (lang) {
        case 'Japanese':
            return 'bg-red-500/20 text-red-300';
        case 'Korean':
            return 'bg-blue-500/20 text-blue-300';
        case 'Chinese':
            return 'bg-amber-500/20 text-amber-300';
        case 'Other':
            return 'bg-emerald-500/20 text-emerald-300';
    }
}
