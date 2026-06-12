import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, Bike, Star, ShoppingBag, ShieldCheck, Phone, CheckCircle2, 
  MapPin, Clock, ArrowDown, ChevronRight, HelpCircle, Heart, Settings, 
  Smartphone, Award, Flame, ThumbsUp, Volume2, Droplets, Truck, Shield, 
  Sparkles, X, Sliders, Wind, HelpCircle as QuestionIcon, MessageCircle
} from 'lucide-react';
import { Size, ProductColor, RaincoatOrder } from '../types';
import { getMediaFromFirestore, addOrderToFirestore, getAdvancedAddonsSettingsFromFirestore } from '../lib/firebase';
import { trackPixelEvent } from '../lib/tracking';
import { motion, AnimatePresence } from 'motion/react';

interface BikeCoverLandingProps {
  onOrderSuccess: (order: RaincoatOrder) => void;
}

const defaultTripleCards = [
  {
    title: "১০০% প্রিমিয়াম ফিটিংস",
    imageUrl: "https://images.unsplash.com/photo-1558981856-653c55a5bfdd?auto=format&fit=crop&q=80&w=600",
    description: "আপনার শখের বাইকের সাইজ অনুযায়ী নিখুঁত ফিটিংস ও চমৎকার ফিনিশিং।"
  },
  {
    title: "থার্মাল হিট সিল টেকনোলজি",
    imageUrl: "https://images.unsplash.com/photo-1558980590-25501fb3a893?auto=format&fit=crop&q=80&w=600",
    description: "ডাবল সেলাই ও হিট সিল্ড কভারেজ, যা বিন্দুমাত্র পানি বা কুয়াশা প্রবেশ করতে দেয় না।"
  },
  {
    title: "২ বছর দীর্ঘমেয়াদি গ্যারান্টি",
    imageUrl: "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&q=80&w=600",
    description: "সুপার ডিউরেবল প্যারাশুট ফ্যাব্রিকেশন, যা রোদের তাপে বা কড়া শীতেও দীর্ঘদিন ফেটে যায় না।"
  }
];

export default function BikeCoverLanding({ onOrderSuccess }: BikeCoverLandingProps) {
  const [selectedColor, setSelectedColor] = useState<ProductColor>('Navy Blue');
  const [submittedOrder, setSubmittedOrder] = useState<RaincoatOrder | null>(null);
  
  // Form fields
  const [name, setName] = useState('');
  const [village, setVillage] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('ঢাকা (Dhaka)');
  const [bikeModel, setBikeModel] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [bikeTripleCards, setBikeTripleCards] = useState<any[]>(defaultTripleCards);

  // Default Fallback Slider Images featuring real Black & Navy Blue covers
  const defaultBikeSliderImages = [
    {
      title: "Navy Blue Cover (নেভি ব্লু)",
      badge: "জনপ্রিয় কালার",
      price: "৭৫0 টাকা (অফার মূল্য: ৬০০/-)",
      description: "ছাতা কাপড়ের তৈরি শতভাগ ওয়াটারপ্রুফ ও ডাস্টপ্রুফ নেভি ব্লু বাইক কভার",
      url: "https://images.unsplash.com/photo-1558981856-653c55a5bfdd?auto=format&fit=crop&q=80&w=600",
      color: "from-blue-600 to-indigo-900"
    },
    {
      title: "Premium Jet Black Cover (কালো)",
      badge: "শতভাগ প্রিমিয়াম",
      price: "৭৫0 টাকা (অফার মূল্য: ৬০০/-)",
      description: "অভিজাত ব্ল্যাক কালার, ডাস্টপ্রুফ এবং রোদের তাপ প্রতিরোধক সুউচ্চ ফিনিশিং কভার",
      url: "https://images.unsplash.com/photo-1558980590-25501fb3a893?auto=format&fit=crop&q=80&w=600",
      color: "from-neutral-800 to-neutral-950"
    },
    {
      title: "Silver Heat Protection (সিলভার কোটিং)",
      badge: "সিলভার প্রটেকশন",
      price: "স্পেশাল ডাস্টপ্রুফ কোটিং",
      description: "বড় সাইজের বাইকের কভারের ভেতরের অংশে বিশেষ সিলভার কোটিং যা ইঞ্জিন গরম হওয়া প্রতিরোধ করে",
      url: "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&q=80&w=600",
      color: "from-slate-400 to-slate-700"
    }
  ];

  // Active state-driven slides and videos
  const [slides, setSlides] = useState<any[]>(defaultBikeSliderImages);
  const [bikeVideos, setBikeVideos] = useState<any[]>([]);
  const [activeSlide, setActiveSlide] = useState(0);

  // Auto move slider effect
  useEffect(() => {
    if (slides.length <= 1) return;
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [slides.length]);

  // Load custom banners and videos for /bikecover from Firestore/LocalStorage
  useEffect(() => {
    getMediaFromFirestore().then((mediaList) => {
      // 1. Fetch bikecover specific slide images
      const filteredSlides = mediaList.filter(item => item.page === 'bikecover' && item.tag !== 'LiveVideo');
      if (filteredSlides.length > 0) {
        const sorted = [...filteredSlides].sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
        setSlides(sorted.map(item => ({
          title: item.title,
          badge: item.tag || "বিশেষ আকর্ষণ",
          price: "৭৫0 টাকা (অফার মূল্য: ৬০০/-)",
          description: item.description || "ছাতা কাপড়ের তৈরি শতভাগ ওয়াটারপ্রুফ ও ডাস্টপ্রুফ বাইক কভার",
          url: item.url,
          color: "from-blue-600 to-indigo-900",
          bgUrl: item.bgUrl
        })));
      }

      // 2. Fetch bikecover specific live videos
      const filteredVideos = mediaList.filter(item => String(item.id).startsWith('live-video-') && item.page === 'bikecover');
      if (filteredVideos.length > 0) {
        setBikeVideos(filteredVideos);
      } else {
        // Default video fallback
        setBikeVideos([
          {
            id: 'bike-video-default-1',
            url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
            title: '১০০% পানি প্রতিরোধ প্রদর্শন (Waterproof Video Demo)'
          }
        ]);
      }
    }).catch(err => {
      console.warn("Could not load dynamic covers or videos from database:", err);
    });
  }, []);

  useEffect(() => {
    const loadTripleCards = () => {
      getAdvancedAddonsSettingsFromFirestore().then((settings) => {
        if (settings && settings.bike_triple_cards && settings.bike_triple_cards.length === 3) {
          setBikeTripleCards(settings.bike_triple_cards);
        } else {
          setBikeTripleCards(defaultTripleCards);
        }
      }).catch(err => {
        console.warn("Could not load triple cards settings:", err);
        setBikeTripleCards(defaultTripleCards);
      });
    };

    loadTripleCards();

    window.addEventListener('raincoat_site_settings_updated', loadTripleCards);
    return () => window.removeEventListener('raincoat_site_settings_updated', loadTripleCards);
  }, []);

  useEffect(() => {
    // Scroll progress handler
    const handleScroll = () => {
      const checkoutEl = document.getElementById('checkout-form');
      if (!checkoutEl) return;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const DISTRICT_LIST = [
    'বাগেরহাট (Bagerhat)',
    'বান্দরবান (Bandarban)',
    'বরগুনা (Barguna)',
    'বরিশাল (Barishal)',
    'ভোলা (Bhola)',
    'বগুড়া (Bogura)',
    'ব্রাহ্মণবাড়িয়া (Brahmanbaria)',
    'চাঁদপুর (Chandpur)',
    'চাঁপাইনওয়াবগঞ্জ (Chapainawabganj)',
    'চট্টগ্রাম (Chattogram)',
    'চুয়াডাঙ্গা (Chuadanga)',
    'কক্সবাজার (Cox’s Bazar)',
    'কুমিল্লা (Cumilla)',
    'ঢাকা (Dhaka)',
    'দিনাজপুর (Dinajpur)',
    'ফরিদপুর (Faridpur)',
    'ফেনী (Feni)',
    'গাইবান্ধা (Gaibandha)',
    'গাজীপুর (Gazipur)',
    'গোপালগঞ্জ (Gopalganj)',
    'হবিগঞ্জ (Habiganj)',
    'জামালপুর (Jamalpur)',
    'যশোর (Jashore)',
    'ঝালকাঠি (Jhalokati)',
    'ঝিনাইদহ (Jhenaidah)',
    'জয়পুরহাট (Joypurhat)',
    'খাগড়াছড়ি (Khagrachhari)',
    'খুলনা (Khulna)',
    'কিশোরগঞ্জ (Kishoreganj)',
    'কুড়িগ্রাম (Kurigram)',
    'কুষ্টিয়া (Kushtia)',
    'লক্ষ্মীপুর (Lakshmipur)',
    'লালমনিরহাট (Lalmonirhat)',
    'মাদারীপুর (Madaripur)',
    'মাগুরা (Magura)',
    'মানিকগঞ্জ (Manikganj)',
    'মেহেরপুর (Meherpur)',
    'مৌলভীবাজার (Moulvibazar)',
    'মৌলভীবাজার (Moulvibazar)',
    'মুন্সীগঞ্জ (Munshiganj)',
    'ময়মনসিংহ (Mymensingh)',
    'নওগাঁ (Naogaon)',
    'নড়াইল (Narail)',
    'নারায়ণগঞ্জ (Narayanganj)',
    'নরসিংদী (Narsingdi)',
    'নাটোর (Natore)',
    'নেত্রকোণা (Netrokona)',
    'নীলফামারী (Nilphamari)',
    'নোয়াখালী (Noakhali)',
    'পাবনা (Pabna)',
    'পঞ্চগড় (Panchagarh)',
    'পটুয়াখালী (Patuakhali)',
    'পিরোজপুর (Pirojpur)',
    'রাজবাড়ি (Rajbari)',
    'রাজশাহী (Rajshahi)',
    'রাঙামাটি (Rangamati)',
    'রংপুর (Rangpur)',
    'সাতক্ষীরা (Satkhira)',
    'শরীয়তপুর (Shariatpur)',
    'শেরপুর (Sherpur)',
    'সিরাজগঞ্জ (Sirajganj)',
    'সুনামগঞ্জ (Sunamganj)',
    'সিলেট (Sylhet)',
    'টাঙ্গাইল (Tangail)',
    'ঠাকুরগাঁও (Thakurgaon)'
  ];

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!name.trim()) return setErrorMessage('অনুগ্রহ করে আপনার নাম লিখুন।');
    if (!bikeModel.trim()) return setErrorMessage('অনুগ্রহ করে আপনার বাইকের মডেলটি সুন্দর করে লিখে দিন (যেমন: Pulsar 150, FZ-S)।');
    if (!village.trim()) return setErrorMessage('অনুগ্রহ করে আপনার সম্পূর্ণ ঠিকানা (গ্রাম/পাড়া/থানা) লিখুন।');
    
    let cleanPhone = phone.replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('88')) {
      cleanPhone = cleanPhone.substring(2);
    }
    if (!cleanPhone.startsWith('01')) {
      if (cleanPhone.startsWith('1') && cleanPhone.length === 10) {
        cleanPhone = '0' + cleanPhone;
      }
    }
    if (!cleanPhone.startsWith('01') || cleanPhone.length !== 11) {
      return setErrorMessage('অনুগ্রহ করে একটি সঠিক ১১ ডিজিটের বাংলাদেশী মোবাইল নাম্বার দিন (যেমন: 017XXXXXXXX)।');
    }

    setIsSubmitting(true);

    const orderId = 'ord-bike-' + Math.floor(Math.random() * 100000);
    const newOrder: RaincoatOrder = {
      id: orderId,
      name,
      village: `${village}, District: ${selectedDistrict}`,
      phone: cleanPhone,
      size: 'XL', // Default size mapped for bike covers
      color: selectedColor,
      weight: 65,
      heightFeet: 5,
      heightInches: 6,
      price: 600, // Total cost in Taka including home delivery
      status: 'Pending',
      isConfirmed: false,
      bikeModel: bikeModel.trim(),
      createdAt: new Date().toISOString(),
      synced: false,
    };

    try {
      await addOrderToFirestore(newOrder);
      newOrder.synced = true;
    } catch (err) {
      console.warn("Direct addOrderToFirestore failed, fallback using local storage syncing:", err);
    }

    // Sync local raincoat_orders cache as well
    const listJson = localStorage.getItem('raincoat_orders') || '[]';
    const list = JSON.parse(listJson);
    list.unshift(newOrder);
    localStorage.setItem('raincoat_orders', JSON.stringify(list));

    setSubmittedOrder(newOrder);
    onOrderSuccess(newOrder);

    trackPixelEvent('Purchase', {
      value: 600,
      currency: 'BDT',
      content_name: 'Premium Bike Cover',
      content_category: 'Automotive Accessories'
    });
    
    setIsSubmitting(false);
  };

  const getEmbedUrl = (url: string) => {
    if (!url) return '';
    try {
      if (url.includes('youtube.com/embed/')) return url;
      if (url.includes('youtube.com/watch')) {
        const id = new URL(url).searchParams.get('v');
        return id ? `https://www.youtube.com/embed/${id}` : url;
      }
      if (url.includes('youtu.be/')) {
        const parts = url.split('/');
        const id = parts[parts.length - 1]?.split('?')[0];
        return id ? `https://www.youtube.com/embed/${id}` : url;
      }
      if (url.includes('facebook.com/')) {
        return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=0`;
      }
      return url;
    } catch (e) {
      return url;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans selection:bg-orange-600 selection:text-white relative">
      
      {/* Top Urgent Alert Strip */}
      <div className="bg-gradient-to-r from-orange-600 via-rose-500 to-blue-900 text-white text-xs sm:text-sm font-bold text-center py-2 px-4 shadow-sm flex items-center justify-center gap-2 relative z-40 font-sans">
        <span className="bg-white/20 px-2 py-0.5 rounded-full text-[10px] sm:text-xs animate-pulse text-amber-200">ধামাকা অফার!</span>
        <span>🏍️ সারা বাংলাদেশে হোম ডেলিভারি এবং ক্যাশ অন ডেলিভারি চার্জ মাত্র ৬০০ টাকা! 🚛</span>
        <button
          onClick={() => scrollToSection('checkout-form')}
          className="underline hover:text-orange-200 transition font-extrabold cursor-pointer hidden sm:inline-block ml-4"
        >
          অর্ডার করুন এখন
        </button>
      </div>

      {/* Hero Header Section */}
      <header className="relative bg-gradient-to-b from-slate-950 to-slate-900 text-white overflow-hidden py-12 sm:py-20 border-b border-slate-800" id="home">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-600/10 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="container mx-auto px-4 max-w-7xl relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* Left Column: Core features / Title */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 text-cyan-400 text-xs font-bold rounded-full border border-blue-500/20 uppercase tracking-widest font-sans">
                <Bike className="h-4 w-4 animate-bounce text-cyan-400" /> ১০০% প্রিমিয়াম বাইক কভার
              </div>
              
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white leading-tight font-sans">
                100% Waterproof & <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-orange-200 to-white block mt-2">
                  Dustproof Bike Cover 🛡️
                </span>
              </h1>
              
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto lg:mx-0 font-sans">
                বাংলাদেশের সকল মডেলের বাইকের জন্য একদম উপযোগী প্রিমিয়াম সাইজ কভার। রোদ, বৃষ্টি, ধুলোবালি কিংবা দাগ থেকে আপনার শখের মোটর বাইককে সম্পূর্ণ নতুনের মতো সতেজ ও সুরক্ষিত রাখুন। সরাসরি চায়না থেকে আমদানিকৃত ৩০০০ মিলি ওজনের ছাতা কাপড়ের তৈরি এই বাইক কভার ২ বছরেরও বেশি অনায়াসে টেকসই থাকবে।
              </p>

              {/* Special Pricing display */}
              <div className="bg-slate-800/80 backdrop-blur-xs p-5 rounded-2xl border border-slate-700/80 max-w-md mx-auto lg:mx-0">
                <div className="text-center font-sans">
                  <span className="text-xs text-slate-400 block pb-1">সারা বাংলাদেশ ডেলিভারি চার্জ সহ ধামাকা অফার মূল্য </span>
                  <div className="flex justify-center items-center gap-3">
                    <span className="text-sm line-through text-slate-500">৭৫০/- TK</span>
                    <span className="text-3xl font-black text-orange-400 font-mono">৬০০/- TK</span>
                    <span className="text-xs bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded-full">হোম ডেলিভারি</span>
                  </div>
                </div>
              </div>

              {/* Features bullet checklist */}
              <div className="grid grid-cols-2 gap-y-3.5 gap-x-4 pt-2 text-slate-300 text-xs sm:text-sm font-semibold max-w-md mx-auto lg:mx-0">
                <div className="flex items-center gap-1.5 font-sans">
                  <CheckCircle2 className="h-4.5 w-4.5 text-emerald-400 shrink-0" /> পানিরোধক (Waterproof 💯%)
                </div>
                <div className="flex items-center gap-1.5 font-sans">
                  <CheckCircle2 className="h-4.5 w-4.5 text-emerald-400 shrink-0" /> ধুলিকণাবারক (Dustproof 💯%)
                </div>
                <div className="flex items-center gap-1.5 font-sans">
                  <CheckCircle2 className="h-4.5 w-4.5 text-emerald-400 shrink-0" /> চাকার ইলাস্টিক জ্যাকিং
                </div>
                <div className="flex items-center gap-1.5 font-sans">
                  <CheckCircle2 className="h-4.5 w-4.5 text-emerald-400 shrink-0" /> সিলভার হিট প্রুফ কোটিং
                </div>
              </div>

              {/* Call to action orders flow buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-3">
                <button
                  onClick={() => scrollToSection('checkout-form')}
                  className="px-8 py-4 bg-orange-500 hover:bg-orange-600 active:scale-98 text-white font-black text-sm sm:text-base rounded-2xl transition duration-300 shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 cursor-pointer animate-pulse-subtle"
                >
                  <ShoppingBag className="h-5 w-5" /> এখনই অর্ডার করুন (ক্যাশ অন ডেলিভারি)
                </button>
                <button
                  onClick={() => scrollToSection('reviews-section')}
                  className="px-6 py-4 bg-slate-800 hover:bg-slate-700 active:scale-98 text-slate-205 border border-slate-700 font-bold text-sm sm:text-base rounded-2xl transition duration-300 flex items-center justify-center gap-1 cursor-pointer"
                >
                  কাস্টমার রিভিউ এবং ফিডব্যাক <ChevronRight className="h-5 w-5 text-slate-400" />
                </button>
              </div>

              {/* Fast trust highlights */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-4 border-t border-slate-800/80 font-sans">
                <div className="flex items-center gap-1.5 bg-slate-800/50 px-3 py-1.5 rounded-full border border-slate-850">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  <span className="text-xs text-slate-300 font-medium">৭ দিনের পরিবর্তন গ্যারান্টি</span>
                </div>
                <div className="flex items-center gap-1.5 bg-slate-800/50 px-3 py-1.5 rounded-full border border-slate-850">
                  <Truck className="h-4 w-4 text-amber-400" />
                  <span className="text-xs text-slate-300 font-medium">২ থেকে ৩ দিনে সারা দেশে ডেলিভারি</span>
                </div>
              </div>

            </div>

            {/* Right Column: Dynamic Slider (Arrows removed to save space!) */}
            <div className="lg:col-span-5 relative w-full flex flex-col items-center justify-center">
              <div className="w-full max-w-sm bg-slate-950 p-6 rounded-3xl border border-slate-800 shadow-2xl space-y-5">
                
                {/* Image Showcase Container */}
                <div className="h-60 rounded-2xl p-5 flex flex-col justify-between text-white relative overflow-hidden transition-all duration-500 shadow-xl border border-slate-850 bg-slate-900">
                  {/* Background Layer of Slide */}
                  {slides[activeSlide]?.bgUrl ? (
                    <img
                      src={slides[activeSlide].bgUrl}
                      alt="Banner Background"
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700"
                      referrerPolicy="no-referrer"
                    />
                  ) : slides[activeSlide]?.url && !slides[activeSlide]?.bgUrl ? (
                    // Default behavior if no custom background has been set (full bleed product photo)
                    <img
                      src={slides[activeSlide].url}
                      alt={slides[activeSlide].title}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className={`absolute inset-0 bg-gradient-to-br ${slides[activeSlide]?.color || 'from-blue-600 to-indigo-900'}`} />
                  )}

                  {/* Interactive layered floating product photo if custom background is customized */}
                  {slides[activeSlide]?.bgUrl && slides[activeSlide]?.url && (
                    <div className="absolute inset-x-0 bottom-14 top-10 flex items-center justify-center pointer-events-none z-10 p-2">
                      <img
                        src={slides[activeSlide].url}
                        alt={slides[activeSlide].title}
                        className="max-h-full max-w-full object-contain filter drop-shadow-[0_10px_10px_rgba(0,0,0,0.6)]"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  )}

                  {/* Subtle vignette overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-black/30 z-2" />

                  {/* Top line of slide showcase card */}
                  <div className="flex justify-between items-start relative z-10">
                    <span className="px-2.5 py-0.5 bg-orange-600 text-white rounded-full text-[9px] font-black uppercase tracking-wider shadow-sm">
                      {slides[activeSlide]?.badge}
                    </span>
                    <Bike className="h-6 w-6 text-white drop-shadow-md animate-pulse shrink-0" />
                  </div>

                  {/* Empty mid spacer */}
                  <div className="h-6 relative z-10" />

                  {/* Bottom title container */}
                  <div className="bg-slate-950/80 backdrop-blur-xs border border-slate-800/40 p-2.5 rounded-xl relative z-10 text-center">
                    <div className="text-xs font-black font-sans text-orange-400">
                      {slides[activeSlide]?.title}
                    </div>
                  </div>
                </div>

                {/* Centered Indicators only - Deleted Arrows as requested to save space */}
                <div className="flex justify-center items-center py-0.5">
                  <div className="flex gap-1.5 bg-slate-900 border border-slate-800 px-3.5 py-1.5 rounded-full shadow-md">
                    {slides.map((_, i) => (
                      <button
                        key={i} 
                        onClick={() => setActiveSlide(i)}
                        className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${activeSlide === i ? 'w-5 bg-orange-400' : 'w-1.5 bg-slate-700 hover:bg-slate-500'}`}
                        aria-label={`Go to slide ${i+1}`}
                      />
                    ))}
                  </div>
                </div>

                {/* Active Slide Specs */}
                <div className="space-y-1 bg-slate-900/40 p-3 rounded-xl border border-slate-850/40 font-sans text-xs">
                  <div className="text-amber-305 font-bold flex items-center gap-1 text-[11px] text-orange-400">
                    <Sparkles className="h-3.5 w-3.5 text-orange-400 shrink-0" /> {slides[activeSlide]?.price}
                  </div>
                  <p className="text-slate-350 leading-relaxed text-[11px] sm:text-xs">
                    {slides[activeSlide]?.description}
                  </p>
                </div>

              </div>
            </div>

          </div>
        </div>
      </header>

      {/* Embedded Live Video Section */}
      <section className="py-12 bg-slate-950 border-b border-slate-800" id="live-video">
        <div className="container mx-auto px-4 max-w-6xl text-center">
          <div className="max-w-2xl mx-auto mb-10">
            <span className="px-3 py-1 bg-orange-500/10 text-orange-400 text-xs font-bold rounded-full border border-orange-550/20 inline-flex items-center gap-1 font-sans">
              <Volume2 className="h-3 w-3 animate-ping text-orange-500" /> হান্ড্রেড পার্সেন্ট রিয়েল লাইভ টেস্ট
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white mt-2 font-sans">
              বাইক কভারের কার্যকারিতা সরাসরি দেখুন! 🔥
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2 font-sans">
              আমাদের বাইক কভারের নিখুঁত ওয়াটারপ্রুফ এবং লিকপ্রুফ সিলিং দেখুন যা কোনোভাবেই পানি ঢুকতে দেবে না।
            </p>
          </div>

          {/* Dynamic Video Showcase Grid supporting multiple videos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto items-stretch justify-center">
            {bikeVideos.map((video, idx) => {
              const embed = getEmbedUrl(video.url);
              return (
                <div key={video.id || idx} className="flex flex-col items-center bg-slate-900/60 p-4 rounded-3xl border border-slate-800 shadow-xl transition hover:border-slate-700">
                  <div className="w-full aspect-video rounded-2xl overflow-hidden bg-black border border-slate-800 relative shadow-inner">
                    {embed ? (
                      <iframe
                        src={embed}
                        title={video.title || `ভিডিও ডেমো #${idx + 1}`}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 p-6 text-center font-sans animate-pulse">
                        <Droplets className="h-10 w-10 text-blue-400 animate-bounce mb-2" />
                        <span className="text-xs font-bold text-slate-300 font-sans">ভিডিও প্লেয়ার লোড হচ্ছে না</span>
                      </div>
                    )}
                  </div>
                  <h3 className="mt-4 text-sm font-black text-slate-200 text-center font-sans tracking-tight">
                    🎬 {video.title || `লাইভ টেস্ট ভিডিও #${idx + 1}`}
                  </h3>
                </div>
              );
            })}
          </div>
          
          <div className="mt-10">
            <button 
              onClick={() => scrollToSection('checkout-form')}
              className="px-8 py-3.5 bg-orange-500 hover:bg-orange-600 active:scale-98 text-white font-black text-sm rounded-2xl shadow-lg shadow-orange-500/25 transition cursor-pointer font-sans"
            >
              আজই অর্ডার করুন (ক্যাশ অন ডেলিভারি)
            </button>
          </div>
        </div>
      </section>

      {/* Bento Grid Features Showcase */}
      <section className="py-12 bg-slate-900 border-b border-slate-800" id="features">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-bold text-orange-400 uppercase tracking-widest font-sans">কেন আমাদের বাইক কভার সেরা?</span>
            <h2 className="text-2xl sm:text-3xl font-black text-white mt-1 font-sans">
              সম্পূর্ণ সুরক্ষার জন্য প্রিমিয়াম ডিজাইন ও কোয়ালিটি ফিচার
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2 font-sans">
              আপনার শখের বাইকের সুরক্ষায় আমরা কোনো আপোষ করি না। নিখুঁত সেলাই গ্যারান্টি ও প্রিমিয়াম উপকরণ।
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 font-sans">
            
            {/* feature 1 */}
            <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-teal-500/10 rounded-xl flex items-center justify-center text-teal-400 shrink-0">
                    <Droplets className="h-5 w-5" />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-white font-sans">ওয়াটারপ্রুফ ও ডাস্টপ্রুফ 💯%</h3>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed font-sans">
                  ১০০% ছাতা কাপড়ের ফ্যাব্রিকেশন, যা বৃষ্টি ও কুয়াশায় মোটরসাইকেলের ইলেকট্রনিক্স ও ইঞ্জিনকে শুষ্ক রাখতে শতভাগ কার্যকর।
                </p>
              </div>
            </div>

            {/* feature 2 */}
            <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400 shrink-0">
                    <Sliders className="h-5 w-5" />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-white font-sans">সেলেঞ্জার সহ পুরো বাইক ডাকবে 🔰</h3>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed font-sans">
                  বাইকের পেছনের পাদানী এবং সেলেঞ্জার (Silence pipe) সহ সম্পূর্ণ মোটর বাইকটিকে চমৎকারভাবে সম্পূর্ণ ঢেকে রাখবে।
                </p>
              </div>
            </div>

            {/* feature 3 */}
            <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-yellow-500/10 rounded-xl flex items-center justify-center text-yellow-400 shrink-0">
                    <Sliders className="h-5 w-5" />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-white font-sans">চাকার ২ পাশে ইলাস্টিক জ্যাকিং 🚲</h3>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed font-sans">
                  কভারের দুই পাশে ইলাস্টিক বেল্ট দেওয়া আছে যা চাকার সাথে শক্তভাবে আঁকড়ে থাকে, ফলে তীব্র বাতাসেও কভার উড়ে যাওয়ার কোনো সম্ভাবনা নেই।
                </p>
              </div>
            </div>

            {/* feature 4 */}
            <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center text-orange-400 shrink-0">
                    <Wind className="h-5 w-5" />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-white font-sans">মাঝের ২ পাশে বাধার ফিতা আছে 🎗️</h3>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed font-sans">
                  ঝড় ও বাতাসে যাতে কভার না খুলে যায়, সেজন্য মাঝের নিচের অংশে বাঁধার জন্য মজবুত ডাবল ফিতা দেওয়া হয়েছে।
                </p>
              </div>
            </div>

            {/* feature 5 */}
            <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-slate-500/10 rounded-xl flex items-center justify-center text-slate-405 shrink-0">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-white font-sans">সিলভার কোটিং সহ বড় সাইজ 💿</h3>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed font-sans">
                  বড় সাইজের বাইকের কভারের ভেতরের অংশে রয়েছে বিশেষ সিলভার কোটিং যা অতিরিক্ত রোদের তাপে বাইকের ইঞ্জিন ও বডি পার্টস ঠান্ডা রাখে।
                </p>
              </div>
            </div>

            {/* feature 6 */}
            <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400 shrink-0">
                    <Award className="h-5 w-5" />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-white font-sans">বহন করার ব্যাগ সম্পূর্ণ ফ্রি 🎒</h3>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed font-sans">
                  ব্যবহারের পর কভার ভাজ করে রাখার জন্য একটি আকর্ষনীয় ম্যাচিং ওয়াটারপ্রুফ হ্যান্ডব্যাগ সম্পূর্ণ বিনামূল্যে পাবেন!
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Sizing calculation tool */}
      <section className="py-12 bg-slate-950 border-b border-slate-800" id="sizing-section">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden">
            <div className="p-6 bg-gradient-to-r from-blue-900/50 to-indigo-900/50 border-b border-slate-800 text-center">
              <span className="text-amber-400 text-xs font-bold uppercase tracking-wider font-sans">Size Chart</span>
              <h3 className="text-lg sm:text-2xl font-black text-white mt-1 font-sans">চাকা টু চাকা ৯৮ ইঞ্চি (মানানসই সাইজ)</h3>
              <p className="text-xs text-slate-400 mt-1 font-sans">বাংলাদেশের যেকোনো ব্র্যান্ড বা মডেলের বাইকাদের জন্য পারফেক্ট সাইজ গ্যারান্টি</p>
            </div>
            
            <div className="p-6 space-y-6 font-sans">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div className="space-y-4">
                  <div className="p-4 bg-slate-950 text-xs leading-relaxed text-slate-350 border border-slate-850 rounded-2xl">
                    <strong className="text-white block mb-1">মোটরসাইকেলের সব সাইজের কভার হবে?</strong>
                    হ্যাঁ, চাকা টু চাকা দৈর্ঘ্যে এটি ৯৮ ইঞ্চি, যা ১০০ সিসি থেকে শুরু করে বড় রাইডিং ও স্পোর্টস মোটরসাইকেলকেও পুরোপুরি ঢেকে রাখবে।
                  </div>
                  <div className="p-4 bg-slate-950 text-xs leading-relaxed text-slate-350 border border-slate-850 rounded-2xl">
                    <strong className="text-white block mb-1">ওভার লক ও নিখুঁত ফিনিশিং 🧵</strong>
                    কভারটি ডাবল ওভারলক সেলাই করা, ফলে পানি বা ধুলিকণা বাতাস জয়েন্ট দিয়ে কোনোভাবেই লিক হবে না। দীর্ঘমেয়াদি ব্যবহার অনায়াসে।
                  </div>
                </div>

                <div className="border border-slate-800 bg-slate-950 rounded-2xl p-5 space-y-4">
                  <h4 className="text-xs font-bold text-orange-400 tracking-wider">রিস্ক-ফ্রি কাস্টমার গ্যারান্টি:</h4>
                  <ul className="text-xs space-y-2 text-slate-300">
                    <li className="flex items-center gap-2">✓ যদি সাইজে কোনো প্রবলেম হয়</li>
                    <li className="flex items-center gap-2">✓ বা অন্য যেকোনো সমস্যার ক্ষেত্রে</li>
                    <li className="flex items-center gap-2">💥 আমরা ৭ দিনের এক্সচেঞ্জ বা রিটার্ন দিচ্ছি (রিটার্ন করতে চাইলে ১০০ টাকা দিয়ে রিটার্ন করতে পারবেন)।</li>
                    <li className="flex items-center gap-2 font-bold text-slate-200">🚚 সারা বাংলাদেশ হোম ডেলিভারি মাত্র ২-৩ দিনে!</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Dynamic Triple Cards Section */}
      <section className="py-12 bg-slate-950 border-b border-slate-800" id="triple-cards-section">
        <div className="container mx-auto px-4 max-w-6xl text-center">
          <div className="max-w-2xl mx-auto mb-10">
            <span className="px-3 py-1 bg-amber-500/10 text-amber-400 text-xs font-bold rounded-full border border-amber-500/20 inline-flex items-center gap-1 font-sans">
              🏍️ বিশেষ আকর্ষণসমূহ (Unique Highlights)
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white mt-2 font-sans">
              প্রিমিয়াম ফিটিং ও উন্নত মান গ্যারান্টি
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {bikeTripleCards.map((card, idx) => (
              <div 
                key={idx} 
                className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl transition-all duration-300 hover:border-slate-700 hover:scale-102 flex flex-col group"
              >
                <div className="h-52 w-full overflow-hidden relative bg-slate-950">
                  {card.imageUrl ? (
                    <img 
                      src={card.imageUrl} 
                      alt={card.title} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-950 text-slate-500 text-xs font-bold">
                      কোনো ছবি সেট করা নেই
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                </div>
                <div className="p-5 flex-1 flex flex-col justify-between text-left space-y-2">
                  <h3 className="text-sm font-black text-white tracking-tight border-b border-slate-800 pb-2 flex items-center gap-1.5">
                    <span className="text-orange-500 text-sm font-bold">{idx + 1}.</span>
                    {card.title || `ফিচার #${idx + 1}`}
                  </h3>
                  <p className="text-slate-400 text-xs leading-relaxed font-sans mt-1">
                    {card.description || "আমাদের কাস্টমাইজড বাইক কভারের বিশেষ গুণগত মান যা আপনার শখের বাইকটি রোদে পোড়া, বৃষ্টি ও কাদা থেকে সুন্দর রাখে।"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Customer Reviews Section */}
      <section className="py-12 bg-slate-900 border-b border-slate-800" id="reviews-section">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <div className="mb-8">
            <span className="px-2.5 py-0.5 bg-orange-500/10 text-orange-400 text-xs font-semibold rounded-full border border-orange-500/20 uppercase tracking-wider inline-flex items-center gap-1 font-sans">
              <Award className="h-3 w-3" /> শতভাগ কাস্টমার সন্তুষ্টি
            </span>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white mt-2 font-sans">
              আমাদের বাইক কভারের কাস্টমার রিভিউ ফিডব্যাক
            </h3>
            <p className="text-slate-400 text-xs sm:text-sm mt-2 font-sans">
              সারা বাংলাদেশ থেকে আমাদের কভার কিনে সন্তুষ্ট বাইকার ভাইদের আসল রিভিউ ও চ্যাট
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left font-sans text-xs">
            {/* review 1 */}
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex gap-1 text-amber-400">
                  {[1,2,3,4,5].map(s=> <Star key={s} className="h-3.5 w-3.5 fill-current" />)}
                </div>
                <span className="text-[10px] text-zinc-550 font-bold">MD. Ashikur Rahman (Dhaka)</span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                \"অনেক চমৎকার বাইক কভার! আমার FZS বাইকটা একদম পাদানী সহ পুরো ঢেকে রেখেছে। কাপড় টা অনেক হালকা কিন্তু পানি একটুও ঢোকে না।\"
              </p>
              <div className="flex items-center gap-1 text-[10px] text-emerald-400">
                <ShieldCheck className="h-3 w-3" /> ভেরিফাইড পারচেজ ক্রয়কারী
              </div>
            </div>

            {/* review 2 */}
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex gap-1 text-amber-400">
                  {[1,2,3,4,5].map(s=> <Star key={s} className="h-3.5 w-3.5 fill-current" />)}
                </div>
                <span className="text-[10px] text-zinc-550 font-bold">হামীম মিয়া (Chittagong)</span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                \"ডেলিভারি ম্যানের কাছ থেকে প্যাকেট খোলার পরে চেক করে নিয়েছি। ছাতা কাপড়ের সুয়িং টা ডাবল সেলাই করা। ব্যাগটাও ফ্রি পেয়েছি। ধন্যবাদ সেলারকে।\"
              </p>
              <div className="flex items-center gap-1 text-[10px] text-emerald-400">
                <ShieldCheck className="h-3 w-3" /> ভেরিফাইড পারচেজ ক্রয়কারী
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Checkout Section */}
      <section className="py-12 bg-slate-950 border-b border-slate-800" id="checkout-form">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Box: Terms & Guarantees info */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-5">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-500/10 rounded-xl text-orange-400">
                    <Truck className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-bold text-white font-sans">ক্যাশ অন ডেলিভারি (Cash On Delivery)</h3>
                </div>
                
                <p className="text-xs text-slate-400 font-sans leading-relaxed">
                  পণ্য হাতে পেয়ে চেক করে তারপর ডেলিভারি ম্যানের কাছে টাকা পরিশোধ করবেন। কোনো অগ্রিম ফি নেই, কোনো বুকিং চার্জ দেওয়া লাগবে না!
                </p>

                <div className="space-y-4 pt-3 border-t border-slate-800/80">
                  <div className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-500 text-white font-black text-xs flex items-center justify-center">১</span>
                    <div className="text-xs font-sans">
                      <h4 className="font-bold text-white mb-0.5">অর্ডার ফরমটি পূরণ করুন</h4>
                      <p className="text-slate-405 leading-relaxed">আপনার নাম, মোবাইল নাম্বার ও সঠিক পূর্ণ ঠিকানা টাইপ করুন।</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-500 text-white font-black text-xs flex items-center justify-center">২</span>
                    <div className="text-xs font-sans">
                      <h4 className="font-bold text-white mb-0.5">২ থেকে ৩ দিনে হোম ডেলিভারি</h4>
                      <p className="text-slate-405 leading-relaxed">আমাদের কুরিয়ার এজেন্ট আপনার বাসায় বা বাজারে পার্সেল পৌছে দেবে।</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-500 text-white font-black text-xs flex items-center justify-center">৩</span>
                    <div className="text-xs font-sans">
                      <h4 className="font-bold text-white mb-0.5">পণ্য চেক করে টাকা দিন</h4>
                      <p className="text-slate-405 leading-relaxed">ডেলিভারি ম্যানের সামনে কভার খুলে দেখে খুশি হয়ে মূল্য পরিশোধ করুন।</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* After-Sales trust box */}
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center gap-3 shadow-xs font-sans text-xs">
                <div className="bg-emerald-500 text-white p-2.5 rounded-xl font-bold text-lg">💡</div>
                <p className="text-slate-400 leading-relaxed">
                  <strong>হোয়াটসঅ্যাপ সাপোর্ট:</strong> যেকোনো প্রয়েজনে সরাসরি ক্লিক করে ম্যাসেজ করতে পারেন বা কল করতে পারেন। কাস্টমার সেবা আমাদের প্রথম লক্ষ্য।
                </p>
              </div>
            </div>

            {/* Right Box: Dynamic Checkout Form / Invoice Output */}
            <div className="lg:col-span-7">
              {submittedOrder ? (
                <div id="order-receipt" className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 text-center text-white font-sans max-w-lg mx-auto">
                  <div className="w-12 h-12 bg-emerald-550/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/20">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  
                  <div className="space-y-1.5">
                    <h3 className="text-lg font-black text-white">অভিনন্দন! আপনার বাইক কভার অর্ডারটি সফলভাবে গৃহীত হয়েছে। 🎉</h3>
                    <p className="text-xs text-slate-400">খুব দ্রুত আমাদের কাস্টমার প্রতিনিধি আপনার মোবাইলে ফোন দিয়ে কভারটি কনফার্ম করে নেবে।</p>
                  </div>

                  <div className="p-4 bg-slate-950 rounded-2xl border border-slate-850 text-left space-y-2 text-xs font-sans">
                    <div className="flex justify-between border-b border-slate-800 pb-1.5 font-bold">
                      <span>অর্ডার ট্র্যাকিং আইডি (Order ID):</span>
                      <span className="text-yellow-400 font-mono">{submittedOrder.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>নাম:</span>
                      <span className="text-slate-300 font-bold">{submittedOrder.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>মোবাইল নং:</span>
                      <span className="text-slate-300 font-bold">{submittedOrder.phone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>কভারের কালার:</span>
                      <span className="text-slate-300 font-bold">{submittedOrder.color === 'Black' ? 'কালো' : 'নেভি ব্লু'}</span>
                    </div>
                    {submittedOrder.bikeModel && (
                      <div className="flex justify-between">
                        <span>বাইকের মডেল:</span>
                        <span className="text-orange-400 font-bold">{submittedOrder.bikeModel}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>সাইজ:</span>
                      <span className="text-slate-300 font-bold">৯৮ ইঞ্চি (চাকা টু চাকা স্ট্যান্ডার্ড)</span>
                    </div>
                    <div className="flex justify-between font-bold border-t border-slate-800 pt-1.5 text-orange-400">
                      <span>ডেলিভারি সহ সর্বমোট মূল্য:</span>
                      <span>৬০০/- BDT</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setSubmittedOrder(null)}
                    className="w-full py-3 px-6 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition text-xs select-none cursor-pointer border border-slate-700"
                  >
                    আরেকটি অর্ডার করুন
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmitOrder} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 font-sans">
                  <div className="border-b border-slate-800 pb-4">
                    <h3 className="text-lg font-black text-white flex items-center gap-1.5 leading-none">
                      <ShoppingBag className="h-5 w-5 text-orange-400" /> অর্ডার ফরম (নিচের তথ্য দিন)
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">অর্ডার নিশ্চিত করতে অনুগ্রহ করে সঠিক নাম ও ঠিকানা প্রদান করুন।</p>
                  </div>

                  {errorMessage && (
                    <div className="p-3 bg-rose-500/15 border border-rose-500/20 text-rose-300 text-xs rounded-xl font-bold">
                      ⚠️ {errorMessage}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* User Name input */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300 block">আপনার নাম (Full Name):</label>
                      <input
                        type="text"
                        placeholder="যেমন: এম.ডি শফিক"
                        value={name}
                        onChange={(e)=>setName(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 text-white focus:outline-none"
                      />
                    </div>

                    {/* User mobile phone input */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300 block">আপনার মোবাইল নাম্বার (১১ ডিজিট):</label>
                      <input
                        type="tel"
                        placeholder="যেমন: 017XXXXXXXX"
                        value={phone}
                        onChange={(e)=>setPhone(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 text-white focus:outline-none font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* District selector */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300 block">জেলা নির্বাচন করুন (District):</label>
                      <select
                        value={selectedDistrict}
                        onChange={(e)=>setSelectedDistrict(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 text-white focus:outline-none"
                      >
                        {DISTRICT_LIST.map(dist => <option key={dist} value={dist}>{dist}</option>)}
                      </select>
                    </div>

                    {/* Choose Color */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300 block">পছন্দসই কালার নির্বাচন করুন:</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedColor('Navy Blue')}
                          className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                            selectedColor === 'Navy Blue' 
                            ? 'bg-blue-600 border-blue-500 text-white shadow-md' 
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-850'
                          }`}
                        >
                          <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>নেভি ব্লু
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedColor('Black')}
                          className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                            selectedColor === 'Black' 
                            ? 'bg-neutral-800 border-neutral-700 text-white shadow-md' 
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-850'
                          }`}
                        >
                          <span className="w-2.5 h-2.5 rounded-full bg-neutral-900 border border-slate-700"></span>কালো কভার
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Bike Model Input */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 block flex items-center gap-1.5">
                      🏍️ আপনি কোন মডেল এর বাইক চালান? (Bike Model):
                    </label>
                    <input
                      type="text"
                      placeholder="যেমন: Pulsar 150, FZ-S v3, Gixxer, Hornet, Splendor"
                      value={bikeModel}
                      onChange={(e)=>setBikeModel(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 text-white focus:outline-none"
                    />
                  </div>

                  {/* Detailed Village/Address input */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 block">আপনার সম্পূর্ণ ঠিকানা (গ্রাম/পাড়া/মেলা/থানা/বাজার লিখে দিন):</label>
                    <textarea
                      placeholder="যেমন: গ্রাম- শান্তিনগর, পোঃ- শান্তিনগর, থানা- শান্তিনগর, জেলা- শান্তিনগর"
                      value={village}
                      onChange={(e)=>setVillage(e.target.value)}
                      rows={3}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 text-white focus:outline-none"
                    />
                  </div>

                  {/* Pricing Overview Invoice Summary Panel Box */}
                  <div className="p-4 bg-slate-950 rounded-2xl border border-slate-850 text-xs space-y-2 font-sans text-slate-300">
                    <div className="flex justify-between">
                      <span>বাইক কভার সাইজ:</span>
                      <span className="font-bold">৯৮ ইঞ্চি (Wheel to Wheel)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>বাইক কভার কালার:</span>
                      <span className="font-bold text-yellow-400">{selectedColor === 'Black' ? 'জেট ব্ল্যাক (Black)' : 'নেভি ব্লু (Navy Blue)'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>কভারের মূল্য (Regular Price):</span>
                      <span className="line-through text-slate-500">৭৫০/- TK</span>
                    </div>
                    <div className="flex justify-between text-emerald-400">
                      <span>হোম ডেলিভারি ফিস (Delivery Charge):</span>
                      <span className="font-bold">ডেলিভারি চার্জ সহ!</span>
                    </div>
                    <div className="flex justify-between font-black text-base border-t border-slate-800 pt-2 text-orange-400">
                      <span>সর্বমোট payable (হাতে পেয়ে টাকা দিবেন):</span>
                      <span>৬০০/- BDT</span>
                    </div>
                  </div>

                  {/* Submit Order button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 px-6 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-black text-sm uppercase rounded-2xl transition duration-300 shadow-lg shadow-orange-500/25 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {isSubmitting ? 'অর্ডার প্রসেস হচ্ছে...' : 'অর্ডার নিশ্চিত করুন (ক্যাশ অন ডেলিভারি)'} 🚛
                  </button>
                </form>
              )}
            </div>

          </div>
        </div>
      </section>

      {/* Floating Sticky bottom mini product checkout trigger element */}
      <div className="sticky bottom-0 bg-slate-950 border-t border-slate-800 py-3 px-4 shadow-[0_-5px_15px_rgba(0,0,0,0.3)] z-40 flex flex-col sm:flex-row justify-between items-center gap-3">
        <div className="flex items-center gap-2.5 text-slate-300 text-xs sm:text-sm font-sans font-semibold">
          <Bike className="h-5 w-5 text-orange-400 shrink-0" />
          <span>
            বাইক কভার কালার: <span className="text-orange-400 font-extrabold">{selectedColor === 'Black' ? 'কালো' : 'নেভি ব্লু'}</span>, 
            সাইজ: <span className="font-mono bg-slate-900 border border-slate-800 text-cyan-300 px-2 py-0.5 rounded font-bold">৯৮ ইঞ্চি</span>, 
            ডেলিভারি সহ মূল্য: <span className="font-mono text-orange-400 font-extrabold">৬০০ BDT</span>
          </span>
        </div>
        <button
          onClick={() => scrollToSection('checkout-form')}
          className="w-full sm:w-auto px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs sm:text-sm rounded-xl transition duration-300 shadow-md cursor-pointer flex items-center justify-center gap-1.5 font-sans"
        >
          <ShoppingBag className="h-4 w-4" /> দ্রুত অর্ডার করুন (ক্যাশ অন ডেলিভারি)
        </button>
      </div>

      {/* Contact info footer structure */}
      <footer className="bg-slate-950 text-slate-400 py-12 px-4 border-t border-slate-800 text-center relative z-20">
        <div className="container mx-auto max-w-4xl space-y-6">
          <div className="flex items-center justify-center gap-2">
            <span className="text-2xl">🏍️</span>
            <span className="text-lg font-black font-sans bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-white">
              প্রিমিয়াম বাইক কভার বাংলাদেশ
            </span>
          </div>

          <p className="text-xs max-w-xl mx-auto font-sans leading-relaxed text-slate-400">
            আমরা সারা বাংলাদেশে সর্বোচ্চ কোয়ালিটি সম্পন্ন ছাতা কাপড়ের বাইক কভার সরবরাহ করি যা ২ বছরের বেশি স্থায়ী হয়। বাধার ফিতা এবং চাকার ইলাস্টিক জ্যাকিং বেল্ট থাকায় ঝড়-বৃষ্টিতেও বাইক সম্পূর্ণ নিরাপদ থাকে।
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 text-[10px] sm:text-xs text-slate-550 font-mono">
            <span>© {new Date().getFullYear()} BikeCover BD. All rights reserved.</span>
            <span>•</span>
            <span>১০০% ওয়াটারপ্রুফ মোটর বাইক কভার ক্যানভাস</span>
            <span>•</span>
            <a
              href="https://wa.me/8801624933949"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-350 hover:text-orange-450 font-bold transition underline cursor-pointer font-sans"
            >
              WhatsApp: +8801624933949
            </a>
            <span>•</span>
            <a
              href="tel:+8801624933949"
              className="text-slate-350 hover:text-orange-455 font-bold transition underline cursor-pointer font-sans"
            >
              Hotline: +8801624933949
            </a>
          </div>
        </div>
      </footer>

      {/* Floating Support Widgets */}
      <div className="fixed bottom-24 sm:bottom-6 right-4 sm:right-6 z-50 flex flex-col gap-2 pointer-events-none">
        <a
          href="https://wa.me/8801624933949"
          target="_blank"
          rel="noopener noreferrer"
          className="pointer-events-auto flex items-center justify-center bg-emerald-500 hover:bg-emerald-600 text-white w-10 h-10 rounded-full shadow-[0_3px_10px_rgba(16,185,129,0.3)] hover:shadow-[0_4px_15px_rgba(16,185,129,0.45)] transition-all duration-350 transform hover:scale-110"
          title="WhatsApp Message"
        >
          <MessageCircle className="h-5 w-5" />
        </a>
        <a
          href="tel:+8801624933949"
          className="pointer-events-auto flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white w-10 h-10 rounded-full shadow-[0_3px_10px_rgba(37,99,235,0.3)] hover:shadow-[0_4px_15px_rgba(37,99,235,0.45)] transition-all duration-350 transform hover:scale-110"
          title="Direct Call"
        >
          <Phone className="h-4.5 w-4.5 animate-pulse" />
        </a>
      </div>

    </div>
  );
}
