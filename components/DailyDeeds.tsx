
import React, { useState, useEffect } from 'react';
import { Deed, DailyRecord } from '../types';

interface DailyDeedsProps {
  deeds: Deed[];
  record: DailyRecord;
  onToggleDeed: (deedId: string) => void;
  onAddCustomDeed: (name: string, points: number) => void;
  onUpdateSadaqah: (amount: number) => void;
}

const DailyDeeds: React.FC<DailyDeedsProps> = ({ deeds, record, onToggleDeed, onAddCustomDeed, onUpdateSadaqah }) => {
  const [customName, setCustomName] = useState('');
  const [sadaqahInput, setSadaqahInput] = useState(record.sadaqahAmount?.toString() || '');

  // Sync internal state with record prop when it changes (e.g., new day)
  useEffect(() => {
    setSadaqahInput(record.sadaqahAmount?.toString() || '');
  }, [record.sadaqahAmount]);

  const handleToggle = (id: string) => {
    onToggleDeed(id);
  };

  const handleAddCustom = () => {
    if (customName.trim()) {
      onAddCustomDeed(customName, 5);
      setCustomName('');
    }
  };

  const handleSadaqahBlur = () => {
    const amount = parseFloat(sadaqahInput);
    if (!isNaN(amount)) {
      onUpdateSadaqah(amount);
    } else {
      onUpdateSadaqah(0);
      setSadaqahInput('0');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-10">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold font-playfair text-amber-400">ডেইলি আমল চেকলিস্ট</h2>
        <span className="bg-emerald-800 text-emerald-300 text-[10px] px-2 py-1 rounded-full font-bold uppercase">
          {record.completedDeeds.length}/{deeds.length} DONE
        </span>
      </div>

      {/* Sadaqah Input Section */}
      <section className="bg-amber-500/10 border border-amber-500/30 p-5 rounded-2xl">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-2xl">🤲</span>
          <h3 className="text-sm font-bold text-amber-500 uppercase tracking-wider">আজকের সদকা (৳)</h3>
        </div>
        <div className="flex gap-2">
          <input 
            type="number" 
            value={sadaqahInput}
            onChange={(e) => setSadaqahInput(e.target.value)}
            onBlur={handleSadaqahBlur}
            placeholder="পরিমাণ লিখুন..."
            className="flex-1 bg-emerald-950 border border-emerald-800 rounded-xl px-4 py-3 text-lg font-bold text-amber-400 focus:outline-none focus:border-amber-500"
          />
          <div className="bg-emerald-900/50 px-4 flex items-center justify-center rounded-xl border border-emerald-800">
            <span className="text-emerald-500 font-bold">BDT</span>
          </div>
        </div>
        <p className="text-[10px] text-emerald-600 mt-2 italic">এই পরিমাণটি আপনার মোট রিপোর্টে যোগ করা হবে।</p>
      </section>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {deeds.map((deed) => {
          const isCompleted = record.completedDeeds.includes(deed.id);
          return (
            <div 
              key={deed.id}
              onClick={() => handleToggle(deed.id)}
              className={`flex items-center gap-3 p-3 rounded-2xl border transition-all cursor-pointer ${
                isCompleted 
                ? 'bg-amber-500/15 border-amber-500 scale-[0.98]' 
                : 'bg-emerald-900/40 border-emerald-800'
              }`}
            >
              <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all shrink-0 ${
                isCompleted ? 'bg-amber-500 border-amber-500' : 'border-emerald-700'
              }`}>
                {isCompleted && <span className="text-emerald-950 text-[10px] font-bold">✓</span>}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className={`text-xs font-bold truncate ${isCompleted ? 'text-amber-400' : 'text-slate-200'}`}>
                  {deed.name}
                </h4>
                <p className="text-[9px] text-emerald-600 font-bold">+{deed.points} Pts</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 pt-6 border-t border-emerald-900/50">
        <h3 className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-3">কাস্টম আমল যোগ করুন</h3>
        <div className="flex gap-2">
          <input 
            type="text" 
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            placeholder="যেমন: ইয়াতিমকে খাওয়ানো..."
            className="flex-1 bg-emerald-950 border border-emerald-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500 text-slate-200"
          />
          <button 
            onClick={handleAddCustom}
            className="bg-emerald-800 text-amber-400 font-bold px-6 py-3 rounded-xl text-sm border border-emerald-700 active:scale-95"
          >
            যোগ করুন
          </button>
        </div>
      </div>
    </div>
  );
};

export default DailyDeeds;
