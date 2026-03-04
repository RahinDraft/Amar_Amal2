
import React, { useState, useEffect, useCallback } from 'react';
import { Deed, DailyRecord, UserFeedback } from '../types';
import { saveToStorage, getFromStorage } from '../utils/storage';
import { SILENT_MODE_ITEMS } from '../constants';

interface AdminProps {
  userName: string;
  setUserName: (name: string) => void;
  deeds: Deed[];
  setDeeds: (deeds: Deed[]) => void;
  history: DailyRecord[];
  setHistory: (history: DailyRecord[]) => void;
  adminPin: string;
  setAdminPin: (pin: string) => void;
  onLogout: () => void;
  devName: string;
  setDevName: (name: string) => void;
}

const Admin: React.FC<AdminProps> = ({ 
  userName, setUserName, deeds, setDeeds, adminPin, setAdminPin, onLogout, devName 
}) => {
  const [editingName, setEditingName] = useState(userName);
  const [newPin, setNewPin] = useState('');
  const [isSettingPin, setIsSettingPin] = useState(false);
  const [users, setUsers] = useState<{name: string, id: string, totalPoints: number}[]>([]);
  const [feedbacks, setFeedbacks] = useState<UserFeedback[]>(() => getFromStorage('ramadan_user_feedbacks', []));
  
  const [newDeedName, setNewDeedName] = useState('');
  const [newDeedPoints, setNewDeedPoints] = useState<number>(10);
  const [isAddingDeed, setIsAddingDeed] = useState(false);
  const [userToDelete, setUserToDelete] = useState<{id: string, name: string} | null>(null);

  const calculatePoints = useCallback((record: DailyRecord, currentDeeds: Deed[]) => {
    const deedPoints = (record.completedDeeds || []).reduce((dAcc, id) => {
      const deed = currentDeeds.find(d => d.id === id);
      return dAcc + (deed?.points || 0);
    }, 0);
    const silentPoints = (record.completedSilentItems || []).reduce((sAcc, id) => {
      const item = SILENT_MODE_ITEMS.find(s => s.id === id);
      return sAcc + (item?.points || 0);
    }, 0);
    return deedPoints + (record.quranPagesRead * 2) + silentPoints + (record.quizPoints || 0);
  }, []);

  const refreshUserList = useCallback(() => {
    const registry = getFromStorage<{name: string, id: string}[]>('ramadan_user_registry', []);
    const adminDeeds = getFromStorage<Deed[]>('ramadan_deeds_admin', deeds);
    
    const enrichedUsers = registry.map(u => {
      const userHistory = getFromStorage<DailyRecord[]>(`ramadan_history_${u.id}`, []);
      // Try to get user-specific deeds for accurate calculation, fallback to admin deeds
      const userDeeds = getFromStorage<Deed[]>(`ramadan_deeds_${u.id}`, adminDeeds);
      const totalPoints = userHistory.reduce((acc, h) => acc + calculatePoints(h, userDeeds), 0);
      return { ...u, totalPoints };
    });
    setUsers(enrichedUsers.sort((a, b) => b.totalPoints - a.totalPoints));
  }, [deeds, calculatePoints]);

  const deleteUser = useCallback((id: string, name: string) => {
    if (id === 'admin') {
      alert('এডমিন ইউজার ডিলিট করা সম্ভব নয়।');
      return;
    }
    
    try {
      const registry = getFromStorage<{name: string, id: string}[]>('ramadan_user_registry', []);
      const updatedRegistry = registry.filter(u => u.id !== id);
      saveToStorage('ramadan_user_registry', updatedRegistry);
      
      // Clear user specific data
      localStorage.removeItem(`ramadan_history_${id}`);
      localStorage.removeItem(`ramadan_deeds_${id}`);
      localStorage.removeItem(`ramadan_tasbeeh_count_${id}`);
      localStorage.removeItem(`ramadan_tasbeeh_total_${id}`);
      localStorage.removeItem(`ramadan_tasbeeh_target_${id}`);
      localStorage.removeItem(`ramadan_active_dhikr_${id}`);
      localStorage.removeItem(`ramadan_dhikr_counts_${id}`);
      
      refreshUserList();
      setUserToDelete(null);
      alert(`ইউজার "${name}" সফলভাবে ডিলিট করা হয়েছে।`);
    } catch (error) {
      console.error('Delete error:', error);
      alert('ত্রুটি হয়েছে!');
    }
  }, [refreshUserList]);

  useEffect(() => {
    refreshUserList();
    setFeedbacks(getFromStorage('ramadan_user_feedbacks', []));
    console.log('Admin component mounted, users count:', users.length);
  }, [refreshUserList, users.length]);

  const handleUpdateName = () => {
    if (editingName.trim()) {
      setUserName(editingName.trim());
      saveToStorage('ramadan_user_name', editingName.trim());
      alert('ডিসপ্লে নাম পরিবর্তন হয়েছে।');
    }
  };

  const deleteFeedback = (id: string) => {
    if (confirm('এই মতামতটি কি ডিলিট করতে চান?')) {
      const updated = feedbacks.filter(f => f.id !== id);
      setFeedbacks(updated);
      saveToStorage('ramadan_user_feedbacks', updated);
    }
  };

  const exportData = () => {
    const allData: Record<string, string | null> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) allData[key] = localStorage.getItem(key);
    }
    const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ramadan_tracker_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (window.confirm('এটি বর্তমান সকল ডাটা মুছে ফেলবে। আপনি কি নিশ্চিত?')) {
          localStorage.clear();
          Object.keys(data).forEach(key => localStorage.setItem(key, data[key]));
          window.location.reload();
        }
      } catch (err) { alert('ভুল ফাইল ফরম্যাট!'); }
    };
    reader.readAsText(file);
  };

  const handleSetPin = () => {
    if (newPin.length === 4) {
      setAdminPin(newPin);
      saveToStorage('ramadan_admin_pin', newPin);
      setNewPin('');
      setIsSettingPin(false);
      alert('এডমিন পিন আপডেট হয়েছে।');
    } else { alert('৪ সংখ্যার পিন দিন।'); }
  };

  const addDeed = () => {
    if (!newDeedName.trim()) return;
    const newDeed: Deed = {
      id: `deed_${Date.now()}`,
      name: newDeedName.trim(),
      points: newDeedPoints,
      category: 'custom'
    };
    const updatedDeeds = [...deeds, newDeed];
    setDeeds(updatedDeeds);
    saveToStorage('ramadan_deeds_admin', updatedDeeds);
    setNewDeedName('');
    setIsAddingDeed(false);
  };

  const deleteDeed = (id: string) => {
    if (window.confirm('এই আমলটি কি ডিলিট করতে চান?')) {
      const updatedDeeds = deeds.filter(d => d.id !== id);
      setDeeds(updatedDeeds);
      saveToStorage('ramadan_deeds_admin', updatedDeeds);
    }
  };

  const updateDeedPoint = (id: string, newPts: number) => {
    const updatedDeeds = deeds.map(d => d.id === id ? { ...d, points: newPts } : d);
    setDeeds(updatedDeeds);
    saveToStorage('ramadan_deeds_admin', updatedDeeds);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-10">
      <button 
        onClick={() => alert('এডমিন টেস্ট অ্যালার্ট')}
        className="w-full bg-amber-500 text-black py-2 rounded-lg font-bold mb-2"
      >
        ক্লিক করুন (টেস্ট)
      </button>
      {/* User Deletion Confirmation Modal */}
      {userToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-emerald-900 border border-emerald-700 p-6 rounded-3xl w-full max-w-xs shadow-2xl">
            <h3 className="text-lg font-bold text-amber-400 mb-2">ইউজার ডিলিট নিশ্চিত করুন</h3>
            <p className="text-sm text-slate-300 mb-6">
              আপনি কি নিশ্চিত যে <span className="font-bold text-white">"{userToDelete.name}"</span> ইউজারকে ডিলিট করতে চান? এটি তার সকল ডাটা মুছে ফেলবে।
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setUserToDelete(null)}
                className="flex-1 bg-emerald-800 text-emerald-400 font-bold py-3 rounded-xl text-xs uppercase tracking-widest"
              >
                বাতিল
              </button>
              <button 
                onClick={() => deleteUser(userToDelete.id, userToDelete.name)}
                className="flex-1 bg-red-600 text-white font-bold py-3 rounded-xl text-xs uppercase tracking-widest"
              >
                ডিলিট করুন
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-4 bg-emerald-900/40 p-5 rounded-2xl border border-emerald-800">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold font-playfair text-amber-400">এডমিন কনসোল</h2>
          <div className="bg-emerald-800 px-3 py-1 rounded-full border border-emerald-700">
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Active Admin</span>
          </div>
        </div>
        <button 
          onClick={onLogout}
          className="w-full bg-red-900/30 hover:bg-red-900/50 text-red-400 border border-red-900/50 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2"
        >
          <span>🚪</span> লগ আউট করুন
        </button>
      </div>

      {/* Feedbacks Section */}
      <section className="bg-emerald-900/60 p-4 sm:p-5 rounded-3xl border border-emerald-800 shadow-xl">
        <h3 className="text-[10px] sm:text-xs font-bold text-amber-500 uppercase tracking-widest mb-4 flex items-center gap-2">
           📨 ইউজার মতামত ({feedbacks.length})
        </h3>
        <div className="space-y-3 max-h-64 overflow-y-auto pr-1 sm:pr-2 custom-scrollbar">
          {feedbacks.length > 0 ? [...feedbacks].reverse().map(f => (
            <div key={f.id} className="bg-emerald-950/80 p-3 sm:p-4 rounded-2xl border border-emerald-800/50 relative group">
              <button onClick={() => deleteFeedback(f.id)} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-[10px] text-red-500 transition-all">🗑️</button>
              <div className="flex justify-between items-start mb-2">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-100 truncate">{f.userName}</p>
                  <p className="text-[8px] text-emerald-600 font-bold uppercase">{f.date}</p>
                </div>
                <div className="text-[9px] sm:text-[10px] shrink-0 ml-2">
                   {Array(5).fill(0).map((_, i) => (
                     <span key={i} className={i < f.rating ? 'grayscale-0' : 'grayscale opacity-30'}>⭐</span>
                   ))}
                </div>
              </div>
              <p className="text-[10px] sm:text-[11px] text-emerald-300 italic leading-relaxed break-words">"{f.message}"</p>
            </div>
          )) : <p className="text-center text-xs text-emerald-800 py-4 italic">কোন মতামত পাওয়া যায়নি।</p>}
        </div>
      </section>

      {/* User Management */}
      <section className="bg-emerald-900/60 p-4 sm:p-5 rounded-3xl border border-emerald-800 shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-[10px] sm:text-xs font-bold text-emerald-500 uppercase tracking-widest">👥 ইউজার তালিকা ({users.length})</h3>
          <button onClick={refreshUserList} className="bg-emerald-800/50 p-1.5 rounded-lg text-amber-500"><span className="text-xs">🔄</span></button>
        </div>
        <div className="space-y-2">
          {users.map(u => (
            <div key={u.id} className="bg-emerald-950/50 p-3 rounded-2xl border border-emerald-800 flex items-center gap-2 sm:gap-3">
              {u.id !== 'admin' && (
                <button 
                  type="button"
                  onClick={() => setUserToDelete({ id: u.id, name: u.name })}
                  className="p-2 bg-red-900/30 hover:bg-red-600 text-white rounded-lg transition-all flex items-center justify-center min-w-[50px] sm:min-w-[60px] cursor-pointer text-[10px] sm:text-xs"
                >
                  ডিলিট
                </button>
              )}
              <div className="flex-1 flex justify-between items-center min-w-0">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-emerald-800 flex items-center justify-center text-xs sm:text-sm shrink-0">👤</div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-bold text-slate-200 truncate">{u.name}</p>
                    <p className="text-[7px] sm:text-[8px] font-mono text-emerald-600 uppercase truncate">ID: {u.id.split('_').pop()}</p>
                  </div>
                </div>
                <div className="bg-amber-500/10 border border-amber-500/30 px-2 sm:px-3 py-1 rounded-full shrink-0 ml-2">
                  <span className="text-[10px] sm:text-xs font-bold text-amber-400">{u.totalPoints}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Deed Management */}
      <section className="bg-emerald-900/40 p-5 rounded-2xl border border-emerald-800">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xs font-bold text-emerald-500 uppercase">📝 আমল ম্যানেজমেন্ট</h3>
          <button onClick={() => setIsAddingDeed(!isAddingDeed)} className="text-[10px] bg-amber-500 text-emerald-950 px-3 py-1 rounded-lg font-bold">{isAddingDeed ? 'বন্ধ' : '+ অ্যাড'}</button>
        </div>
        {isAddingDeed && (
          <div className="bg-emerald-950/50 p-4 rounded-xl border border-emerald-800 mb-4 space-y-3">
            <input type="text" value={newDeedName} onChange={(e) => setNewDeedName(e.target.value)} placeholder="নাম..." className="w-full bg-emerald-900 border border-emerald-800 rounded-lg px-3 py-2 text-sm text-slate-100" />
            <div className="flex gap-2 items-center">
              <input type="number" value={newDeedPoints} onChange={(e) => setNewDeedPoints(parseInt(e.target.value) || 0)} className="w-20 bg-emerald-900 border border-emerald-800 rounded-lg px-3 py-2 text-sm" />
              <button onClick={addDeed} className="flex-1 bg-amber-500 text-emerald-950 font-bold py-2 rounded-lg text-xs">অ্যাড</button>
            </div>
          </div>
        )}
        <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
          {deeds.map(deed => (
            <div key={deed.id} className="bg-emerald-950/30 p-2.5 rounded-xl border border-emerald-800 flex items-center justify-between">
              <span className="text-xs font-medium text-slate-300">{deed.name}</span>
              <div className="flex items-center gap-3">
                <input type="number" value={deed.points} onChange={(e) => updateDeedPoint(deed.id, parseInt(e.target.value) || 0)} className="w-10 bg-emerald-900/50 border border-emerald-800 rounded text-[10px] text-amber-500 font-bold text-center" />
                <button onClick={() => deleteDeed(deed.id)}>🗑️</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4">
        <section className="bg-emerald-900/40 p-5 rounded-2xl border border-emerald-800">
          <h3 className="text-xs font-bold text-emerald-500 uppercase mb-4">💾 ব্যাকআপ ও সেটিংস</h3>
          <div className="grid grid-cols-2 gap-2 mb-4">
            <button onClick={exportData} className="bg-emerald-800 text-amber-400 font-bold py-3 rounded-xl text-[10px]">JSON ব্যাকআপ</button>
            <div className="relative">
              <input type="file" accept=".json" onChange={importData} className="absolute inset-0 w-full h-full opacity-0" />
              <button className="w-full bg-emerald-950 text-emerald-500 font-bold py-3 rounded-xl text-[10px]">ইমপোর্ট</button>
            </div>
          </div>
          <div>
            <label className="block text-[9px] text-emerald-600 uppercase mb-1">প্রোফাইল নাম</label>
            <div className="flex gap-2">
              <input type="text" value={editingName} onChange={(e) => setEditingName(e.target.value)} className="flex-1 bg-emerald-950 border border-emerald-800 rounded-lg px-3 py-1.5 text-xs" />
              <button onClick={handleUpdateName} className="bg-amber-500 text-emerald-950 font-bold px-3 rounded-lg text-[10px]">Update</button>
            </div>
          </div>
        </section>

        <section className="bg-emerald-900/40 p-5 rounded-2xl border border-emerald-800">
          <h3 className="text-xs font-bold text-emerald-500 uppercase mb-4">🔐 পিন কোড</h3>
          <button onClick={() => setIsSettingPin(!isSettingPin)} className="w-full bg-emerald-900 border border-emerald-800 text-emerald-400 py-2 rounded-lg text-[10px]">{isSettingPin ? 'বন্ধ' : 'পিন পরিবর্তন'}</button>
          {isSettingPin && (
            <div className="mt-3 flex gap-2">
              <input type="password" maxLength={4} value={newPin} onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))} placeholder="পিন" className="flex-1 bg-emerald-950 px-4 py-2 text-sm rounded-lg" />
              <button onClick={handleSetPin} className="bg-amber-500 text-emerald-950 font-bold px-4 rounded-lg text-xs">সেট</button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Admin;
