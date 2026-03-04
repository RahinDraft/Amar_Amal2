
import React, { useState, useEffect } from 'react';
import { getFromStorage } from '../utils/storage';

interface OnboardingProps {
  onComplete: (name: string, isAdmin: boolean, existingId?: string) => void;
  correctPin: string;
  devName: string;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete, correctPin, devName }) => {
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [showPinField, setShowPinField] = useState(false);
  const [error, setError] = useState('');
  const [existingUsers, setExistingUsers] = useState<{name: string, id: string}[]>([]);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  useEffect(() => {
    const registry = getFromStorage<{name: string, id: string}[]>('ramadan_user_registry', []);
    setExistingUsers(registry);
    // If no users exist, default to create view
    if (registry.length === 0) {
      setIsCreatingNew(true);
    }
  }, []);

  useEffect(() => {
    if (name.trim().toLowerCase() === 'admin') {
      setShowPinField(true);
    } else {
      setShowPinField(false);
      setPin('');
      setError('');
    }
  }, [name]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) return;

    if (trimmedName.toLowerCase() === 'admin') {
      if (pin === correctPin) {
        onComplete(trimmedName, true);
      } else {
        setError('ভুল পিন!');
      }
    } else {
      onComplete(trimmedName, false);
    }
  };

  const handleProfileSelect = (user: {name: string, id: string}) => {
    onComplete(user.name, false, user.id);
  };

  const getShortId = (id: string) => {
    const parts = id.split('_');
    return parts[parts.length - 1].toUpperCase();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-emerald-950 text-slate-100 p-6 relative overflow-hidden">
      <div className="absolute inset-0 islamic-pattern opacity-10 pointer-events-none"></div>
      
      <div className="relative z-10 w-full max-w-sm text-center animate-fadeIn">
        <div className="w-16 h-16 bg-amber-500 rounded-full flex items-center justify-center text-3xl shadow-2xl shadow-amber-500/20 mx-auto mb-4">🌙</div>
        
        <h1 className="text-2xl font-bold font-playfair text-amber-500 mb-1">আমার আমল</h1>
        <p className="text-emerald-400 text-[10px] mb-8 uppercase tracking-[0.2em] font-bold">Spiritual Progress Manager</p>
        
        {!isCreatingNew && existingUsers.length > 0 ? (
          <div className="animate-fadeIn">
            <h3 className="text-xs font-bold text-emerald-500 uppercase mb-4 tracking-widest text-left ml-1">ব্যবহারকারী নির্বাচন করুন</h3>
            <div className="grid grid-cols-1 gap-3 max-h-[40vh] overflow-y-auto pr-1 custom-scrollbar mb-6">
              {existingUsers.map(user => (
                <button 
                  key={user.id} 
                  onClick={() => handleProfileSelect(user)} 
                  className="bg-emerald-900/30 border border-emerald-800 hover:border-amber-500/50 p-4 rounded-2xl flex items-center justify-between transition-all active:scale-[0.98] group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-800 flex items-center justify-center text-lg border border-emerald-700">👤</div>
                    <div className="text-left">
                      <p className="text-sm font-bold text-slate-200 group-hover:text-amber-400 transition-colors">{user.name}</p>
                      <p className="text-[9px] font-mono text-emerald-600 font-bold uppercase tracking-tighter">ID: #{getShortId(user.id)}</p>
                    </div>
                  </div>
                  <div className="text-emerald-700 group-hover:text-amber-500">▶</div>
                </button>
              ))}
            </div>
            
            <div className="flex items-center gap-4 mb-6">
              <div className="flex-1 h-px bg-emerald-900/50"></div>
              <span className="text-[10px] text-emerald-700 font-bold uppercase">অথবা</span>
              <div className="flex-1 h-px bg-emerald-900/50"></div>
            </div>

            <button 
              onClick={() => setIsCreatingNew(true)}
              className="w-full bg-emerald-800/50 border border-emerald-700 text-emerald-400 font-bold py-4 rounded-2xl text-sm hover:bg-emerald-800 transition-all active:scale-95"
            >
              ➕ নতুন ইউজার যোগ করুন
            </button>
          </div>
        ) : (
          <div className="animate-fadeIn">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="text-left">
                <div className="flex justify-between items-center mb-2 ml-1">
                  <label className="block text-[10px] font-bold text-emerald-500 uppercase tracking-widest">নতুন নাম লিখুন</label>
                  {existingUsers.length > 0 && (
                    <button 
                      type="button"
                      onClick={() => setIsCreatingNew(false)}
                      className="text-[10px] text-amber-500 font-bold underline uppercase"
                    >
                      তালিকায় ফিরে যান
                    </button>
                  )}
                </div>
                <input 
                  type="text" 
                  required 
                  autoFocus
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  placeholder="আপনার নাম..." 
                  className="w-full bg-emerald-900/50 border-2 border-emerald-800 rounded-2xl px-5 py-4 text-lg focus:outline-none focus:border-amber-500 transition-all text-slate-100 placeholder:text-emerald-800" 
                />
              </div>

              {showPinField && (
                <div className="text-left animate-fadeIn">
                  <label className="block text-xs font-bold text-amber-500 uppercase tracking-widest mb-2 ml-1">এডমিন পিন</label>
                  <input 
                    type="password" 
                    maxLength={4} 
                    required 
                    value={pin} 
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))} 
                    placeholder="****" 
                    className="w-full bg-emerald-900/50 border-2 border-amber-500/50 rounded-2xl px-5 py-4 text-center text-2xl tracking-[1em] focus:outline-none focus:border-amber-500 transition-all text-amber-400 font-mono" 
                  />
                  {error && <p className="text-red-500 text-[10px] mt-2 ml-1 font-bold uppercase">{error}</p>}
                </div>
              )}
              
              <button 
                type="submit" 
                className={`w-full font-bold text-lg py-4 rounded-2xl shadow-xl active:scale-95 transition-all ${
                  showPinField ? 'bg-amber-600 text-white' : 'bg-amber-500 text-emerald-950'
                }`}
              >
                {showPinField ? 'এডমিন লগিন' : 'শুরু করুন'}
              </button>
            </form>
          </div>
        )}
        
        <p className="mt-12 text-[9px] text-emerald-800/60 uppercase tracking-[0.2em] font-bold">
          Developed by: <span className="text-amber-600/60">{devName}</span>
        </p>
      </div>
    </div>
  );
};

export default Onboarding;
