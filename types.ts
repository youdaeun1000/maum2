
export enum MoodType {
  EXCITED = 'EXCITED',
  FUN = 'FUN',
  HAPPY = 'HAPPY',
  SMUG = 'SMUG',
  NORMAL = 'NORMAL',
  NEUTRAL = 'NEUTRAL',
  UNHAPPY = 'UNHAPPY',
  ANXIOUS = 'ANXIOUS'
}

export interface MoodEntry {
  id: string;
  timestamp: number;
  mood: MoodType;
  note: string;
  image?: string;
}

export interface Pattern {
  situation: string;
  moodEmoji: string;
  description: string;
}

export interface PatternAnalysisResult {
  summary: string;
  patterns: Pattern[];
}

/**
 * AI Insight result containing text analysis and optional landscape image URL
 */
export interface AIAnalysisResult {
  text: string;
  imageUrl?: string;
}

export interface MoodConfig {
  type: MoodType;
  emoji: string;
  label: string;
  color: string;
  score: number;
}

export const MOOD_CONFIGS: Record<MoodType, MoodConfig> = {
  [MoodType.EXCITED]: { type: MoodType.EXCITED, emoji: '🤩', label: '최고예요', color: 'bg-yellow-400', score: 5 },
  [MoodType.FUN]: { type: MoodType.FUN, emoji: '😆', label: '즐거워요', color: 'bg-orange-300', score: 4.5 },
  [MoodType.HAPPY]: { type: MoodType.HAPPY, emoji: '😊', label: '좋아요', color: 'bg-green-400', score: 4 },
  [MoodType.SMUG]: { type: MoodType.SMUG, emoji: '😏', label: '능청스러워요', color: 'bg-sky-400', score: 3.5 },
  [MoodType.NORMAL]: { type: MoodType.NORMAL, emoji: '🙂', label: '보통이에요', color: 'bg-teal-400', score: 3 },
  [MoodType.NEUTRAL]: { type: MoodType.NEUTRAL, emoji: '😐', label: '그저 그래요', color: 'bg-blue-300', score: 2.5 },
  [MoodType.UNHAPPY]: { type: MoodType.UNHAPPY, emoji: '☹', label: '침울해요', color: 'bg-gray-400', score: 2 },
  [MoodType.ANXIOUS]: { type: MoodType.ANXIOUS, emoji: '😰', label: '불안해요', color: 'bg-orange-400', score: 1.5 },
};
