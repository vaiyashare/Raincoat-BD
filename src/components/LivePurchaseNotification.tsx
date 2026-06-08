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
      }, 500);

    }, 12000); // changes every 12 seconds

    return () => clearInterval(interval);
  }, [activeList.length]);

  const currentPurchase = activeList[currentIndex];

  if (!currentPurchase) return null;

  const timeAgoVal = currentPurchase.createdAt 
    ? getBengaliTimeAgo(currentPurchase.createdAt) 
    : currentPurchase.timeAgo;

  return (
    <div className="fixed top-6 right-3 sm:right-6 z-[100000] pointer-events-none w-full max-w-[calc(100vw-1.5rem)] sm:max-w-xs px-2 sm:px-0">
      <AnimatePresence mode="wait">
        {isVisible && (
          <motion.div
            key={currentPurchase.id}
            initial={{ opacity: 0, x: 50, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            drag="x"
            dragConstraints={{ left: -100, right: 300 }}
            dragElastic={0.2}
            onDragEnd={(event, info) => {
              if (info.offset.x > 80 || info.offset.x < -80) {
                setIsVisible(false);
              }
            }}
            whileDrag={{ scale: 0.96, opacity: 0.7 }}
            className="pointer-events-auto bg-slate-950/90 backdrop-blur-md border border-slate-800 p-2 sm:p-2.5 rounded-xl shadow-xl flex items-center gap-2.5 text-white font-sans cursor-grab active:cursor-grabbing relative overflow-hidden select-none"
          >
            {/* Optimized Green glowing status circle / bag */}
            <div className="relative shrink-0 w-8 sm:w-9 h-8 sm:h-9 bg-gradient-to-tr from-emerald-500/20 to-teal-500/10 rounded-lg border border-emerald-500/30 flex items-center justify-center pointer-events-none">
              <ShoppingBag className="h-4 sm:h-4.5 w-4 sm:w-4.5 text-emerald-400" />
              <div className="absolute top-0 right-0 w-2 h-2 bg-emerald-500 rounded-full border border-slate-900 animate-ping" />
              <div className="absolute top-0 right-0 w-2 h-2 bg-emerald-500 rounded-full border border-slate-900" />
            </div>

            {/* Notification Text details */}
            <div className="flex-1 min-w-0 pr-4 pointer-events-none">
              <div className="flex items-center justify-between gap-1">
                <span className="font-sans font-black text-[11px] sm:text-xs text-slate-100 tracking-wide truncate max-w-[120px]">
                  {currentPurchase.name}
                </span>
                <span className="text-[8px] sm:text-[9px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded-full font-sans font-bold flex items-center gap-0.5 border border-emerald-500/15 shrink-0">
                  <ShieldCheck className="h-2.5 w-2.5" /> কনফার্মড
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-300 mt-0.5 font-sans font-medium">
                <span className="text-orange-400 font-semibold">{currentPurchase.color}</span> (<span className="text-[#00e3cd] font-bold">{currentPurchase.size}</span>) রেনকোট
              </p>
              <div className="flex items-center justify-between mt-0.5 text-[8px] sm:text-[9px] text-slate-400 font-sans">
                <span className="truncate max-w-[120px] sm:max-w-[160px]">📍 {currentPurchase.location}</span>
                <span className="shrink-0 text-amber-500 font-sans font-bold">{timeAgoVal}</span>
              </div>
            </div>

            {/* Simple Tap/Click Cross to Dismiss */}
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setIsVisible(false);
              }}
              className="absolute top-1 right-1 p-1 text-slate-400 hover:text-white rounded-full hover:bg-slate-800/40 transition cursor-pointer"
              title="বন্ধ করুন"
            >
              <X className="h-3 w-3" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
