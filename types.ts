
export enum View {
  DASHBOARD = 'DASHBOARD',
  DEEDS = 'DEEDS',
  QURAN = 'QURAN',
  TASBEEH = 'TASBEEH',
  STATS = 'STATS',
  SOCIAL = 'SOCIAL',
  GOALS = 'GOALS',
  QUIZ = 'QUIZ',
  ADMIN = 'ADMIN'
}

export interface UserFeedback {
  id: string;
  userName: string;
  rating: number;
  message: string;
  date: string;
}

export interface Deed {
  id: string;
  name: string;
  points: number;
  category: 'prayer' | 'quran' | 'charity' | 'social' | 'custom';
}

export interface DailyRecord {
  date: string; // YYYY-MM-DD
  completedDeeds: string[]; // array of deed IDs
  quranPagesRead: number;
  sadaqahAmount: number;
  notes: string;
  isSilentModeActive: boolean;
  completedSilentItems: string[];
  quizPoints?: number;
}

export interface PrayerTimes {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
  Imsak: string;
  Midnight: string;
}

export interface GroupMember {
  id: string;
  name: string;
  points: number;
  todayProgress: number; // 0 to 100
  avatar: string;
}

export interface SocialGroup {
  id: string;
  name: string;
  code: string;
  members: GroupMember[];
}

export interface Message {
  role: 'user' | 'model';
  text: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  points: number;
}
