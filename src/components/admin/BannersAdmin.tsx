import React, { useState, useEffect, useRef } from 'react';
import { Save, AlertCircle, Check, Plus, Trash2, ArrowUp, ArrowDown, Sparkles, Image, Settings, Eye, ChevronUp, ChevronDown, Image as ImageIcon } from 'lucide-react';
import { HomepageBannerSlide, HomepageBannerSettings } from '../../types';
import { getBannerSettingsFromFirestore, saveBannerSettingsToFirestore } from '../../lib/firebase';
import { compressImage } from '../../lib/imageCompressor';
import MediaPickerModal from './MediaPickerModal';

interface BannersAdminProps {
  userRole: string; // 'Admin' | 'Editor' | 'ReadOnly'
}

export default function BannersAdmin({ userRole }: BannersAdminProps) {
  const [slides, setSlides] = useState<HomepageBannerSlide[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Editing state
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  
  // Single slide form states
  const [badge, setBadge] = useState('');
  const [badgeColor, setBadgeColor] = useState('bg-orange-600/15 border-orange-500/20 text-orange-400');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [bgType, setBgType] = useState<'color' | 'image' | 'gradient'>('gradient');
  const [bgColor, setBgColor] = useState('#1e1b4b');
  const [bgGradient, setBgGradient] = useState('from-slate-900 via-indigo-950 to-slate-900');
  const [bgImage, setBgImage] = useState('');
  const [bgImageMobile, setBgImageMobile] = useState('');
  const [textColor, setTextColor] = useState('text-white');
  const [primaryBtnText, setPrimaryBtnText] = useState('🛒 সম্পূর্ণ শপ ভিউ দেখুন');
  const [primaryBtnLink, setPrimaryBtnLink] = useState('/shop');
  const [secondaryBtnText, setSecondaryBtnText] = useState('🌧️ রেইনকোট অর্ডার করুন');
  const [secondaryBtnLink, setSecondaryBtnLink] = useState('/raincoat');

  // Media Pickers state triggers
  const [isWebPickerOpen, setIsWebPickerOpen] = useState(false);
  const [isMobilePickerOpen, setIsMobilePickerOpen] = useState(false);

  const fileInputRefWeb = useRef<HTMLInputElement>(null);
  const fileInputRefMobile = useRef<HTMLInputElement>(null);

  const defaultBanners: HomepageBannerSlide[] = [
    {
      badge: "Monsoon Flash Deals",
      badgeColor: "bg-orange-600/15 border-orange-500/20 text-orange-400",
      title: "বর্ষার ধামাকা ২০% থেকে ৫০% সরাসরি ক্যাশ ডিসকাউন্ট!",
      description: "সারা বাংলাদেশে কুরিয়ার চার্জ সম্পূর্ণ ফ্রী। কোন অগ্রিম টাকা দেওয়া ছাড়াই সম্পূর্ণ প্রোডাক্ট হাতে পেয়ে চেক করে মূল্য পরিশোধ করুন! সেরা ওয়াটারপ্রুফ রেইন গিয়ারস।",
      bgType: 'gradient',
      bgColor: "#1e1b4b",
      bgGradient: "from-slate-900 via-indigo-950 to-slate-900",
      textColor: "text-white",
      primaryBtnText: "🛒 সম্পূর্ণ শপ ভিউ দেখুন",
      primaryBtnLink: "/shop",
      secondaryBtnText: "🌧️ রেইনকোট অর্ডার করুন",
      secondaryBtnLink: "/raincoat"
    },
    {
      badge: "জনপ্রিয় কালার (Navy Blue)",
      badgeColor: "bg-cyan-500/15 border-cyan-400/20 text-cyan-300",
      title: "প্রিমিয়াম ওয়াটারপ্রুফ নেভি ব্লু বাইক কভার - অফার মূল্য ৬০০/-",
      description: "ছাতা কাপড়ের তৈরি শতভাগ ওয়াটারপ্রুফ ও ডাস্টপ্রুফ নেভি ব্লু কভার। রোদ, বৃষ্টি ও ধুলোবালি প্রতিরোধে সিলভার হিট কোটিং যুক্ত দ্বিমুখী অনন্য সুরক্ষা।",
      bgType: 'gradient',
      bgColor: "#1e1b4b",
      bgGradient: "from-blue-950 via-indigo-950 to-slate-900",
      textColor: "text-white",
      primaryBtnText: "🏍️ বাইক কভার অর্ডার করুন",
      primaryBtnLink: "/bikecover",
      secondaryBtnText: "🛒 সম্পূর্ণ শপ ভিউ",
      secondaryBtnLink: "/shop"
    },
    {
      badge: "শতভাগ প্রিমিয়াম (Jet Black)",
      badgeColor: "bg-amber-500/15 border-amber-400/20 text-amber-300",
      title: "প্রিমিয়াম ওয়াটারপ্রুফ জেট ব্ল্যাক বাইক কভার - মাত্র ৬০০/- টাকা!",
      description: "অভিজাত ব্ল্যাক কালার, ডাস্টপ্রুফ এবং রোদের তাপ প্রতিরোধক সুউচ্চ ফিনিশিং কভার যা পিচ্ছিল কাদা ও ধুলোবালি প্রতিরোধে জ্যাকিং ইলাস্টিক বেল্ট সমৃদ্ধ।",
      bgType: 'gradient',
      bgColor: "#1a1a1a",
      bgGradient: "from-neutral-900 via-stone-900 to-neutral-950",
      textColor: "text-white",
      primaryBtnText: "🏍️ বাইক কভার অর্ডার করুন",
      primaryBtnLink: "/bikecover",
      secondaryBtnText: "🛒 সম্পূর্ণ শপ ভিউ",
      secondaryBtnLink: "/shop"
    }
  ];

  const loadBanners = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const cached = localStorage.getItem('raincoat_banner_settings_fallback');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed && Array.isArray(parsed.slides)) {
            setSlides(parsed.slides);
          }
        } catch (_) {}
      }

      const remote = await getBannerSettingsFromFirestore();
      if (remote && Array.isArray(remote.slides) && remote.slides.length > 0) {
        setSlides(remote.slides);
        localStorage.setItem('raincoat_banner_settings_fallback', JSON.stringify(remote));
      } else if (!cached) {
        setSlides(defaultBanners);
        localStorage.setItem('raincoat_banner_settings_fallback', JSON.stringify({ slides: defaultBanners }));
      }
    } catch (err) {
      console.warn("Could not find banner settings:", err);
      setErrorMsg("ফায়ারবেস থেকে হোমপেজ ব্যানার লোড করা সম্ভব হয়নি। সংরক্ষিত ক্যাশ সচল রয়েছে।");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBanners();
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'web' | 'mobile') => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      const reader = new FileReader();
      reader.onload = async (uploadEvent) => {
        if (uploadEvent.target?.result) {
          const rawDataUrl = uploadEvent.target.result as string;
          try {
            // Automatically compress manual uploaded asset in browser
            const compressed = await compressImage(rawDataUrl, 800, 0.55);
            if (target === 'web') {
              setBgImage(compressed);
              setBgType('image');
            } else {
              setBgImageMobile(compressed);
              setBgType('image');
            }
            setSuccessMsg('ছবি সফলভাবে প্রসেস ও কমপ্রেস করা হয়েছে!');
            setTimeout(() => setSuccessMsg(''), 2500);
          } catch (e) {
            console.error("Image compression failed:", e);
            if (target === 'web') {
              setBgImage(rawDataUrl);
              setBgType('image');
            } else {
              setBgImageMobile(rawDataUrl);
              setBgType('image');
            }
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleStartEdit = (index: number) => {
    const slide = slides[index];
    setEditingIndex(index);
    setBadge(slide.badge || '');
    setBadgeColor(slide.badgeColor || 'bg-orange-600/15 border-orange-500/20 text-orange-400');
    setTitle(slide.title || '');
    setDescription(slide.description || '');
    setBgType(slide.bgType || 'gradient');
    setBgColor(slide.bgColor || '#1e1b4b');
    setBgGradient(slide.bgGradient || 'from-slate-900 via-indigo-950 to-slate-900');
    setBgImage(slide.bgImage || '');
    setBgImageMobile(slide.bgImageMobile || '');
    setTextColor(slide.textColor || 'text-white');
    setPrimaryBtnText(slide.primaryBtnText || '🛒 সম্পূর্ণ শপ ভিউ দেখুন');
    setPrimaryBtnLink(slide.primaryBtnLink || '/shop');
    setSecondaryBtnText(slide.secondaryBtnText || '🌧️ রেইনকোট অর্ডার করুন');
    setSecondaryBtnLink(slide.secondaryBtnLink || '/raincoat');
  };

  const handleAddNewSlide = () => {
    setEditingIndex(slides.length);
    setBadge('নতুন অফার');
    setBadgeColor('bg-rose-500/15 border-rose-400/20 text-rose-300');
    setTitle('আপনার আকর্ষনীয় বর্ষাকালীন ব্যানার টাইটেল দিন');
    setDescription('এখানে আপনার কাস্টমারদের জন্য বিস্তারিত বর্ণনা বাংলাতে লিখুন।');
    setBgType('gradient');
    setBgColor('#111827');
    setBgGradient('from-slate-950 via-teal-950 to-slate-900');
    setBgImage('');
    setBgImageMobile('');
    setTextColor('text-white');
    setPrimaryBtnText('🛒 শপ ভিউ');
    setPrimaryBtnLink('/shop');
    setSecondaryBtnText('🌧️ রেইনকোট কিনুন');
    setSecondaryBtnLink('/raincoat');
  };

  const handleDeleteSlide = async (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (userRole === 'ReadOnly') {
      setErrorMsg('দুঃখিত, রিড অনলি এক্সেস মোডে ডিলিট সম্ভব নয়!');
      return;
    }
    if (!window.confirm('আপনি কি নিশ্চিতভাবেই এই হোমপেজ স্লাইডটি ডিলিট করতে চান?')) return;

    const filtered = slides.filter((_, idx) => idx !== index);
    setSlides(filtered);
    localStorage.setItem('raincoat_banner_settings_fallback', JSON.stringify({ slides: filtered }));

    try {
      await saveBannerSettingsToFirestore({ slides: filtered });
      setSuccessMsg('ব্যানার স্লাইডটি সফলভাবে মুছে ফেলা হয়েছে!');
      window.dispatchEvent(new Event('raincoat_banner_settings_updated'));
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (_) {
      setErrorMsg('ডাটাবেসে আপডেট করতে সমস্যা হয়েছে।');
    }

    if (editingIndex === index) {
      setEditingIndex(null);
    } else if (editingIndex !== null && editingIndex > index) {
      setEditingIndex(editingIndex - 1);
    }
  };

  const handleSaveActiveSlide = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingIndex === null) return;
    if (userRole === 'ReadOnly') {
      setErrorMsg('দুঃখিত! আপনার প্রোফাইলে রাইটিং এক্সেস সীমাবদ্ধ করা রয়েছে।');
      return;
    }

    const updatedSlide: HomepageBannerSlide = {
      badge,
      badgeColor,
      title,
      description,
      bgType,
      bgColor,
      bgGradient,
      bgImage,
      bgImageMobile,
      textColor,
      primaryBtnText,
      primaryBtnLink,
      secondaryBtnText,
      secondaryBtnLink
    };

    let updatedList = [...slides];
    if (editingIndex < slides.length) {
      updatedList[editingIndex] = updatedSlide;
    } else {
      updatedList.push(updatedSlide);
    }

    setSlides(updatedList);
    localStorage.setItem('raincoat_banner_settings_fallback', JSON.stringify({ slides: updatedList }));

    try {
      await saveBannerSettingsToFirestore({ slides: updatedList });
      setSuccessMsg('স্লাইড ইনফরমেশন ও ড্রাফট সফলভাবে সংরক্ষিত ও সিঙ্ক করা হয়েছে!');
      setEditingIndex(null);
      window.dispatchEvent(new Event('raincoat_banner_settings_updated'));
      setTimeout(() => setSuccessMsg(''), 2500);
    } catch (err) {
      console.error(err);
      setErrorMsg('ফায়ারবেসে সেভ করতে সমস্যা হয়েছে!');
    }
  };

  const handleMoveOrder = async (index: number, direction: 'up' | 'down') => {
    if (userRole === 'ReadOnly') return;
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= slides.length) return;

    const copy = [...slides];
    const temp = copy[index];
    copy[index] = copy[targetIdx];
    copy[targetIdx] = temp;

    setSlides(copy);
    localStorage.setItem('raincoat_banner_settings_fallback', JSON.stringify({ slides: copy }));

    try {
      await saveBannerSettingsToFirestore({ slides: copy });
      window.dispatchEvent(new Event('raincoat_banner_settings_updated'));
    } catch (_) {}
  };

  const handleResetToFactoryDefaults = async () => {
    if (userRole === 'ReadOnly') return;
    if (!window.confirm('আপনি কি নিশ্চিতভাবেই স্লাইডার ব্যানার রিস্টোর করে পূর্বের অরিজিনাল অবস্থায় ফেরত নিয়ে যেতে চান?')) return;

    setSlides(defaultBanners);
    localStorage.setItem('raincoat_banner_settings_fallback', JSON.stringify({ slides: defaultBanners }));

    try {
      await saveBannerSettingsToFirestore({ slides: defaultBanners });
      setSuccessMsg('অরিজিনাল ৩টি স্লাইড সফলভাবে রিস্টোর ও ডাটাবেইজে সেট করা হয়েছে!');
      setEditingIndex(null);
      window.dispatchEvent(new Event('raincoat_banner_settings_updated'));
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (_) {
      setErrorMsg('রিসেট করতে ত্রুটি হয়েছে!');
    }
  };

  return (
    <div className="space-y-6 text-left font-sans text-xs">
      
      {/* Dynamic Instruction Header */}
      <div className="bg-slate-900 border border-slate-800 text-white rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shadow-lg">
        <div>
          <h3 className="font-extrabold text-amber-400 text-sm flex items-center gap-1.5 uppercase tracking-wide">
            🌅 Dynamic Homepage Carousel Banners (হোম পেইজ স্লাইডার ব্যানার)
          </h3>
          <p className="text-[10px] text-slate-300 mt-0.5">
            প্রধান হোমপেজের টপ কারোসেল স্লাইডার ব্যানারগুলির টেক্সট, ব্যাকগ্রাউন্ড কালার, কাস্টম ছবি (মোবাইল ও ওয়েব) এবং বাটন সম্পূর্ণ ডাইনামিকলি নিয়ন্ত্রণ করুন।
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleResetToFactoryDefaults}
            className="px-2.5 py-1 text-[10px] bg-slate-850 hover:bg-slate-800 border border-slate-700 text-slate-300 font-bold rounded-lg transition"
            disabled={userRole === 'ReadOnly'}
          >
            🔄 অরিজিনাল রিসেট করুন
          </button>
          
          <button
            type="button"
            onClick={handleAddNewSlide}
            className="px-2.5 py-1 text-[10px] bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition flex items-center gap-1 shadow-sm"
            disabled={userRole === 'ReadOnly'}
          >
            <Plus className="h-3 w-3" /> নতুন স্লাইড যোগ করুন
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
          {errorMsg}
        </div>
      )}

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-bold flex items-center gap-2">
          <Check className="h-4 w-4 shrink-0 text-emerald-500" />
          {successMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Sliders list */}
        <div className="lg:col-span-4 bg-white p-4 rounded-xl border border-slate-200 space-y-3">
          <h4 className="font-extrabold text-slate-900 uppercase tracking-wider text-[10px] pb-2 border-b border-slate-100 flex items-center gap-1">
            <Settings className="h-3.5 w-3.5 text-slate-400" /> স্লাইডসমূহ ({slides.length})
          </h4>

          {slides.length === 0 ? (
            <div className="p-8 text-center text-slate-400 border border-dashed border-slate-200 rounded-xl">
              কোনো ব্যানার নেই। "নতুন স্লাইড" বাটনে ম্যাপ করুন।
            </div>
          ) : (
            <div className="space-y-2">
              {slides.map((slide, idx) => (
                <div 
                  key={idx}
                  onClick={() => handleStartEdit(idx)}
                  className={`p-3 rounded-xl border transition-all text-left relative cursor-pointer group ${
                    editingIndex === idx 
                      ? 'bg-indigo-50/50 border-indigo-400 shadow-sm ring-1 ring-indigo-300' 
                      : 'bg-slate-50 border-slate-200 hover:bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                        <span className="text-[10px] font-mono bg-slate-200/60 px-1 py-0.2 rounded font-bold text-slate-700">#{idx + 1}</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-50 border border-indigo-100 text-indigo-700 font-extrabold truncate max-w-[120px]">
                          {slide.badge || 'No Badge'}
                        </span>
                      </div>
                      <h5 className="font-extrabold text-[11px] text-slate-900 truncate leading-tight">{slide.title}</h5>
                      <p className="text-[9px] text-slate-400 truncate mt-1">{slide.description}</p>
                    </div>

                    {/* Up/Down buttons & delete */}
                    <div className="flex flex-col items-center gap-1 group-hover:opacity-100 opacity-80 shrink-0">
                      <div className="flex gap-0.5">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleMoveOrder(idx, 'up'); }}
                          className="p-0.5 rounded bg-white border border-slate-200 text-slate-500 hover:text-indigo-600 transition"
                          disabled={idx === 0}
                        >
                          <ChevronUp className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleMoveOrder(idx, 'down'); }}
                          className="p-0.5 rounded bg-white border border-slate-200 text-slate-500 hover:text-indigo-600 transition"
                          disabled={idx === slides.length - 1}
                        >
                          <ChevronDown className="h-3 w-3" />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteSlide(idx, e)}
                        className="p-1 rounded hover:bg-rose-50 text-rose-500 hover:text-rose-700 transition"
                        title="স্লাইড মুছে ফেলুন"
                        disabled={userRole === 'ReadOnly'}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Bg thumbnail preview indicator */}
                  <div className="mt-2.5 pt-2 border-t border-slate-100/50 flex justify-between items-center text-[9px] text-slate-400">
                    <span className="flex items-center gap-1">
                      🖥️ {slide.bgType === 'image' ? (slide.bgImage ? 'কাস্টম ছবি' : 'ডিফল্ট ছবি') : slide.bgType === 'gradient' ? 'গ্রাডিয়েন্ট' : 'সলিড কালার'}
                    </span>
                    {slide.bgImageMobile && (
                      <span className="text-emerald-600 font-bold">📱 মোবাইল ছবি সচল</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Editing details form */}
        <div className="lg:col-span-8">
          {editingIndex !== null ? (
            <form onSubmit={handleSaveActiveSlide} className="bg-white p-5 rounded-xl border border-slate-200 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h4 className="font-extrabold text-slate-900 text-[11px] flex items-center gap-1.5 uppercase text-indigo-600">
                  <Sparkles className="h-4 w-4 text-indigo-500" /> 
                  {editingIndex < slides.length ? `স্লাইডার #${editingIndex + 1} পরিবর্তন ও কনফিগার করুন` : 'নতুন ব্যানার স্লাইড তৈরি করুন'}
                </h4>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingIndex(null)}
                    className="px-3 py-1 bg-slate-100 hover:bg-slate-250 text-slate-600 text-[10px] font-bold rounded-lg border border-slate-200 transition"
                  >
                    বাতিল
                  </button>
                  <button
                    type="submit"
                    className="px-3.5 py-1 bg-[#10b981] hover:bg-emerald-600 text-white text-[10px] font-extrabold rounded-lg transition-all flex items-center gap-1 shadow"
                    disabled={userRole === 'ReadOnly'}
                  >
                    <Save className="h-3 w-3" /> স্লাইড সংরক্ষণ করুন
                  </button>
                </div>
              </div>

              {/* Grid content variables */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* 1. Badge Text */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">স্লাইড ব্যাজ / অফার ট্যাগ (Badge English)</label>
                  <input 
                    type="text" 
                    placeholder="যেমন: Monsoon Flash Deals"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-bold focus:outline-none focus:bg-white focus:border-indigo-500"
                    value={badge}
                    onChange={(e) => setBadge(e.target.value)}
                  />
                </div>

                {/* 2. Badge styles text */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">ব্যাজ কালার ও CSS ক্লাস (Badge Styling Class)</label>
                  <input 
                    type="text" 
                    placeholder="যেমন: bg-orange-600/15 border-orange-500/20 text-orange-400"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-mono focus:outline-none focus:bg-white focus:border-indigo-500"
                    value={badgeColor}
                    onChange={(e) => setBadgeColor(e.target.value)}
                  />
                </div>

                {/* 3. Slide Title */}
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">ব্যানার বড় শিরোনাম (Main Heading) *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="যেমন: বর্ষার ধামাকা ২০% থেকে ৫০% সরাসরি ক্যাশ ডিসকাউন্ট!"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:bg-white focus:border-indigo-500"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                {/* 4. Description sentence */}
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">বিস্তারিত বিবরণ (Description Text) *</label>
                  <textarea 
                    required
                    rows={2}
                    placeholder="কুরিয়ার ডেলিভারি চার্জ সম্পূর্ণ ফ্রি। কাস্টমার সম্পূর্ণ প্রোডাক্ট হাতে পেয়ে চেক করে পেমেন্ট করতে পারবেন।"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-indigo-500"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                {/* 5. Custom Background Type */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">ব্যাকগ্রাউন্ড টাইপ (Background Type)</label>
                  <select
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none"
                    value={bgType}
                    onChange={(e) => setBgType(e.target.value as any)}
                  >
                    <option value="gradient">🌈 গ্রাডিয়েন্ট (Tailwind Gradient)</option>
                    <option value="color">🎨 সলিড কালার (Solid Base Color)</option>
                    <option value="image">🖼️ কাস্টম ছবি (Desktop & Mobile Image)</option>
                  </select>
                </div>

                {/* 6. Solid bg picker or gradient string */}
                <div>
                  {bgType === 'color' && (
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">পছন্দের ব্যাকগ্রাউন্ড কালার (Pick Background Color)</label>
                      <div className="flex gap-2">
                        <input 
                          type="color" 
                          className="w-10 h-9 p-0.5 bg-white border border-slate-200 rounded-lg cursor-pointer shrink-0"
                          value={bgColor}
                          onChange={(e) => setBgColor(e.target.value)}
                        />
                        <input 
                          type="text" 
                          placeholder="#1e1b4b"
                          className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                          value={bgColor}
                          onChange={(e) => setBgColor(e.target.value)}
                        />
                      </div>
                    </div>
                  )}
                  {bgType === 'gradient' && (
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">Tailwind গ্রাডিয়েন্ট ক্লাস (CSS Gradient Class)</label>
                      <input 
                        type="text" 
                        placeholder="जैसे: from-slate-900 via-indigo-950 to-slate-900"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-mono"
                        value={bgGradient}
                        onChange={(e) => setBgGradient(e.target.value)}
                      />
                    </div>
                  )}
                  {bgType === 'image' && (
                    <div className="p-2.5 bg-amber-50 border border-amber-250 text-amber-800 rounded-xl text-[10px] font-semibold leading-normal">
                      📸 ছবির ব্যাকগ্রাউন্ড নির্বাচন করেছেন। নিচে কাস্টম ছবি আপলোড বা লিংক ইনজেক্ট করার ফর্ম রয়েছে।
                    </div>
                  )}
                </div>

                {/* 7. Image uploads for Web view (Desktop) */}
                <div className="md:col-span-2 border border-slate-100 p-3.5 rounded-xl bg-slate-50/75 space-y-3">
                  <h5 className="font-extrabold text-[10px] text-slate-700 uppercase flex items-center gap-1">
                    <Image className="h-3.5 w-3.5 text-indigo-500" /> ব্যাকগ্রাউন্ড ছবি কাস্টমাইজেশন (ছবি আপলোড করুন বা লিংক বসান)
                  </h5>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* WEB (Desktop) Image */}
                    <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-2">
                      <span className="font-bold text-slate-700 block">🖥️ ডেস্কটপ বর্ষাকালীন ব্যানার (PC Web View Only)</span>
                      
                      <input 
                        type="file" 
                        ref={fileInputRefWeb}
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileUpload(e, 'web')}
                      />
                      
                      {bgImage ? (
                        <div className="space-y-1 text-center font-bold">
                          <img src={bgImage} alt="Desktop Custom" className="max-h-16 rounded object-contain mx-auto" referrerPolicy="no-referrer" />
                          <button 
                            type="button" 
                            onClick={() => setBgImage('')}
                            className="text-[9px] text-rose-500 hover:underline"
                          >
                            ছবি মুছুন
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => fileInputRefWeb.current?.click()}
                            className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-[10px] font-bold border transition"
                          >
                            কম্পিউটার আপলোড
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsWebPickerOpen(true)}
                            className="flex-1 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-[10px] font-bold border border-indigo-200 transition flex items-center justify-center gap-1"
                          >
                            <ImageIcon className="h-3.5 w-3.5" /> গ্যালারি
                          </button>
                        </div>
                      )}

                      <div className="pt-1.5 border-t border-slate-100">
                        <label className="block text-[9px] font-bold text-slate-400 mb-0.5">অথবা সরাসরি ওয়েব লিংক (Direct Link)</label>
                        <input 
                          type="text" 
                          placeholder="https://example.com/banner-pc.png"
                          className="w-full px-2 py-1 border border-slate-200 rounded-lg text-[10px] font-mono"
                          value={bgImage}
                          onChange={(e) => { setBgImage(e.target.value); if(e.target.value) setBgType('image'); }}
                        />
                      </div>
                    </div>

                    {/* MOBILE Image */}
                    <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-2">
                      <span className="font-bold text-[#f43f5e] block">📱 মোবাইল বর্ষাকালীন ব্যানার (Mobile View Only)</span>
                      
                      <input 
                        type="file" 
                        ref={fileInputRefMobile}
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileUpload(e, 'mobile')}
                      />
                      
                      {bgImageMobile ? (
                        <div className="space-y-1 text-center font-bold">
                          <img src={bgImageMobile} alt="Mobile Custom" className="max-h-16 rounded object-contain mx-auto" referrerPolicy="no-referrer" />
                          <button 
                            type="button" 
                            onClick={() => setBgImageMobile('')}
                            className="text-[9px] text-rose-500 hover:underline"
                          >
                            মোবাইল ছবি মুছুন
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => fileInputRefMobile.current?.click()}
                            className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-[10px] font-bold border transition"
                          >
                            কম্পিউটার আপলোড
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsMobilePickerOpen(true)}
                            className="flex-1 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-[10px] font-bold border border-indigo-200 transition flex items-center justify-center gap-1"
                          >
                            <ImageIcon className="h-3.5 w-3.5" /> গ্যালারি
                          </button>
                        </div>
                      )}

                      <div className="pt-1.5 border-t border-slate-100">
                        <label className="block text-[9px] font-bold text-slate-400 mb-0.5">অথবা সরাসরি মোবাইল ইমেজ লিংক</label>
                        <input 
                          type="text" 
                          placeholder="https://example.com/banner-phone.png"
                          className="w-full px-2 py-1 border border-slate-200 rounded-lg text-[10px] font-mono"
                          value={bgImageMobile}
                          onChange={(e) => { setBgImageMobile(e.target.value); if(e.target.value) setBgType('image'); }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Button Action configs */}
                <div className="md:col-span-2 border-t border-slate-150 pt-3.5 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Btn 1 Text */}
                  <div className="p-3 bg-slate-50 border rounded-xl space-y-2">
                    <span className="font-extrabold text-[#4f46e5]">🎯 বাটন ১ - প্রাইমারি লিংক (Primary Action Call)</span>
                    <div className="space-y-1.5">
                      <div>
                        <label className="text-[9px] font-bold text-slate-500 block">বাটন লেখা (Button Text)</label>
                        <input 
                          type="text" 
                          className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                          value={primaryBtnText}
                          onChange={(e) => setPrimaryBtnText(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-slate-500 block">লিংক লোকেশন (Link / href)</label>
                        <select
                          className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                          value={primaryBtnLink}
                          onChange={(e) => setPrimaryBtnLink(e.target.value)}
                        >
                          <option value="/shop">🛒 প্রোডাক্ট ক্যাটালগ শপ (/shop)</option>
                          <option value="/raincoat">🌧️ রেইনকোট অর্ডার ল্যান্ডিং পেজ (/raincoat)</option>
                          <option value="/bikecover">🏍️ বাইক কভার অর্ডার ল্যান্ডিং পেজ (/bikecover)</option>
                          <option value="#checkout-form">⚡ সরাসরি পেমেন্ট অর্ডার ফর্ম (#checkout-form)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Btn 2 Text */}
                  <div className="p-3 bg-slate-50 border rounded-xl space-y-2">
                    <span className="font-extrabold text-slate-700">🎯 বাটন ২ - সেকেন্ডারি লিংক (Secondary Action Call)</span>
                    <div className="space-y-1.5">
                      <div>
                        <label className="text-[9px] font-bold text-slate-500 block">বাটন লেখা (Button Text)</label>
                        <input 
                          type="text" 
                          className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                          value={secondaryBtnText}
                          onChange={(e) => setSecondaryBtnText(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-slate-500 block">লিংক লোকেশন (Link / href)</label>
                        <select
                          className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                          value={secondaryBtnLink}
                          onChange={(e) => setSecondaryBtnLink(e.target.value)}
                        >
                          <option value="/shop">🛒 প্রোডাক্ট ক্যাটালগ শপ (/shop)</option>
                          <option value="/raincoat">🌧️ রেইনকোট অর্ডার ল্যান্ডিং পেজ (/raincoat)</option>
                          <option value="/bikecover">🏍️ বাইক কভার অর্ডার ল্যান্ডিং পেজ (/bikecover)</option>
                          <option value="#checkout-form">⚡ সরাসরি পেমেন্ট অর্ডার ফর্ম (#checkout-form)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </form>
          ) : (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center flex flex-col items-center justify-center space-y-3 min-h-[300px]">
              <Eye className="h-10 w-10 text-slate-350 shrink-0" />
              <div>
                <span className="font-extrabold text-slate-700 block">ব্যানার এডিটর ফোকাস</span>
                <p className="text-[10px] text-slate-400 mt-1">বামদিকের তালিকা থেকে যেকোনো একটি ব্যানার স্লাইড সিলেক্ট করে পরিবর্তন করতে শুরু করুন অথবা "নতুন স্লাইড" বাটনে ক্লিক করুন।</p>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Media Picker Overlays */}
      <MediaPickerModal 
        isOpen={isWebPickerOpen}
        onClose={() => setIsWebPickerOpen(false)}
        onSelect={(url) => {
          setBgImage(url);
          setBgType('image');
        }}
        title="ডেস্কটপ ব্যানার ব্যাকগ্রাউন্ড ছবি সিলেক্ট করুন"
      />

      <MediaPickerModal 
        isOpen={isMobilePickerOpen}
        onClose={() => setIsMobilePickerOpen(false)}
        onSelect={(url) => {
          setBgImageMobile(url);
          setBgType('image');
        }}
        title="মোবাইল ব্যানার ব্যাকগ্রাউন্ড ছবি সিলেক্ট করুন"
      />
    </div>
  );
}
