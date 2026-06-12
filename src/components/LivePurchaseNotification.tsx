import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, ShieldCheck, X } from 'lucide-react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { RaincoatOrder } from '../types';

interface PurchaseNotification {
  id: string | number;
  name: string;
  size: string;
  color: string;
  location: string;
  timeAgo: string;
  createdAt?: string;
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

function getBengaliTimeAgo(createdAtString?: string): string {
  if (!createdAtString) return 'এই মাত্র';
  try {
    const createdDate = new Date(createdAtString);
    const now = new Date();
    const diffMs = now.getTime() - createdDate.getTime();
    
    if (diffMs < 0) return 'এই মাত্র';
    
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    const convertToBengaliNumber = (num: number): string => {
      const bDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
      return num.toString().split('').map(d => bDigits[parseInt(d, 10)] || d).join('');
    };

    if (diffMins < 1) {
      return 'এই মাত্র';
    } else if (diffMins < 60) {
      return `${convertToBengaliNumber(diffMins)} মিনিট আগে`;
    } else if (diffHours < 24) {
      return `${convertToBengaliNumber(diffHours)} ঘণ্টা আগে`;
    } else if (diffDays === 1) {
      return 'গতকাল';
    } else {
      return `${convertToBengaliNumber(diffDays)} দিন আগে`;
    }
  } catch (e) {
    return 'কিছুক্ষণ আগে';
  }
}

export default function LivePurchaseNotification() {
  const [purchaseList, setPurchaseList] = useState<PurchaseNotification[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isListOpen, setIsListOpen] = useState(false);

  const activeList = purchaseList.length > 0 ? purchaseList : PURCHASE_DATA;

  // 1. Subscribe to Live Orders from Firestore
  useEffect(() => {
    const q = query(
      collection(db, 'orders'),
      orderBy('createdAt', 'desc'),
      limit(15)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const results: PurchaseNotification[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data() as RaincoatOrder;
        
        // Exclude cancelled/fake orders for authentic trust display
        if (
          data.status === 'Cancelled' || 
          data.status === 'Canceled' || 
          data.status === 'Canceled Fake Order'
        ) {
          return;
        }

        const locationParts: string[] = [];
        if (data.village) locationParts.push(data.village.trim());
        if (data.policeStation && (!data.village || data.village.trim() !== data.policeStation.trim())) {
          locationParts.push(data.policeStation.trim());
        }
        if (data.district && (!data.policeStation || data.policeStation.trim() !== data.district.trim())) {
          locationParts.push(data.district.trim());
        }
        
        // Mask location nicely for clean presentation (e.g., "village, district" or just "district")
        const location = locationParts.slice(-2).join(', ') || 'বাংলাদেশ';

        let colorBengali: string = data.color;
        if (data.color === 'Black') {
          colorBengali = 'কালো';
        } else if (data.color === 'Navy Blue') {
          colorBengali = 'নেভি ব্লু';
        }

        results.push({
          id: data.id || doc.id,
          name: data.name || 'সম্মানিত ক্রেতা',
          size: data.size || 'XL',
          color: colorBengali,
          location: location,
          timeAgo: 'এই মাত্র',
          createdAt: data.createdAt
        });
      });

      if (results.length > 0) {
        setPurchaseList((prevList) => {
          // If we have a new latest order that wasn't at the top of our previous list, flash it!
          if (prevList.length > 0 && results[0]?.id !== prevList[0]?.id) {
            setCurrentIndex(0);
            setIsVisible(true);
            
            // Auto close preview after 5 seconds
            setTimeout(() => {
              setIsVisible(false);
            }, 5000);
          }
          return results;
        });
      }
    }, (error) => {
      console.warn("Failed to stream live orders for notifications safely: ", error);
    });

    return () => unsubscribe();
  }, []);

  // 2. Initial delay before showing the first notification
  useEffect(() => {
    const initialDelay = setTimeout(() => {
      setIsVisible(true);
      // Auto vanish after 5 seconds to remain light and non-intrusive
      setTimeout(() => {
        setIsVisible(false);
      }, 5000);
    }, 4000);
    return () => clearTimeout(initialDelay);
  }, []);

  // 3. Rotate notification and toggle visibility periodically
  useEffect(() => {
    const listLen = activeList.length;
    if (listLen <= 1) return;

    const interval = setInterval(() => {
      setIsVisible(false);
      
      // Allow transition out before showing next item
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % listLen);
        setIsVisible(true);
        
        // Auto vanish after 5 seconds to remain clean
        setTimeout(() => {
          setIsVisible(false);
        }, 5000);
      }, 500);

    }, 15000); // changes and briefly displays every 15 seconds

    return () => clearInterval(interval);
  }, [activeList.length]);

  const currentPurchase = activeList[currentIndex];

  if (!currentPurchase) return null;

  const timeAgoVal = currentPurchase.createdAt 
    ? getBengaliTimeAgo(currentPurchase.createdAt) 
    : currentPurchase.timeAgo;

  return (
    <div className="fixed top-3 right-4 left-4 sm:left-auto sm:right-6 sm:bottom-28 sm:top-auto z-[99999] pointer-events-none flex flex-col items-end">
      
      {/* Container for Relative Floating Items */}
      <div className="relative flex items-center justify-end w-full sm:w-auto">
        
        {/* Understated sliding horizontal compact capsule indicator */}
        <AnimatePresence mode="wait">
          {isVisible && !isListOpen && (
            <motion.div
              initial={{ opacity: 0, x: 20, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 380, damping: 28 }}
              className="absolute right-12 sm:right-14 top-1/2 -translate-y-1/2 bg-slate-950/95 border border-emerald-500/25 backdrop-blur-md pl-3 pr-2 py-1.5 sm:py-2 rounded-xl sm:rounded-full shadow-2xl flex items-center gap-2 text-white text-[11px] w-[calc(100vw-6.5rem)] sm:w-auto max-w-[280px] sm:max-w-none pointer-events-auto select-none"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <p className="font-sans font-medium text-slate-100 flex flex-wrap sm:flex-nowrap items-center gap-x-1 sm:gap-1.5 leading-tight sm:leading-none flex-1 min-w-0">
                <span className="font-black text-emerald-400 shrink-0">{currentPurchase.name}</span> 
                <span className="text-slate-400 font-sans truncate max-w-[90px] sm:max-w-none">({currentPurchase.location.split(',')[0]} থেকে)</span> 
                <span className="font-sans text-amber-400 font-bold shrink-0">{currentPurchase.color} {currentPurchase.size}</span> 
                <span className="text-[10px] text-slate-300 font-sans shrink-0">অর্ডার করেছেন</span>
              </p>
              
              {/* Very small self close trigger */}
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setIsVisible(false);
                }}
                className="text-slate-400 hover:text-white p-0.5 rounded-full hover:bg-slate-800 transition cursor-pointer shrink-0"
                title="বন্ধ করুন"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Recent Purchase Dropdown Panel */}
        <AnimatePresence>
          {isListOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="absolute top-14 sm:top-auto sm:bottom-14 right-0 w-72 sm:w-80 bg-slate-950/95 border border-slate-800/80 backdrop-blur-md rounded-2xl p-4 shadow-2xl pointer-events-auto text-left select-none"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-3">
                <h3 className="text-xs font-extrabold text-slate-100 flex items-center gap-1.5 uppercase font-sans tracking-wider">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
                  সদ্য সমাপ্ত অর্ডারসমূহ
                </h3>
                <button 
                  onClick={() => setIsListOpen(false)}
                  className="text-slate-400 hover:text-white p-1 hover:bg-slate-800/40 rounded-lg transition cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              
              {/* Scrollable list of last orders */}
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800">
                {activeList.slice(0, 5).map((item, idx) => {
                  const itemTimeAgo = item.createdAt ? getBengaliTimeAgo(item.createdAt) : item.timeAgo;
                  return (
                    <div 
                      key={item.id || idx} 
                      className="p-2 rounded-xl bg-slate-900/40 border border-slate-800/40 flex items-start gap-2.5 hover:bg-slate-900/60 transition"
                    >
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center shrink-0">
                        <ShoppingBag className="h-3.5 w-3.5 text-emerald-400" />
                      </div>
                      <div className="flex-1 min-w-0 font-sans text-left">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[11px] font-black text-slate-200 truncate">{item.name}</span>
                          <span className="text-[8px] text-emerald-400 font-bold shrink-0">{itemTimeAgo}</span>
                        </div>
                        <p className="text-[9px] text-slate-400 mt-0.5 font-sans">
                          কালার: <span className="text-orange-400 font-bold">{item.color}</span> | সাইজ: <span className="text-teal-400 font-bold">{item.size}</span>
                        </p>
                        <p className="text-[8px] text-slate-500 truncate mt-0.5">
                          📍 {item.location}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-3 pt-2 text-center border-t border-slate-900">
                <p className="text-[9px] text-slate-500 font-semibold tracking-wide uppercase">
                  ⚡ রিয়েল-টাইম ডাটা ট্র্যাকিং সক্রিয়
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mini Floating Bell Button */}
        <motion.button
          onClick={() => {
            setIsListOpen(!isListOpen);
            setIsVisible(false); // Hide the slide-out tooltip on open
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          animate={isVisible ? { rotate: [0, -12, 12, -12, 12, -8, 8, 0] } : {}}
          transition={{ duration: 0.65, ease: "easeInOut" }}
          className="pointer-events-auto w-11 h-11 rounded-full bg-slate-950/90 hover:bg-slate-900 border border-slate-800/80 text-white shadow-2xl flex items-center justify-center cursor-pointer transition relative select-none"
          title="অর্ডার নোটিফিকেশন"
        >
          {/* Subtle glowing indicator or icon */}
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className="h-4.5 w-4.5 text-slate-100 group-hover:text-emerald-400 transition"
          >
            <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
            <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
          </svg>

          {/* Glowing Red Notification Ring Indicator */}
          <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border border-slate-950 animate-pulse">
            <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
          </span>
        </motion.button>

      </div>
    </div>
  );
}
