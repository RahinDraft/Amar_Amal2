
import React, { useState } from 'react';

interface PinAuthProps {
  correctPin: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const PinAuth: React.FC<PinAuthProps> = ({ correctPin, onSuccess, onCancel }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === correctPin) {
      onSuccess();
    } else {
      setError(true);
      setPin('');
      setTimeout(() => setError(false), 500);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fadeIn">
      <div className="w-16 h-16 bg-emerald-900 rounded-full flex items-center justify-center text-2xl mb-6 shadow-xl border border-emerald-800">🔐</div>
      <h3 className="text-xl font-bold text-amber-400 mb-2">এডমিন পিন দিন</h3>
      <p className="text-emerald-500 text-xs mb-8">সেটিংস পরিবর্তন করতে ৪ সংখ্যার পিনটি দিন</p>
      
      <form onSubmit={handleSubmit} className="w-full max-w-xs space-y-6">
        <div className="flex justify-center gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div 
              key={i}
              className={`w-12 h-16 border-2 rounded-2xl flex items-center justify-center text-2xl font-bold transition-all ${
                error ? 'border-red-500 animate-shake' : 
                pin.length > i ? 'border-amber-500 text-amber-400 bg-amber-500/10' : 'border-emerald-800 text-emerald-800'
              }`}
            >
              {pin.length > i ? '•' : ''}
            </div>
          ))}
        </div>
        
        <input 
          type="password"
          pattern="\d*"
          inputMode="numeric"
          autoFocus
          maxLength={4}
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
          className="sr-only"
        />

        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 'C', 0, 'OK'].map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                if (key === 'C') setPin('');
                else if (key === 'OK') { if(pin === correctPin) onSuccess(); else { setError(true); setPin(''); } }
                else if (typeof key === 'number' && pin.length < 4) setPin(prev => prev + key);
              }}
              className="h-14 bg-emerald-900/50 hover:bg-emerald-800 text-slate-100 rounded-2xl font-bold text-lg active:scale-90 transition-transform border border-emerald-800"
            >
              {key}
            </button>
          ))}
        </div>

        <button 
          type="button"
          onClick={onCancel}
          className="w-full text-emerald-600 text-xs font-bold uppercase tracking-widest pt-4"
        >
          ফিরে যান
        </button>
      </form>
    </div>
  );
};

export default PinAuth;
