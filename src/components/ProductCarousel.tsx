import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ShieldCheck, Sparkles, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import navyRaincoatImg from '../assets/images/navy_raincoat_1780660053988.png';
import blackRaincoatImg from '../assets/images/black_raincoat_1780660074069.png';
import seamSealingImg from '../assets/images/raincoat_seam_sealing_1780660091277.png';
import wristCuffsImg from '../assets/images/raincoat_wrist_cuffs_1780660107193.png';
import actionImg from '../assets/images/navy_raincoat_action_1780660126544.png';

interface CarouselItem {
  id: number;
  url: string;
  title: string;
  tag: string;
  description?: string;
}

export default function ProductCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const carouselItems: CarouselItem[] = [
    {
      id: 1,
      url: navyRaincoatImg,
      title: 'প্রিমিয়াম নেভি ব্লু কালার',
      tag: 'নেভি ব্লু',
      description: 'ক্যাপসহ প্রিমিয়াম ২-পিস জ্যাকেট ও জুতো কাভারসহ ট্রাউজার সেট',
    },
    {
      id: 2,
      url: blackRaincoatImg,
      title: 'প্রিমিয়াম জেট ব্ল্যাক কালার',
      tag: 'কালো',
      description: 'অভিজাত ব্ল্যাক কালার এবং জ্যাকেটের বুকে আল্ট্রা রিফ্লেক্টিভ সেফটি স্ট্রাইপ',
    },
    {
      id: 3,
      url: actionImg,
      title: 'রেইনকোটটির বাস্তব ফিটিং লুক',
      tag: 'স্মার্ট ডিজাইন',
      description: 'যেকোনো পোশাকে সহজেই ফিট করে, হালকা এবং শতভাগ স্বাচ্ছন্দ্যময়',
    },
    {
      id: 4,
      url: seamSealingImg,
      title: '১০০% লিকপ্রুফ সীমিং প্রযুক্তি',
      tag: 'ওয়াটারপ্রুফ গিয়ার',
      description: 'রেইনকোটের ভেতরের প্রতিটি সেলাই জয়েন্ট হট-প্রেসড পিইউ টেপ দ্বারা সিল করা',
    },
    {
      id: 5,
      url: wristCuffsImg,
      title: 'ভেলক্রো এডজাস্টেবল রিস্ট কাফ',
      tag: 'ফিটিং লুক',
      description: 'হাতে পানি প্রবেশ করা সম্পূর্ণ আটকাতে ইলাস্টিক বর্ডার প্লাস ভেলক্রো বেল্ট সুবিধা',
    },
  ];

  useEffect(() => {
    if (isHovered) return;

    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % carouselItems.length);
    }, 4500);

    return () => clearInterval(timer);
  }, [isHovered, carouselItems.length]);

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prevIndex) => (prevIndex - 1 + carouselItems.length) % carouselItems.length);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prevIndex) => (prevIndex + 1) % carouselItems.length);
  };

  const currentItem = carouselItems[currentIndex];

  return (
    <div 
      className="relative w-full max-w-sm sm:max-w-md md:max-w-lg aspect-[4/5] sm:aspect-square bg-slate-950/40 border border-slate-700/60 rounded-3xl shadow-2xl overflow-hidden group select-none"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      id="product-gallery-carousel"
    >
      {/* Background Ambience Soft Light */}
      <div className="absolute inset-0 bg-radial from-indigo-900/10 to-transparent pointer-events-none" />

      {/* Slide Image Rendering with Motion Transitions */}
      <div className="w-full h-full relative flex items-center justify-center p-2 sm:p-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentItem.id}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="w-full h-full flex items-center justify-center"
          >
            <img
              src={currentItem.url}
              alt={currentItem.title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-contain rounded-2xl max-h-[85%] transition duration-500 transform group-hover:scale-[1.02]"
              id={`carousel-img-${currentItem.id}`}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Product Tag Overlays */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-none z-10">
        <span className="bg-amber-500 text-slate-950 font-bold text-[9px] sm:text-[10px] uppercase font-sans tracking-wider px-2.5 py-1 rounded-full shadow-md backdrop-blur-xs flex items-center gap-1">
          <Sparkles className="h-3 w-3" />
          Monsoon Premium
        </span>
        <span className="bg-blue-600/90 text-white font-extrabold text-[9px] sm:text-[10px] uppercase font-sans tracking-wider px-2.5 py-1 rounded-full shadow-md backdrop-blur-xs">
          {currentItem.tag}
        </span>
      </div>

      {/* Manual Controls Buttons */}
      <button
        onClick={handlePrev}
        className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 bg-slate-900/75 hover:bg-slate-900 text-white rounded-full flex items-center justify-center border border-slate-750 hover:scale-105 active:scale-95 transition-all duration-200 z-10 opacity-0 group-hover:opacity-100 cursor-pointer"
        aria-label="Previous image"
        id="carousel-btn-prev"
      >
        <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
      </button>

      <button
        onClick={handleNext}
        className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 bg-slate-900/75 hover:bg-slate-900 text-white rounded-full flex items-center justify-center border border-slate-750 hover:scale-105 active:scale-95 transition-all duration-200 z-10 opacity-0 group-hover:opacity-100 cursor-pointer"
        aria-label="Next image"
        id="carousel-btn-next"
      >
        <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
      </button>

      {/* Info Label Panel Overlay (Bottom) */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-950 via-slate-950/90 to-transparent p-4 pt-10 pb-4 z-10">
        <div className="text-center sm:text-left">
          <h4 className="text-sm sm:text-base font-bold text-white font-sans flex items-center justify-center sm:justify-start gap-1.5">
            <ShieldCheck className="h-4 w-4 text-emerald-450 shrink-0" />
            {currentItem.title}
          </h4>
          {currentItem.description && (
            <p className="text-[10px] sm:text-xs text-slate-300 mt-1 font-sans font-medium line-clamp-1 leading-relaxed">
              {currentItem.description}
            </p>
          )}
        </div>

        {/* Carousel indicators/dots */}
        <div className="flex justify-center gap-1.5 mt-3">
          {carouselItems.map((_, idx) => (
            <button
              key={idx}
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex(idx);
              }}
              className={`h-1.5 transition-all duration-350 rounded-full cursor-pointer ${
                idx === currentIndex ? 'w-5 bg-amber-500' : 'w-1.5 bg-slate-600/70 hover:bg-slate-500'
              }`}
              title={`Slide ${idx + 1}`}
              id={`carousel-dot-${idx}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
