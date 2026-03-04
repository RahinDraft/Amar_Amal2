
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { getFromStorage, saveToStorage } from '../utils/storage';

const DHIKR_LIST = [
  { id: 'subhanallah', name: 'সুবহানাল্লাহ', meaning: 'আল্লাহ অতি পবিত্র' },
  { id: 'alhamdulillah', name: 'আলহামদুলিল্লাহ', meaning: 'সকল প্রশংসা আল্লাহর' },
  { id: 'allahuakbar', name: 'আল্লাহু আকবার', meaning: 'আল্লাহ সবচেয়ে মহান' },
  { id: 'la_ilaha_illallah', name: 'লা ইলাহা ইল্লাল্লাহ', meaning: 'আল্লাহ ছাড়া কোনো উপাস্য নেই' },
  { id: 'astaghfirullah', name: 'আস্তাগফিরুল্লাহ', meaning: 'আমি আল্লাহর কাছে ক্ষমা চাই' },
];

interface TasbeehProps {
  userId: string;
}

const Tasbeeh: React.FC<TasbeehProps> = ({ userId }) => {
  const countKey = `ramadan_tasbeeh_count_${userId}`;
  const targetKey = `ramadan_tasbeeh_target_${userId}`;
  const totalKey = `ramadan_tasbeeh_total_${userId}`;
  const activeDhikrKey = `ramadan_active_dhikr_${userId}`;
  const dhikrCountsKey = `ramadan_dhikr_counts_${userId}`;

  const [count, setCount] = useState(() => getFromStorage<number>(countKey, 0));
  const [target, setTarget] = useState(() => getFromStorage<number>(targetKey, 33));
  const [totalCount, setTotalCount] = useState(() => getFromStorage<number>(totalKey, 0));
  const [activeDhikrId, setActiveDhikrId] = useState(() => getFromStorage<string>(activeDhikrKey, 'subhanallah'));
  const [dhikrCounts, setDhikrCounts] = useState<{ [key: string]: number }>(() => 
    getFromStorage<{ [key: string]: number }>(dhikrCountsKey, {})
  );
  const [isAnimating, setIsAnimating] = useState(false);

  const activeDhikr = useMemo(() => 
    DHIKR_LIST.find(d => d.id === activeDhikrId) || DHIKR_LIST[0]
  , [activeDhikrId]);

  useEffect(() => {
    saveToStorage(countKey, count);
    saveToStorage(targetKey, target);
    saveToStorage(totalKey, totalCount);
    saveToStorage(activeDhikrKey, activeDhikrId);
    saveToStorage(dhikrCountsKey, dhikrCounts);
  }, [count, target, totalCount, activeDhikrId, dhikrCounts, countKey, targetKey, totalKey, activeDhikrKey, dhikrCountsKey]);

  const handleIncrement = useCallback(() => {
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 150);
    
    if ('vibrate' in navigator) {
      navigator.vibrate(25);
    }

    setCount(prev => {
      const next = prev + 1;
      if (next === target && target > 0) {
        if ('vibrate' in navigator) navigator.vibrate([100, 50, 100]);
      }
      return next;
    });
    setTotalCount(prev => prev + 1);
    setDhikrCounts(prev => ({
      ...prev,
      [activeDhikrId]: (prev[activeDhikrId] || 0) + 1
    }));
  }, [target, activeDhikrId]);

  const handleReset = () => {
    if (window.confirm('আপনি কি বর্তমান কাউন্ট রিসেট করতে চান?')) {
      setCount(0);
    }
  };

  const handleResetAll = () => {
    if (window.confirm('আপনি কি সকল জিকিরের হিসাব রিসেট করতে চান?')) {
      setCount(0);
      setTotalCount(0);
      setDhikrCounts({});
    }
  };

  const progress = target > 0 ? (count / target) * 100 : (count % 100);
  const circumference = 2 * Math.PI * 95;
  const offset = circumference - (Math.min(100, progress) / 100) * circumference;

  // Generate beads coordinates
  const beads = useMemo(() => {
    const b = [];
    const count = 33; // Fixed beads for visual aesthetic
    for (let i = 0; i < count; i++) {
      const angle = (i * (360 / count) - 90) * (Math.PI / 180);
      const x = 128 + 95 * Math.cos(angle);
      const y = 128 + 95 * Math.sin(angle);
      b.push({ x, y, id: i });
    }
    return b;
  }, []);

  return (
    <div className="space-y-6 animate-fadeIn pb-10">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold font-playfair text-amber-400">ডিজিটাল তাসবীহ</h2>
        <button 
          onClick={handleReset}
          className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest bg-emerald-900/40 px-3 py-1 rounded-full border border-emerald-800"
        >
          Reset
        </button>
      </div>

      {/* Dhikr Selection Options at the Top */}
      <div className="overflow-x-auto pb-2 scrollbar-hide">
        <div className="flex gap-2 min-w-max">
          {DHIKR_LIST.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveDhikrId(item.id)}
              className={`px-4 py-2 rounded-full border text-xs font-bold transition-all whitespace-nowrap ${
                activeDhikrId === item.id 
                ? 'bg-amber-500 border-amber-500 text-emerald-950 shadow-lg shadow-amber-500/20' 
                : 'bg-emerald-900/40 border-emerald-800 text-emerald-500'
              }`}
            >
              {item.name}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-emerald-900/40 p-4 sm:p-6 rounded-3xl border border-emerald-800 flex flex-col items-center">
        <div className="text-center mb-4">
          <h3 className="text-base sm:text-lg font-bold text-amber-400">{activeDhikr.name}</h3>
          <p className="text-[9px] sm:text-[10px] text-emerald-500 italic">{activeDhikr.meaning}</p>
        </div>
        <div className="relative w-48 h-48 sm:w-64 sm:h-64 flex items-center justify-center">
          {/* Progress Ring */}
          <svg className="absolute inset-0 w-full h-full transform -rotate-90">
            <circle
              cx="96"
              cy="96"
              r="85"
              stroke="currentColor"
              strokeWidth="3"
              fill="transparent"
              className="text-emerald-950 sm:hidden"
            />
            <circle
              cx="128"
              cy="128"
              r="110"
              stroke="currentColor"
              strokeWidth="4"
              fill="transparent"
              className="text-emerald-950 hidden sm:block"
            />
            {/* Mobile Progress */}
            <circle
              cx="96"
              cy="96"
              r="85"
              stroke="url(#emeraldGradientMobile)"
              strokeWidth="6"
              fill="transparent"
              strokeDasharray={534}
              strokeDashoffset={534 - (534 * (count % target)) / target}
              strokeLinecap="round"
              className="transition-all duration-300 sm:hidden"
            />
            {/* Desktop Progress */}
            <circle
              cx="128"
              cy="128"
              r="110"
              stroke="url(#emeraldGradient)"
              strokeWidth="8"
              fill="transparent"
              strokeDasharray={691}
              strokeDashoffset={691 - (691 * (count % target)) / target}
              strokeLinecap="round"
              className="transition-all duration-300 hidden sm:block"
            />
            <defs>
              <linearGradient id="emeraldGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#fbbf24" />
              </linearGradient>
              <linearGradient id="emeraldGradientMobile" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#fbbf24" />
              </linearGradient>
            </defs>
          </svg>

          {/* Main Counter Button */}
          <button 
            onClick={handleIncrement}
            className="relative z-10 w-36 h-36 sm:w-48 sm:h-48 rounded-full bg-gradient-to-br from-emerald-800 to-emerald-950 border-4 border-emerald-700 shadow-2xl flex flex-col items-center justify-center active:scale-95 transition-all group"
          >
            <span className="text-4xl sm:text-5xl font-bold font-playfair text-amber-400 group-active:scale-110 transition-transform">{count}</span>
            <span className="text-[8px] sm:text-[10px] text-emerald-500 font-bold uppercase tracking-widest mt-1 sm:mt-2">Tap</span>
          </button>
        </div>

        <div className="mt-8 w-full grid grid-cols-3 gap-3">
          {[33, 99, 100].map((t) => (
            <button
              key={t}
              onClick={() => setTarget(t)}
              className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                target === t 
                ? 'bg-amber-500 border-amber-500 text-emerald-950 shadow-lg shadow-amber-500/20' 
                : 'bg-emerald-900/40 border-emerald-800 text-emerald-500'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-emerald-900/20 p-4 rounded-2xl border border-emerald-800/50">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔄</span>
            <div>
              <h4 className="text-xs font-bold text-emerald-500 uppercase">মোট জিকির</h4>
              <p className="text-lg font-bold text-amber-400">{totalCount}</p>
            </div>
          </div>
          <button 
            onClick={handleResetAll}
            className="text-[9px] font-bold text-red-500 uppercase tracking-widest bg-red-900/20 px-3 py-1 rounded-lg border border-red-900/30"
          >
            Reset All
          </button>
        </div>

        {/* Individual Dhikr Counts */}
        <div className="space-y-2 pt-2 border-t border-emerald-800/30">
          {DHIKR_LIST.map((dhikr) => (
            <div key={dhikr.id} className="flex justify-between items-center text-[11px]">
              <span className="text-emerald-500 font-medium">{dhikr.name}</span>
              <span className="text-slate-400 font-mono">{dhikrCounts[dhikr.id] || 0} বার</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Tasbeeh;
