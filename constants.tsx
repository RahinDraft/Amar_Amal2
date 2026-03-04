
import { Deed, QuizQuestion } from './types';

export const DEFAULT_DEEDS: Deed[] = [
  { id: 'fajr', name: '৫ ওয়াক্ত নামাজ (ফজর)', points: 10, category: 'prayer' },
  { id: 'dhuhr', name: '৫ ওয়াক্ত নামাজ (যোহর)', points: 10, category: 'prayer' },
  { id: 'asr', name: '৫ ওয়াক্ত নামাজ (আসর)', points: 10, category: 'prayer' },
  { id: 'maghrib', name: '৫ ওয়াক্ত নামাজ (মাগরিব)', points: 10, category: 'prayer' },
  { id: 'isha', name: '৫ ওয়াক্ত নামাজ (এশা)', points: 10, category: 'prayer' },
  { id: 'taraweeh', name: 'তারাবিহ নামাজ', points: 15, category: 'prayer' },
  { id: 'tahajjud', name: 'তাহাজ্জুদ নামাজ', points: 30, category: 'prayer' },
  { id: 'dhikr', name: 'জিকির ও তসবিহ', points: 5, category: 'custom' },
  { id: 'dua', name: 'মাসনুন দোয়া পাঠ', points: 5, category: 'custom' },
  { id: 'sadaqah', name: 'সদকা করা', points: 20, category: 'charity' },
  { id: 'iftar_host', name: 'কাউকে ইফতার করানো', points: 25, category: 'social' },
  { id: 'quran_tilawat', name: 'কুরআন তিলাওয়াত', points: 20, category: 'quran' },
  { id: 'no_lying', name: 'মিথ্যা না বলা', points: 15, category: 'custom' },
  { id: 'no_backbiting', name: 'গীবত না করা', points: 15, category: 'custom' },
  { id: 'no_anger', name: 'রাগ না করা', points: 10, category: 'custom' },
  { id: 'help_parents', name: 'পিতা-মাতাকে সাহায্য', points: 20, category: 'social' },
];

export const SILENT_MODE_ITEMS = [
  { id: 'no_backbiting', name: 'গীবত না করা', points: 15 },
  { id: 'no_anger', name: 'রাগ না করা', points: 15 },
  { id: 'less_social', name: 'সোশ্যাল মিডিয়া কম ব্যবহার', points: 10 },
  { id: 'no_lying', name: 'মিথ্যা না বলা', points: 10 }
];

export const QURAN_TOTAL_PAGES = 604;
export const RAMADAN_DAYS = 30;

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 'q1',
    question: 'পবিত্র কুরআনের প্রথম সূরা কোনটি?',
    options: ['সূরা আল-বাকারাহ', 'সূরা আল-ফাতিহা', 'সূরা আল-ইখলাস', 'সূরা আন-নাস'],
    correctAnswer: 1,
    explanation: 'সূরা আল-ফাতিহা হলো কুরআনের প্রথম সূরা।',
    points: 10
  },
  {
    id: 'q2',
    question: 'রমজান মাসে রোজা রাখা ইসলামের কততম রুকন?',
    options: ['প্রথম', 'দ্বিতীয়', 'তৃতীয়', 'চতুর্থ'],
    correctAnswer: 3,
    explanation: 'ইসলামের পাঁচটি রুকনের মধ্যে রোজা হলো চতুর্থ রুকন।',
    points: 10
  },
  {
    id: 'q3',
    question: 'কোন রাতে পবিত্র কুরআন নাযিল শুরু হয়?',
    options: ['শবে বরাত', 'শবে মেরাজ', 'লাইলাতুল কদর', 'ঈদের রাত'],
    correctAnswer: 2,
    explanation: 'লাইলাতুল কদর বা কদরের রাতে কুরআন নাযিল শুরু হয়।',
    points: 10
  },
  {
    id: 'q4',
    question: 'কুরআনের সবচেয়ে বড় সূরা কোনটি?',
    options: ['সূরা আল-ইমরান', 'সূরা আল-বাকারাহ', 'সূরা আল-মায়েদাহ', 'সূরা আন-নিসা'],
    correctAnswer: 1,
    explanation: 'সূরা আল-বাকারাহ কুরআনের দীর্ঘতম সূরা।',
    points: 10
  },
  {
    id: 'q5',
    question: 'হাদিস অনুযায়ী জান্নাতের চাবি কোনটি?',
    options: ['রোজা', 'হজ', 'নামাজ', 'সদকা'],
    correctAnswer: 2,
    explanation: 'রাসূলুল্লাহ (সা.) বলেছেন, "নামাজ হলো জান্নাতের চাবি।"',
    points: 10
  },
  {
    id: 'q6',
    question: 'পবিত্র কুরআনের সবচেয়ে ছোট সূরা কোনটি?',
    options: ['সূরা আল-ইখলাস', 'সূরা আল-কাওসার', 'সূরা আন-নাস', 'সূরা আল-ফালাক'],
    correctAnswer: 1,
    explanation: 'সূরা আল-কাওসার পবিত্র কুরআনের সবচেয়ে ছোট সূরা।',
    points: 10
  },
  {
    id: 'q7',
    question: 'ইসলামের প্রথম খলিফা কে ছিলেন?',
    options: ['হযরত উমর (রা.)', 'হযরত আলী (রা.)', 'হযরত আবু বকর (রা.)', 'হযরত উসমান (রা.)'],
    correctAnswer: 2,
    explanation: 'হযরত আবু বকর (রা.) ছিলেন ইসলামের প্রথম খলিফা।',
    points: 10
  },
  {
    id: 'q8',
    question: 'কুরআনের কোন সূরাকে "কুরআনের হৃদয়" বলা হয়?',
    options: ['সূরা আর-রাহমান', 'সূরা ইয়াসিন', 'সূরা আল-বাকারাহ', 'সূরা আল-মুলক'],
    correctAnswer: 1,
    explanation: 'সূরা ইয়াসিনকে কুরআনের হৃদয় বলা হয়।',
    points: 10
  },
  {
    id: 'q9',
    question: 'হজ পালনের জন্য কোন মাসে মক্কায় যেতে হয়?',
    options: ['রমজান', 'শাওয়াল', 'জিলকদ', 'জিলহজ'],
    correctAnswer: 3,
    explanation: 'জিলহজ মাসে হজ পালিত হয়।',
    points: 10
  },
  {
    id: 'q10',
    question: 'পবিত্র কুরআনে মোট কতটি সূরা আছে?',
    options: ['১১০টি', '১১৪টি', '১২০টি', '১০৫টি'],
    correctAnswer: 1,
    explanation: 'পবিত্র কুরআনে মোট ১১৪টি সূরা আছে।',
    points: 10
  }
];

export const THEME = {
  primary: '#064e3b', // emerald-900
  secondary: '#022c22', // emerald-950
  accent: '#d97706', // amber-600
  gold: '#fbbf24', // amber-400
  text: '#f1f5f9', // slate-100
};
