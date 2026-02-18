/**
 * 語種檢測與標籤工具函數
 * 用於檢測配布的親名 (Original Trainer) 語種
 */

export type Language = 'Korean' | 'Japanese' | 'Other';

/**
 * 根據親名檢測語種
 * @param originalTrainer 親名字串
 * @returns 語種類型
 */
export function detectLanguage(originalTrainer?: string): Language {
    if (!originalTrainer) return 'Other';

    // 檢測韓文（Hangul）
    if (/[가-힣]/.test(originalTrainer)) return 'Korean';

    // 檢測日文（Hiragana, Katakana, Kanji）
    if (/[ぁ-んァ-ン一-龠]|[ァ-ヶー]/.test(originalTrainer)) return 'Japanese';

    // 預設為英文/其他
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
        case 'Other':
            return 'bg-emerald-500/20 text-emerald-300';
    }
}
