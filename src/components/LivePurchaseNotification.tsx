import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, ShieldCheck } from 'lucide-react';

interface PurchaseNotification {
  id: number;
  name: string;
  size: string;
  color: string;
  location: string;
  timeAgo: string;
}

const PURCHASE_DATA: PurchaseNotification[] = [
  { id: 1, name: 'আবদুল্লাহ', size: 'XXL', color: 'নেভি ব্লু', location: 'মিরপুর, ঢাকা', timeAgo: 'এই মাত্র' },
  { id: 2, name: 'রহিম আক্কাস', size: '3XL', color: 'নেভি ব্লু', location: 'চাষাড়া, নারায়ণগঞ্জ', timeAgo: '২ মিনিট আগে' },
  { id: 3, name: 'সাদেক', size: 'XL', color: 'কালো', location: 'হালিশহর, চট্টগ্রাম', timeAgo: '৫ মিনিট আগে' },
  { id: 4, name: 'নিলয়', size: '4XL', color: 'কালো', location: 'রাজশাহী সদর', timeAgo: '৭ মিনিট আগে' },
  { id: 5, name: 'প্রিয়ংকা', size: 'XL', color: 'নেভি ব্লু', location: 'সিলেট মেট্রো', timeAgo: '৯ মিনিট আগে' },
  { id: 6, name: 'বেলাল', size: '3XL', color: 'কালো', location: 'খুলনা জিলা', timeAgo: '১২ মিনিট আগে' },
  { id: 7, name: 'শ্রাবণী', size: 'XXL', color: 'কালো', location: 'ময়মনসিংহ সদর', timeAgo: '১৫ মিনিট আগে' },
  { id: 8, name: 'সাথি', size: 'XXL', color: 'নেভি ব্লু', location: 'উত্তরা, ঢাকা', timeAgo: 'এই মাত্র' },
  { id: 9, name: 'রুবেল', size: '3XL', color: 'নেভি ব্লু', location: 'গাজীপুর চৌরাস্তা', timeAgo: '৩ মিনিট আগে' },
  { id: 10, name: 'মাসুম', size: 'XL', color: 'কালো', location: 'মতিঝিল, ঢাকা', timeAgo: '৬ মিনিট আগে' },
  { id: 11, name: 'শিবলি', size: '4XL', color: 'কালো', location: 'বগুড়া সদর', timeAgo: '৮ মিনিট আগে' },
  { id: 12, name: 'রহমত', size: 'XL', color: 'নেভি ব্লু', location: 'কোতোয়ালী, কুমিল্লা', timeAgo: '১০ মিনিট আগে' },
  { id: 13, name: 'হাসান', size: '3XL', color: 'কালো', location: 'যশোর কোতোয়ালি', timeAgo: '১৩ মিনিট আগে' },
  { id: 14, name: 'আনোয়ার', size: 'XXL', color: 'কালো', location: 'ধানমণ্ডি, ঢাকা', timeAgo: '১৬ মিনিট আগে' }
];

export default function LivePurchaseNotification() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Initial delay before showing the first notification
    const initialDelay = setTimeout(() => {
      setIsVisible(true);
    }, 4000);

    // Rotate notification and toggle visibility periodic interval
    const interval = setInterval(() => {
      setIsVisible(false);
      
      // Allow transition out before showing next item
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % PURCHASE_DATA.length);
        setIsVisible(true);
      }, 500);

    }, 12000); // changes every 12 seconds

    return () => {
      clearTimeout(initialDelay);
      clearInterval(interval);
    };
  }, []);

  const currentPurchase = PURCHASE_DATA[currentIndex];

  return (
    <div className="fixed top-6 right-3 sm:right-6 z-[100000] pointer-events-none w-full max-w-[calc(100vw-1.5rem)] sm:max-w-xs px-2 sm:px-0">
      <AnimatePresence mode="wait">
        {isVisible && (
          <motion.div
            key={currentPurchase.id}
            initial={{ opacity: 0, x: 50, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 40, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="pointer-events-auto bg-slate-950/90 backdrop-blur-md border border-slate-800 p-2 sm:p-2.5 rounded-xl shadow-xl flex items-center gap-2.5 text-white font-sans"
          >
            {/* Optimized Green glowing status circle / bag */}
            <div className="relative shrink-0 w-8 sm:w-9 h-8 sm:h-9 bg-gradient-to-tr from-emerald-500/20 to-teal-500/10 rounded-lg border border-emerald-500/30 flex items-center justify-center">
              <ShoppingBag className="h-4 sm:h-4.5 w-4 sm:w-4.5 text-emerald-400" />
              <div className="absolute top-0 right-0 w-2 h-2 bg-emerald-500 rounded-full border border-slate-900 animate-ping" />
              <div className="absolute top-0 right-0 w-2 h-2 bg-emerald-500 rounded-full border border-slate-900" />
            </div>

            {/* Notification Text details */}
            <div className="flex-1 min-w-0 pr-0.5">
              <div className="flex items-center justify-between gap-1">
                <span className="font-black text-[11px] sm:text-xs text-slate-100 font-sans tracking-wide truncate">
                  {currentPurchase.name}
                </span>
                <span className="text-[8px] sm:text-[9px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded-full font-bold flex items-center gap-0.5 border border-emerald-500/15 shrink-0">
                  <ShieldCheck className="h-2.5 w-2.5" /> কনফার্মড
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-300 mt-0.5 font-sans font-medium">
                <span className="text-orange-400 font-semibold">{currentPurchase.color}</span> (<span className="text-[#00e3cd] font-bold">{currentPurchase.size}</span>) রেনকোট
              </p>
              <div className="flex items-center justify-between mt-0.5 text-[8px] sm:text-[9px] text-slate-400 font-sans">
                <span className="truncate max-w-[120px] sm:max-w-none">📍 {currentPurchase.location}</span>
                <span className="shrink-0 text-amber-500 font-bold">{currentPurchase.timeAgo}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
