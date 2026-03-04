
import React from 'react';
import { View } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeView: View;
  onViewChange: (view: View) => void;
  totalPoints: number;
  isAdmin?: boolean;
  onLogout: () => void;
  devName: string;
  locationName?: string;
  locationError?: string | null;
  isLocationLoading?: boolean;
  onRefreshLocation?: () => void;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  activeView, 
  onViewChange, 
  totalPoints, 
  isAdmin, 
  onLogout, 
  devName,
  locationName,
  locationError,
  isLocationLoading,
  onRefreshLocation
}) => {
  const navItems = isAdmin 
    ? [
        { view: View.DASHBOARD, label: 'স্ট্যাটাস', icon: '📊' },
        { view: View.ADMIN, label: 'সেটিংস', icon: '⚙️' },
      ]
    : [
        { view: View.DASHBOARD, label: 'হোম', icon: '🏠' },
        { view: View.DEEDS, label: 'আমল', icon: '✨' },
        { view: View.TASBEEH, label: 'তাসবীহ', icon: '📿' },
        { view: View.QURAN, label: 'কুরআন', icon: '📖' },
        { view: View.QUIZ, label: 'কুইজ', icon: '🧩' },
        { view: View.STATS, label: 'রিপোর্ট', icon: '📈' },
        { view: View.SOCIAL, label: 'লিডারবোর্ড', icon: '🏆' },
      ];

  const handleHeaderLogout = () => {
    if (window.confirm('আপনি কি এই সেশন থেকে লগ আউট করতে চান?')) {
      onLogout();
    }
  };

  return (
    <div className="flex flex-col min-h-screen max-w-md mx-auto relative overflow-hidden bg-emerald-950 border-x border-emerald-900 shadow-2xl">
      {/* Background pattern removed to rule out click interference */}
      
      {/* Header */}
      <header className="sticky top-0 z-30 bg-emerald-900/90 backdrop-blur-md p-4 border-b border-emerald-800 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center text-xl shadow-lg shadow-amber-500/20">🌙</div>
          <div className="flex flex-col">
            <h1 className="text-lg font-bold font-playfair text-amber-400 leading-tight">
              {isAdmin ? 'এডমিন প্যানেল' : 'আমার আমল'}
            </h1>
            {!isAdmin && (
              <div className="flex items-center gap-1">
                {locationError ? (
                  <span className="text-[8px] text-red-400 font-medium leading-tight max-w-[120px] truncate">
                    {locationError}
                  </span>
                ) : (
                  <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                    📍 {locationName || 'লোকেশন লোড হচ্ছে...'}
                  </span>
                )}
                <button 
                  onClick={onRefreshLocation}
                  disabled={isLocationLoading}
                  className={`text-[10px] text-emerald-500 hover:text-amber-400 transition-all ${isLocationLoading ? 'animate-spin' : ''}`}
                >
                  🔄
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isAdmin && (
            <div className="flex flex-col items-end mr-1">
              <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-widest">Points</span>
              <span className="text-xs font-bold text-amber-400">{totalPoints}</span>
            </div>
          )}
          
          <button 
            onClick={handleHeaderLogout}
            className="w-8 h-8 rounded-lg bg-emerald-800/50 flex items-center justify-center text-sm border border-emerald-700 text-emerald-500 hover:text-amber-500 transition-colors"
            title="Logout"
          >
            🚪
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-24 relative z-10 px-4 pt-4">
        {children}
        
        {/* Subtle Developer Credit */}
        <footer className="mt-12 mb-8 text-center opacity-40">
           <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-[0.2em]">
             Developed by <span className="text-amber-500">{devName}</span>
           </p>
        </footer>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto z-40 bg-emerald-900/95 backdrop-blur-lg border-t border-emerald-800 px-1 sm:px-2 py-2 sm:py-3">
        <div className="flex justify-around items-center">
          {navItems.map((item) => (
            <button
              key={item.view}
              onClick={() => onViewChange(item.view)}
              className={`flex flex-col items-center transition-all group ${
                activeView === item.view ? 'scale-105' : 'hover:scale-105'
              }`}
            >
              <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl flex items-center justify-center text-lg sm:text-xl transition-all ${
                activeView === item.view 
                ? 'bg-gradient-to-br from-amber-500 to-amber-600 text-emerald-950 shadow-lg shadow-amber-500/30' 
                : 'bg-emerald-800/30 text-emerald-500 group-hover:bg-emerald-800/50'
              }`}>
                {item.icon}
              </div>
              <span className={`text-[8px] sm:text-[9px] mt-1 font-bold uppercase tracking-tighter transition-colors ${
                activeView === item.view ? 'text-amber-400' : 'text-emerald-700'
              }`}>
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default Layout;
