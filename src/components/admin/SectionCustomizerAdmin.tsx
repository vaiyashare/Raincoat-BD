import React, { useState, useEffect, useMemo } from 'react';
import { 
  Palette, 
  Type, 
  Image as ImageIcon, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  Globe, 
  Save, 
  Check, 
  RefreshCw, 
  Tv, 
  Package, 
  Sparkles, 
  Truck, 
  Settings,
  HelpCircle,
  Eye,
  Tablet,
  Smartphone,
  CheckCircle2,
  Sliders,
  ChevronDown,
  Info
} from 'lucide-react';
import { 
  getAdvancedAddonsSettingsFromFirestore, 
  saveAdvancedAddonsSettingsToFirestore 
} from '../../lib/firebase';
import { AdvancedAddonsSettings } from '../../types';

// Types for Section Styling & Content configuration
export interface SectionCustomization {
  bgColor: string;
  textColor: string;
  textAlign: 'left' | 'center' | 'right';
  fontSize: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'default';
  image_url: string;
  icon_text: string;
  title_1: string;
  title_2: string;
  body: string;
  video_url?: string;
  visible_mobile: boolean;
  visible_desktop: boolean;
  padding_vertical?: 'compact' | 'normal' | 'generous';
}

interface SectionCustomizerAdminProps {
  userRole?: string;
}

export default function SectionCustomizerAdmin({ userRole }: SectionCustomizerAdminProps) {
  const [settings, setSettings] = useState<AdvancedAddonsSettings | null>(null);
  const [activePage, setActivePage] = useState<'raincoat' | 'bikecover' | 'global'>('raincoat');
  const [activeSection, setActiveSection] = useState<string>('raincoat_hero');
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Default Fallback values for all page sections
  const defaultSections: Record<string, SectionCustomization> = {
    // 1. Raincoat Sections
    raincoat_hero: {
      bgColor: '#0f172a', // deep slate
      textColor: '#ffffff',
      textAlign: 'left',
      fontSize: 'default',
      image_url: '', // Empty means use interactive ProductCarousel
      icon_text: '১০০% প্রিমিয়াম ওয়াটারপ্রুফ গিয়ার',
      title_1: 'ঝুম বৃষ্টি কিংবা ঝড়ো হাওয়া—',
      title_2: 'বাইরে বের হতে আর কোনো ভয় নেই!',
      body: 'আমরা নিয়ে এলাম সম্পূর্ণ থার্মাল হিট সিল প্রযুক্তির প্রিমিয়াম কোয়ালিটির রেইনকোট জ্যাকেট ও প্যান্টের এক দুর্দান্ত কম্বো! কোনো বাইরের সেলাই নেই, ফলে এক ফোটা পানিও কাপড়ে ঢোকার সুযোগ নেই।',
      visible_mobile: true,
      visible_desktop: true,
      padding_vertical: 'normal'
    },
    raincoat_live_video: {
      bgColor: '#ffffff',
      textColor: '#1e293b',
      textAlign: 'center',
      fontSize: 'default',
      image_url: '',
      icon_text: 'হান্ড্রেড পার্সেন্ট রিয়েল লাইভ টেস্ট',
      title_1: 'আমাদের রেইনকোটের লাইভ ওয়াটারপ্রুফ টেস্ট ভিডিও!',
      title_2: '',
      body: 'কোনো গিমিক বা এডিট ছাড়াই শতভাগ বাস্তব উপায়ে রেইনকোটটির গুণগত মান ও ফিনিশিং এই ছোট রিভিও ক্লিপে তুলে ধরা হয়েছে।',
      video_url: '',
      visible_mobile: true,
      visible_desktop: true,
      padding_vertical: 'normal'
    },
    raincoat_features: {
      bgColor: '#f8fafc', // slate-50
      textColor: '#0f172a',
      textAlign: 'center',
      fontSize: 'default',
      image_url: '',
      icon_text: 'ফিচারস হাইলাইটস (Product Features)',
      title_1: 'কেন আমাদের অল-সিজন রেইনকোটটি সেরা?',
      title_2: 'যেকোনো বাইকার এবং পথচারীদের জন্য শতভাগ নিরাপদ বৃষ্টির সুরক্ষাকবচ।',
      body: 'আমাদের রেইনকোটে ব্যবহৃত প্রতিটি পার্ট অত্যন্ত নিখুঁত ও মজবুত কাঁচামাল দিয়ে তৈরি। দীর্ঘ ৩ সিজন অনায়াসে এটি আপনার সাথী হবে।',
      visible_mobile: true,
      visible_desktop: true,
      padding_vertical: 'normal'
    },
    raincoat_comparison: {
      bgColor: '#ffffff',
      textColor: '#1e293b',
      textAlign: 'center',
      fontSize: 'default',
      image_url: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=600', // Default comparison representation
      icon_text: 'তুলনামূলক পার্থক্য (Raincoat Difference)',
      title_1: 'বাজারের সাধারণ রেইনকোট বনাম আমাদের প্রিমিয়াম রেইনকোট',
      title_2: 'একবার প্রিমিয়াম ফিটিংস ব্যবহারের স্বাদ নিন, সাধারণ প্লাস্টিকের অস্বস্তি থেকে মুক্তি পান।',
      body: 'বাজারে কমদামী রেইনকোটে সেলাইয়ের ছিদ্র দিয়ে কড়া বর্ষায় পানি চুয়ে আপনার ভেতরের মোবাইল-মানিব্যাগ ভিজিয়ে দেয়, অন্যদিকে আমাদের থার্মাল-সিল শতভাগ অভেদ্য।',
      visible_mobile: true,
      visible_desktop: true,
      padding_vertical: 'normal'
    },
    raincoat_bundle: {
      bgColor: '#090d16', // extra dark
      textColor: '#ffffff',
      textAlign: 'center',
      fontSize: 'default',
      image_url: '',
      icon_text: 'বিশেষ বর্ষাকালীন অফার (Special Bundle Price)',
      title_1: 'সীমাবদ্ধ সময়ের বিশেষ বান্ডেল ধামাকা অফার!',
      title_2: 'ডাবল কোটেড ফ্যাব্রিকেশনের রেইনকোট জ্যাকেট + প্যান্ট + প্রিমিয়াম ড্যাফোডিল পকেট ব্যাগ!',
      body: 'আজই বুক করুন অবিশ্বাস্য কম্বো অফারে। আমরা কোনো অগ্রিম ডেলিভারি চার্জ ছাড়া সারা বাংলাদেশে হোম ডেলিভারি দিচ্ছি। পণ্য হাতে পেয়ে দেখে তারপর পরিশোধ করুন।',
      visible_mobile: true,
      visible_desktop: true,
      padding_vertical: 'generous'
    },

    // 2. Bike Cover Sections
    bikecover_hero: {
      bgColor: '#090d16',
      textColor: '#ffffff',
      textAlign: 'center',
      fontSize: 'default',
      image_url: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&q=80&w=1200', 
      icon_text: 'প্রিমিয়াম বাইক কভার ও ডাস্টপ্রুফ জ্যাকেট',
      title_1: 'বাইকের সুরক্ষায়— প্রিমিয়াম সিলভার কোটেড',
      title_2: 'প্যারাশুট ওয়াটারপ্রুফ বাইক কভার!',
      body: 'রোদের তীব্র তাপ থেকে রঙের ফিকে হয়ে যাওয়া, বৃষ্টির কাদা পানি, ধূলিকণা কার্বন এবং স্ক্র্যাচ থেকে আপনার শখের বাইকটিকে সম্পূর্ণ আগলে রাখুন অফুরন্ত বছর।',
      visible_mobile: true,
      visible_desktop: true,
      padding_vertical: 'normal'
    },
    bikecover_features: {
      bgColor: '#0f172a',
      textColor: '#ffffff',
      textAlign: 'left',
      fontSize: 'default',
      image_url: '',
      icon_text: 'ম্যাক্সিমাম পারফরম্যান্স (Specifications)',
      title_1: 'চাকা টু চাকা কভারেজ ও বাধার ড্রস্ট্রিংস',
      title_2: '৯৮ ইঞ্চি সাইজের ইউনিভার্সাল ফিটিংস ফর অল মোটরসাইকেলস!',
      body: 'আমাদের বাইক কভারটিতে রয়েছে উইন্ডপ্রুফ স্ট্র্যাপ, ইলাস্টিক জ্যাকিং এবং চাকার সাথে লক করার বিশেষ গর্ত। তীব্র ঝড়েও এটি উড়ে যাবে না।',
      visible_mobile: true,
      visible_desktop: true,
      padding_vertical: 'normal'
    },

    // 3. Shop & Product Page Details
    shop_catalog: {
      bgColor: '#ffffff',
      textColor: '#1e293b',
      textAlign: 'center',
      fontSize: 'default',
      image_url: '',
      icon_text: 'লাইভ প্রোডাক্ট স্টোর (Shop Catalogs)',
      title_1: 'আমাদের রানিং সেরা কালেকশনস',
      title_2: 'নিজের পছন্দের প্রিমিয়াম সাইজ ও পছন্দসই আকর্ষণীয় কালারটি নির্বাচন করুন',
      body: 'অফলাইন ও অনলাইনে হাজারো বাইকারদের প্রথম পছন্দ আমাদের এই অল-সিজন রিলিজ। অত্যন্ত দ্রুতগতিতে স্টকের সমাপ্তি ঘটছে!',
      visible_mobile: true,
      visible_desktop: true,
      padding_vertical: 'normal'
    }
  };

  const defaultTripleCards = useMemo(() => [
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
  ], []);

  // Safe fetch of settings from Firebase on mount
  useEffect(() => {
    async function loadData() {
      try {
        const saved = await getAdvancedAddonsSettingsFromFirestore();
        if (saved) {
          if (!saved.bike_triple_cards || saved.bike_triple_cards.length !== 3) {
            saved.bike_triple_cards = defaultTripleCards;
          }
          setSettings(saved);
        } else {
          // Put local fallback structure
          const fallbackSettings: any = {
            section_customizations: defaultSections,
            bike_triple_cards: defaultTripleCards
          };
          setSettings(fallbackSettings);
        }
      } catch (err) {
        console.error("Error loading settings in Customizer", err);
      }
    }
    loadData();
  }, [defaultTripleCards]);

  // Update section customizer values helper
  const handleUpdateValue = (sectionKey: string, field: keyof SectionCustomization, value: any) => {
    if (!settings) return;

    const currentCustomizations = settings.section_customizations || {};
    const baseSection = currentCustomizations[sectionKey] || defaultSections[sectionKey] || {};

    const updatedSection = {
      ...baseSection,
      [field]: value
    };

    const updatedSettings = {
      ...settings,
      section_customizations: {
        ...currentCustomizations,
        [sectionKey]: updatedSection
      }
    };

    setSettings(updatedSettings);
  };

  // Update custom triple cards value helper
  const handleUpdateCardValue = (index: number, key: 'title' | 'imageUrl' | 'description', value: string) => {
    if (!settings) return;
    const cards = [...(settings.bike_triple_cards || defaultTripleCards)];
    cards[index] = { ...cards[index], [key]: value };
    setSettings({
      ...settings,
      bike_triple_cards: cards
    });
  };

  // Upload/Compress card image in browser
  const handleCardImageUpload = (index: number, file: File) => {
    const validExtensions = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validExtensions.includes(file.type)) {
      alert('শুধুমাত্র JPG, PNG অথবা WEBP ইমেজ আপলোড করা যাবে!');
      return;
    }
    if (file.size > 1.2 * 1024 * 1024) {
      alert('ইমেজের সাইজ অতিরিক্ত বড় (১.২ মেগাবাইটের নীচে ইমেজ ট্রাই করুন)!');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        const base64 = event.target.result as string;
        handleUpdateCardValue(index, 'imageUrl', base64);
      }
    };
    reader.readAsDataURL(file);
  };

  // Upload/Compress general section image in browser
  const handleSectionImageUpload = (sectionKey: string, file: File) => {
    const validExtensions = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validExtensions.includes(file.type)) {
      alert('শুধুমাত্র JPG, PNG অথবা WEBP ইমেজ আপলোড করা যাবে!');
      return;
    }
    if (file.size > 1.2 * 1024 * 1024) {
      alert('ইমেজের সাইজ অতিরিক্ত বড় (১.২ মেগাবাইটের নীচে ইমেজ ট্রাই করুন)!');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        const base64 = event.target.result as string;
        handleUpdateValue(sectionKey, 'image_url', base64);
      }
    };
    reader.readAsDataURL(file);
  };

  // Commit changes to cloud Firestore seamlessly
  const handleSaveAll = async () => {
    if (!settings) return;
    setIsSaving(true);
    setSuccessMsg('');
    try {
      // Direct update of the full settings payload with the section properties
      await saveAdvancedAddonsSettingsToFirestore(settings);
      setSuccessMsg('ডিজাইন কাস্টমাইজেশন রিয়েল-টাইমে সেভ করা হয়েছে!');
      
      // Emit trigger event to tell all components (including the live layout iframe) to re-render in real-time
      window.dispatchEvent(new Event('raincoat_site_settings_updated'));
      
      setTimeout(() => setSuccessMsg(''), 4050);
    } catch (err) {
      alert('সরাসরি ফায়ারস্টোরে আপডেট করতে ত্রুটি ঘটেছে। পুনরায় চেষ্টা করুন।');
    } finally {
      setIsSaving(false);
    }
  };

  // Extract selected section's actual styling values with robust default fallbacks.
  const currentSectionData = useMemo(() => {
    if (!settings) return defaultSections[activeSection];
    const customizations = settings.section_customizations || {};
    return {
      ...(defaultSections[activeSection] || {}),
      ...(customizations[activeSection] || {})
    } as SectionCustomization;
  }, [settings, activeSection]);

  // Section selectors per landing page type
  const pageSections = {
    raincoat: [
      { id: 'raincoat_hero', name: '🧥 হিরো সেকশন (Hero Header)' },
      { id: 'raincoat_live_video', name: '🎥 লাইভ ভিডিও সেকশন' },
      { id: 'raincoat_features', name: '✨ প্রোডাক্ট ফিচার সমূহ' },
      { id: 'raincoat_comparison', name: '📊 তুলনা ও পার্থক্য কার্ড' },
      { id: 'raincoat_bundle', name: '🎁 প্যাকেজ অফার ব্যানার' },
      { id: 'shop_catalog', name: '🛒 শপ প্রোডাক্ট ক্যাটালগ' }
    ],
    bikecover: [
      { id: 'bikecover_hero', name: '🏍️ বাইк কভার হিরো ব্যানার' },
      { id: 'bikecover_features', name: '🚲 স্পেসিফিকেশন ও কভারেজ' },
      { id: 'bike_triple_cards', name: '🖼️ ৩-ইমেজ আকর্ষণীয় কার্ড সেকশন' }
    ],
    global: [
      { id: 'global_branding', name: '🌐 গ্লোবাল থিম পরিচিতি' }
    ]
  };

  const predefinedBgColors = [
    { hex: '#0f172a', name: 'Slate Slate (হিরো)' },
    { hex: '#ffffff', name: 'Pure White (পরিষ্কার)' },
    { hex: '#f8fafc', name: 'Slate Blue Ice' },
    { hex: '#090d16', name: 'Cosmic Pitch (গাঢ়)' },
    { hex: '#1e3a8a', name: 'Navy Ocean' },
    { hex: '#064e3b', name: 'Forest Emerald' },
    { hex: '#f1f5f9', name: 'Light Cloud Slates' },
    { hex: '#7f1d1d', name: 'Deep Crimson Red' }
  ];

  if (!settings) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-500 font-sans gap-2">
        <RefreshCw className="h-5 w-5 animate-spin text-indigo-600" />
        ভিজুয়াল ডিজাইন কন্ট্রোলসমূহ লোড হচ্ছে...
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans text-slate-700 text-xs sm:text-sm">
      
      {/* Title block */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-5">
        <div>
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <Palette className="h-5 w-5 text-indigo-600" />
            সেকশন ডিজাইন ও টেক্সট এলাইনমেন্ট কাস্টমাইজার
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            প্রতিটি সেকশনের ব্যাকগ্রাউন্ড রঙ, টেক্সট সাইজ, টেক্সট লাইনমেন্ট, ছবি লিংক, এবং শিরোনাম ক্যাশ অন ফ্লাই সরাসরি সম্পাদনা করুন।
          </p>
        </div>

        {/* Global Action buttons */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleSaveAll}
            disabled={isSaving || userRole === 'ReadOnly'}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold rounded-xl flex items-center gap-1.5 shadow-md shadow-emerald-600/10 transition cursor-pointer"
          >
            {isSaving ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                সেভ করা হচ্ছে...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                ডিজাইন পাবলিশ করুন
              </>
            )}
          </button>
        </div>
      </div>

      {/* Save Notify */}
      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-bold font-sans flex items-center gap-2 shadow-2xs relative overflow-hidden animate-slide-in">
          <span className="w-1.5 h-full bg-emerald-500 absolute left-0 top-0" />
          <Check className="h-4 w-4 text-emerald-600 shrink-0" />
          {successMsg}
        </div>
      )}

      {/* Core Customizer Panel */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden flex flex-col lg:flex-row min-h-[500px]">
        
        {/* Left Side: Navigation Map of Landing page sections */}
        <div className="w-full lg:w-72 bg-slate-50 border-r border-slate-100 p-4 space-y-4 shrink-0">
          
          {/* Target Page Selection tabs */}
          <div className="space-y-1">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block px-1">১. ল্যান্ডিং পেজ নির্বাচন</span>
            <div className="grid grid-cols-2 gap-1 bg-slate-200/60 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setActivePage('raincoat');
                  setActiveSection('raincoat_hero');
                }}
                className={`py-1.5 px-2 rounded-lg text-[11px] font-extrabold transition-all cursor-pointer ${
                  activePage === 'raincoat' ? 'bg-white text-slate-800 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                ☔ রেইনকোট পেজ
              </button>
              <button
                type="button"
                onClick={() => {
                  setActivePage('bikecover');
                  setActiveSection('bikecover_hero');
                }}
                className={`py-1.5 px-2 rounded-lg text-[11px] font-extrabold transition-all cursor-pointer ${
                  activePage === 'bikecover' ? 'bg-white text-slate-800 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                🏍️ বাইক কভার পেজ
              </button>
            </div>
          </div>

          {/* Sections map picker */}
          <div className="space-y-2.5 pt-2 border-t border-slate-200/60">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block px-1">২. কাস্টমাইজেবল সেকশন তালিকা</span>
            <div className="space-y-1">
              {pageSections[activePage].map((sec) => (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => setActiveSection(sec.id)}
                  className={`w-full text-left py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-between gap-2.5 shrink-0 ${
                    activeSection === sec.id
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-200/50 hover:text-slate-900 bg-white border border-slate-100'
                  }`}
                >
                  <span className="truncate">{sec.name}</span>
                  <Sliders className={`h-3 w-3 shrink-0 ${activeSection === sec.id ? 'text-white' : 'text-slate-400'}`} />
                </button>
              ))}
            </div>
          </div>

          <div className="p-3.5 bg-orange-50 border border-orange-100 rounded-2xl space-y-1.5">
            <h5 className="text-[10px] font-black text-orange-850 flex items-center gap-1">
              <Info className="h-3.5 w-3.5 shrink-0 text-orange-600" />
              ইনস্ট্যান্ট লাইভ প্রিভিউ সিঙ্ক
            </h5>
            <p className="text-[10px] text-orange-700 leading-normal">
              সেভ করুন বাটন ক্লিক দেয়ার সাথে সাথেই আপনার ব্রাউজারের মেইন পেজ এবং ল্যান্ডিং আইফ্রেম রিলোড ছাড়াই নতুন রঙ ও টেক্সট প্রদর্শন করবে।
            </p>
          </div>

        </div>

        {/* Right Side: Parameter Customize Form Fields */}
        <div className="flex-1 p-5 sm:p-6 space-y-6">
          
          {/* Header indicator and brief */}
          <div className="bg-slate-50 border border-slate-150 p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block font-sans">সিলেক্টেড সেকশন প্যারামিটারস</span>
              <h4 className="text-sm font-black text-indigo-900 mt-1 font-sans flex items-center gap-1.5">
                ✒️ {pageSections[activePage].find(s => s.id === activeSection)?.name || 'কাস্টম সেকশন'}
              </h4>
            </div>
            
            {/* Visibility Options */}
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 text-[11px] font-extrabold text-slate-600 cursor-pointer select-none">
                <Smartphone className="h-3.5 w-3.5 text-slate-400" />
                মোবাইলে দেখান:
                <input 
                  type="checkbox"
                  checked={currentSectionData.visible_mobile}
                  onChange={(e) => handleUpdateValue(activeSection, 'visible_mobile', e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 h-3.5 w-3.5"
                />
              </label>

              <label className="flex items-center gap-1.5 text-[11px] font-extrabold text-slate-600 cursor-pointer select-none">
                <Tablet className="h-3.5 w-3.5 text-slate-400" />
                ডেস্কটপে দেখান:
                <input 
                  type="checkbox"
                  checked={currentSectionData.visible_desktop}
                  onChange={(e) => handleUpdateValue(activeSection, 'visible_desktop', e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 h-3.5 w-3.5"
                />
              </label>
            </div>
          </div>

          {activeSection === 'bike_triple_cards' ? (
            <div className="space-y-6">
              <div className="bg-amber-50 border border-amber-200 p-4.5 rounded-2xl flex items-center gap-3">
                <span className="p-2.5 bg-amber-100 text-amber-700 rounded-xl text-lg font-bold">🖼️</span>
                <div className="text-xs">
                  <strong className="text-amber-850 font-extrabold block">৩-ইমেজ অল্টারনেティブ কার্ড সেকশন (Highlights Manager)</strong>
                  <p className="text-amber-700 mt-0.5 leading-normal">
                    এখানে আপনি বাইক কভার ল্যান্ডিং পেজের কার্ডগুলোর ছবি, শিরোনাম এবং সংক্ষিপ্ত বিবরণ কাস্টমাইজ করতে পারেন। সরাসরি ছবি আপলোড করতে পারেন অথবা যেকোনো অনলাইন হোস্ট করা ইমেজ লিঙ্কও ব্যবহার করতে পারেন।
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[0, 1, 2].map((idx) => {
                  const cardsArray = settings.bike_triple_cards || defaultTripleCards;
                  const card = cardsArray[idx] || { title: '', imageUrl: '', description: '' };
                  return (
                    <div key={idx} className="bg-slate-50 border border-slate-200 rounded-2xl p-4.5 space-y-4">
                      <div className="flex items-center justify-between border-b pb-2">
                        <span className="font-bold text-slate-800 text-xs">কার্ড নম্বর {idx + 1} (Card {idx + 1})</span>
                        <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-bold">অ্যাক্টিভ</span>
                      </div>

                      {/* Image Preview / Selection Box */}
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-700">ছবি (Image View)</label>
                        <div className="w-full h-32 bg-slate-200 rounded-xl overflow-hidden relative flex items-center justify-center border border-dashed border-slate-300">
                          {card.imageUrl ? (
                            <img 
                              src={card.imageUrl} 
                              alt={`Preview ${idx + 1}`} 
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <span className="text-[10px] text-slate-400 font-bold">কোনো ছবি সিলেক্ট করা নেই</span>
                          )}
                        </div>

                        {/* File Upload Selector */}
                        <div className="pt-1 select-none">
                          <label className="block cursor-pointer bg-white border border-slate-300 hover:border-slate-400 active:scale-98 text-slate-700 text-[11px] font-bold py-2 text-center rounded-xl shadow-2xs transition">
                            📤 ছবি আপলোড করুন
                            <input 
                              type="file" 
                              accept="image/*"
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) handleCardImageUpload(idx, f);
                              }}
                              className="hidden" 
                            />
                          </label>
                        </div>

                        {/* Image URL text field */}
                        <div className="space-y-1 pt-1">
                          <span className="text-[10px] text-slate-400 font-semibold block">অথবা সরাসরি ইমেজ লিঙ্ক বসান:</span>
                          <input 
                            type="text"
                            value={card.imageUrl}
                            onChange={(e) => handleUpdateCardValue(idx, 'imageUrl', e.target.value)}
                            placeholder="https://example.com/photo.jpg"
                            className="w-full text-[10px] px-2.5 py-1.8 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none"
                          />
                        </div>

                      </div>

                      {/* Card Title */}
                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-slate-700">কার্ড শিরোনাম (Title):</label>
                        <input 
                          type="text"
                          value={card.title}
                          onChange={(e) => handleUpdateCardValue(idx, 'title', e.target.value)}
                          placeholder="যেমন: ১০০% প্রিমিয়াম ওয়াটারপ্রুফ গিয়ার"
                          className="w-full text-xs px-2.5 py-2 bg-white border border-slate-200 rounded-lg text-slate-850 font-bold focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>

                      {/* Card Description */}
                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-slate-700">সংক্ষিপ্ত বিবরণ (Description):</label>
                        <textarea
                          rows={3}
                          value={card.description || ''}
                          onChange={(e) => handleUpdateCardValue(idx, 'description', e.target.value)}
                          placeholder="সংক্ষিপ্ত বর্ণনা..."
                          className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none"
                        />
                      </div>

                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
              
              {/* COLUMN 1: VISUALS (Bg, Color, Alignment, Image) */}
              <div className="space-y-4">
                <div className="flex items-center gap-1 border-b border-slate-100 pb-1.5">
                  <Palette className="h-4 w-4 text-slate-400" />
                  <h5 className="text-[11px] font-black text-slate-800 uppercase tracking-wider">রঙ, আকৃতি ও এলাইনমেন্ট</h5>
                </div>

                {/* Background Color Customization */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700">সেকশন ব্যাকগ্রাউন্ড কালার (Background Color)</label>
                  <div className="flex gap-2">
                    <input 
                      type="color" 
                      value={currentSectionData.bgColor}
                      onChange={(e) => handleUpdateValue(activeSection, 'bgColor', e.target.value)}
                      className="w-10 h-10 border border-slate-200 rounded-xl cursor-pointer p-0"
                    />
                    <input 
                      type="text" 
                      value={currentSectionData.bgColor}
                      onChange={(e) => handleUpdateValue(activeSection, 'bgColor', e.target.value)}
                      placeholder="#ffffff"
                      className="flex-1 text-xs px-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none font-mono text-slate-800"
                    />
                  </div>
                  
                  {/* Predefined Color Presets */}
                  <div className="flex flex-wrap gap-1 pt-1.5">
                    {predefinedBgColors.map((color) => (
                      <button
                        key={color.hex}
                        type="button"
                        onClick={() => handleUpdateValue(activeSection, 'bgColor', color.hex)}
                        className="px-2 py-1 text-[9px] font-semibold border rounded-lg hover:border-slate-400 transition cursor-pointer bg-white"
                        title={color.name}
                      >
                        <span className="inline-block w-2 bg-slate-200 h-2 rounded-full mr-1.5" style={{ backgroundColor: color.hex }}></span>
                        {color.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Text Alignments */}
                <div className="grid grid-cols-2 gap-3.5 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">টেক্সট এলাইনমেন্ট (Text Align)</label>
                    <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl w-fit border border-slate-200/60">
                      <button
                        type="button"
                        onClick={() => handleUpdateValue(activeSection, 'textAlign', 'left')}
                        className={`p-2 rounded-lg transition ${
                          currentSectionData.textAlign === 'left' ? 'bg-indigo-600 text-white shadow-2xs' : 'text-slate-500 hover:bg-slate-200/70'
                        }`}
                        title="Left"
                      >
                        <AlignLeft className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdateValue(activeSection, 'textAlign', 'center')}
                        className={`p-2 rounded-lg transition ${
                          currentSectionData.textAlign === 'center' ? 'bg-indigo-600 text-white shadow-2xs' : 'text-slate-500 hover:bg-slate-200/70'
                        }`}
                        title="Center"
                      >
                        <AlignCenter className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdateValue(activeSection, 'textAlign', 'right')}
                        className={`p-2 rounded-lg transition ${
                          currentSectionData.textAlign === 'right' ? 'bg-indigo-600 text-white shadow-2xs' : 'text-slate-500 hover:bg-slate-200/70'
                        }`}
                        title="Right"
                      >
                        <AlignRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">টেক্সট সাইজ (Font Scale)</label>
                    <select
                      value={currentSectionData.fontSize}
                      onChange={(e) => handleUpdateValue(activeSection, 'fontSize', e.target.value)}
                      className="w-full px-3 py-1.8 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none text-xs text-slate-700 font-bold cursor-pointer"
                    >
                      <option value="default">ডিফল্ট রেসপন্সিভ (Default)</option>
                      <option value="sm">কমপ্যাক্ট ক্রিস্টাল (Small)</option>
                      <option value="md">স্ট্যান্ডার্ড প্যারাগ্রাফ (Medium)</option>
                      <option value="lg">অতিরিক্ত বড় বোল্ড (Large)</option>
                      <option value="xl">মৌলিক বাটন সাইজ (Extra Large)</option>
                      <option value="2xl">বিশাল সাইনবোর্ড (Giant display)</option>
                    </select>
                  </div>
                </div>

                {/* Vertical Padding Spacing height modifier */}
                <div className="pt-1.5">
                  <label className="block text-xs font-bold text-slate-700 mb-1">প্যাডিং স্পেসিং (Section Height / Padding)</label>
                  <select
                    value={currentSectionData.padding_vertical || 'normal'}
                    onChange={(e) => handleUpdateValue(activeSection, 'padding_vertical', e.target.value)}
                    className="w-full px-3 py-1.8 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none text-xs text-slate-700 font-bold cursor-pointer"
                  >
                    <option value="compact">কম দূরত্ব (Compact - py-6)</option>
                    <option value="normal">স্ট্যান্ডার্ড (Normal - py-10)</option>
                    <option value="generous">বিশাল এবং উচু স্পেস (Generous - py-16)</option>
                  </select>
                </div>

                {/* Custom Image URL background / section illustration */}
                <div className="pt-1.5 space-y-2">
                  <label className="block text-xs font-bold text-slate-700 flex items-center justify-between">
                    <span>সেকশন ইমেজ লিংক বা ব্যানার হোস্ট URL (Image Input)</span>
                    <ImageIcon className="h-4 w-4 text-indigo-500" />
                  </label>

                  {/* Image Preview Box */}
                  {currentSectionData.image_url && (
                    <div className="w-full h-36 bg-slate-150 rounded-xl overflow-hidden relative flex items-center justify-center border border-dashed border-slate-300">
                      <img 
                        src={currentSectionData.image_url} 
                        alt="Section Preview" 
                        className="w-full h-full object-contain bg-white"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  )}

                  {/* Direct File Upload button */}
                  <div className="select-none">
                    <label className="block cursor-pointer bg-slate-900 border border-slate-800 hover:bg-slate-800 active:scale-98 text-white text-[11px] font-extrabold py-2 text-center rounded-xl shadow-xs transition mb-2">
                      📥 নতুন ছবি সরাসরি আপলোড করুন
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleSectionImageUpload(activeSection, f);
                        }}
                        className="hidden" 
                      />
                    </label>
                  </div>

                  <input 
                    type="text" 
                    value={currentSectionData.image_url || ''}
                    onChange={(e) => handleUpdateValue(activeSection, 'image_url', e.target.value)}
                    placeholder="যেমন: https://example.com/banner-raincoat.png"
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-850 focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block leading-normal font-medium">
                    {activeSection === 'raincoat_comparison' 
                      ? 'বাজারের সাধারণ রেইনকোট বনাম আমাদের প্রিমিয়াম রেইনকোট সেকশনের প্রধান তুলনা কার্টুন/ছবি কাস্টমাইজ করুন। ফাঁকা রাখলে এটি প্রদর্শিত হবে না।'
                      : 'যেসব সেকশনে স্লাইডার বা ব্যানার রয়েছে, সেখানে ছবির লিংক দিলে তা প্রদর্শন হবে। ফাঁকা রাখলে বাই-ডিফল্ট প্রোডাক্ট ড্রপ কন্টেন্ট ব্যবহার হবে।'
                    }
                  </span>
                </div>

              </div>

              {/* COLUMN 2: COPY-TEXTS & INFO (Title, slogan, paragraphs) */}
              <div className="space-y-4">
                <div className="flex items-center gap-1 border-b border-slate-100 pb-1.5">
                  <Type className="h-4 w-4 text-slate-400" />
                  <h5 className="text-[11px] font-black text-slate-800 uppercase tracking-wider">কপিরাইটিং টেক্সটস ও স্লোগান</h5>
                </div>

                {/* Sub-header / Badge promo text */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">প্রোমোショナル ট্যাগলাইন বা ব্যাজ টেক্সট</label>
                  <input 
                    type="text" 
                    value={currentSectionData.icon_text}
                    onChange={(e) => handleUpdateValue(activeSection, 'icon_text', e.target.value)}
                    placeholder="যেমন: ১০০% প্রিমিয়াম ওয়াটারপ্রুফ গিয়ার"
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-850 focus:outline-none"
                  />
                </div>

                {/* Main Title 1 */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">প্রধান শিরোনাম লাইন ১ (Primary Header Line 1)</label>
                  <input 
                    type="text" 
                    value={currentSectionData.title_1}
                    onChange={(e) => handleUpdateValue(activeSection, 'title_1', e.target.value)}
                    placeholder="যেমন: ঝুম বৃষ্টি কিংবা ঝড়ো হাওয়া—"
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-850 focus:outline-none font-bold"
                  />
                </div>

                {/* Main Title 2 */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">প্রধান শিরোনাম লাইন ২ (Primary Header Line 2)</label>
                  <input 
                    type="text" 
                    value={currentSectionData.title_2}
                    onChange={(e) => handleUpdateValue(activeSection, 'title_2', e.target.value)}
                    placeholder="যেমন: বাইরে বের হতে আর কোনো ভয় নেই!"
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-850 focus:outline-none"
                  />
                </div>

                {/* Body Paragraph description text */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">বিস্তারিত বিবরণ বা মূল প্যারাগ্রাফ (Paragraph Content)</label>
                  <textarea
                    rows={4}
                    value={currentSectionData.body}
                    onChange={(e) => handleUpdateValue(activeSection, 'body', e.target.value)}
                    placeholder="রেইনকোটের আকর্ষণীয় এবং তথ্যবহুল সংক্ষিপ্ত একটি বর্ণনা লিখুন..."
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-850 focus:outline-none leading-relaxed"
                  />
                </div>

                {/* Dynamic Video Embed URL (for live video section only) */}
                {activeSection === 'raincoat_live_video' && (
                  <div>
                    <span className="text-amber-600 font-extrabold text-[10px] uppercase block mb-1">🎥 অতিরিক্ত ভিডিও সেটিং</span>
                    <label className="block text-xs font-bold text-slate-700 mb-1">ইউটিউব / ফেসবুক ভিডিও লিংক (Video URL)</label>
                    <input 
                      type="text" 
                      value={currentSectionData.video_url || ''}
                      onChange={(e) => handleUpdateValue(activeSection, 'video_url', e.target.value)}
                      placeholder="যেমন: https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none"
                    />
                  </div>
                )}

              </div>

            </div>
          )}

          {/* Quick confirmation tip */}
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex items-center gap-3 mt-4">
            <span className="p-2 shrink-0 bg-indigo-50 rounded-xl border border-indigo-200 text-indigo-600">
              <Eye className="h-5 w-5" />
            </span>
            <div className="text-xs">
              <strong className="text-slate-800 font-extrabold block">পাবলিশ করা খুবই সহজ!</strong>
              <span className="text-slate-500 mt-0.5 block leading-normal">
                উপরের ডান কোনায় "ডিজাইন পাবলিশ করুন" বাটনে ক্লিক দেয়ার সাথে সাথে আপনার সাইটের ডাটাবেস আপডেট হবে এবং গ্রাহকদের ল্যান্ডিং স্ক্রিনে পরিবর্তন আসবে।
              </span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
