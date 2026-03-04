
import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { DailyRecord, UserFeedback, View } from '../types';
import { getFromStorage, saveToStorage } from '../utils/storage';

interface StatsProps {
  history: DailyRecord[];
  calculatePoints: (record: DailyRecord) => number;
  onLogout: () => void;
  devName: string;
  onViewChange: (view: View) => void;
}

const Stats: React.FC<StatsProps> = ({ history, calculatePoints, onLogout, devName, onViewChange }) => {
  const userName = getFromStorage('ramadan_user_name', 'ইউজার');
  
  const [showFeedback, setShowFeedback] = useState(false);
  const [rating, setRating] = useState(5);
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const data = history.slice(-7).map(h => ({
    name: h.date.split('-').slice(2).join('/'),
    points: calculatePoints(h),
    deeds: h.completedDeeds.length
  }));

  const totalSadaqah = history.reduce((sum, h) => sum + (h.sadaqahAmount || 0), 0);
  const totalQuran = history.reduce((sum, h) => sum + (h.quranPagesRead || 0), 0);
  const totalQuizPoints = history.reduce((sum, h) => sum + (h.quizPoints || 0), 0);
  const cumulativePoints = history.reduce((sum, h) => sum + calculatePoints(h), 0);

  const handleFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    const feedback: UserFeedback = {
      id: Date.now().toString(),
      userName: userName,
      rating: rating,
      message: message.trim(),
      date: new Date().toLocaleDateString('bn-BD')
    };

    const existingFeedbacks = getFromStorage<UserFeedback[]>('ramadan_user_feedbacks', []);
    saveToStorage('ramadan_user_feedbacks', [...existingFeedbacks, feedback]);
    
    setSubmitted(true);
    setTimeout(() => {
      setShowFeedback(false);
      setSubmitted(false);
      setMessage('');
    }, 2000);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-10">
      <h2 className="text-xl font-bold font-playfair text-amber-400">সাপ্তাহিক রিপোর্ট</h2>

      <div className="bg-emerald-900/40 p-4 rounded-2xl border border-emerald-800">
        <h3 className="text-sm font-bold text-emerald-400 mb-4">পয়েন্টস স্ট্যাটিস্টিক্স</h3>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#064e3b" />
              <XAxis dataKey="name" stroke="#52e08a" fontSize={10} />
              <YAxis stroke="#52e08a" fontSize={10} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#022c22', border: '1px solid #064e3b' }}
                itemStyle={{ color: '#fbbf24' }}
              />
              <Bar dataKey="points">
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={index === data.length - 1 ? '#fbbf24' : '#d97706'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-2 xs:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-emerald-900/40 p-3 sm:p-4 rounded-2xl border border-emerald-800 flex flex-col items-center">
          <span className="text-2xl sm:text-3xl mb-1">🤲</span>
          <span className="text-[10px] sm:text-xs text-emerald-500 font-bold uppercase">মোট সদকা</span>
          <span className="text-base sm:text-lg font-bold text-amber-400">৳ {totalSadaqah}</span>
        </div>
        <div className="bg-emerald-900/40 p-3 sm:p-4 rounded-2xl border border-emerald-800 flex flex-col items-center">
          <span className="text-2xl sm:text-3xl mb-1">📖</span>
          <span className="text-[10px] sm:text-xs text-emerald-500 font-bold uppercase">মোট তিলাওয়াত</span>
          <span className="text-base sm:text-lg font-bold text-amber-400">{totalQuran} পৃষ্ঠা</span>
        </div>
        <div className="col-span-2 xs:col-span-1 bg-emerald-900/40 p-3 sm:p-4 rounded-2xl border border-emerald-800 flex flex-col items-center">
          <span className="text-2xl sm:text-3xl mb-1">❓</span>
          <span className="text-[10px] sm:text-xs text-emerald-500 font-bold uppercase">কুইজ পয়েন্ট</span>
          <span className="text-base sm:text-lg font-bold text-amber-400">{totalQuizPoints}</span>
        </div>
      </div>

      <div className="bg-emerald-900/40 p-5 rounded-2xl border border-emerald-800">
        <h3 className="text-sm font-bold text-amber-400 mb-3">Level of Taqwa</h3>
        <div className="space-y-4">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-300">বর্তমান লেভেল: <span className="text-amber-500 font-bold">
              {cumulativePoints > 1000 ? 'মুহসিন' : cumulativePoints > 300 ? 'মুমিন' : 'মুসলিম'}
            </span></span>
            <span className="text-slate-400">Total: {cumulativePoints} Pts</span>
          </div>
          <div className="w-full bg-emerald-950 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-amber-600 to-amber-400 h-2 rounded-full transition-all duration-1000" 
              style={{ width: `${Math.min(100, (cumulativePoints / 2000) * 100)}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Feedback Section */}
      <div className="bg-emerald-900/40 p-5 rounded-2xl border border-emerald-800 border-dashed">
        {!showFeedback ? (
          <div className="text-center py-2">
            <p className="text-xs text-emerald-500 mb-3 italic">আপনার কোনো মতামত বা পরামর্শ আছে?</p>
            <button 
              onClick={() => setShowFeedback(true)}
              className="bg-emerald-800 hover:bg-emerald-700 text-amber-400 text-[10px] font-bold uppercase tracking-widest px-6 py-2 rounded-full border border-emerald-700 transition-all"
            >
              ✍️ মতামত জানান
            </button>
          </div>
        ) : (
          <div className="animate-slideUp">
            {submitted ? (
              <div className="text-center py-4">
                <span className="text-3xl mb-2 block">✨</span>
                <p className="text-sm font-bold text-amber-400">ধন্যবাদ! আপনার মতামত পাঠানো হয়েছে।</p>
              </div>
            ) : (
              <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                <div className="flex justify-between items-center">
                   <h4 className="text-[10px] font-bold text-emerald-500 uppercase">মতামত দিন</h4>
                   <div className="flex gap-1">
                     {[1, 2, 3, 4, 5].map((s) => (
                       <button 
                         key={s} 
                         type="button" 
                         onClick={() => setRating(s)}
                         className={`text-sm ${rating >= s ? 'grayscale-0' : 'grayscale opacity-30'}`}
                       >
                         ⭐
                       </button>
                     ))}
                   </div>
                </div>
                <textarea 
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="আপনার কথা এখানে লিখুন..."
                  className="w-full bg-emerald-950 border border-emerald-800 rounded-xl px-4 py-3 text-xs text-slate-100 focus:outline-none focus:border-amber-500 h-24"
                />
                <div className="flex gap-2">
                  <button type="button" onClick={() => setShowFeedback(false)} className="flex-1 text-[10px] text-emerald-700 font-bold uppercase py-2">বন্ধ করুন</button>
                  <button type="submit" className="flex-1 bg-amber-500 text-emerald-950 font-bold py-2 rounded-xl text-[10px] uppercase shadow-lg shadow-amber-500/20">সাবমিট করুন</button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>

      {/* Developer Credit Display */}
      <div className="bg-emerald-900/20 p-4 rounded-2xl border border-emerald-800/30 text-center">
         <p className="text-[10px] text-emerald-700 font-bold uppercase tracking-widest mb-1">Application Developer</p>
         <p className="text-sm font-bold text-amber-500/80 font-playfair">{devName}</p>
      </div>

      <button 
        onClick={onLogout}
        className="w-full py-4 rounded-2xl border border-emerald-800 text-emerald-600 text-xs font-bold uppercase tracking-widest hover:bg-emerald-900/20 transition-colors"
      >
        🚪 লগ আউট / নাম পরিবর্তন করুন
      </button>
    </div>
  );
};

export default Stats;
