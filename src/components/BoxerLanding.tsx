import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  CheckCircle2, 
  ShieldCheck, 
  Award, 
  Phone, 
  ChevronLeft, 
  ChevronRight, 
  Volume2, 
  MapPin, 
  User, 
  Check, 
  Smartphone,
  Eye,
  Info,
  Layers,
  Heart,
  Grid
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  addOrderToFirestore, 
  getAdvancedAddonsSettingsFromFirestore 
} from '../lib/firebase';
import { trackPixelEvent } from '../lib/tracking';
import { RaincoatOrder } from '../types';

interface BoxerLandingProps {
  onOrderSuccess: (order: RaincoatOrder) => void;
}

export default function BoxerLanding({ onOrderSuccess }: BoxerLandingProps) {
  // Site Customizations settings loaded from Firestore
  const [siteSettings, setSiteSettings] = useState<any>(null);

  // Form Field State variables
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [village, setVillage] = useState('');
  
  // Selection states
  const [selectedSet, setSelectedSet] = useState<'1set' | '2sets'>('1set');
  const [selectedSize, setSelectedSize] = useState<'S' | 'M' | 'L' | 'XL' | 'XXL' | '3XL'>('L');
  const [selectedColorOption, setSelectedColorOption] = useState<'option1' | 'option2'>('option1');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [submittedOrder, setSubmittedOrder] = useState<RaincoatOrder | null>(null);

  // Carousel current index state
  const [carouselIndex, setCarouselIndex] = useState(0);

  // Load customizations and listen to real-time events from Section Customizer Admin
  const loadCustomizations = async () => {
    try {
      const res = await getAdvancedAddonsSettingsFromFirestore();
      if (res) {
        setSiteSettings(res);
      }
    } catch (err) {
      console.error("Failed to load customized segments for boxer:", err);
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
  const heroData = getSectionData('boxer_hero', {
    bgColor: '#0f172a',
    textColor: '#ffffff',
    textAlign: 'center',
    fontSize: 'default',
    image_url: 'https://images.unsplash.com/photo-1582966772680-860e372bb558?auto=format&fit=crop&q=80&w=600',
    icon_text: 'সেরা ধামাকা প্রিমিয়াম কম্বো অফার',
    title_1: 'সলিড কালার প্রিমিয়াম মেন্স বক্সার ব্রিফ',
    title_2: '৯৫% কটন ও ৫% স্প্যানডেক্স চায়না লাক্সারি ফেব্রিক্স দিয়ে তৈরি জেন্টলস বক্সার!',
    body: 'টপ নচ এক্সপার্ট কোয়ালিটি সুইং ও নিখুঁত ট্রিপল সুচ ফিনিশিং। গরমে ও প্রতিদিনের ব্যবহারে সর্বোচ্চ আরামদায়ক সলিড ট্রাঙ্ক বা বক্সার ব্রিফ প্যাক। আলাদা ডেলিভারি চার্জ ছাড়া সারা বাংলাদেশে ক্যাশ অন ডেলিভারি!',
    visible_mobile: true,
    visible_desktop: true,
    padding_vertical: 'normal'
  });

  // 2. SECTION: SPECS CUSTOMIZER DATAS
  const specsData = getSectionData('boxer_specs', {
    bgColor: '#ffffff',
    textColor: '#0f172a',
    textAlign: 'center',
    fontSize: 'default',
    image_url: '',
    icon_text: 'আরামদায়ক প্রিমিয়াম ফেব্রিক গ্যারান্টি',
    title_1: 'অনুপম আরামদায়ক ও নিখুঁত ফিনিশিং',
    title_2: '১০০% নিখুঁত ফিটিং এবং সুক্ষ্ম ডাবল নিডেল কোয়ালিটি সুইং ডিজাইন!',
    body: 'আমাদের প্রতিটি বক্সার ব্রিফ ৯ভ% প্রিমিয়াম সুতি বা কটন এবং ৫% লাক্সারি স্প্যানডেক্স ফেব্রিক দিয়ে তৈরি। এটি চায়না প্রিমিয়াম এক্সপোর্ট ফেব্রিক্স এবং চমৎকার ইলাস্টিক ফ্লেক্সিবিলিটি সমৃদ্ধ।',
    visible_mobile: true,
    visible_desktop: true,
    padding_vertical: 'normal'
  });

  // 3. SECTION: CAROUSEL/GALLERY CUSTOMIZER DATAS
  const galleryData = getSectionData('boxer_gallery', {
    bgColor: '#f8fafc',
    textColor: '#0f172a',
    textAlign: 'center',
    fontSize: 'default',
    icon_text: 'বক্সার কালার ও ক্লোজ-আপ গ্যালারি',
    title_1: 'চারটি আকর্ষণীয় সলিড কালার এবং চমৎকার ইলাস্টিক গ্যালারি',
    title_2: 'কালো, নেভি ব্লু, সাদা ও অ্যাস কালারে অত্যন্ত স্টাইলিশ সলিড ব্রিফ কালেকশন!',
    body: 'খুব কাছ থেকে নিখুঁত থ্রেড টপ-কোয়ালিটি গ্যারান্টি স্টিচ দেখার জন্য الصور নিচে ক্লিক করুন।',
    gallery_images: [
      'https://images.unsplash.com/photo-1582966772680-860e372bb558?auto=format&fit=crop&q=80&w=600',
      'https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&q=80&w=600',
      'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&q=80&w=600',
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=600',
      'https://images.unsplash.com/photo-1508962914676-134849a727f0?auto=format&fit=crop&q=80&w=600',
      'https://images.unsplash.com/photo-1481944877197-f58c755efb1c?auto=format&fit=crop&q=80&w=600'
    ],
    visible_mobile: true,
    visible_desktop: true,
    padding_vertical: 'normal'
  });

  // 4. SECTION: VIDEO CUSTOMIZER DATAS
  const videoData = getSectionData('boxer_video', {
    bgColor: '#0f172a',
    textColor: '#ffffff',
    textAlign: 'center',
    fontSize: 'default',
    icon_text: '১০০% বাস্তব কোয়ালিটি রিভিউ ভিডিও',
    title_1: 'আমাদের বক্সারের সরাসরি লাইভ ও কোয়ালিটি ফিডব্যাক ভিডিও দেখুন',
    title_2: 'কেন আমাদের বক্সার বাজারে সবচেয়ে সেরা কোয়ালিটির তা সরাসরি ভিডিওতে দেখুন।',
    body: 'কোনো এডিটিং ছাড়া শতভাগ খাঁটি ওপেনিং ও চমৎকার সুইং ডেমোস্ট্রেশন লাইভ টেস্ট রিভিউ ভিডিও।',
    video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    visible_mobile: true,
    visible_desktop: true,
    padding_vertical: 'normal'
  });

  // 5. SECTION: CHECKOUT HEADER CUSTOMIZER DATAS
  const checkoutData = getSectionData('boxer_checkout', {
    bgColor: '#ffffff',
    textColor: '#1e293b',
    textAlign: 'center',
    fontSize: 'default',
    icon_text: 'অগ্রিম ১ টাকাও পেমেন্ট করা লাগবে না',
    title_1: 'নিচের চেকআউট ফর্মটি পূরণ করে আপনার Boxer কম্বো সুনিশ্চিত করুন!',
    title_2: '১ সেট বা ২ সেট আপনার পছন্দের প্যাকেজ সিলেক্ট করে সঠিক ঠিকানা দিন।',
    body: 'পণ্য ডেলিভারি পাওয়ার পর চেক করে সন্তুষ্ট হয়ে তারপর পেমেন্ট করবেন। কোনো প্রকার রিস্ক ছাড়া শতভাগ নিরাপদ কেনাকাটা।',
    visible_mobile: true,
    visible_desktop: true,
    padding_vertical: 'normal'
  });

  // Helpers for structural class names
  const getAlignClass = (align: 'left' | 'center' | 'right') => {
    if (align === 'center') return 'text-center items-center justify-center';
    if (align === 'right') return 'text-right items-end justify-end';
    return 'text-left items-start justify-start';
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

  // Pricing formula
  // 1 Set (3 pieces) and 2 Sets (6 pieces)
  const currentPrice = selectedSet === '1set' ? 550 : 950;
  const regularPrice = selectedSet === '1set' ? 1050 : 2100;

  // Sizing definitions
  const sizes = [
    { label: 'S', info: '28-30' },
    { label: 'M', info: '30-32' },
    { label: 'L', info: '32-34' },
    { label: 'XL', info: '34-36' },
    { label: 'XXL', info: '36-38' },
    { label: '3XL', info: '38-40' }
  ];

  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!name.trim()) return setErrorMessage('অনুগ্রহ করে আপনার নামটি লিখুন।');
    if (!phone.trim()) return setErrorMessage('অনুগ্রহ করে আপনার সচল মোবাইল নম্বরটি লিখুন।');
    if (!village.trim()) return setErrorMessage('অনুগ্রহ করে আপনার ডেলিভারির সম্পূর্ণ ঠিকানাটি প্রদান করুন।');

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
      return setErrorMessage('অনুগ্রহ করে একটি সঠিক ১১ ডিজিটের বাংলাদেশী মোবাইল নাম্বার দিন (যেমন: 01XXXXXXXXX)।');
    }

    setIsSubmitting(true);

    const generatedOrderId = 'ord-boxer-' + Math.floor(Math.random() * 100000);
    
    // Notes for detailed selection
    const colorBundleName = selectedColorOption === 'option1' ? 'কালো, সাদা, নেভি ব্লু' : 'কালো, এস, নেভি ব্লু';
    const setQuantityText = selectedSet === '1set' ? '১ সেট (৩ পিস - ৫৫০ টাকা)' : '২ সেট (৬ পিস - ৯৫০ টাকা)';
    const fullNotes = `মেন্স বক্সার ব্রিফ কম্বো অর্ডার। প্যাক সাইজ: ${setQuantityText}, সাইজ কোড: ${selectedSize} (কোমর ইন্ঞ্চ সহ), কালার কম্বিনেশন: ${colorBundleName}. চায়না কটন ফেব্রিক্স (৯৫% কটন + ৫% স্প্যান্ডেক্স)। সম্পূর্ণ ক্যাশ অন ডেলিভারি (মূল্য: ৳${currentPrice} টাকা)।`;

    const newOrder: RaincoatOrder = {
      id: generatedOrderId,
      name: name.trim(),
      village: village.trim(),
      phone: cleanPhone,
      size: 'XL', // default fallback union value for standard schema Compatibility
      color: 'Black', // default fallback union value for standard schema Compatibility
      weight: 65,
      heightFeet: 5,
      heightInches: 7,
      price: currentPrice,
      status: 'Pending',
      isConfirmed: false,
      bikeModel: 'Boxer Pack Color Combo',
      orderNotes: fullNotes,
      createdAt: new Date().toISOString(),
      synced: false,
    };

    try {
      // background firestore save
      addOrderToFirestore(newOrder).then(() => {
        newOrder.synced = true;
      }).catch((err) => {
        console.warn("Boxer order direct firestore save failed, keeping client local:", err);
      });

      // Saving in localStorage
      const listJson = localStorage.getItem('raincoat_orders') || '[]';
      const orderList = JSON.parse(listJson);
      orderList.unshift(newOrder);
      localStorage.setItem('raincoat_orders', JSON.stringify(orderList));

      setSubmittedOrder(newOrder);
      localStorage.setItem('last_ordered_product_slug', 'boys-premium-boxers');
      
      onOrderSuccess(newOrder);

      // Trigger standard conversion pixel event
      trackPixelEvent('Purchase', {
        value: currentPrice,
        currency: 'BDT',
        content_name: 'Premium Cotton Boxer Briefs',
        content_category: 'Mens Undergarments'
      });

    } catch (err: any) {
      setErrorMessage('অর্ডার সাবমিট প্রক্রিয়ায় ত্রুটি হয়েছে। অনুগ্রহ করে পুনরায় ট্রাই করুন।');
    } finally {
      setIsSubmitting(false);
    }
  };

  const scrollToCheckout = () => {
    const el = document.getElementById('boxer-checkout-form');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const nextCarousel = () => {
    const total = (galleryData.gallery_images || []).length;
    setCarouselIndex((prev) => (prev + 1) % total);
  };

  const prevCarousel = () => {
    const total = (galleryData.gallery_images || []).length;
    setCarouselIndex((prev) => (prev - 1 + total) % total);
  };

  return (
    <div className="w-full bg-slate-950 text-slate-100 min-h-screen">
      
      {/* 1. Header Sticky strip */}
      <div className="bg-gradient-to-r from-cyan-600 via-blue-700 to-indigo-800 text-white text-xs font-black text-center py-2 px-4 shadow-md flex items-center justify-center gap-2 relative z-30 select-none">
        <span className="bg-amber-400 text-slate-950 px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs animate-bounce font-bold">গ্র্যান্ড ওফার</span>
        <span>💥 প্রিমিয়াম মেন্স বক্সার ব্রিফ প্যাক! ডেলিভারি চার্জ সম্পূর্ণ ফ্রী সারা বাংলাদেশ! 💥</span>
        <button
          onClick={scrollToCheckout}
          className="underline hover:text-amber-200 transition font-extrabold cursor-pointer ml-3 text-[11px] sm:text-xs"
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
          {/* subtle abstract background circle */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="container mx-auto px-4 max-w-7xl relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              
              {/* Text Area */}
              <div className={`lg:col-span-7 space-y-6 flex flex-col ${getAlignClass(heroData.textAlign)}`}>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-500/10 text-cyan-400 text-xs font-black rounded-full border border-cyan-500/20 uppercase tracking-wider font-sans">
                  💎 {heroData.icon_text}
                </div>

                <h1 className={`font-black tracking-tight leading-tight font-sans ${getFontSizeClass(heroData.fontSize, "text-3xl sm:text-4xl md:text-5xl")}`}>
                  {heroData.title_1} <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-white block mt-2">
                    {heroData.title_2}
                  </span>
                </h1>

                <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl font-sans font-medium">
                  {heroData.body}
                </p>

                {/* Sizing Price highlights */}
                <div className="bg-slate-900/60 backdrop-blur-md p-5 rounded-2xl border border-slate-800/80 max-w-md w-full grid grid-cols-2 gap-4 divide-x divide-slate-850">
                  <div className="text-center font-sans">
                    <span className="text-[10px] text-cyan-400 block font-bold">১ সেট কম্বো প্যাক (৩ টি)</span>
                    <span className="text-sm font-bold text-slate-400 line-through block mt-1">৳১০৫০/-</span>
                    <span className="text-2xl font-black text-amber-400 font-mono">৳৫৫০/-</span>
                    <span className="text-[9px] text-emerald-400 font-semibold block mt-0.5">ডেলিভারি সম্পূর্ণ ফ্রী!</span>
                  </div>
                  <div className="text-center font-sans pl-4">
                    <span className="text-[10px] text-cyan-400 block font-bold">২ সেট ডাবল প্যাক (৬ টি)</span>
                    <span className="text-sm font-bold text-slate-400 line-through block mt-1">৳২১০০/-</span>
                    <span className="text-2xl font-black text-amber-400 font-mono">৳৯৫০/-</span>
                    <span className="text-[9px] text-emerald-400 font-semibold block mt-0.5">সুপার সেভার ডিল!</span>
                  </div>
                </div>

                {/* Specifications Checklist */}
                <div className="grid grid-cols-2 gap-3 pt-2 text-slate-350 text-xs font-semibold w-full max-w-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-cyan-400 shrink-0" /> চায়না ফেব্রিক্স দিয়ে তৈরি
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-cyan-400 shrink-0" /> ৯৫% কটন ও ৫% স্পান্ডেক্স
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-cyan-400 shrink-0" /> ৪ টি আকর্ষণীয় সলিড কালার
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-cyan-400 shrink-0" /> এক্সপার্ট সুইং ও ফাইন ফিনিশিং
                  </div>
                </div>

                {/* CTA Flow */}
                <div className="flex flex-col sm:flex-row gap-4 w-full pt-3">
                  <button
                    onClick={scrollToCheckout}
                    className="px-8 py-4 bg-cyan-500 hover:bg-cyan-600 active:scale-98 text-slate-950 font-black text-sm sm:text-base rounded-2xl transition duration-300 shadow-xl shadow-cyan-500/25 flex items-center justify-center gap-3 cursor-pointer font-sans"
                  >
                    <ShoppingBag className="h-5 w-5 text-slate-950" /> বক্সার প্যাক অর্ডার করুন (COD)
                  </button>
                  <a
                    href="tel:+8801624933949"
                    className="px-6 py-4 bg-slate-900 hover:bg-slate-800 active:scale-98 text-slate-200 border border-slate-800 font-bold text-sm sm:text-base rounded-2xl transition duration-300 flex items-center justify-center gap-2 cursor-pointer font-sans"
                  >
                    <Phone className="h-4 w-4 text-cyan-400" /> +8801624933949
                  </a>
                </div>
              </div>

              {/* Showcase Hero Image */}
              <div className="lg:col-span-5 relative w-full flex flex-col items-center justify-center">
                <div className="relative group w-full max-w-sm bg-slate-900/40 p-4 border border-slate-850 rounded-3xl shadow-2xl overflow-hidden aspect-square flex items-center justify-center">
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent pointer-events-none"></div>
                  <img 
                    src={heroData.image_url || 'https://images.unsplash.com/photo-1582966772680-860e372bb558?auto=format&fit=crop&q=80&w=600'} 
                    alt="Boys Boxer brief comfort wear package" 
                    className="w-full h-full object-cover rounded-2xl transition-transform duration-300 group-hover:scale-[1.02]"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute bottom-5 right-5 bg-cyan-600 text-white text-xs font-black px-3.5 py-1.5 rounded-xl shadow-md select-none transform rotate-2">
                    চায়না ইমপোর্টেড ফেব্রিক 👑
                  </div>
                </div>

                {/* Additional badge block info */}
                <div className="w-full max-w-sm bg-slate-900/60 p-4 mt-4 border border-slate-800/80 rounded-2xl flex items-center gap-3">
                  <div className="relative shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-cyan-400 font-sans">🛡️ শতভাগ ফিটিং ও আরামের নিশ্চয়তা</h4>
                    <p className="text-[10px] text-slate-400 leading-normal font-sans mt-0.5">পছন্দ না হলে সাথে সাথে ডেলিভারি ম্যান থাকা অবস্থায় সম্পূর্ণ ফ্রি রিটার্ন করতে পারবেন!</p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </header>
      ) : null}

      {/* 3. EXPERT SPECS AND FABRICS HIGHLIGHTS */}
      {specsData.visible_mobile || specsData.visible_desktop ? (
        <section 
          className={`border-b border-slate-900 ${getVisibilityClass(specsData.visible_mobile, specsData.visible_desktop)} ${getPaddingClass(specsData.padding_vertical)}`}
          style={{ backgroundColor: specsData.bgColor, color: specsData.textColor }}
        >
          <div className="container mx-auto px-4 max-w-6xl">
            <div className={`max-w-2xl mx-auto mb-12 flex flex-col ${getAlignClass(specsData.textAlign)}`}>
              <span className="px-3 py-1 bg-cyan-500/10 text-cyan-600 text-xs font-black rounded-full border border-cyan-500/20 inline-flex items-center gap-1 font-sans">
                💡 {specsData.icon_text}
              </span>
              <h2 className={`font-black mt-3 font-sans text-center ${getFontSizeClass(specsData.fontSize, "text-2xl sm:text-3xl")}`} style={{ color: specsData.textColor }}>
                {specsData.title_1}
              </h2>
              <p className="text-xs sm:text-sm mt-2 text-center font-sans font-medium opacity-80">
                {specsData.title_2}
              </p>
            </div>

            {/* Layout grids representing Premium properties of Boxer */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              <div className="bg-slate-50 border border-slate-150 p-6 rounded-2xl flex flex-col space-y-4">
                <div className="w-12 h-12 rounded-xl bg-cyan-500/10 text-cyan-600 flex items-center justify-center text-xl font-bold">
                  🧶
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-slate-900 font-sans">৯৫% সুতি ও ৫% স্প্যান্ডেক্স</h4>
                  <p className="text-xs text-slate-650 font-sans leading-relaxed mt-1">
                    বক্সেস জ্যাকেট ৯৫% এক্সপোর্ট কোয়ালিটি কটন সুতা এবং ৫% লাক্সারি স্পান্ডেক্স স্প্রিং চমৎকার ফ্লেক্সিবল স্ট্রেচিয়েবল কম্বিনেশন।
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-150 p-6 rounded-2xl flex flex-col space-y-4">
                <div className="w-12 h-12 rounded-xl bg-cyan-500/10 text-cyan-600 flex items-center justify-center text-xl font-bold">
                  🛡️
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-slate-900 font-sans">টপ নচ এক্সপার্ট সুইং ফিনিশিং</h4>
                  <p className="text-xs text-slate-650 font-sans leading-relaxed mt-1">
                    হাই-ডিউটি ট্রিপল সুচ লক স্টিচ এবং অত্যন্ত সূক্ষ্ম ডাবল নিডেল কোয়ালিটি সুইং ডিজাইন যাতে আরাম অনুভব হয় এবং সুইং লিকেজ না ঘটে।
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-150 p-6 rounded-2xl flex flex-col space-y-4">
                <div className="w-12 h-12 rounded-xl bg-cyan-500/10 text-cyan-600 flex items-center justify-center text-xl font-bold">
                  🌏
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-slate-900 font-sans">চায়না ইমপোর্টেড কোয়ালিটি ফ্যাব্রিকস</h4>
                  <p className="text-xs text-slate-650 font-sans leading-relaxed mt-1">
                    প্রিমিয়াম গেজমেন্ট স্টাইল চায়না ইমপোর্টেড সুতা যা ক্ষতিকর রং বিহীন এবং ধোয়ার পরও কালার বা ফিটিং নষ্ট হয় না।
                  </p>
                </div>
              </div>

            </div>

            <div className="mt-8 text-center text-xs font-sans opacity-85 max-w-xl mx-auto leading-relaxed border-t border-slate-150 pt-5">
              {specsData.body}
            </div>

          </div>
        </section>
      ) : null}

      {/* 4. IMAGE CAROUSEL SECTION (ক্যারাসল ইমেজ থাকবে ও তা চেঞ্জ এর অপশন থাকবে) */}
      {galleryData.visible_mobile || galleryData.visible_desktop ? (
        <section 
          className={`border-b border-slate-900 ${getVisibilityClass(galleryData.visible_mobile, galleryData.visible_desktop)} ${getPaddingClass(galleryData.padding_vertical)}`}
          style={{ backgroundColor: galleryData.bgColor, color: galleryData.textColor }}
        >
          <div className="container mx-auto px-4 max-w-5xl">
            <div className={`max-w-2xl mx-auto mb-10 flex flex-col ${getAlignClass(galleryData.textAlign)}`}>
              <span className="px-3 py-1 bg-cyan-550/10 text-cyan-600 bg-cyan-500/10 text-xs font-black rounded-full border border-cyan-500/20 inline-flex items-center gap-1 font-sans">
                📸 {galleryData.icon_text}
              </span>
              <h2 className={`font-black mt-3 font-sans text-center ${getFontSizeClass(galleryData.fontSize, "text-2xl sm:text-3xl")}`} style={{ color: galleryData.textColor }}>
                {galleryData.title_1}
              </h2>
              <p className="text-xs sm:text-sm mt-2 text-center opacity-85 font-sans leading-relaxed">
                {galleryData.title_2}
              </p>
            </div>

            {/* CAROUSEL FLOW BLOCK */}
            <div className="relative max-w-3xl mx-auto bg-slate-900/30 p-4 border border-slate-200/50 rounded-3xl shadow-xl flex flex-col">
              
              <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden bg-slate-950 flex items-center justify-center">
                
                {/* Active Image with transition */}
                <img 
                  src={(galleryData.gallery_images || [])[carouselIndex] || 'https://images.unsplash.com/photo-1582966772680-860e372bb558?auto=format&fit=crop&q=80&w=600'} 
                  alt={`Boxer slide view ${carouselIndex + 1}`}
                  className="max-h-full max-w-full object-contain rounded-xl select-none"
                  referrerPolicy="no-referrer"
                />

                {/* Left navigation arrow button */}
                <button
                  type="button"
                  onClick={prevCarousel}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-slate-950/80 hover:bg-cyan-600 border border-slate-800 hover:border-cyan-500 text-white hover:text-slate-950 rounded-full flex items-center justify-center pointer-events-auto transition active:scale-95 cursor-pointer z-10"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>

                {/* Right navigation arrow button */}
                <button
                  type="button"
                  onClick={nextCarousel}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-slate-950/80 hover:bg-cyan-600 border border-slate-800 hover:border-cyan-500 text-white hover:text-slate-950 rounded-full flex items-center justify-center pointer-events-auto transition active:scale-95 cursor-pointer z-10"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>

                {/* Slide indicator pill */}
                <div className="absolute bottom-4 right-4 bg-slate-950/80 backdrop-blur-md px-3 py-1 text-[10px] text-cyan-400 rounded-full border border-slate-800 font-bold select-none font-sans">
                  ফটো স্লাইড: {carouselIndex + 1} / {(galleryData.gallery_images || []).length}
                </div>
              </div>

              {/* Dot Indicators */}
              <div className="flex justify-center items-center gap-1.5 mt-4">
                {(galleryData.gallery_images || []).map((_: any, idx: number) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCarouselIndex(idx)}
                    className={`h-2.5 rounded-full transition-all cursor-pointer ${
                      carouselIndex === idx ? 'w-8 bg-cyan-500' : 'w-2.5 bg-slate-400 hover:bg-slate-200'
                    }`}
                  />
                ))}
              </div>

              {/* Thumbnails grid shortcut */}
              <div className="grid grid-cols-6 gap-2 mt-4">
                {(galleryData.gallery_images || []).slice(0, 6).map((imgUrl: string, idx: number) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCarouselIndex(idx)}
                    className={`aspect-square rounded-lg overflow-hidden border p-0.5 transition cursor-pointer bg-slate-950 ${
                      carouselIndex === idx ? 'border-cyan-500 ring-2 ring-cyan-500/20' : 'border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <img src={imgUrl} className="w-full h-full object-cover rounded" referrerPolicy="no-referrer" />
                  </button>
                ))}
              </div>

            </div>

            <p className="text-center text-xs mt-6 opacity-75 font-sans">
              {galleryData.body}
            </p>

          </div>
        </section>
      ) : null}

      {/* 5. VIDEOS DEMO EMBED SECTION (১ টা ভিডিও তাকবে লিংক সেভ করলে জেনো তা ল্যান্ডিং পেইজে দেখায়।) */}
      {videoData.visible_mobile || videoData.visible_desktop ? (
        <section 
          className={`border-b border-slate-900 ${getVisibilityClass(videoData.visible_mobile, videoData.visible_desktop)} ${getPaddingClass(videoData.padding_vertical)}`}
          style={{ backgroundColor: videoData.bgColor, color: videoData.textColor }}
        >
          <div className="container mx-auto px-4 max-w-5xl">
            <div className={`max-w-2xl mx-auto mb-10 flex flex-col ${getAlignClass(videoData.textAlign)}`}>
              <span className="px-3 py-1 bg-red-500/10 text-red-500 text-xs font-black rounded-full border border-red-500/20 inline-flex items-center gap-1 font-sans">
                <Volume2 className="h-3 w-3 animate-ping text-red-400" /> {videoData.icon_text}
              </span>
              <h2 className={`font-black mt-3 font-sans text-center ${getFontSizeClass(videoData.fontSize, "text-2xl sm:text-3xl")}`} style={{ color: videoData.textColor }}>
                {videoData.title_1}
              </h2>
              <p className="text-xs sm:text-sm mt-2 text-center opacity-85 font-sans leading-relaxed">
                {videoData.title_2}
              </p>
            </div>

            {/* Embedded single Video link */}
            <div className="max-w-3xl mx-auto bg-slate-900/40 p-4 border border-slate-800 rounded-3xl shadow-2xl relative">
              <div className="relative w-full aspect-video bg-black border border-slate-800 rounded-2xl overflow-hidden">
                <iframe 
                  src={parseVideoEmbed(videoData.video_url)}
                  width="100%" 
                  height="100%" 
                  style={{ border: 'none', overflow: 'hidden' }} 
                  frameBorder="0" 
                  allowFullScreen={true}
                  allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                  title="Boys Boxer briefs features and fabrication test video review"
                  className="absolute inset-0"
                />
              </div>
            </div>

            <p className="text-center text-xs mt-6 opacity-75 font-sans">
              {videoData.body}
            </p>

          </div>
        </section>
      ) : null}

      {/* 6. SIZING CHART DISPLAY */}
      <section className="py-10 sm:py-16 bg-slate-900 border-b border-slate-950">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="px-3 py-1 bg-cyan-500/10 text-cyan-400 text-xs font-black rounded-full border border-cyan-500/20 font-sans">
              📏 সাইজ গাইডলাইন
            </span>
            <h2 className="text-2xl font-black mt-3 font-sans">আপনার সঠিক বক্সার সাইজ নির্বাচন করুন</h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-sans mt-1.5">উচ্চ স্থিতিস্থাপক ইলাস্টিক ফিনিশিং সমৃদ্ধ, কোমর ইনঞ্চ অনুযায়ী নিচের সাইজ চার্টটি দেখে সঠিক সাইজ সিলেক্ট করুন।</p>
          </div>

          <div className="bg-slate-950 p-4.5 sm:p-6 rounded-3xl border border-slate-850 shadow-xl overflow-x-auto">
            <table className="w-full text-left border-collapse font-sans text-xs min-w-[500px]">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase font-black tracking-wider bg-slate-900/40">
                  <th className="py-3 px-4">সাইজ কোড (Size Code)</th>
                  <th className="py-3 px-4 text-center">কোমর সাইজ (Waist Range)</th>
                  <th className="py-3 px-4 text-center">উপযোগী ইলাস্টিক স্ট্রেচ</th>
                  <th className="py-3 px-4 text-right">স্টক স্ট্যাটাস</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850 font-bold">
                {sizes.map((sz) => (
                  <tr 
                    key={sz.label} 
                    onClick={() => setSelectedSize(sz.label as any)}
                    className={`hover:bg-slate-900/35 transition cursor-pointer ${
                      selectedSize === sz.label ? 'bg-cyan-500/5 text-cyan-400' : ''
                    }`}
                  >
                    <td className="py-3 px-4 font-black flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${selectedSize === sz.label ? 'bg-cyan-500 animate-pulse' : 'bg-slate-700'}`}></span>
                      {sz.label}
                    </td>
                    <td className="py-3 px-4 text-center text-slate-200">
                      {sz.info} ইঞ্চি (Inch)
                    </td>
                    <td className="py-3 px-4 text-center text-slate-400">
                      হাই স্থিতিস্থাপক (Flexible Stretch)
                    </td>
                    <td className="py-3 px-4 text-right text-emerald-400">
                      স্টক এভেলেবেল (In Stock)
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 7. ORDER CHECKOUT FORM */}
      {checkoutData.visible_mobile || checkoutData.visible_desktop ? (
        <section 
          className={`border-b border-slate-900 ${getVisibilityClass(checkoutData.visible_mobile, checkoutData.visible_desktop)} ${getPaddingClass(checkoutData.padding_vertical)}`}
          style={{ backgroundColor: checkoutData.bgColor, color: checkoutData.textColor }}
          id="boxer-checkout-form"
        >
          <div className="container mx-auto px-4 max-w-4xl">
            <div className={`max-w-2xl mx-auto mb-10 flex flex-col ${getAlignClass(checkoutData.textAlign)}`}>
              <span className="px-3 py-1 bg-cyan-500/10 text-cyan-600 text-xs font-black rounded-full border border-cyan-500/20 inline-flex items-center gap-1 font-sans">
                ✍️ {checkoutData.icon_text}
              </span>
              <h2 className={`font-black mt-3 font-sans text-center ${getFontSizeClass(checkoutData.fontSize, "text-2xl sm:text-3xl")}`} style={{ color: checkoutData.textColor }}>
                {checkoutData.title_1}
              </h2>
              <p className="text-xs sm:text-sm mt-2 text-center opacity-85 font-sans leading-relaxed">
                {checkoutData.title_2}
              </p>
            </div>

            {/* Error alerts popup if form fails validation */}
            {errorMessage && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-2xl text-xs font-bold font-sans mb-6 text-center animate-shake leading-relaxed select-none">
                ⚠️ {errorMessage}
              </div>
            )}

            {/* Checkout main panel form */}
            <div className="bg-slate-900 border border-slate-800 p-5 sm:p-8 rounded-3xl shadow-2xl relative overflow-hidden grid grid-cols-1 md:grid-cols-12 gap-8 items-stretch">
              
              <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-cyan-500 via-sky-400 to-indigo-600"></div>

              {/* Form entries on left */}
              <form onSubmit={handleOrderSubmit} className="md:col-span-7 space-y-5 flex flex-col justify-start">
                
                {/* 1. Full delivery Customer Name */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-300 font-sans">
                    ১. আপনার সম্পূর্ণ নাম (কাস্টমারের নাম) <span className="text-rose-500 font-mono">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 pointer-events-none text-sm">
                      <User className="h-4 w-4" />
                    </span>
                    <input 
                      type="text" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="আপনার নাম লিখুন..."
                      className="w-full text-xs pl-10.5 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-500/20 transition leading-snug"
                    />
                  </div>
                </div>

                {/* 2. Customer Phone contact */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-300 font-sans">
                    ২. সচল মোবাইল নম্বর (১১ ডিজিট) <span className="text-rose-500 font-mono">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 pointer-events-none text-sm">
                      <Smartphone className="h-4 w-4" />
                    </span>
                    <input 
                      type="tel" 
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="যেমন: 01XXXXXXXXX"
                      className="w-full text-xs pl-10.5 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-500/20 transition leading-snug"
                    />
                  </div>
                </div>

                {/* 3. Delivery address */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-300 font-sans">
                    ৩. আপনার সম্পূর্ণ ঠিকানা (গ্রাম/পাড়া/থানা/জেলা) <span className="text-rose-500 font-mono">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute top-3 left-3.5 text-slate-500 pointer-events-none text-sm">
                      <MapPin className="h-4 w-4" />
                    </span>
                    <textarea 
                      rows={3}
                      value={village}
                      onChange={(e) => setVillage(e.target.value)}
                      placeholder="যেমন: গ্রাম, ডাকঘর, থানা ও জেলা সুন্দর করে লিখুন..."
                      className="w-full text-xs pl-10.5 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-500/20 transition leading-snug resize-none"
                    />
                  </div>
                </div>

                {/* 4. Package/Set Selection */}
                <div className="space-y-2 pt-1">
                  <span className="block text-xs font-bold text-slate-300 font-sans">
                    ৪. পছন্দসই সেট কম্বো ডিল নির্বাচন করুন <span className="text-rose-500 font-mono">*</span>
                  </span>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedSet('1set')}
                      className={`p-3.5 rounded-xl border text-center font-bold tracking-tight transition cursor-pointer ${
                        selectedSet === '1set' 
                          ? 'bg-cyan-500 border-cyan-500 text-slate-950 shadow-md shadow-cyan-400/10' 
                          : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-200'
                      }`}
                    >
                      <span className="block text-xs font-black">১ সেট (৩ পিস)</span>
                      <span className="block text-[9px] opacity-90 mt-1 font-bold">বাজার মূল্য: ৳১০৫০/-</span>
                      <span className="block text-sm font-black italic mt-0.5 font-mono">৳৫৫০/- (ফ্রী ডেলিভারি)</span>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setSelectedSet('2sets')}
                      className={`p-3.5 rounded-xl border text-center font-bold tracking-tight transition cursor-pointer ${
                        selectedSet === '2sets' 
                          ? 'bg-cyan-500 border-cyan-500 text-slate-950 shadow-md shadow-cyan-400/10' 
                          : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-200'
                      }`}
                    >
                      <span className="block text-xs font-black">২ সেট (৬ পিস)</span>
                      <span className="block text-[9px] opacity-90 mt-1 font-bold">বাজার মূল্য: ৳২১০০/-</span>
                      <span className="block text-sm font-black italic mt-0.5 font-mono">৳৯৫০/- (ফ্রী ডেলিভারি)</span>
                    </button>
                  </div>
                </div>

                {/* 5. Size Selection buttons (Waist Range labeled correctly) */}
                <div className="space-y-2">
                  <span className="block text-xs font-bold text-slate-300 font-sans">
                    ৫. আপনার সাইজ কোড নির্বাচন করুন (কোমর ইঞ্চি অনুযায়ী) <span className="text-rose-500 font-mono">*</span>
                  </span>
                  <div className="grid grid-cols-6 gap-1.5ClassName">
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 w-full">
                      {sizes.map((sz) => (
                        <button
                          key={sz.label}
                          type="button"
                          onClick={() => setSelectedSize(sz.label as any)}
                          className={`py-3.5 rounded-xl border text-center font-black transition cursor-pointer ${
                            selectedSize === sz.label 
                              ? 'bg-cyan-500 border-cyan-500 text-slate-950 font-sans shadow-md scale-102' 
                              : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-300 font-sans'
                          }`}
                        >
                          <span className="block text-xs">{sz.label}</span>
                          <span className="block text-[8px] font-bold opacity-80 mt-0.5">({sz.info}")</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 6. Color selection bundles */}
                <div className="space-y-2 pt-1">
                  <span className="block text-xs font-bold text-slate-300 font-sans">
                    ৬. কালার কম্বিনেশন অপশন নির্বাচন করুন <span className="text-rose-500 font-mono">*</span>
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    
                    <button
                      type="button"
                      onClick={() => setSelectedColorOption('option1')}
                      className={`p-4 rounded-xl border text-left font-bold transition flex items-center justify-between gap-3 cursor-pointer ${
                        selectedColorOption === 'option1' 
                          ? 'bg-cyan-500/5 border-cyan-500 text-cyan-400' 
                          : 'bg-slate-950 border-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="space-y-1">
                        <span className="text-xs font-black block">১ম অপশন (কালো, সাদা, নেভি ব্লু)</span>
                        <span className="text-[9px] text-slate-400 block font-normal leading-tight">ভিন্ন ভিন্ন কালারের প্রিমিয়াম সলিড বক্সার ব্রিফস।</span>
                      </div>
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                        selectedColorOption === 'option1' ? 'border-cyan-400 bg-cyan-500 text-slate-950' : 'border-slate-800 bg-slate-900'
                      }`}>
                        {selectedColorOption === 'option1' && <Check className="h-3.5 w-3.5 font-bold" />}
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedColorOption('option2')}
                      className={`p-4 rounded-xl border text-left font-bold transition flex items-center justify-between gap-3 cursor-pointer ${
                        selectedColorOption === 'option2' 
                          ? 'bg-cyan-500/5 border-cyan-500 text-cyan-400' 
                          : 'bg-slate-950 border-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="space-y-1">
                        <span className="text-xs font-black block">২য় অপশন (কালো, এস, নেভি ব্লু)</span>
                        <span className="text-[9px] text-slate-400 block font-normal leading-tight">ভিন্ন কালারের স্টাইলিশ অ্যাস ব্রিফসসহ ফিটিং ব্রিফস।</span>
                      </div>
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                        selectedColorOption === 'option2' ? 'border-cyan-400 bg-cyan-500 text-slate-950' : 'border-slate-800 bg-slate-900'
                      }`}>
                        {selectedColorOption === 'option2' && <Check className="h-3.5 w-3.5 font-bold" />}
                      </div>
                    </button>

                  </div>
                </div>

                {/* Order submission layout with animated Submit button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full py-4 bg-amber-400 hover:bg-amber-500 active:scale-99 text-slate-950 font-black text-sm rounded-xl tracking-wide shadow-xl shadow-amber-400/10 hover:shadow-amber-400/15 duration-300 transition flex items-center justify-center gap-2 cursor-pointer ${
                    isSubmitting ? 'opacity-85 cursor-not-allowed' : ''
                  }`}
                >
                  {isSubmitting ? (
                    <span className="inline-block h-4.5 w-4.5 animate-spin rounded-full border-2 border-slate-950 border-t-transparent"></span>
                  ) : (
                    <ShoppingBag className="h-4.5 w-4.5" />
                  )}
                  অর্ডারটি সম্পূর্ণ নিশ্চিত করুন করুন (৳{currentPrice} টাকা)
                </button>

              </form>

              {/* Right Sidebar Checklist on checkout info */}
              <div className="md:col-span-5 bg-slate-950/65 p-4.5 rounded-2xl border border-slate-850 flex flex-col justify-between space-y-6">
                
                <div className="space-y-4">
                  <h4 className="text-xs font-extrabold text-cyan-400 tracking-wider uppercase font-sans">📌 অর্ডার প্রক্রিয়াকরণ গাইডলাইন</h4>
                  
                  <div className="space-y-3.5 text-xs font-medium font-sans text-slate-300">
                    <div className="flex gap-2.5 items-start">
                      <span className="text-cyan-400 text-xs mt-0.5">১.</span>
                      <p className="leading-relaxed">চেকআউট ফর্মের তথ্য সঠিকভাবে পূরণ করে সাবমিট বাটনে চাপ দিন। অগ্রিম কোনো টাকা দিতে হবে না।</p>
                    </div>
                    <div className="flex gap-2.5 items-start">
                      <span className="text-cyan-400 text-xs mt-0.5">২.</span>
                      <p className="leading-relaxed">অর্ডার সফলভাবে পাওয়ার পর ৪ ঘণ্টার মধ্যেই আমাদের কোয়ালিটি কনফার্মেশন টিম থেকে কল দেওয়া হবে।</p>
                    </div>
                    <div className="flex gap-2.5 items-start">
                      <span className="text-cyan-400 text-xs mt-0.5">৩.</span>
                      <p className="leading-relaxed">সরাসরি ক্যাশ অন ডেলিভারিতে পণ্য ডেলিভারি করা হবে। আপনি পণ্য পেয়ে চেক করে পছন্দ হলে তবেই পেমেন্ট করবেন।</p>
                    </div>
                  </div>
                </div>

                {/* Set/Price detailed calculation description */}
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-2">
                  <div className="flex justify-between text-xs font-bold text-slate-400">
                    <span>আইটেম পরিমাণ:</span>
                    <span className="text-cyan-400 font-mono">{selectedSet === '1set' ? '১ সেট (৩ পিস)' : '২ সেট (৬ পিস)'}</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold text-slate-400">
                    <span>ডেলিভারি চার্জ:</span>
                    <span className="text-emerald-400">ফ্রী (৳০/-)</span>
                  </div>
                  <div className="border-t border-slate-850 my-2 pt-2 flex justify-between text-sm font-black text-white">
                    <span>সর্বমোট টাকা:</span>
                    <span className="text-amber-400 font-mono">৳{currentPrice}/- BDT</span>
                  </div>
                </div>

                {/* Phone Customer Service hot line button */}
                <a 
                  href="tel:+8801624933949" 
                  className="w-full py-2.5 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl flex items-center justify-center gap-2 text-[11px] font-bold text-slate-300 font-sans"
                >
                  <Phone className="h-3.5 w-3.5 text-cyan-400" /> ডিরেক্ট কল করুন: +8801624933949
                </a>

              </div>

            </div>

          </div>
        </section>
      ) : null}

      {/* 8. Success order presentation layout */}
      <AnimatePresence>
        {submittedOrder && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/90 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-slate-905 bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-2xl max-w-md w-full relative overflow-hidden text-center space-y-5"
            >
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 to-cyan-500"></div>
              
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto text-3xl">
                ✓
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-black text-emerald-400 font-sans">অভিনন্দন! আপনার অর্ডারটি নিশ্চিত হয়েছে</h3>
                <p className="text-xs text-slate-300 font-bold font-sans">খুব শীঘ্রই আমাদের কনফার্মেশন কোয়ালিটি প্যানেল থেকে আপনার মোবাইলে কল দেওয়া হবে।</p>
                <p className="text-[10px] text-slate-400 font-mono">অর্ডার আইডি: {submittedOrder.id}</p>
              </div>

              {/* Summary table */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-850/80 text-left text-xs font-bold font-sans text-slate-350 space-y-2 max-w-xs mx-auto">
                <div className="flex justify-between">
                  <span>নাম:</span>
                  <span className="text-white font-normal">{submittedOrder.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>মোবাইল:</span>
                  <span className="text-white font-normal">{submittedOrder.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span>প্যাকেজ ডিল:</span>
                  <span className="text-white font-normal">{selectedSet === '1set' ? '১ সেট (৩ পিস)' : '২ সেট (৬ পিস)'}</span>
                </div>
                <div className="flex justify-between">
                  <span>সাইজ:</span>
                  <span className="text-white font-normal">{selectedSize} ({sizes.find(s => s.label === selectedSize)?.info}")</span>
                </div>
                <div className="flex justify-between">
                  <span>কালার কম্বিনেশন:</span>
                  <span className="text-white font-normal">{selectedColorOption === 'option1' ? '১ম অপশন' : '২য় অপশন'}</span>
                </div>
                <div className="border-t border-slate-850.my-1.5 pt-1.5 flex justify-between text-emerald-400 font-black">
                  <span>মোট বিল (ডেলিভারি ফ্রী):</span>
                  <span>৳{submittedOrder.price}/- BDT</span>
                </div>
              </div>

              <button
                onClick={() => setSubmittedOrder(null)}
                className="px-6 py-2.5 bg-cyan-500 hover:bg-cyan-600 active:scale-97 text-slate-950 font-black text-xs rounded-xl transition duration-200 cursor-pointer w-full font-sans"
              >
                পড়া শেষ, ধন্যবাদ
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 9. Footing brand note */}
      <footer className="py-8 bg-slate-950 border-t border-slate-900 text-center font-sans">
        <p className="text-[10px] text-slate-500 font-bold">&copy; {new Date().getFullYear()} Mens Fashion Hub Bangladesh. All rights reserved.</p>
        <p className="text-[9px] text-slate-600 mt-1">৯৫% প্রিমিয়াম স্পেকট্রাল কটন ও ৫% ফাইবার ইলাস্টিক লাইফস্টাইল কম্বো।</p>
      </footer>

    </div>
  );
}
