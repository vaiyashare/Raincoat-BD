import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  CheckCircle2, 
  ShieldCheck, 
  Award, 
  Phone, 
  CloudRain, 
  ChevronRight, 
  Volume2, 
  MapPin, 
  User, 
  Check, 
  Smartphone,
  Eye,
  Info,
  Gift,
  Bike,
  Image as ImageIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  addOrderToFirestore, 
  getAdvancedAddonsSettingsFromFirestore 
} from '../lib/firebase';
import { trackPixelEvent } from '../lib/tracking';
import { RaincoatOrder, Size, ProductColor } from '../types';

interface RaincoatBikeCoverComboLandingProps {
  onOrderSuccess: (order: RaincoatOrder) => void;
}

export default function RaincoatBikeCoverComboLanding({ onOrderSuccess }: RaincoatBikeCoverComboLandingProps) {
  // Page Customizer & Control configs
  const [siteSettings, setSiteSettings] = useState<any>(null);

  // Form Field State variables
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [village, setVillage] = useState('');
  const [selectedSize, setSelectedSize] = useState<Size>('XL');
  const [selectedColor, setSelectedColor] = useState<ProductColor>('Black');
  const [bikeCoverColor, setBikeCoverColor] = useState<'Black' | 'Navy Blue'>('Black');
  const [bikeModel, setBikeModel] = useState('');
  const [bikePreferredColor, setBikePreferredColor] = useState<'Black' | 'Navy Blue'>('Black');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [formErrors, setFormErrors] = useState<{ name?: boolean; phone?: boolean; village?: boolean; bikeModel?: boolean }>({});
  const [submittedOrder, setSubmittedOrder] = useState<RaincoatOrder | null>(null);

  // Gallery current index state
  const [activeGalleryIndex, setActiveGalleryIndex] = useState(0);

  // Load customizations and listen to real-time events from Section Customizer Admin
  const loadCustomizations = async () => {
    try {
      const res = await getAdvancedAddonsSettingsFromFirestore();
      if (res) {
        setSiteSettings(res);
      }
    } catch (err) {
      console.error("Failed to load customized segments for combo:", err);
    }
  };

  useEffect(() => {
    loadCustomizations();
    
    // Subscribe to admin configuration updates
    window.addEventListener('raincoat_site_settings_updated', loadCustomizations);
    return () => {
      window.removeEventListener('raincoat_site_settings_updated', loadCustomizations);
    };
  }, []);

  // Helper: Retrieve dynamic database setting OR static fallback
  const getSectionData = (sectionKey: string, fallbacks: Record<string, any>) => {
    const customizations = siteSettings?.section_customizations || {};
    return {
      ...fallbacks,
      ...(customizations[sectionKey] || {})
    };
  };

  // 1. SECTION: HERO CUSTOMIZER DATAS
  const heroData = getSectionData('combo_hero', {
    bgColor: '#090d16',
    textColor: '#ffffff',
    textAlign: 'center',
    fontSize: 'default',
    image_url: '',
    icon_text: 'বর্ষার সেরা ধামাকা অফার',
    title_1: 'রেইনকোট এবং প্রিমিয়াম বাইক কভার কম্বো অফার!',
    title_2: 'কড়া রোদ আর ঝুম বৃষ্টির হাত থেকে নিজেকে ও নিজের বাইককে শতভাগ সুরক্ষিত রাখুন।',
    body: 'সম্পূর্ণ থার্মাল পিইউ সিল প্রযুক্তির ওয়াটারপ্রুফ রেইনকোট এবং উচ্চমানের প্যারাশুট সিলভার কোটেড বাইক কভার এখন একসাথে অবিশ্বাস্য অফার মূল্যে পাচ্ছেন! আলাদা ডেলিভারি চার্জ ছাড়া সারা বাংলাদেশে ক্যাশ অন ডেলিভারি!',
    visible_mobile: true,
    visible_desktop: true,
    padding_vertical: 'normal'
  });

  // 2. SECTION: VIDEO CUSTOMIZER DATAS
  const videoData = getSectionData('combo_video', {
    bgColor: '#ffffff',
    textColor: '#0f172a',
    textAlign: 'center',
    fontSize: 'default',
    image_url: '',
    icon_text: '১০০% বাস্তব ডেমো এবং কোয়ালিটি টেস্ট ভিডিও',
    title_1: 'আমাদের কম্বো প্রোডাক্টের সরাসরি লাইভ রিভিউ দেখুন!',
    title_2: 'সরাসরি ভিডিওতে দেখুন রেইনকোট ও বাইক কভারের গুণগত মান ও পানির প্রতিরোধ ক্ষমতা।',
    body: 'ভিডিও দুটি প্লে করে দেখে নিন আমাদের প্রিমিয়াম কম্বোর কার্যকারিতা। কোনো ভিডিও এডিটিং ছাড়া শতভাগ খাঁটি রিভিউ ভিডিও।',
    video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', // Default Video 1
    video_url_2: 'https://www.youtube.com/embed/dQw4w9WgXcQ', // Default Video 2
    visible_mobile: true,
    visible_desktop: true,
    padding_vertical: 'normal'
  });

  // 3. SECTION: GALLERY CUSTOMIZER DATAS
  const galleryData = getSectionData('combo_gallery', {
    bgColor: '#f8fafc',
    textColor: '#0f172a',
    textAlign: 'center',
    fontSize: 'default',
    image_url: '',
    icon_text: 'রেইনকোট প্রোডাক্ট গ্যালারি (Gallery Images)',
    title_1: 'আমাদের রেইনকোটের বাস্তব আকর্ষণীয় ছবির গ্যালারি!',
    title_2: 'খাঁটি ফ্যাব্রিক ও প্রিমিয়াম হিট সিল্ড ফিনিশিং এর ৫-৬টি রিয়েল ফটোগ্রাফস।',
    body: 'ছবির গ্যালারি থেকে সরাসরি দেখে নিন ফিনিশিংটি কেমন। আমরা গ্রাহককে যা ছবিতে দেখাই, হুবহু তাই ডেলিভারি করি।',
    gallery_images: [
      'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=600',
      'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&q=80&w=600',
      'https://images.unsplash.com/photo-1508962914676-134849a727f0?auto=format&fit=crop&q=80&w=600',
      'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?auto=format&fit=crop&q=80&w=600',
      'https://images.unsplash.com/photo-1511216113906-8f57bb83e776?auto=format&fit=crop&q=80&w=600',
      'https://images.unsplash.com/photo-1481944877197-f58c755efb1c?auto=format&fit=crop&q=80&w=600'
    ],
    visible_mobile: true,
    visible_desktop: true,
    padding_vertical: 'normal'
  });

  // 4. SECTION: FEATURES CUSTOMIZER DATAS
  const featuresData = getSectionData('combo_features', {
    bgColor: '#ffffff',
    textColor: '#0f172a',
    textAlign: 'center',
    fontSize: 'default',
    image_url: '',
    icon_text: 'কেন আমাদের কম্বো প্যাকেজটি সবচেয়ে সেরা?',
    title_1: 'প্রিমিয়াম রেইনকোট এবং অল-ওয়েদার বাইক কভারের বিশেষত্ব',
    title_2: 'বাজারের নিম্নমানের পণ্য থেকে নিজেকে রেহাই দিয়ে এই মাস্টারপিস কম্বো বেছে নিন।',
    body: 'আমাদের কম্বোতে ব্যবহৃত রেইনকোটে রয়েছে ৩ বছর অনায়াসে ব্যবহারের নিশ্চয়তা, ডাবল হিট সিলযুক্ত কব্জি এবং সম্পূর্ণ থার্মাল লিকেজ প্রুফ সীম। বাইক কভারটি উচ্চমানের প্যারাশুট সিলভার কোটেড ফ্যাব্রিকের যা অতিরিক্ত তাপ ও ক্ষতিকর অতিবেগুনী রশ্মি থেকে বাইকের কালার রক্ষা করে।',
    visible_mobile: true,
    visible_desktop: true,
    padding_vertical: 'normal'
  });

  // 5. SECTION: CHECKOUT HEADER CUSTOMIZER DATAS
  const checkoutData = getSectionData('combo_checkout', {
    bgColor: '#f1f5f9',
    textColor: '#1e293b',
    textAlign: 'center',
    fontSize: 'default',
    image_url: '',
    icon_text: 'ক্যাশ অন ডেলিভারি (Cash on Delivery)',
    title_1: 'নিচের চেকআউট ফর্মটি পূরণ করে অর্ডারটি সুনিশ্চিত করুন!',
    title_2: 'কোনো অগ্রিম পেমেন্ট করতে হবে না, পণ্য হাতে পেয়ে দেখে টাকা পরিশোধ করবেন।',
    body: 'দয়া করে আপনার সঠিক নাম, সচল মোবাইল নম্বর এবং ডেলিভারির সঠিক ঠিকানা প্রদান করুন। আমাদের প্রতিনিধি অর্ডার নিশ্চিত করতে ফোন করবেন।',
    visible_mobile: true,
    visible_desktop: true,
    padding_vertical: 'normal'
  });

  // Helper class names
  const getAlignClass = (align: 'left' | 'center' | 'right') => {
    if (align === 'center') return 'text-center items-center';
    if (align === 'right') return 'text-right items-end';
    return 'text-left items-start';
  };

  const getVisibilityClass = (visMobile: boolean, visDesktop: boolean) => {
    if (!visMobile && !visDesktop) return 'hidden';
    if (!visMobile) return 'hidden md:block';
    if (!visDesktop) return 'block md:hidden';
    return 'block';
  };

  const getPaddingClass = (padding?: 'compact' | 'normal' | 'generous') => {
    if (padding === 'compact') return 'py-6 sm:py-8';
    if (padding === 'generous') return 'py-16 sm:py-24';
    return 'py-10 sm:py-16';
  };

  const getFontSizeClass = (sz: string, defaultClass: string) => {
    if (sz === 'sm') return 'text-sm';
    if (sz === 'md') return 'text-base';
    if (sz === 'lg') return 'text-lg sm:text-xl';
    if (sz === 'xl') return 'text-xl sm:text-2xl';
    if (sz === '2xl') return 'text-2xl sm:text-3xl md:text-4xl';
    return defaultClass;
  };

  // Convert embed urls dynamically
  const parseVideoEmbed = (rawUrl: string) => {
    if (!rawUrl) return '';
    let videoId = '';
    
    if (rawUrl.includes('youtube.com/embed/')) return rawUrl;
    if (rawUrl.includes('facebook.com/plugins/video.php')) return rawUrl;

    if (rawUrl.includes('youtube.com/watch?v=')) {
      const parts = rawUrl.split('youtube.com/watch?v=')[1];
      videoId = parts ? parts.split('&')[0] : '';
    } else if (rawUrl.includes('youtu.be/')) {
      const parts = rawUrl.split('youtu.be/')[1];
      videoId = parts ? parts.split('?')[0] : '';
    } else if (rawUrl.includes('youtube.com/shorts/')) {
      const parts = rawUrl.split('youtube.com/shorts/')[1];
      videoId = parts ? parts.split('?')[0] : '';
    }

    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}`;
    }

    if (rawUrl.includes('facebook.com') || rawUrl.includes('fb.watch')) {
      return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(rawUrl)}&show_text=false&width=500`;
    }

    return rawUrl;
  };

  // Sizing Price rules
  // XL / XXL Price: Base 990 + Bike Cover 600 = 1590
  // 3XL / 4XL Price: Base 1090 + Bike Cover 600 = 1690
  const isLargeSizeObj = selectedSize === '3XL' || selectedSize === '4XL';
  const currentPrice = isLargeSizeObj ? 1690 : 1590;
  const regularPrice = isLargeSizeObj ? 2190 : 2090;

  // Sizing list
  const sizes: Size[] = ['XL', 'XXL', '3XL', '4XL'];

  // Submit flow
  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    const newErrors: { name?: boolean; phone?: boolean; village?: boolean; bikeModel?: boolean } = {};

    if (!name.trim()) newErrors.name = true;
    
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
      newErrors.phone = true;
    }

    if (!village.trim()) newErrors.village = true;
    if (!bikeModel.trim()) newErrors.bikeModel = true;

    if (Object.keys(newErrors).length > 0) {
      setFormErrors(newErrors);

      if (newErrors.name) {
        setErrorMessage('অনুগ্রহ করে আপনার নামটি লিখুন।');
        const el = document.getElementById('combo-name-input');
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el?.focus();
      } else if (newErrors.phone) {
        setErrorMessage('অনুগ্রহ করে একটি সঠিক ১১ ডিজিটের বাংলাদেশী মোবাইল নাম্বার দিন (যেমন: 01XXXXXXXXX)।');
        const el = document.getElementById('combo-phone-input');
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el?.focus();
      } else if (newErrors.village) {
        setErrorMessage('অনুগ্রহ করে আপনার ডেলিভারির সম্পূর্ণ ঠিকানাটি প্রদান করুন।');
        const el = document.getElementById('combo-village-input');
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el?.focus();
      } else if (newErrors.bikeModel) {
        setErrorMessage('অনুগ্রহ করে আপনার বাইকের মডেলটি নির্বাচন বা উল্লেখ করুন।');
        const el = document.getElementById('combo-bike-model-input');
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el?.focus();
      }
      return;
    }

    setFormErrors({});
    setIsSubmitting(true);

    const generatedOrderId = 'ord-combo-' + Math.floor(Math.random() * 100000);
    
    // Notes contains additional selected info
    const fullNotes = `কম্বো ডিল (রেইনকোট + বাইক কভার)। রেইনকোট সাইজ: ${selectedSize}, রেইনকোট কালার: ${selectedColor}. বাইক কভার কালার: ${bikeCoverColor}. কাস্টমারের বাইক মডেল: ${bikeModel}, পছন্দের বাইক কালার: ${bikePreferredColor}. ক্যাশ অন ডেলিভারি (ডেলিভারি চার্জ সহ মোট খরচ ৳${currentPrice} টাকা)।`;

    const newOrder: RaincoatOrder = {
      id: generatedOrderId,
      name: name.trim(),
      village: village.trim(),
      phone: cleanPhone,
      size: selectedSize,
      color: selectedColor,
      weight: 75, // average default
      heightFeet: 5,
      heightInches: 6,
      price: currentPrice,
      status: 'Pending',
      isConfirmed: false,
      bikeModel: bikeModel,
      orderNotes: fullNotes,
      createdAt: new Date().toISOString(),
      synced: false,
    };

    try {
      // background firestore save
      addOrderToFirestore(newOrder).then(() => {
        newOrder.synced = true;
      }).catch((err) => {
        console.warn("Combo order direct cloud save failed, keeping inside client localcache:", err);
      });

      // Local storage syncing
      const listJson = localStorage.getItem('raincoat_orders') || '[]';
      const orderList = JSON.parse(listJson);
      orderList.unshift(newOrder);
      localStorage.setItem('raincoat_orders', JSON.stringify(orderList));

      setSubmittedOrder(newOrder);
      localStorage.setItem('last_ordered_product_slug', 'raincoat-bike-cover-combo');
      
      onOrderSuccess(newOrder);

      // Trigger tracking
      trackPixelEvent('Purchase', {
        value: currentPrice,
        currency: 'BDT',
        content_name: 'Raincoat and Bike Cover Premium Combo',
        content_category: 'Rain Gear & Motorcycle Accessories'
      });

    } catch (err: any) {
      setErrorMessage('অর্ডার প্রসেস করতে ত্রুটি ঘটেছে। অনুগ্রহ করে আবার ট্রাই করুন।');
    } finally {
      setIsSubmitting(false);
    }
  };

  const scrollToCheckout = () => {
    const el = document.getElementById('combo-checkout-form');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="w-full bg-slate-950 text-slate-100 min-h-screen">
      
      {/* 1. Header Alert strip */}
      <div className="bg-gradient-to-r from-amber-500 via-rose-650 via-rose-600 to-indigo-800 text-white text-xs font-black text-center py-2 px-4 shadow-md flex items-center justify-center gap-2 relative z-30 select-none">
        <span className="bg-white/20 px-2 py-0.5 rounded-full text-[10px] sm:text-xs animate-pulse text-amber-250">সীমিত সময়ের অফার</span>
        <span>💥 রেইনকোট ও বাইক কভার সুপার লাক্সারি কম্বো! ডেলিভারি সম্পূর্ণ ফ্রী সারা বাংলাদেশে! 💥</span>
        <button
          onClick={scrollToCheckout}
          className="underline hover:text-orange-200 transition font-extrabold cursor-pointer ml-4 text-[11px] sm:text-xs"
        >
          অর্ডার করুন এখনই ⚡
        </button>
      </div>

      {/* 2. HERO SECTION */}
      {heroData.visible_mobile || heroData.visible_desktop ? (
        <header 
          className={`relative overflow-hidden border-b border-slate-900 ${getVisibilityClass(heroData.visible_mobile, heroData.visible_desktop)} ${getPaddingClass(heroData.padding_vertical)}`}
          style={{ backgroundColor: heroData.bgColor, color: heroData.textColor }}
        >
          {/* Animated Rain Background */}
          <div className="absolute inset-0 pointer-events-none opacity-20">
            <div className="absolute top-[-50%] left-[-20%] w-[140%] h-[140%] bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:10px_20px] rotate-[15deg]"></div>
          </div>

          <div className="container mx-auto px-4 max-w-7xl relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              
              {/* Text Area */}
              <div className={`lg:col-span-7 space-y-6 flex flex-col ${getAlignClass(heroData.textAlign)}`}>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 text-amber-400 text-xs font-black rounded-full border border-amber-500/20 uppercase tracking-wider font-sans">
                  <Gift className="h-4 w-4 animate-bounce text-amber-400" /> {heroData.icon_text}
                </div>

                <h1 className={`font-black tracking-tight leading-tight font-sans ${getFontSizeClass(heroData.fontSize, "text-3xl sm:text-4xl md:text-5xl")}`}>
                  {heroData.title_1} <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-300 to-white block mt-2">
                    {heroData.title_2}
                  </span>
                </h1>

                <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl font-sans font-medium">
                  {heroData.body}
                </p>

                {/* Sizing Price tags inside Hero */}
                <div className="bg-slate-900/60 backdrop-blur-md p-5 rounded-2xl border border-slate-800/80 max-w-md w-full grid grid-cols-2 gap-4 divide-x divide-slate-800">
                  <div className="text-center font-sans">
                    <span className="text-[10px] text-slate-400 block font-bold">XL / XXL কম্বো প্যাক</span>
                    <span className="text-lg font-black text-slate-400 line-through block mt-1">৳২০৯০/-</span>
                    <span className="text-2xl font-black text-amber-400 font-mono">৳১৫৯০/-</span>
                    <span className="text-[9px] text-emerald-400 font-semibold block mt-0.5">ফ্রী ডেলিভারি!</span>
                  </div>
                  <div className="text-center font-sans pl-4">
                    <span className="text-[10px] text-slate-400 block font-bold">3XL / 4XL কম্বো প্যাক</span>
                    <span className="text-lg font-black text-slate-400 line-through block mt-1">৳২১৯০/-</span>
                    <span className="text-2xl font-black text-amber-400 font-mono">৳১৬৯০/-</span>
                    <span className="text-[9px] text-emerald-400 font-semibold block mt-0.5">ফ্রী ডেলিভারি!</span>
                  </div>
                </div>

                {/* Badges items */}
                <div className="flex flex-wrap gap-x-6 gap-y-3 pt-2 text-slate-350 text-xs font-semibold">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4.5 w-4.5 text-amber-400 shrink-0" /> ওয়াটারপ্রুফ রেইনকোট জ্যাকেট ও প্যান্ট
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4.5 w-4.5 text-amber-400 shrink-0" /> ডাস্ট ও হিটপ্রুফ প্যারাসুট বাইক কভার
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4.5 w-4.5 text-amber-400 shrink-0" /> কোনো অগ্রিম পেমেন্টের ঝামেলা নেই
                  </div>
                </div>

                {/* CTA Flow */}
                <div className="flex flex-col sm:flex-row gap-4 w-full pt-3">
                  <button
                    onClick={scrollToCheckout}
                    className="px-8 py-4 bg-amber-500 hover:bg-amber-600 active:scale-98 text-slate-950 font-black text-sm sm:text-base rounded-2xl transition duration-300 shadow-xl shadow-amber-500/25 flex items-center justify-center gap-2 cursor-pointer font-sans animate-pulse-subtle"
                  >
                    <ShoppingBag className="h-5 w-5 text-slate-950" /> কম্বো অর্ডার করুন (COD)
                  </button>
                  <a
                    href="tel:+8801624933949"
                    className="px-6 py-4 bg-slate-900 hover:bg-slate-800 active:scale-98 text-slate-200 border border-slate-800 font-bold text-sm sm:text-base rounded-2xl transition duration-300 flex items-center justify-center gap-2 cursor-pointer font-sans"
                  >
                    <Phone className="h-4.5 w-4.5 text-cyan-400" /> হটলাইন: +8801624933949
                  </a>
                </div>
              </div>

              {/* Showcase Hero Image */}
              <div className="lg:col-span-5 relative w-full flex flex-col items-center justify-center">
                <div className="relative group w-full max-w-md bg-slate-900/40 p-4 border border-slate-850 rounded-3xl shadow-2xl overflow-hidden aspect-square flex items-center justify-center">
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent"></div>
                  {heroData.image_url && !heroData.image_url.includes('unsplash.com') ? (
                    <img 
                      src={heroData.image_url} 
                      alt="Raincoat & Bike Cover Combo Deluxe Package" 
                      className="w-full h-full object-contain rounded-2xl"
                      referrerPolicy="no-referrer"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center p-6 text-slate-500">
                      <ImageIcon className="h-10 w-10 stroke-[1.2] mb-1.5 text-slate-400" />
                      <span className="text-xs font-semibold text-slate-400">কোনো ছবি যুক্ত করা হয়নি</span>
                    </div>
                  )}
                  <div className="absolute bottom-5 right-5 bg-amber-500 text-slate-900 text-xs font-black px-3.5 py-1.5 rounded-xl shadow-md select-none transform rotate-3">
                    সাশ্রয়ী কম্বো প্যাক 🎁
                  </div>
                </div>

                {/* Durable badging info */}
                <div className="w-full max-w-md bg-slate-900/60 p-4 mt-4 border border-slate-800/80 rounded-2xl flex items-center gap-3.5">
                  <div className="relative shrink-0 flex items-center justify-center w-11 h-11 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-extrabold text-amber-400 font-sans">🛡️ ১০০% কাস্টমার স্যাটিসফ্যাকশন ও রিপ্লেসমেন্ট গ্যারান্টি</h4>
                    <p className="text-[10px] sm:text-xs text-slate-400 leading-normal font-sans mt-0.5">পণ্য হাতে পেয়ে পুরোপুরি চেক করে সন্তুষ্ট হলে তবেই পেমেন্ট করবেন। কোনো ছেঁড়া বা কাটা থাকলে সাথে সাথে রিটার্ন করতে পারবেন!</p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </header>
      ) : null}

      {/* 3. IMAGES GALLERY SECTION */}
      {galleryData.visible_mobile || galleryData.visible_desktop ? (
        <section 
          className={`border-b border-slate-900 ${getVisibilityClass(galleryData.visible_mobile, galleryData.visible_desktop)} ${getPaddingClass(galleryData.padding_vertical)}`}
          style={{ backgroundColor: galleryData.bgColor, color: galleryData.textColor }}
        >
          <div className="container mx-auto px-4 max-w-6xl">
            <div className={`max-w-2xl mx-auto mb-10 flex flex-col ${getAlignClass(galleryData.textAlign)}`}>
              <span className="px-3 py-1 bg-amber-500/10 text-amber-500 text-xs font-black rounded-full border border-amber-500/20 inline-flex items-center gap-1 font-sans">
                📸 {galleryData.icon_text}
              </span>
              <h2 className={`font-black mt-3 font-sans ${getFontSizeClass(galleryData.fontSize, "text-2xl sm:text-3xl")}`}>
                {galleryData.title_1}
              </h2>
              <p className="text-xs sm:text-sm mt-2 opacity-80 leading-relaxed font-sans font-medium">
                {galleryData.title_2}
              </p>
              {galleryData.body && (
                <p className="text-xs mt-2 font-sans opacity-70 italic max-w-lg">
                  {galleryData.body}
                </p>
              )}
            </div>

            {/* Gallery Interface */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Big showcase image displaying selected thumbnail with rich backdrop zoom */}
              <div className="lg:col-span-8 flex flex-col space-y-4">
                <div className="w-full aspect-[4/3] bg-slate-900/70 p-3 rounded-3xl border border-slate-800/80 overflow-hidden relative flex items-center justify-center group shadow-xl">
                  <img 
                    src={galleryData.gallery_images[activeGalleryIndex]} 
                    alt={`Raincoat premium closeup view ${activeGalleryIndex + 1}`}
                    className="max-h-full max-w-full object-contain rounded-2xl transition-transform duration-500 group-hover:scale-[1.03]"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-4 left-4 bg-slate-950/80 backdrop-blur-md text-[10px] text-amber-400 px-3 py-1 rounded-full font-bold border border-slate-800">
                    ছবি নং- {activeGalleryIndex + 1}
                  </div>
                </div>
              </div>

              {/* Slicing thumbnail grid scroll column */}
              <div className="lg:col-span-4 flex flex-col space-y-3">
                <div className="text-slate-400 text-xs font-bold font-sans">রেইনকোট ও ফ্যাব্রিকেশন ফিনিশিং ক্লোজ-আপ ফটোজ:</div>
                <div className="grid grid-cols-3 lg:grid-cols-2 gap-3.5">
                  {galleryData.gallery_images.map((img: string, idx: number) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveGalleryIndex(idx)}
                      className={`aspect-square p-1 rounded-2xl border transition-all overflow-hidden relative flex items-center justify-center bg-slate-900/50 cursor-pointer ${
                        activeGalleryIndex === idx 
                          ? 'border-amber-400 ring-2 ring-amber-400/25 shadow-md shadow-amber-400/10' 
                          : 'border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <img 
                        src={img} 
                        alt={`Raincoat thumbnail choice ${idx + 1}`} 
                        className="w-full h-full object-cover rounded-xl"
                        referrerPolicy="no-referrer"
                        loading="lazy"
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {/* 4. DYNAMIC EMBED VIDEO SECTION */}
      {videoData.visible_mobile || videoData.visible_desktop ? (
        <section 
          className={`border-b border-slate-900 ${getVisibilityClass(videoData.visible_mobile, videoData.visible_desktop)} ${getPaddingClass(videoData.padding_vertical)}`}
          style={{ backgroundColor: videoData.bgColor, color: videoData.textColor }}
        >
          <div className="container mx-auto px-4 max-w-6xl">
            <div className={`max-w-2xl mx-auto mb-10 flex flex-col ${getAlignClass(videoData.textAlign)}`}>
              <span className="px-3 py-1 bg-rose-550/10 text-rose-500 bg-rose-500/10 text-xs font-black rounded-full border border-rose-500/20 inline-flex items-center gap-1 font-sans">
                <Volume2 className="h-3 w-3 animate-ping text-rose-400" /> {videoData.icon_text}
              </span>
              <h2 className={`font-black mt-3 font-sans ${getFontSizeClass(videoData.fontSize, "text-2xl sm:text-3xl")}`}>
                {videoData.title_1}
              </h2>
              <p className="text-xs sm:text-sm mt-2 opacity-80 leading-relaxed font-sans font-medium">
                {videoData.title_2}
              </p>
              {videoData.body && (
                <p className="text-xs mt-2 font-sans opacity-70 italic max-w-lg">
                  {videoData.body}
                </p>
              )}
            </div>

            {/* Exactly two embedded videos layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              
              {/* Video 1 Frame */}
              <div className="flex flex-col items-center space-y-3.5 bg-slate-900/25 p-4.5 rounded-3xl border border-slate-900 relative">
                <div className="relative w-full aspect-video bg-black/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                  <iframe 
                    src={parseVideoEmbed(videoData.video_url)}
                    width="100%" 
                    height="100%" 
                    style={{ border: 'none', overflow: 'hidden' }} 
                    frameBorder="0" 
                    allowFullScreen={true}
                    allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                    title="Raincoat & Cover Combo Live Test Overview 1"
                    className="absolute inset-0"
                  />
                </div>
                <div className="text-xs font-bold text-center text-slate-350 font-sans">
                  📺 ভিডিও ১: রেইনকোট ওয়াটারপ্রুফিং টেস্ট ও জ্যাকেট ওভারভিউ
                </div>
              </div>

              {/* Video 2 Frame */}
              <div className="flex flex-col items-center space-y-3.5 bg-slate-900/25 p-4.5 rounded-3xl border border-slate-900 relative">
                <div className="relative w-full aspect-video bg-black/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                  <iframe 
                    src={parseVideoEmbed(videoData.video_url_2)}
                    width="100%" 
                    height="100%" 
                    style={{ border: 'none', overflow: 'hidden' }} 
                    frameBorder="0" 
                    allowFullScreen={true}
                    allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                    title="Raincoat & Cover Combo Live Test Overview 2"
                    className="absolute inset-0"
                  />
                </div>
                <div className="text-xs font-bold text-center text-slate-350 font-sans">
                  📺 ভিডিও ২: প্রিমিয়াম বাইক কভার ডাস্ট ও হিট প্রোটেকশন টেস্ট
                </div>
              </div>

            </div>
          </div>
        </section>
      ) : null}

      {/* 5. COMBO FEATURES HIGHLIGHT SECTION */}
      {featuresData.visible_mobile || featuresData.visible_desktop ? (
        <section 
          className={`border-b border-slate-900 ${getVisibilityClass(featuresData.visible_mobile, featuresData.visible_desktop)} ${getPaddingClass(featuresData.padding_vertical)}`}
          style={{ backgroundColor: featuresData.bgColor, color: featuresData.textColor }}
        >
          <div className="container mx-auto px-4 max-w-6xl">
            <div className={`max-w-2xl mx-auto mb-12 flex flex-col ${getAlignClass(featuresData.textAlign)}`}>
              <span className="px-3 py-1 bg-amber-500/10 text-amber-500 text-xs font-black rounded-full border border-amber-500/20 inline-flex items-center gap-1 font-sans">
                💡 {featuresData.icon_text}
              </span>
              <h2 className={`font-black mt-3 font-sans ${getFontSizeClass(featuresData.fontSize, "text-2xl sm:text-3xl")}`}>
                {featuresData.title_1}
              </h2>
              <p className="text-xs sm:text-sm mt-2 opacity-80 leading-relaxed font-sans font-medium">
                {featuresData.title_2}
              </p>
            </div>

            {/* Grid specifications */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              {/* Item 1 */}
              <div className="bg-slate-900/40 p-6 rounded-2xl border border-slate-850 space-y-3 flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center text-lg mb-4">
                    🧥
                  </div>
                  <h4 className="text-sm font-extrabold text-white font-sans">১০০% প্রিমিয়াম ওয়াটারপ্রুফ রেইনকোট</h4>
                  <p className="text-xs text-slate-300 font-medium font-sans leading-relaxed mt-2">
                    থার্মাল হিট সিল প্রযুক্তিতে চমৎকার ফিনিশিংয়ে তৈরি রেইনকোট জ্যাকেট এবং সাইজ-ফিটিং ট্রাউজার।
                  </p>
                </div>
                <span className="text-[10px] text-amber-400 font-bold tracking-wider font-sans">জ্যাকেট + ট্রাউজার প্যাক</span>
              </div>

              {/* Item 2 */}
              <div className="bg-slate-900/40 p-6 rounded-2xl border border-slate-850 space-y-3 flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center text-lg mb-4">
                    🏍️
                  </div>
                  <h4 className="text-sm font-extrabold text-white font-sans">সিলভার প্যারাশুট বাইক কভার</h4>
                  <p className="text-xs text-slate-300 font-medium font-sans leading-relaxed mt-2">
                    উচ্চমানের সিলভার কোটিং সমৃদ্ধ উইন্ডপ্রুফ স্ট্র্যাপ ও ইলাস্টিক জ্যাকিং কভার, যা রোদ ও ধুলো থেকে বাইকের কালার আগলে রাখে।
                  </p>
                </div>
                <span className="text-[10px] text-amber-400 font-bold tracking-wider font-sans">অল-ওয়েদার প্রোটেকশন</span>
              </div>

              {/* Item 3 */}
              <div className="bg-slate-900/40 p-6 rounded-2xl border border-slate-850 space-y-3 flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center text-lg mb-4">
                    🛡️
                  </div>
                  <h4 className="text-sm font-extrabold text-white font-sans">৩ সিজন অনায়াসে ব্যবহার উপযোগী</h4>
                  <p className="text-xs text-slate-300 font-medium font-sans leading-relaxed mt-2">
                    মজবুত কোয়ালিটির সুতা ও পিইউ ট্যাপ সিলিং সীমিং ব্যবহার করার কারণে দীর্ঘ ৩ সিজন কোনোরকম লিকেজ ছাড়া ব্যবহার করা যাবে।
                  </p>
                </div>
                <span className="text-[10px] text-amber-400 font-bold tracking-wider font-sans">উচ্চস্থায়িত্বের নিশ্চয়তা</span>
              </div>

            </div>

            <div className="mt-8 text-center bg-slate-900/60 p-5 rounded-2xl border border-slate-800 font-sans max-w-xl mx-auto select-none">
              <span className="text-xs text-slate-300">
                {featuresData.body}
              </span>
            </div>

          </div>
        </section>
      ) : null}

      {/* 6. ORDER FORM & CHECKOUT BLOCK */}
      {checkoutData.visible_mobile || checkoutData.visible_desktop ? (
        <section 
          className={`border-b border-slate-900 ${getVisibilityClass(checkoutData.visible_mobile, checkoutData.visible_desktop)} ${getPaddingClass(checkoutData.padding_vertical)}`}
          style={{ backgroundColor: checkoutData.bgColor, color: checkoutData.textColor }}
          id="combo-checkout-form"
        >
          <div className="container mx-auto px-4 max-w-4xl">
            <div className={`max-w-2xl mx-auto mb-10 flex flex-col ${getAlignClass(checkoutData.textAlign)}`}>
              <span className="px-3 py-1 bg-amber-500/10 text-amber-500 text-xs font-black rounded-full border border-amber-500/20 inline-flex items-center gap-1 font-sans">
                ✍️ {checkoutData.icon_text}
              </span>
              <h2 className={`font-black mt-3 font-sans ${getFontSizeClass(checkoutData.fontSize, "text-2xl sm:text-3xl")}`}>
                {checkoutData.title_1}
              </h2>
              <p className="text-xs sm:text-sm mt-2 opacity-80 leading-relaxed font-sans font-medium">
                {checkoutData.title_2}
              </p>
              {checkoutData.body && (
                <p className="text-xs mt-2 font-sans opacity-70 italic max-w-lg">
                  {checkoutData.body}
                </p>
              )}
            </div>

            {/* Error Message alert popup */}
            {errorMessage && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-2xl text-xs font-bold font-sans mb-6 text-center animate-shake leading-relaxed select-none">
                ⚠️ {errorMessage}
              </div>
            )}

            {/* Checkout Interface form card */}
            <div className="bg-slate-900 border border-slate-800/80 p-5 sm:p-8 rounded-3xl shadow-2xl relative overflow-hidden grid grid-cols-1 md:grid-cols-12 gap-8 items-stretch">
              
              <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-600"></div>

              {/* Left Form controls block */}
              <form onSubmit={handleOrderSubmit} className="md:col-span-7 space-y-5 flex flex-col justify-start">
                
                 {/* Full delivery Customer's Name (নাম) */}
                 <div className="space-y-1">
                   <label className="block text-xs font-bold text-slate-350 font-sans">
                     ১. আপনার নাম (কাস্টমারের নাম) <span className="text-rose-500 font-mono">*</span>
                   </label>
                   <div className="relative">
                     <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 pointer-events-none text-sm">
                       <User className="h-4.5 w-4.5" />
                     </span>
                     <input 
                       type="text" 
                       id="combo-name-input"
                       value={name}
                       onChange={(e) => {
                         setName(e.target.value);
                         if (e.target.value.trim()) {
                           setFormErrors(prev => ({ ...prev, name: false }));
                         }
                       }}
                       placeholder="আপনার নাম লিখুন..."
                       className={`w-full text-xs pl-10.5 pr-4 py-3 bg-slate-950/80 border rounded-xl text-white outline-none focus:ring-1 transition leading-snug ${
                         formErrors.name 
                           ? 'border-rose-500 ring-1 ring-rose-500/25 focus:border-rose-500' 
                           : 'border-slate-800 focus:border-amber-400 focus:ring-amber-400/25'
                       }`}
                     />
                   </div>
                   {formErrors.name && (
                     <span className="text-[11px] font-bold text-rose-400 block mt-1 font-sans animate-pulse">
                       * অনুগ্রহ করে আপনার নাম লিখুন।
                     </span>
                   )}
                 </div>

                 {/* Customer's Mobile number (মোবাইল নম্বর) */}
                 <div className="space-y-1">
                   <label className="block text-xs font-bold text-slate-350 font-sans">
                     ২. সচল মোবাইল নম্বর (১১ ডিজিট) <span className="text-rose-500 font-mono">*</span>
                   </label>
                   <div className="relative">
                     <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 pointer-events-none text-sm">
                       <Smartphone className="h-4.5 w-4.5" />
                     </span>
                     <input 
                       type="tel" 
                       id="combo-phone-input"
                       value={phone}
                       onChange={(e) => {
                         setPhone(e.target.value);
                         if (e.target.value.trim().length >= 11) {
                           setFormErrors(prev => ({ ...prev, phone: false }));
                         }
                       }}
                       placeholder="যেমন: 017XXXXXXXX"
                       className={`w-full text-xs pl-10.5 pr-4 py-3 bg-slate-950/80 border rounded-xl text-white outline-none focus:ring-1 transition leading-snug font-mono ${
                         formErrors.phone 
                           ? 'border-rose-500 ring-1 ring-rose-500/25 focus:border-rose-500' 
                           : 'border-slate-800 focus:border-amber-400 focus:ring-amber-400/25'
                       }`}
                     />
                   </div>
                   {formErrors.phone && (
                     <span className="text-[11px] font-bold text-rose-400 block mt-1 font-sans animate-pulse">
                       * অনুগ্রহ করে একটি সঠিক ১১ ডিজিটের বাংলাদেশী মোবাইল নাম্বার দিন।
                     </span>
                   )}
                 </div>

                 {/* Complete Delivery Address (ঠিকানা) */}
                 <div className="space-y-1">
                   <label className="block text-xs font-bold text-slate-350 font-sans">
                     ৩. আপনার সম্পূর্ণ ঠিকানা (গ্রাম/পাড়া/থানা/জেলা) <span className="text-rose-500 font-mono">*</span>
                   </label>
                   <div className="relative">
                     <span className="absolute top-3 left-3.5 text-slate-500 pointer-events-none text-sm">
                       <MapPin className="h-4.5 w-4.5" />
                     </span>
                     <textarea 
                       rows={3}
                       id="combo-village-input"
                       value={village}
                       onChange={(e) => {
                         setVillage(e.target.value);
                         if (e.target.value.trim()) {
                           setFormErrors(prev => ({ ...prev, village: false }));
                         }
                       }}
                       placeholder="যেমন: গ্রাম, ডাকঘর, থানা ও জেলা সুন্দর করে লিখুন..."
                       className={`w-full text-xs pl-10.5 pr-4 py-3 bg-slate-950/80 border rounded-xl text-white outline-none focus:ring-1 transition leading-snug resize-none ${
                         formErrors.village 
                           ? 'border-rose-500 ring-1 ring-rose-500/25 focus:border-rose-500' 
                           : 'border-slate-800 focus:border-amber-400 focus:ring-amber-400/25'
                       }`}
                     />
                   </div>
                   {formErrors.village && (
                     <span className="text-[11px] font-bold text-rose-400 block mt-1 font-sans animate-pulse">
                       * অনুগ্রহ করে আপনার সম্পূর্ণ ঠিকানা (গ্রাম/পাড়া/থানা) লিখুন।
                     </span>
                   )}
                 </div>

                {/* Sizing Selection buttons (Size select - English labels on sizes) */}
                <div className="space-y-2 pt-1">
                  <span className="block text-xs font-bold text-slate-350 font-sans">
                    ৪. রেইনকোটের প্রিমিয়াম সাইজ নির্বাচন করুন <span className="text-rose-500 font-mono">*</span>
                  </span>
                  <div className="grid grid-cols-4 gap-2">
                    {sizes.map((sz) => (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => setSelectedSize(sz)}
                        className={`py-3 rounded-xl border text-center font-black transition-all cursor-pointer ${
                          selectedSize === sz 
                            ? 'bg-amber-400 border-amber-400 text-slate-950 font-sans shadow-md shadow-amber-400/10 scale-102' 
                            : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-300 font-sans'
                        }`}
                      >
                        {sz}
                        <span className="block text-[8px] font-bold opacity-80 mt-0.5">
                          {(sz === 'XL' || sz === 'XXL') ? '৳৯৯০' : '৳১০৯০'}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Two dropdown panels side-by-side: Raincoat and Bike Cover Colors */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Raincoat Color select (English labels) */}
                  <div className="space-y-1.5">
                    <span className="block text-xs font-bold text-slate-350 font-sans">
                      ৫. রেইনকোট কালার <span className="text-rose-500 font-mono">*</span>
                    </span>
                    <select
                      value={selectedColor}
                      onChange={(e) => setSelectedColor(e.target.value as ProductColor)}
                      className="w-full text-xs px-3.5 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-amber-400 focus:ring-0 cursor-pointer font-bold font-sans"
                    >
                      <option value="Black">Black (কালো)</option>
                      <option value="Navy Blue">Navy Blue (নেভি ব্লু)</option>
                    </select>
                  </div>

                  {/* Bike Cover Color select (English labels) */}
                  <div className="space-y-1.5">
                    <span className="block text-xs font-bold text-slate-350 font-sans">
                      ৬. বাইক কভার কালার <span className="text-rose-500 font-mono">*</span>
                    </span>
                    <select
                      value={bikeCoverColor}
                      onChange={(e) => setBikeCoverColor(e.target.value as 'Black' | 'Navy Blue')}
                      className="w-full text-xs px-3.5 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-amber-400 focus:ring-0 cursor-pointer font-bold font-sans"
                    >
                      <option value="Black">Black (কালো)</option>
                      <option value="Navy Blue">Navy Blue (নেভি ব্লু)</option>
                    </select>
                  </div>
                </div>

                {/* Bike Model selection dropdown and Preferred Color selector layout */}
                <div className="border-t border-slate-800/80 pt-4 space-y-4">
                  <div className="bg-amber-400/5 p-3 rounded-2xl border border-amber-400/10 flex items-start gap-2.5">
                    <Bike className="h-5 w-5 text-amber-400 mt-0.5 shrink-0" />
                    <span className="text-[10px] text-amber-300 leading-normal font-sans font-medium">নিচের ড্রপডাউন থেকে আপনার বাইকের মডেল সিলেক্ট করুন এবং পছন্দের কালারটি নির্বাচন করুন:</span>
                  </div>

                  {/* 1. Which model of bike they ride */}
                  <div className="space-y-1.5 font-sans">
                    <label className="block text-xs font-bold text-slate-350 font-sans">
                      ৭. আপনি কোন বাইক মডেলটি চালান? <span className="text-rose-500 font-mono">*</span>
                    </label>
                    <select
                      id="combo-bike-model-input"
                      value={bikeModel}
                      onChange={(e) => {
                        setBikeModel(e.target.value);
                        if (e.target.value) {
                          setFormErrors(prev => ({ ...prev, bikeModel: false }));
                        }
                      }}
                      className={`w-full text-xs px-3.5 py-3 bg-slate-950 border rounded-xl text-white outline-none focus:ring-1 cursor-pointer font-bold font-sans transition-all ${
                        formErrors.bikeModel 
                          ? 'border-rose-500 ring-1 ring-rose-500/25 focus:border-rose-500' 
                          : 'border-slate-800 focus:border-amber-400'
                      }`}
                    >
                      <option value="">বাইক মডেল সিলেক্ট করুন...</option>
                      <option value="Bajaj Pulsar 150">Bajaj Pulsar 150 / 125</option>
                      <option value="TVS Apache RTR 160">TVS Apache RTR 160 / 4V</option>
                      <option value="Yamaha FZ-S / V2 / V3 / V4">Yamaha FZ-S / Fazer V3</option>
                      <option value="Suzuki Gixxer / SF">Suzuki Gixxer / SF</option>
                      <option value="Yamaha R15 / MT-15">Yamaha R15 / MT-15</option>
                      <option value="Suzuki GSX-R150">Suzuki GSX-R150</option>
                      <option value="Bajaj Discover 125 / 110">Bajaj Discover 125 / 110</option>
                      <option value="Hero Splendor / Passion">Hero Splendor / Passion Plus</option>
                      <option value="Honda Hornet / CB Trigger">Honda Hornet / CB Trigger</option>
                      <option value="Hero Thriller / Hunk">Hero Thriller / Hunk 150</option>
                      <option value="Vespa / Scooter">Vespa / Suzuki Access (Scooter)</option>
                      <option value="Others / অন্যান্য">Others / অন্যান্য বাইক মডেল</option>
                    </select>
                    {formErrors.bikeModel && (
                      <span className="text-[11px] font-bold text-rose-400 block mt-1 font-sans animate-pulse">
                        * অনুগ্রহ করে আপনার বাইকের মডেলটি নির্বাচন করুন।
                      </span>
                    )}
                  </div>

                  {/* 2. Bike Preferred Color option - Dropdown option as requested */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-350 font-sans">
                      ৮. বাইকের পছন্দের কালার (Preferred Color of bike) <span className="text-rose-500 font-mono">*</span>
                    </label>
                    <select
                      value={bikePreferredColor}
                      onChange={(e) => setBikePreferredColor(e.target.value as 'Black' | 'Navy Blue')}
                      className="w-full text-xs px-3.5 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-amber-400 focus:ring-0 cursor-pointer font-bold font-sans"
                    >
                      <option value="Black">Black (কালো)</option>
                      <option value="Navy Blue">Navy Blue (নেভি ব্লু)</option>
                    </select>
                  </div>
                </div>

                {/* Ordering/Submit CTA flow */}
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4.5 bg-amber-500 hover:bg-amber-600 border border-amber-400/20 active:scale-[0.99] disabled:bg-slate-700 disabled:text-slate-400 text-slate-950 font-black text-sm sm:text-base rounded-2xl transition-all shadow-xl shadow-amber-500/10 flex items-center justify-center gap-2 cursor-pointer font-sans"
                  >
                    {isSubmitting ? (
                      <>⌛ দয়া করে অপেক্ষা করুন...</>
                    ) : (
                      <>
                        <CheckCircle2 className="h-5.5 w-5.5 text-slate-950" />
                        অর্ডার কনফার্ম করুন (৳{currentPrice} টাকা)
                      </>
                    )}
                  </button>
                </div>

              </form>

              {/* Right Billing checkout summary details card */}
              <div className="md:col-span-5 bg-slate-950/60 p-5 rounded-2xl border border-slate-800/80 flex flex-col justify-between space-y-6">
                
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2.5 border-b border-slate-850">
                    <span className="p-2.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl text-xs font-black">📝</span>
                    <div>
                      <h4 className="text-xs sm:text-sm font-black text-white font-sans">বিলিং সামারি (Order Invoice)</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5 font-sans leading-none">সম্পূর্ণ প্রিমিয়াম ক্যাশ অন ডেলিভারি</p>
                    </div>
                  </div>

                  <div className="space-y-2.5 font-sans">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400">রেইনকোট ({selectedSize}):</span>
                      <span className="font-bold text-white">৳{(selectedSize === 'XL' || selectedSize === 'XXL') ? '৯৯০' : '১০৯০'}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400">প্রিমিয়াম বাইক কভার:</span>
                      <span className="font-bold text-white">৳৬০০</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400">ডেলিভারি চার্জ:</span>
                      <span className="font-bold text-emerald-400">৳০ (সম্পূর্ণ ফ্রী!)</span>
                    </div>
                    
                    <div className="pt-2 border-t border-slate-850 flex justify-between items-center">
                      <span className="text-xs font-bold text-amber-400">কম্বো ডিসকাউন্ট মোট প্রাইজ:</span>
                      <div className="text-right">
                        <span className="text-slate-500 line-through text-[11px] block leading-none mb-0.5">৳{regularPrice}/-</span>
                        <span className="text-md font-black text-amber-400 font-mono">৳{currentPrice}/- BDT</span>
                      </div>
                    </div>
                  </div>
                </div>



              </div>

            </div>

          </div>
        </section>
      ) : null}

      {/* 7. Bottom Footing Area with copyrights and compliance */}
      <footer className="bg-slate-950 py-10 border-t border-slate-900 font-sans text-center text-xs text-slate-500 select-none">
        <p>© {new Date().getFullYear()} প্রিমিয়াম রেইনকোট এবং বাইক কভার কম্বো বাংলাদেশ। সর্বস্বত্ব সংরক্ষিত।</p>
        <p className="text-[10px] text-slate-650 mt-1">ক্যাশ অন হোম ডেলিভারি ও রিয়েলটাইম পার্সেল ট্র্যাকিং সুবিধা।</p>
      </footer>

    </div>
  );
}
