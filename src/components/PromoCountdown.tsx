import React, { useState, useEffect } from 'react';
import { Timer, Flame } from 'lucide-react';

export default function PromoCountdown() {
  const [timeLeft, setTimeLeft] = useState({ hours: 2, minutes: 47, seconds: 15 });

  useEffect(() => {
    // Persistent timer targeting ~2 hours and 47 minutes for high conversion
    const TIMER_KEY = 'raincoat_promo_target_time';
    let targetTime = localStorage.getItem(TIMER_KEY);

    if (!targetTime) {
      // Set to 2 hours, 47 minutes, and 15 seconds from now
      const futureTime = Date.now() + (2 * 60 * 60 * 1000) + (47 * 60 * 1000) + (15 * 1000);
      localStorage.setItem(TIMER_KEY, futureTime.toString());
      targetTime = futureTime.toString();
    }

    const calculateTimeLeft = () => {
      const now = Date.now();
      let diff = parseInt(targetTime || '0') - now;

      if (diff <= 0) {
        // Reset the timer for another round to stay persistent and functional
        const resetTarget = Date.now() + (2 * 60 * 60 * 1000) + (47 * 60 * 1000) + (15 * 1000);
        localStorage.setItem(TIMER_KEY, resetTarget.toString());
        diff = resetTarget - now;
      }

      const hrs = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const mins = Math.floor((diff / (1000 * 60)) % 60);
      const secs = Math.floor((diff / 1000) % 60);

      setTimeLeft({ hours: hrs, minutes: mins, seconds: secs });
    };

    calculateTimeLeft(); // run once immediately
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, []);

  // English numbers to Bengali digits converter helper
  const convertToBanglaNumber = (num: number): string => {
    const banglaDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    const formattedNum = num.toString().padStart(2, '0');
    return formattedNum
      .split('')
      .map(char => {
        const digit = parseInt(char);
        return isNaN(digit) ? char : banglaDigits[digit];
      })
      .join('');
  };

  return (
    <div className="bg-slate-950/80 border border-amber-500/20 rounded-2xl p-4 sm:p-5 shadow-lg shadow-amber-500/5 font-sans relative overflow-hidden my-4">
      {/* Absolute pulse background effect */}
      <div className="absolute -top-12 -right-12 w-24 h-24 bg-amber-500/10 rounded-full blur-xl pointer-events-none" />
      
      <div className="flex flex-col sm:flex-row items-center sm:justify-between gap-3 relative z-10">
        <div className="flex items-center gap-2">
          {/* Glowing Flame/Timer Icon */}
          <div className="h-9 w-9 bg-gradient-to-tr from-amber-500 to-orange-600 rounded-lg flex items-center justify-center text-slate-950 animate-pulse">
            <Flame className="h-5 w-5 fill-current" />
          </div>
          <div className="text-center sm:text-left">
            <span className="text-[10px] sm:text-xs font-black text-amber-500 uppercase tracking-widest block">মনসুন বিশেষ ডিসকাউন্ট</span>
            <p className="text-xs sm:text-sm font-extrabold text-slate-100 mt-0.5">অফারের সময় শেষ হতে আর বাকি:</p>
          </div>
        </div>

        {/* Timers Digits layout */}
        <div className="flex items-center gap-2 font-black text-lg sm:text-xl font-sans">
          {/* Hours block */}
          <div className="flex flex-col items-center">
            <div className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-amber-400 min-w-[44px] text-center shadow-inner tracking-widest">
              {convertToBanglaNumber(timeLeft.hours)}
            </div>
            <span className="text-[9px] text-slate-400 mt-1 font-bold">ঘণ্টা</span>
          </div>

          <span className="text-amber-500/80 -mt-3.5">:</span>

          {/* Minutes block */}
          <div className="flex flex-col items-center">
            <div className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-amber-400 min-w-[44px] text-center shadow-inner tracking-widest animate-pulse">
              {convertToBanglaNumber(timeLeft.minutes)}
            </div>
            <span className="text-[9px] text-slate-400 mt-1 font-bold">মিনিট</span>
          </div>

          <span className="text-amber-500/80 -mt-3.5">:</span>

          {/* Seconds block */}
          <div className="flex flex-col items-center">
            <div className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-orange-500 min-w-[44px] text-center shadow-inner tracking-widest">
              {convertToBanglaNumber(timeLeft.seconds)}
            </div>
            <span className="text-[9px] text-slate-400 mt-1 font-bold">সেকেন্ড</span>
          </div>
        </div>
      </div>
      
      {/* Progress Line */}
      <div className="w-full bg-slate-900 h-1 rounded-full mt-3 overflow-hidden border border-slate-850">
        <div 
          className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-1000 animate-pulse"
          style={{ width: `${((timeLeft.hours * 3600 + timeLeft.minutes * 60 + timeLeft.seconds) / (3 * 3600)) * 100}%` }}
        />
      </div>
    </div>
  );
}
