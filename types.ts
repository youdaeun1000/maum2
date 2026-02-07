
export enum MoodType {
  EXCITED = 'EXCITED',
  FUN = 'FUN',
  HAPPY = 'HAPPY',
  NORMAL = 'NORMAL',
  NEUTRAL = 'NEUTRAL',
  UNHAPPY = 'UNHAPPY',
  ANXIOUS = 'ANXIOUS',
  SAD = 'SAD'
}

export type NuanceKey = 'fear_safety' | 'anxiety_stability' | 'worry_carefree' | 'ominous_good' | 'guilt_proud';

export interface MoodEntry {
  id: string;
  timestamp: number;
  mood: MoodType;
  note: string;
  nuances?: Partial<Record<NuanceKey, string>>;
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
  [MoodType.NORMAL]: { type: MoodType.NORMAL, emoji: '🙂', label: '보통이에요', color: 'bg-teal-400', score: 3 },
  [MoodType.NEUTRAL]: { type: MoodType.NEUTRAL, emoji: '😐', label: '그저 그래요', color: 'bg-blue-300', score: 2.5 },
  [MoodType.UNHAPPY]: { type: MoodType.UNHAPPY, emoji: '☹', label: '침울해요', color: 'bg-gray-400', score: 2 },
  [MoodType.ANXIOUS]: { type: MoodType.ANXIOUS, emoji: '😰', label: '불안해요', color: 'bg-orange-400', score: 1.5 },
  [MoodType.SAD]: { type: MoodType.SAD, emoji: '😢', label: '슬퍼요', color: 'bg-indigo-400', score: 1 },
};

export const NUANCE_PAIRS: Record<NuanceKey, [string, string]> = {
  fear_safety: ['무섭다', '안전하다'],
  anxiety_stability: ['불안하다', '안정적이다'],
  worry_carefree: ['걱정하다', '태평천하하다'],
  ominous_good: ['불길하다', '예감이 좋다'],
  guilt_proud: ['죄책감이 든다', '떳떳당당하다'],
};
