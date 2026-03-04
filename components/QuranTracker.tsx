import React, { useState } from 'react';
import { QURAN_TOTAL_PAGES } from '../constants';

interface QuranTrackerProps {
  totalPagesRead: number;
  onUpdatePages: (pages: number) => void;
}

const QuranTracker: React.FC<QuranTrackerProps> = ({ totalPagesRead, onUpdatePages }) => {
  const [inputVal, setInputVal] = useState('');
  
  const pagesPerDay = Math.ceil(QURAN_TOTAL_PAGES / 30);
  const progressPercent = Math.min(100, Math.round((totalPagesRead / QURAN_TOTAL_PAGES) * 100));
  const pagesRemaining = QURAN_TOTAL_PAGES - totalPagesRead;

  const handleUpdate = () => {
    const pages = parseInt(inputVal);
    if (!isNaN(pages) && pages > 0) {
      onUpdatePages(pages);
      setInputVal('');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-10">
      <h2 className="text-xl font-bold font-playfair text-amber-400">কুরআন তিলাওয়াত ট্র্যাকার</h2>

      <div className="bg-emerald-900/40 p-6 rounded-3xl border border-emerald-800 flex flex-col items-center text-center">
        <div className="relative w-40 h-40 mb-4">
          <div className="absolute inset-0 rounded-full border-8 border-emerald-950"></div>
          <div 
            className="absolute inset-0 rounded-full border-8 border-amber-500 border-t-transparent border-r-transparent transition-all duration-1000"
            style={{ transform: `rotate(${progressPercent * 3.6}deg)` }}
          ></div>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-amber-400">{progressPercent}%</span>
            <span className="text-[10px] text-emerald-500 font-bold uppercase">পড়া হয়েছে</span>
          </div>
        </div>
        <p className="text-sm text-slate-300">আপনি খতমের লক্ষ্যমাত্রার <span className="text-amber-400 font-bold">{progressPercent}%</span> সম্পন্ন করেছেন।</p>
      </div>

      <div className="bg-emerald-900/40 p-5 rounded-2xl border border-emerald-800">
        <h3 className="text-xs font-bold text-emerald-500 uppercase tracking-widest mb-4">আজকের তিলাওয়াত যোগ করুন</h3>
        <div className="flex gap-2">
          <input 
            type="number" 
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="কত পৃষ্ঠা পড়লেন?"
            className="flex-1 bg-emerald-950 border border-emerald-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500 text-slate-200"
          />
          <button 
            onClick={handleUpdate}
            className="bg-emerald-800 text-amber-400 font-bold px-6 py-3 rounded-xl text-sm border border-emerald-700 active:scale-95"
          >
            যোগ করুন
          </button>
        </div>
      </div>

      <div className="bg-emerald-900/20 p-4 rounded-2xl border border-emerald-800/50 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <span className="text-2xl">📖</span>
          <div>
            <h4 className="text-xs font-bold text-emerald-500 uppercase">মোট পড়া হয়েছে</h4>
            <p className="text-lg font-bold text-amber-400">{totalPagesRead} পৃষ্ঠা</p>
          </div>
        </div>
        <div className="text-right">
          <h4 className="text-xs font-bold text-emerald-500 uppercase">অবশিষ্ট</h4>
          <p className="text-lg font-bold text-slate-400">{pagesRemaining} পৃষ্ঠা</p>
        </div>
      </div>
    </div>
  );
};

export default QuranTracker;