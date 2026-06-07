import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, ShieldCheck, X, Truck, Calendar } from 'lucide-react';
import { RaincoatOrder } from '../types';

interface SuccessToastProps {
  order: RaincoatOrder | null;
  onClose: () => void;
  duration?: number; // duration in ms
}

export default function SuccessToast({ order, onClose, duration = 6500 }: SuccessToastProps) {
  useEffect(() => {
    if (!order) return;

    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [order, onClose, duration]);

  if (!order) return null;

  return (
    <div className="fixed top-24 sm:top-28 right-3 sm:right-6 z-[100100] pointer-events-none w-full max-w-[calc(100vw-1.5rem)] sm:max-w-sm px-2 sm:px-0">
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.9, x: 50 }}
          animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
          exit={{ opacity: 0, scale: 0.95, x: 40 }}
          transition={{ type: 'spring', stiffness: 350, damping: 25 }}
          className="pointer-events-auto bg-slate-900 border-2 border-emerald-500 shadow-2xl p-4 rounded-2xl text-white font-sans overflow-hidden relative"
        >
          {/* Animated light pulse backdrop */}
          <div className="absolute top-[-40%] left-[-20%] w-[60%] h-[150%] bg-emerald-500/10 rounded-full blur-xl pointer-events-none"></div>

          {/* Toast Header */}
          <div className="flex items-start justify-between gap-2.5 relative z-10">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0">
                <CheckCircle2 className="h-5 w-5 text-emerald-400 animate-bounce" />
              </div>
              <div>
                <span className="text-[10px] sm:text-[11px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  অর্ডার সফল হয়েছে!
                </span>
                <h4 className="text-sm font-black text-white mt-1">ক্যাশ অন ডেলিভারি নিশ্চিত</h4>
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="p-1 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Toast Body */}
          <div className="mt-3.5 space-y-2.5 text-xs text-slate-350 relative z-10">
            <p className="text-[11px] leading-relaxed text-slate-200">
              ধন্যবাদ <strong>{order.name}</strong>, আপনার প্রিমিয়াম রেনকোট অর্ডারটি সফলভাবে গ্রহণ করা হয়েছে। 
            </p>

            <div className="bg-white/5 border border-white/10 p-2.5 rounded-xl space-y-1 font-sans">
              <div className="flex justify-between items-center text-[10px]">
                <span>অর্ডার আইডি:</span>
                <span className="font-mono font-bold text-[#00e3cd]">#{order.id.replace('ord-', '')}</span>
              </div>
              <div className="flex justify-between items-center text-[10px]">
                <span>রং ও সাইজ:</span>
                <span className="font-semibold text-slate-200">{order.color === 'Black' ? 'কালো' : 'নেভি ব্লু'} ({order.size})</span>
              </div>
              <div className="flex justify-between items-center text-[10px]">
                <span>পরিশোধযোগ্য মূল্য:</span>
                <span className="font-mono font-extrabold text-orange-400">{order.price} TK</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-bold bg-emerald-500/5 px-2.5 py-1.5 rounded-lg border border-emerald-500/10">
              <Truck className="h-3.5 w-3.5 animate-pulse" />
              <span>২৪ ঘণ্টার মধ্যে কল দিয়ে বুকিং নিশ্চিত করা হবে।</span>
            </div>
          </div>

          {/* Action Link to track */}
          <div className="mt-3.5 pt-2.5 border-t border-white/5 flex justify-end gap-2 relative z-10">
            <button
              onClick={() => {
                window.open('#/track-order', '_blank');
                onClose();
              }}
              className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-slate-950 font-black text-[10.5px] rounded-lg transition-all shadow-md cursor-pointer flex items-center gap-1"
            >
              🔍 অর্ডারটি ট্র্যাক করুন
            </button>
          </div>

          {/* Countdown timer line animation */}
          <motion.div
            initial={{ width: '100%' }}
            animate={{ width: '0%' }}
            transition={{ duration: duration / 1000, ease: 'linear' }}
            className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-400"
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
