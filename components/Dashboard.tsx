
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { PrayerTimes } from '../types';
import { SILENT_MODE_ITEMS } from '../constants';
import { getPrayerTimes } from '../services/prayerTimesService';
import { getRamadanMotivation } from '../services/geminiService';
import { getFromStorage, saveToStorage, getTodayDateString } from '../utils/storage';
import { toPng } from 'html-to-image';

interface DashboardProps {
  totalPoints: number;
  userName: string;
  completedCount: number;
  totalDeeds: number;
  completedSilentItems: string[];
  onToggleSilentItem: (itemId: string) => void;
  isAdmin?: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  totalPoints, 
  userName, 
  completedCount, 
  totalDeeds, 
  completedSilentItems,
  onToggleSilentItem,
  isAdmin
}) => {
  const [prayers, setPrayers] = useState<PrayerTimes | null>(null);
  const [prayerSource, setPrayerSource] = useState<'API' | 'Calculated' | null>(null);
  const [motivation, setMotivation] = useState<string>("লোড হচ্ছে...");
  const [isRefreshingPrayers, setIsRefreshingPrayers] = useState(false);
  const [locationStatus, setLocationStatus] = useState<string>('');
  const [fetchError, setFetchError] = useState<boolean>(false);
  const [isRefreshingAi, setIsRefreshingAi] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [countdown, setCountdown] = useState<{ label: string; time: string } | null>(null);
  const [showCardModal, setShowCardModal] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);
  const today = getTodayDateString();
  const userId = getFromStorage('ramadan_user_id', 'guest');
  const cacheKey = `ramadan_motivation_${userId}_${today}`;

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchPrayerData = useCallback(async () => {
    setIsRefreshingPrayers(true);
    setFetchError(false);

    const today = getTodayDateString();
    const cachedPrayers = getFromStorage<{ date: string, times: PrayerTimes, source: string } | null>('cached_prayer_times', null);

    // If we have cached times for today, use them immediately to avoid waiting
    if (cachedPrayers && cachedPrayers.date === today) {
      setPrayers(cachedPrayers.times);
      setPrayerSource(cachedPrayers.source as any);
      setLocationStatus(cachedPrayers.source === 'Calculated' ? 'অফলাইন/ক্যালকুলেটেড' : 'ক্যাশড');
      setIsRefreshingPrayers(false);
      // We still continue to fetch fresh data in the background if it was from a calculated source
      if (cachedPrayers.source === 'Calculated') {
        // Continue to background fetch
      } else {
        return; // Already have good API data cached for today
      }
    }

    const manualLat = getFromStorage<number | null>('manual_lat', null);
    const manualLng = getFromStorage<number | null>('manual_lng', null);
    const savedLat = getFromStorage<number | null>('last_known_lat', 23.8103);
    const savedLng = getFromStorage<number | null>('last_known_lng', 90.4125);

    const getTimes = async (lat: number, lng: number, sourceLabel: string) => {
      const result = await getPrayerTimes(lat, lng);
      if (result) {
        setPrayers(result);
        setPrayerSource('API');
        saveToStorage('last_known_lat', lat);
        saveToStorage('last_known_lng', lng);
        saveToStorage('cached_prayer_times', {
          date: getTodayDateString(),
          times: result,
          source: 'API'
        });
        setLocationStatus(sourceLabel);
      } else {
        setFetchError(true);
        setLocationStatus('Error');
      }
      setIsRefreshingPrayers(false);
    };

    if (manualLat !== null && manualLng !== null) {
      await getTimes(manualLat, manualLng, 'ম্যানুয়াল');
    } else if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => await getTimes(pos.coords.latitude, pos.coords.longitude, 'বর্তমান লোকেশন'),
        async () => await getTimes(savedLat || 23.8103, savedLng || 90.4125, 'ঢাকা (ডিফল্ট)'),
        { timeout: 5000 }
      );
    } else {
      await getTimes(savedLat || 23.8103, savedLng || 90.4125, 'ডিফল্ট');
    }
  }, []);

  const fetchAiMotivation = useCallback(async (force = false) => {
    if (isAdmin) return;
    const cached = getFromStorage<string | null>(cacheKey, null);
    if (cached && !force) {
      setMotivation(cached);
      return;
    }

    setIsRefreshingAi(true);
    try {
      const message = await getRamadanMotivation(userName, totalPoints);
      setMotivation(message);
      saveToStorage(cacheKey, message);
    } catch (error) {
      setMotivation("রমজানের এই বরকতময় সময়ে আপনার ইবাদত কবুল হোক।");
    } finally {
      setIsRefreshingAi(false);
    }
  }, [userName, totalPoints, completedCount, totalDeeds, cacheKey, isAdmin]);

  useEffect(() => {
    fetchPrayerData();
    if (!isAdmin) {
      fetchAiMotivation();
      // Auto-update motivation every 2 minutes
      const motivationTimer = setInterval(() => {
        fetchAiMotivation(true);
      }, 2 * 60 * 1000);
      return () => clearInterval(motivationTimer);
    }
  }, [today, isAdmin, fetchPrayerData, fetchAiMotivation]);

  const format12h = (time24: string) => {
    if (!time24) return '--:--';
    try {
      const [h, m] = time24.split(':').map(Number);
      const ampm = h >= 12 ? 'PM' : 'AM';
      const h12 = h % 12 || 12;
      return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`;
    } catch (e) {
      return time24;
    }
  };

  const adjustTime = (timeStr: string, minutes: number) => {
    if (!timeStr) return '--:--';
    try {
      const [h, m] = timeStr.split(':').map(Number);
      const date = new Date();
      date.setHours(h, m + minutes, 0, 0);
      return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    } catch (e) {
      return '--:--';
    }
  };

  const calculateCountdown = useCallback(() => {
    if (!prayers) return;
    const now = new Date();
    const parseTime = (timeStr: string) => {
      const [hours, minutes] = timeStr.split(':').map(Number);
      const d = new Date();
      d.setHours(hours, minutes, 0, 0);
      return d;
    };
    
    try {
      const imsak = parseTime(prayers.imsak);
      const maghrib = parseTime(prayers.maghrib);
      let target = (now < imsak) ? imsak : (now < maghrib) ? maghrib : new Date(imsak.getTime() + 86400000);
      let label = (now < imsak) ? 'সেহরি শেষ' : (now < maghrib) ? 'ইফতারের বাকি' : 'পরবর্তী সেহরি';
      
      const diff = Math.max(0, target.getTime() - now.getTime());
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setCountdown({ label, time: `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}` });
    } catch (e) {}
  }, [prayers]);

  useEffect(() => {
    calculateCountdown();
    const interval = setInterval(calculateCountdown, 1000);
    return () => clearInterval(interval);
  }, [calculateCountdown]);

  const handleSaveToGallery = async () => {
    if (!cardRef.current || isDownloading) return;
    setIsDownloading(true);
    try {
      const dataUrl = await toPng(cardRef.current, { cacheBust: true, quality: 1, pixelRatio: 3, backgroundColor: '#022c22' });
      const link = document.createElement('a');
      link.download = `আমার_আমল_${today}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) { alert('ইমেজ সেভ করা সম্ভব হয়নি।'); } finally { setIsDownloading(false); }
  };

  const prayerLabels: { [key: string]: string } = {
    imsak: 'সাহরি শেষ', fajr: 'ফজর', dhuhr: 'যুহর', asr: 'আসর', maghrib: 'মাগরিব', isha: 'ইশা'
  };

  const getRamadanDay = () => {
    // Based on image: 21 Feb 2026 is 3 Ramadan
    const baseDate = new Date(2026, 1, 21); // Month is 0-indexed, so 1 is Feb
    const diffTime = currentTime.getTime() - baseDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return 3 + diffDays;
  };

  const getBengaliDate = () => {
    // Based on image: 21 Feb 2026 is 8 Falgun
    const baseDate = new Date(2026, 1, 21);
    const diffTime = currentTime.getTime() - baseDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const day = 8 + diffDays;
    return `${day} ফাল্গুন, ১৪৩২`;
  };

  const getEnglishDate = () => {
    const months = ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'];
    const days = ['রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'];
    return `${days[currentTime.getDay()]}, ${currentTime.getDate()} ${months[currentTime.getMonth()]} ${currentTime.getFullYear()}`;
  };

  const getCurrentPrayer = () => {
    if (!prayers) return null;
    const now = new Date();
    const parseTime = (timeStr: string) => {
      const [hours, minutes] = timeStr.split(':').map(Number);
      const d = new Date();
      d.setHours(hours, minutes, 0, 0);
      return d;
    };

    const times = [
      { name: 'ফজর', start: parseTime(prayers.fajr), end: parseTime(prayers.sunrise) },
      { name: 'যোহর', start: parseTime(prayers.dhuhr), end: parseTime(prayers.asr) },
      { name: 'আসর', start: parseTime(prayers.asr), end: parseTime(prayers.maghrib) },
      { name: 'মাগরিব', start: parseTime(prayers.maghrib), end: parseTime(prayers.isha) },
      { name: 'এশা', start: parseTime(prayers.isha), end: new Date(parseTime(prayers.fajr).getTime() + 86400000) },
    ];

    for (let i = 0; i < times.length; i++) {
      if (now >= times[i].start && now < times[i].end) {
        const total = times[i].end.getTime() - times[i].start.getTime();
        const elapsed = now.getTime() - times[i].start.getTime();
        const progress = Math.min(100, Math.max(0, (elapsed / total) * 100));
        
        const remaining = times[i].end.getTime() - now.getTime();
        const h = Math.floor(remaining / 3600000);
        const m = Math.floor((remaining % 3600000) / 60000);
        const s = Math.floor((remaining % 60000) / 1000);
        const countdownStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;

        return { ...times[i], progress, countdown: countdownStr };
      }
    }
    return null;
  };

  const currentPrayer = getCurrentPrayer();

  return (
    <div className="space-y-4 animate-fadeIn pb-10 text-slate-200">
      {/* Top Ramadan Card */}
      <section className="bg-emerald-900/40 p-5 rounded-xl border border-emerald-800/30 flex justify-between items-center">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-emerald-400">{getRamadanDay()} রমযান, ১৪৪৭ হিজরী</h2>
          <p className="text-sm opacity-80">{getEnglishDate()}</p>
          <p className="text-sm opacity-60">{getBengaliDate()}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className="text-amber-400 text-xl">☀️</div>
            <div className="text-sm font-bold">{format12h(prayers?.sunrise || '')}</div>
            <div className="text-[10px] opacity-60">সূর্যোদয়</div>
          </div>
          <div className="text-center">
            <div className="text-amber-400 text-xl">🌇</div>
            <div className="text-sm font-bold">{format12h(prayers?.maghrib || '')}</div>
            <div className="text-[10px] opacity-60">সূর্যাস্ত</div>
          </div>
        </div>
      </section>

      {/* Sahri & Iftar Quick View */}
      <section className="grid grid-cols-3 gap-1.5 sm:gap-2">
        <div className="bg-emerald-900/20 p-2 sm:p-4 rounded-xl border border-emerald-800/20 text-center space-y-1 sm:space-y-2">
          <div className="text-[10px] sm:text-sm font-bold text-slate-100">{format12h(prayers?.imsak || '')}</div>
          <div className="text-[8px] sm:text-[10px] opacity-60 uppercase font-bold tracking-tighter">সাহরি শেষ</div>
        </div>
        <div className="bg-emerald-900/20 p-2 sm:p-4 rounded-xl border border-emerald-800/20 text-center space-y-1 sm:space-y-2">
          <div className="text-[10px] sm:text-sm font-bold text-slate-100">{format12h(prayers?.maghrib || '')}</div>
          <div className="text-[8px] sm:text-[10px] opacity-60 uppercase font-bold tracking-tighter">ইফতারের সময়</div>
        </div>
        <div className="bg-emerald-900/20 p-2 sm:p-4 rounded-xl border border-emerald-800/20 text-center space-y-1 sm:space-y-2">
          <div className="text-[10px] sm:text-sm font-bold text-emerald-400 font-mono">{countdown?.time || '--:--:--'}</div>
          <div className="text-[8px] sm:text-[10px] opacity-60 uppercase font-bold tracking-tighter">{countdown?.label || 'সাহরির বাকি'}</div>
        </div>
      </section>

      {/* AI Motivation / Hadith Section */}
      {!isAdmin && (
        <section className="bg-gradient-to-r from-emerald-800/40 to-emerald-900/40 p-5 rounded-xl border border-emerald-800/30 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 text-6xl opacity-10 group-hover:scale-110 transition-transform">📖</div>
          <div className="relative z-10">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-emerald-400 font-bold text-[10px] uppercase tracking-[0.2em]">আজকের আয়াত ও হাদিস</h3>
              <button onClick={() => fetchAiMotivation(true)} disabled={isRefreshingAi} className={`text-xs ${isRefreshingAi ? 'animate-spin' : ''}`}>🔄</button>
            </div>
            <p className="text-slate-100 text-sm font-medium leading-relaxed italic">{motivation}</p>
          </div>
        </section>
      )}

      {/* Detailed Prayer Section */}
      <section className="bg-emerald-900/10 p-5 rounded-2xl border border-emerald-800/10">
        <div className="mb-6">
          <h3 className="text-2xl font-bold text-emerald-400 border-b-2 border-emerald-800 pb-1 inline-block font-playfair">নামাজের সময়সূচী</h3>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 sm:gap-4">
          {/* Left Column: Countdown */}
          <div className="sm:col-span-5 flex flex-col items-center justify-center sm:border-r border-emerald-800/30 sm:pr-4">
            <div className="text-center mb-4">
              <p className="text-sm font-bold text-emerald-100 leading-tight">{currentPrayer?.name || '---'}-এর ওয়াক্ত</p>
              <p className="text-xs text-emerald-500 font-medium">শেষ হতে বাকি</p>
            </div>
            
            <div className="relative w-24 h-24 sm:w-28 sm:h-28">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="48"
                  cy="48"
                  r="42"
                  stroke="currentColor"
                  strokeWidth="5"
                  fill="transparent"
                  className="text-emerald-900/30 sm:hidden"
                />
                <circle
                  cx="56"
                  cy="56"
                  r="50"
                  stroke="currentColor"
                  strokeWidth="6"
                  fill="transparent"
                  className="text-emerald-900/30 hidden sm:block"
                />
                {/* Mobile Circle */}
                <circle
                  cx="48"
                  cy="48"
                  r="42"
                  stroke="currentColor"
                  strokeWidth="5"
                  fill="transparent"
                  strokeDasharray={264}
                  strokeDashoffset={264 - (264 * (currentPrayer?.progress || 0)) / 100}
                  strokeLinecap="round"
                  className="text-amber-500 transition-all duration-1000 sm:hidden"
                />
                {/* Desktop Circle */}
                <circle
                  cx="56"
                  cy="56"
                  r="50"
                  stroke="currentColor"
                  strokeWidth="6"
                  fill="transparent"
                  strokeDasharray={314}
                  strokeDashoffset={314 - (314 * (currentPrayer?.progress || 0)) / 100}
                  strokeLinecap="round"
                  className="text-amber-500 transition-all duration-1000 hidden sm:block"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[9px] sm:text-[10px] text-emerald-600 font-bold uppercase tracking-tighter">বাকি</span>
                <span className="text-xs sm:text-sm font-mono font-bold text-amber-400">{currentPrayer?.countdown || '--:--:--'}</span>
              </div>
            </div>
          </div>

          {/* Right Column: Table */}
          <div className="sm:col-span-7 sm:pl-2">
            <div className="grid grid-cols-3 text-[9px] font-bold text-emerald-600 uppercase mb-3 border-b border-emerald-800/20 pb-1">
              <span>ওয়াক্ত</span>
              <span className="text-center">শুরু</span>
              <span className="text-right">শেষ</span>
            </div>
            
            <div className="space-y-3 sm:space-y-2.5">
              {prayers && (
                <>
                  {[
                    { id: 'fajr', name: 'ফজর', start: prayers.fajr, end: prayers.sunrise },
                    { id: 'dhuhr', name: 'যোহর', start: prayers.dhuhr, end: prayers.asr },
                    { id: 'asr', name: 'আসর', start: prayers.asr, end: prayers.maghrib },
                    { id: 'maghrib', name: 'মাগরিব', start: prayers.maghrib, end: prayers.isha },
                    { id: 'isha', name: 'এশা', start: prayers.isha, end: prayers.fajr },
                  ].map((p) => (
                    <div key={p.id} className={`grid grid-cols-3 items-center text-[10px] sm:text-[11px] ${currentPrayer?.name === p.name ? 'text-amber-400 font-bold' : 'text-emerald-100/80'}`}>
                      <span>{p.name}</span>
                      <span className="text-center font-mono">{format12h(p.start)}</span>
                      <span className="text-right font-mono">{format12h(p.end)}</span>
                    </div>
                  ))}
                  
                  <div className="pt-2 mt-2 border-t border-emerald-800/20">
                    <div className="flex justify-between items-center text-[9px] sm:text-[10px] font-bold text-emerald-500">
                      <span className="opacity-60">এশার মাকরূহ ওয়াক্ত শুরু:</span>
                      <span className="font-mono text-emerald-400">{format12h("23:32")}</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Forbidden Times Section */}
      <section className="bg-red-900/10 p-5 rounded-2xl border border-red-900/20">
        <div className="mb-4">
          <h3 className="text-lg font-bold text-red-400 border-b border-red-900/30 pb-1 inline-block">নামাজের নিষিদ্ধ সময় সমূহ</h3>
        </div>
        
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-red-950/30 p-3 rounded-xl border border-red-900/20 text-center">
            <p className="text-[10px] text-red-500 font-bold uppercase mb-1">সূর্যোদয়</p>
            <p className="text-[10px] font-mono text-red-200 leading-tight">
              {prayers ? `${format12h(prayers.sunrise)} - ${format12h(adjustTime(prayers.sunrise, 15))}` : '--:--'}
            </p>
          </div>
          <div className="bg-red-950/30 p-3 rounded-xl border border-red-900/20 text-center">
            <p className="text-[10px] text-red-500 font-bold uppercase mb-1">মধ্যাহ্ন (যাওয়াল)</p>
            <p className="text-[10px] font-mono text-red-200 leading-tight">
              {prayers ? `${format12h(adjustTime(prayers.dhuhr, -10))} - ${format12h(prayers.dhuhr)}` : '--:--'}
            </p>
          </div>
          <div className="bg-red-950/30 p-3 rounded-xl border border-red-900/20 text-center">
            <p className="text-[10px] text-red-500 font-bold uppercase mb-1">সূর্যাস্ত</p>
            <p className="text-[10px] font-mono text-red-200 leading-tight">
              {prayers ? `${format12h(adjustTime(prayers.maghrib, -15))} - ${format12h(prayers.maghrib)}` : '--:--'}
            </p>
          </div>
        </div>
        <p className="text-[9px] text-red-700 mt-3 italic text-center">* এই সময়গুলোতে যেকোনো ধরণের নামাজ পড়া নিষিদ্ধ।</p>
      </section>

      {/* Share Card Action */}
      {!isAdmin && (
        <div className="flex justify-center pt-2">
          <button onClick={() => setShowCardModal(true)} className="bg-emerald-900/20 px-6 py-2 rounded-full border border-emerald-800/30 text-[10px] text-emerald-500 uppercase font-bold tracking-widest hover:text-amber-500 transition-colors">
            শেয়ার কার্ড জেনারেট করুন 🖼️
          </button>
        </div>
      )}

      {/* Card Modal */}
      {showCardModal && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-6 bg-black/95 backdrop-blur-md animate-fadeIn">
          <div ref={cardRef} className="w-full max-w-xs bg-[#0a1210] border-2 border-emerald-800 rounded-3xl p-8 text-center relative overflow-hidden shadow-2xl">
              <div className="relative z-10">
                <div className="text-4xl mb-4">🌙</div>
                <h2 className="text-2xl font-bold font-playfair text-emerald-400 mb-1">আজকের সাফল্য</h2>
                <div className="bg-emerald-900/20 border border-emerald-800/30 rounded-2xl py-6 my-6">
                  <span className="block text-5xl font-bold text-amber-500">{totalPoints}</span>
                  <span className="text-xs text-emerald-500 uppercase font-bold tracking-widest">পয়েন্টস</span>
                </div>
                <p className="text-slate-300 text-sm mb-4">{userName}</p>
                <p className="text-[10px] text-emerald-800 font-bold uppercase tracking-[0.2em]">আমার আমল অ্যাপ</p>
              </div>
          </div>
          <div className="flex gap-3 w-full max-w-xs mt-8">
            <button onClick={() => setShowCardModal(false)} className="flex-1 bg-emerald-900/30 text-emerald-500 font-bold py-3.5 rounded-2xl border border-emerald-800/50">বন্ধ করুন</button>
            <button onClick={handleSaveToGallery} className="flex-1 bg-emerald-400 text-emerald-950 font-bold py-3.5 rounded-2xl">সেভ করুন</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
