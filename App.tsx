
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Deed, DailyRecord } from './types';
import { DEFAULT_DEEDS, SILENT_MODE_ITEMS } from './constants';
import { getFromStorage, saveToStorage, getTodayDateString } from './utils/storage';
import { getAddressFromCoords } from './services/locationService';
import { syncUserToSupabase } from './services/supabase';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import DailyDeeds from './components/DailyDeeds';
import QuranTracker from './components/QuranTracker';
import Tasbeeh from './components/Tasbeeh';
import Stats from './components/Stats';
import Social from './components/Social';
import Onboarding from './components/Onboarding';
import Admin from './components/Admin';
import Quiz from './components/Quiz';

const App: React.FC = () => {
  const [userName, setUserName] = useState<string | null>(() => getFromStorage('ramadan_user_name', null));
  const [userId, setUserId] = useState<string | null>(() => getFromStorage('ramadan_user_id', null));
  const [isAdmin, setIsAdmin] = useState<boolean>(() => getFromStorage('ramadan_is_admin', false));
  const [activeView, setActiveView] = useState<View>(View.DASHBOARD);
  const [adminPin, setAdminPin] = useState<string>(() => getFromStorage('ramadan_admin_pin', '1234'));
  const [devName, setDevName] = useState('RAHIN AHMED');
  
  const [locationName, setLocationName] = useState<string>(() => getFromStorage('ramadan_location_name', 'লোকেশন লোড হচ্ছে...'));
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLocationLoading, setIsLocationLoading] = useState(false);

  const fetchLocation = useCallback(async () => {
    setIsLocationLoading(true);
    setLocationError(null);

    if (!("geolocation" in navigator)) {
      setLocationError("আপনার ব্রাউজার লোকেশন সাপোর্ট করে না");
      setIsLocationLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          saveToStorage('last_known_lat', latitude);
          saveToStorage('last_known_lng', longitude);
          
          const name = await getAddressFromCoords(latitude, longitude);
          setLocationName(name);
          saveToStorage('ramadan_location_name', name);
        } catch (err) {
          setLocationError("আপনার বর্তমান লোকেশন লোড হয়নি, সঠিক সময়সূচী পেতে লোকেশন সেট করুন");
        } finally {
          setIsLocationLoading(false);
        }
      },
      (err) => {
        setLocationError("আপনার বর্তমান লোকেশন লোড হয়নি, সঠিক সময়সূচী পেতে লোকেশন সেট করুন");
        setIsLocationLoading(false);
      },
      { timeout: 10000 }
    );
  }, []);

  useEffect(() => {
    if (userName) {
      fetchLocation();
    }
  }, [userName, fetchLocation]);

  const [deeds, setDeeds] = useState<Deed[]>(DEFAULT_DEEDS);
  const [history, setHistory] = useState<DailyRecord[]>([]);
  const [today, setToday] = useState(getTodayDateString());

  useEffect(() => {
    const timer = setInterval(() => {
      const newToday = getTodayDateString();
      if (newToday !== today) {
        setToday(newToday);
      }
    }, 30000);
    return () => clearInterval(timer);
  }, [today]);

  useEffect(() => {
    if (userId) {
      const userHistory = getFromStorage<DailyRecord[]>(`ramadan_history_${userId}`, []);
      const adminDeeds = getFromStorage<Deed[] | null>('ramadan_deeds_admin', null);
      const userDeeds = getFromStorage<Deed[]>(`ramadan_deeds_${userId}`, adminDeeds || DEFAULT_DEEDS);
      
      setHistory(userHistory);
      setDeeds(isAdmin ? (adminDeeds || DEFAULT_DEEDS) : userDeeds);
    } else {
      setHistory([]);
      setDeeds(DEFAULT_DEEDS);
    }
  }, [userId, isAdmin]);

  const currentRecord = useMemo(() => {
    const existing = history.find(h => h.date === today);
    return existing || {
      date: today,
      completedDeeds: [],
      quranPagesRead: 0,
      sadaqahAmount: 0,
      notes: '',
      isSilentModeActive: false,
      completedSilentItems: []
    };
  }, [history, today]);

  const handleOnboardingComplete = (name: string, isAdminRole: boolean, existingId?: string) => {
    let finalId = '';
    if (isAdminRole) {
      finalId = 'admin';
    } else if (existingId) {
      finalId = existingId;
    } else {
      finalId = `${name.replace(/\s+/g, '_')}_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
      const registry = getFromStorage<{name: string, id: string}[]>('ramadan_user_registry', []);
      const updatedRegistry = [...registry, { name, id: finalId }];
      saveToStorage('ramadan_user_registry', updatedRegistry);
    }
    saveToStorage('ramadan_user_name', name);
    saveToStorage('ramadan_user_id', finalId);
    saveToStorage('ramadan_is_admin', isAdminRole);
    setUserName(name);
    setUserId(finalId);
    setIsAdmin(isAdminRole);
    setActiveView(View.DASHBOARD);
  };

  const handleLogout = useCallback(() => {
    // Clear sensitive data from storage
    localStorage.removeItem('ramadan_user_name');
    localStorage.removeItem('ramadan_user_id');
    localStorage.removeItem('ramadan_is_admin');
    
    // Reset React state instead of refreshing the page
    setUserName(null);
    setUserId(null);
    setIsAdmin(false);
    setActiveView(View.DASHBOARD);
    
    // Do NOT use window.location.href or window.location.reload()
  }, []);

  const calculatePoints = useCallback((record: DailyRecord) => {
    const deedPoints = record.completedDeeds.reduce((dAcc, id) => {
      const deed = deeds.find(d => d.id === id);
      return dAcc + (deed?.points || 0);
    }, 0);
    const silentPoints = (record.completedSilentItems || []).reduce((sAcc, id) => {
      const item = SILENT_MODE_ITEMS.find(s => s.id === id);
      return sAcc + (item?.points || 0);
    }, 0);
    return deedPoints + (record.quranPagesRead * 2) + silentPoints + (record.quizPoints || 0);
  }, [deeds]);

  const totalPoints = useMemo(() => {
    const otherDaysPoints = history.filter(h => h.date !== today).reduce((acc, h) => acc + calculatePoints(h), 0);
    return otherDaysPoints + calculatePoints(currentRecord);
  }, [history, today, currentRecord, calculatePoints]);

  useEffect(() => {
    if (userId && !isAdmin) {
      saveToStorage(`ramadan_history_${userId}`, history);
    }
  }, [history, userId, isAdmin]);

  useEffect(() => {
    if (userId) {
      const key = isAdmin ? 'ramadan_deeds_admin' : `ramadan_deeds_${userId}`;
      saveToStorage(key, deeds);
    }
  }, [deeds, userId, isAdmin]);

  useEffect(() => {
    saveToStorage('ramadan_admin_pin', adminPin);
  }, [adminPin]);

  const updateCurrentRecord = useCallback((updated: DailyRecord) => {
    if (isAdmin) return; 
    setHistory(prev => {
      const idx = prev.findIndex(h => h.date === today);
      if (idx > -1) {
        const newHistory = [...prev];
        newHistory[idx] = updated;
        return newHistory;
      } else {
        return [...prev, updated];
      }
    });
  }, [today, isAdmin]);

  const handleToggleDeed = useCallback((deedId: string) => {
    const updated = {
      ...currentRecord,
      completedDeeds: currentRecord.completedDeeds.includes(deedId)
        ? currentRecord.completedDeeds.filter(id => id !== deedId)
        : [...currentRecord.completedDeeds, deedId]
    };
    updateCurrentRecord(updated);
  }, [currentRecord, updateCurrentRecord]);

  const handleToggleSilentItem = useCallback((itemId: string) => {
    const isAlreadyIn = currentRecord.completedSilentItems?.includes(itemId);
    const updatedItems = isAlreadyIn 
      ? currentRecord.completedSilentItems.filter(id => id !== itemId)
      : [...(currentRecord.completedSilentItems || []), itemId];
    const updated = {
      ...currentRecord,
      completedSilentItems: updatedItems,
      isSilentModeActive: updatedItems.length > 0
    };
    updateCurrentRecord(updated);
  }, [currentRecord, updateCurrentRecord]);

  const handleUpdateQuran = useCallback((pages: number) => {
    const updated = { ...currentRecord, quranPagesRead: currentRecord.quranPagesRead + pages };
    updateCurrentRecord(updated);
  }, [currentRecord, updateCurrentRecord]);

  const handleUpdateSadaqah = useCallback((amount: number) => {
    const updated = { ...currentRecord, sadaqahAmount: amount };
    updateCurrentRecord(updated);
  }, [currentRecord, updateCurrentRecord]);

  const handleAwardQuizPoints = useCallback((points: number) => {
    const updated = { 
      ...currentRecord, 
      quizPoints: (currentRecord.quizPoints || 0) + points 
    };
    updateCurrentRecord(updated);
  }, [currentRecord, updateCurrentRecord]);

  const handleAddCustomDeed = useCallback((name: string, points: number) => {
    const newDeed: Deed = { id: `custom_${Date.now()}`, name, points, category: 'custom' };
    setDeeds(prev => [...prev, newDeed]);
  }, []);
  const todayPoints = calculatePoints(currentRecord);
  const userProgress = deeds.length > 0 ? Math.round((currentRecord.completedDeeds.length / deeds.length) * 100) : 0;

  useEffect(() => {
    if (userId && userName && !isAdmin) {
      syncUserToSupabase({
        id: userId,
        name: userName,
        points: totalPoints,
        todayProgress: userProgress,
        avatar: '👤'
      });
    }
  }, [userId, userName, totalPoints, userProgress, isAdmin]);

  if (!userName) {
    return <Onboarding onComplete={handleOnboardingComplete} correctPin={adminPin} devName={devName} />;
  }

  return (
    <Layout 
      activeView={activeView} 
      onViewChange={setActiveView} 
      totalPoints={totalPoints}
      isAdmin={isAdmin}
      onLogout={handleLogout}
      devName={devName}
      locationName={locationName}
      locationError={locationError}
      isLocationLoading={isLocationLoading}
      onRefreshLocation={fetchLocation}
    >
      {activeView === View.DASHBOARD && (
        <Dashboard 
          todayPoints={todayPoints} 
          totalPoints={totalPoints}
          userName={userName} 
          completedCount={currentRecord.completedDeeds.length}
          totalDeeds={deeds.length}
          completedSilentItems={currentRecord.completedSilentItems || []}
          onToggleSilentItem={handleToggleSilentItem}
          isAdmin={isAdmin}
        />
      )}
      {activeView === View.DEEDS && (
        <DailyDeeds 
          deeds={deeds} 
          record={currentRecord} 
          onToggleDeed={handleToggleDeed}
          onAddCustomDeed={handleAddCustomDeed}
          onUpdateSadaqah={handleUpdateSadaqah}
        />
      )}
      {activeView === View.TASBEEH && (
        <Tasbeeh key={userId || 'guest'} userId={userId || 'guest'} />
      )}
      {activeView === View.QURAN && (
        <QuranTracker 
          totalPagesRead={history.reduce((sum, h) => sum + h.quranPagesRead, 0)} 
          onUpdatePages={handleUpdateQuran} 
        />
      )}
      {activeView === View.STATS && (
        <Stats 
          history={history} 
          totalPoints={totalPoints}
          calculatePoints={calculatePoints} 
          onLogout={handleLogout} 
          devName={devName}
          onViewChange={setActiveView}
        />
      )}
      {activeView === View.SOCIAL && (
        <Social 
          userPoints={totalPoints} 
          userName={userName} 
          userId={userId || 'unknown'} 
          userProgress={userProgress} 
          isAdmin={isAdmin}
        />
      )}
      {activeView === View.QUIZ && (
        <Quiz 
          onAwardPoints={handleAwardQuizPoints} 
          currentQuizPoints={currentRecord.quizPoints || 0} 
        />
      )}
      {activeView === View.ADMIN && (
        <Admin 
          userName={userName} 
          setUserName={setUserName} 
          deeds={deeds} 
          setDeeds={setDeeds} 
          history={history}
          setHistory={setHistory}
          adminPin={adminPin}
          setAdminPin={setAdminPin}
          onLogout={handleLogout}
          devName={devName}
        />
      )}
    </Layout>
  );
};

export default App;
