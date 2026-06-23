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
  saveAdvancedAddonsSettingsToFirestore,
  getProductsFromFirestore
} from '../../lib/firebase';
import { AdvancedAddonsSettings } from '../../types';

// Types for Section Styling & Content configuration
export interface SectionCustomization {
  bgColor: string;
  textColor: string;
  textAlign: 'left' | 'center' | 'right';
  fontSize: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'default';
  image_url?: string;
  icon_text: string;
  title_1: string;
  title_2: string;
  body: string;
  video_url?: string;
  video_url_2?: string;
  gallery_images?: string[];
  visible_mobile: boolean;
  visible_desktop: boolean;
  padding_vertical?: 'compact' | 'normal' | 'generous';
}

interface SectionCustomizerAdminProps {
  userRole?: string;
}

export default function SectionCustomizerAdmin({ userRole }: SectionCustomizerAdminProps) {
  const [settings, setSettings] = useState<AdvancedAddonsSettings | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [activePage, setActivePage] = useState<'raincoat' | 'bikecover' | 'combo' | 'boxer' | 'global'>('raincoat');
  const [activeSection, setActiveSection] = useState<string>('raincoat_hero');
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  
  // Visual Editor options states
  const [editorMode, setEditorMode] = useState<'classic' | 'visual'>('classic');
  const [previewDevice, setPreviewDevice] = useState<'mobile' | 'tablet' | 'desktop'>('mobile');
  const [previewTab, setPreviewTab] = useState<'mockup' | 'iframe'>('mockup');

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
    },
    combo_hero: {
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
    },
    combo_video: {
      bgColor: '#ffffff',
      textColor: '#0f172a',
      textAlign: 'center',
      fontSize: 'default',
      image_url: '',
      icon_text: '১০০% বাস্তব ডেমো এবং কোয়ালিটি টেস্ট ভিডিও',
      title_1: 'আমাদের কম্বো প্রোডাক্টের সরাসরি লাইভ রিভিউ দেখুন!',
      title_2: 'সরাসরি ভিডিওতে দেখুন রেইনকোট ও বাইক কভারের গুণগত মান ও পানির প্রতিরোধ ক্ষমতা।',
      body: 'ভিডিও দুটি প্লে করে দেখে নিন আমাদের প্রিমিয়াম কম্বোর কার্যকারিতা। কোনো ভিডিও এডিটিং ছাড়া শতভাগ খাঁটি রিভিউ ভিডিও।',
      video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      video_url_2: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      visible_mobile: true,
      visible_desktop: true,
      padding_vertical: 'normal'
    },
    combo_gallery: {
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
    },
    combo_features: {
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
    },
    combo_checkout: {
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
    },
    boxer_hero: {
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
    },
    boxer_specs: {
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
    },
    boxer_video: {
      bgColor: '#0f172a',
      textColor: '#ffffff',
      textAlign: 'center',
      fontSize: 'default',
      icon_text: '১০০% বাস্তব কোয়ালিটি রিভিউ ভিডিও',
      title_1: 'আমাদের বক্সারের সরাসরি লাইভ ও কোয়ালিটি ফিডব্যাক ভিডিও দেখুন',
      title_2: 'কেন আমাদের বক্সার বাজারে সবচেয়ে সেরা কোয়ালিটির তা সরাসরি ভিডিওতে দেখুন।',
      body: 'কোনো এডিটিং ছাড়া শতভাগ খাঁটি ওপেনিং ও চমৎকার সুইং ডেমোস্ট্রেশন লাইভ টেস্ট রিভিউ ভিডিও।',
      video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      visible_mobile: true,
      visible_desktop: true,
      padding_vertical: 'normal'
    },
    boxer_gallery: {
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
    },
    boxer_checkout: {
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

        // Fetch products as well
        const prod = await getProductsFromFirestore();
        if (prod && prod.length > 0) {
          setProducts(prod);
        } else {
          const list = localStorage.getItem('raincoat_shop_products');
          if (list) {
            try {
              setProducts(JSON.parse(list));
            } catch (e) {}
          }
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

  // Helper to compress images browser-side using HTML5 canvas
  const compressImage = (file: File, maxWidth = 800, maxHeight = 800, quality = 0.55): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > maxWidth || height > maxHeight) {
            if (width > height) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            } else {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            // Export compressed JPEG as base64 to ensure small file size
            const base64 = canvas.toDataURL('image/jpeg', quality);
            resolve(base64);
          } else {
            resolve(e.target?.result as string);
          }
        };
        img.onerror = () => {
          resolve(e.target?.result as string);
        };
        img.src = e.target?.result as string;
      };
      reader.onerror = () => {
        resolve('');
      };
      reader.readAsDataURL(file);
    });
  };

  // Upload/Compress card image in browser
  const handleCardImageUpload = async (index: number, file: File) => {
    const validExtensions = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validExtensions.includes(file.type)) {
      alert('শুধুমাত্র JPG, PNG অথবা WEBP ইমেজ আপলোড করা যাবে!');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('ইমেজের সাইজ অতিরিক্ত বড় (১০ মেগাবাইটের নীচে ইমেজ ট্রাই করুন)!');
      return;
    }

    try {
      const compressedBase64 = await compressImage(file);
      if (compressedBase64) {
        handleUpdateCardValue(index, 'imageUrl', compressedBase64);
      }
    } catch (err) {
      console.error("Card Image compression failed", err);
      alert('ছবি প্রসেস করতে ব্যর্থ হয়েছে। অনুগ্রহ করে অন্য ছবি চেষ্টা করুন।');
    }
  };

  // Upload/Compress general section image in browser
  const handleSectionImageUpload = async (sectionKey: string, file: File) => {
    const validExtensions = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validExtensions.includes(file.type)) {
      alert('শুধুমাত্র JPG, PNG অথবা WEBP ইমেজ আপলোড করা যাবে!');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('ইমেজের সাইজ অতিরিক্ত বড় (১০ মেগাবাইটের নীচে ইমেজ ট্রাই করুন)!');
      return;
    }

    try {
      const compressedBase64 = await compressImage(file);
      if (compressedBase64) {
        handleUpdateValue(sectionKey, 'image_url', compressedBase64);
      }
    } catch (err) {
      console.error("Section Image compression failed", err);
      alert('ছবি প্রসেস করতে ব্যর্থ হয়েছে। অনুগ্রহ করে অন্য ছবি চেষ্টা করুন।');
    }
  };

  // Render Visual Editing Mockup with interactive inline text editing
  const renderVisualMockup = () => {
    const data = currentSectionData || {
      bgColor: '#0f172a',
      textColor: '#ffffff',
      textAlign: 'left',
      fontSize: 'default',
      image_url: '',
      icon_text: '১০০% প্রিমিয়াম ওয়াটারপ্রুফ গিয়ার',
      title_1: 'ঝুম বৃষ্টি কিংবা ঝড়ো হাওয়া—',
      title_2: 'বাইরে বের হতে আর কোনো ভয় নেই!',
      body: 'বিস্তারিত বর্ণনা...'
    };

    const padClass = data.padding_vertical === 'compact' ? 'py-4 px-4' : data.padding_vertical === 'generous' ? 'py-14 px-6' : 'py-8 px-5';
    const alignStyle = data.textAlign === 'center' ? 'text-center items-center' : data.textAlign === 'right' ? 'text-right items-end' : 'text-left items-start';

    // 1. Triple Alternative Cards rendering
    if (activeSection === 'bike_triple_cards') {
      const cardsArray = settings?.bike_triple_cards || defaultTripleCards;
      return (
        <div className="p-4 bg-slate-50 w-full min-h-[450px]">
          <div className="text-center mb-6">
            <span className="text-[10px] uppercase font-black text-slate-400">৩-ইমেজ অল্টারনেটিভ কার্ড সেকশন</span>
            <h4 className="text-sm font-black text-slate-800">স্পেসিফিকেশন ও কভারেজ</h4>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {cardsArray.map((card: any, idx: number) => (
              <div key={idx} className="bg-white rounded-xl overflow-hidden border border-slate-200 p-3.5 shadow-xs">
                <div className="flex gap-3">
                  <div className="w-16 h-16 shrink-0 bg-slate-100 rounded-lg overflow-hidden relative">
                    {card.imageUrl ? (
                      <img src={card.imageUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-full h-full bg-slate-200 flex items-center justify-center text-xs">📷</div>
                    )}
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <input
                      type="text"
                      value={card.title}
                      onChange={(e) => handleUpdateCardValue(idx, 'title', e.target.value)}
                      className="w-full text-xs font-black bg-transparent border-b border-dashed border-slate-300 hover:border-slate-500 outline-none p-0 focus:border-indigo-500 text-slate-850"
                    />
                    <textarea
                      rows={2}
                      value={card.description}
                      onChange={(e) => handleUpdateCardValue(idx, 'description', e.target.value)}
                      className="w-full text-[10px] leading-normal bg-transparent border-b border-dashed border-slate-200 hover:border-slate-400 outline-none p-0 resize-none text-slate-500 focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // Homepage products manual customizer visual mockup
    if (activeSection === 'homepage_products_customizer') {
      const isManual = !!settings?.homepage_manual_selection_enabled;
      return (
        <div className="p-5 bg-slate-900 text-white w-full rounded-2xl shadow-inner min-h-[400px] text-center flex flex-col justify-between">
          <div className="space-y-2">
            <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-400 block">হোমপেজ ক্যাটাগরি ভিউয়ার সিমুলেটর</span>
            <h4 className="text-sm font-black text-slate-100">ক্যাটাগরি ভিত্তিক পণ্য সাজানোর রিয়েল-টাইম নমুনা</h4>
            <div className="p-2.5 inline-block bg-white/10 rounded-xl border border-white/10 text-xs font-bold text-slate-350">
              {isManual ? (
                <span className="text-emerald-400 flex items-center justify-center gap-1.5">
                  ● ম্যানুয়াল সিলেকশন মোড সচল আছে
                </span>
              ) : (
                <span className="text-amber-400 flex items-center justify-center gap-1.5">
                  ○ অটোমেটিক মোড সচল (সব প্রোডাক্ট ক্যাটাগরিভিত্তিক দেখাবে)
                </span>
              )}
            </div>
          </div>

          <div className="my-6 space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar pr-1.5 text-left">
            {Array.from(new Set(products.map(p => p.category).filter(Boolean))).map((cat: any) => {
              const selectedIds = settings?.homepage_category_products?.[cat] || [];
              const catProducts = products.filter(p => isManual ? selectedIds.includes(p.id) : p.category === cat);
              
              return (
                <div key={cat} className="space-y-1.5">
                  <span className="text-[10px] bg-indigo-550 bg-indigo-900/40 text-indigo-200 px-2 py-0.5 rounded font-bold border border-indigo-500/20">{cat} ({catProducts.length})</span>
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    {catProducts.length > 0 ? (
                      catProducts.map(p => (
                        <div key={p.id} className="bg-white/5 border border-white/10 rounded-lg p-1.5 flex gap-1.5 items-center">
                          {p.image ? (
                            <img src={p.image} className="w-6 h-6 object-cover rounded" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="w-6 h-6 bg-white/10 rounded flex items-center justify-center text-[8px]">📷</div>
                          )}
                          <div className="truncate flex-1">
                            <span className="block truncate font-bold text-slate-100">{p.title}</span>
                            <span className="font-mono text-slate-450 text-slate-400">{p.price} Tk</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <span className="text-slate-500 italic col-span-2 text-[9px]">এই ক্যাটাগরিতে কোনো পণ্য সিলেক্ট করা নেই!</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <span className="text-[9px] text-slate-400 font-medium">নিচের ডানদিকের সবুজ "ডিজাইন পাবলিশ করুন" বাটনে ক্লিক করে রিয়েলটাইমে গ্রাহকদের স্ক্রিনে পাবলিশ করুন।</span>
        </div>
      );
    }

    // 2. Product catalague mockup rendering
    if (activeSection === 'shop_catalog') {
      return (
        <div className="p-4 w-full" style={{ backgroundColor: data.bgColor, color: data.textColor }}>
          <div className={`max-w-lg mx-auto flex flex-col gap-3.5 w-full ${alignStyle}`}>
            <input
              type="text"
              value={data.icon_text || ''}
              onChange={(e) => handleUpdateValue(activeSection, 'icon_text', e.target.value)}
              className="text-[9px] font-black tracking-wider uppercase px-2.5 py-1 bg-white/10 rounded-full border border-white/20 outline-none hover:border-indigo-400 focus:border-indigo-500 text-center inline-block w-fit focus:ring-0"
              style={{ color: data.textColor, borderColor: `${data.textColor}40`, backgroundColor: `${data.textColor}15` }}
              placeholder="স্লোগান..."
            />
            <input
              type="text"
              value={data.title_1 || ''}
              onChange={(e) => handleUpdateValue(activeSection, 'title_1', e.target.value)}
              className="w-full font-black text-sm bg-transparent border-b border-dashed hover:border-indigo-400 focus:border-indigo-500 focus:ring-0 outline-none transition"
              style={{ color: data.textColor, textAlign: data.textAlign, borderColor: `${data.textColor}25` }}
              placeholder="শিরোনাম ১..."
            />
            <input
              type="text"
              value={data.title_2 || ''}
              onChange={(e) => handleUpdateValue(activeSection, 'title_2', e.target.value)}
              className="w-full font-black text-xs bg-transparent border-b border-dashed hover:border-indigo-400 focus:border-indigo-500 focus:ring-0 outline-none transition opacity-90"
              style={{ color: data.textColor, textAlign: data.textAlign, borderColor: `${data.textColor}25` }}
              placeholder="শিরোনাম ২..."
            />
            <textarea
              rows={2}
              value={data.body || ''}
              onChange={(e) => handleUpdateValue(activeSection, 'body', e.target.value)}
              className="w-full text-[10px] bg-transparent border-b border-dashed hover:border-indigo-400 focus:border-indigo-500 focus:ring-0 outline-none leading-relaxed resize-none transition opacity-80"
              style={{ color: data.textColor, textAlign: data.textAlign, borderColor: `${data.textColor}20` }}
              placeholder="বিস্তারিত বর্ণনা..."
            />
            
            {/* Products mock items */}
            <div className="grid grid-cols-2 gap-3.5 w-full mt-2">
              {[1, 2].map((id) => (
                <div key={id} className="bg-white text-slate-800 rounded-xl overflow-hidden border border-slate-200 p-2 text-left space-y-1">
                  <div className="aspect-square bg-slate-100 rounded-lg flex items-center justify-center text-sm">🧥</div>
                  <div className="text-[10px] font-black text-slate-850">Waterproof Jacket v{id}</div>
                  <div className="text-[9px] font-bold text-indigo-600">৳ ১,২৯৯.০০</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    // 3. Global parameters page mockup rendering
    if (activeSection === 'global_branding') {
      return (
        <div className="p-4 w-full" style={{ backgroundColor: data.bgColor, color: data.textColor }}>
          <div className={`max-w-lg mx-auto flex flex-col gap-3.5 w-full ${alignStyle}`}>
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-lg">🌐</div>
            <input
              type="text"
              value={data.icon_text || ''}
              onChange={(e) => handleUpdateValue(activeSection, 'icon_text', e.target.value)}
              className="text-[9px] font-black tracking-wider uppercase px-2.5 py-1 bg-white/10 rounded-full border border-white/20 outline-none hover:border-indigo-400 focus:border-indigo-500 text-center inline-block w-fit focus:ring-0"
              style={{ color: data.textColor, borderColor: `${data.textColor}40`, backgroundColor: `${data.textColor}15` }}
              placeholder="স্লোগান..."
            />
            <input
              type="text"
              value={data.title_1 || ''}
              onChange={(e) => handleUpdateValue(activeSection, 'title_1', e.target.value)}
              className="w-full font-black text-sm bg-transparent border-b border-dashed hover:border-indigo-400 focus:border-indigo-500 focus:ring-0 outline-none transition"
              style={{ color: data.textColor, textAlign: data.textAlign, borderColor: `${data.textColor}25` }}
              placeholder="থিম পরিচিতি..."
            />
            <textarea
              rows={3}
              value={data.body || ''}
              onChange={(e) => handleUpdateValue(activeSection, 'body', e.target.value)}
              className="w-full text-[10px] bg-transparent border-b border-dashed hover:border-indigo-400 focus:border-indigo-500 focus:ring-0 outline-none leading-relaxed resize-none transition opacity-80 font-medium"
              style={{ color: data.textColor, textAlign: data.textAlign, borderColor: `${data.textColor}20` }}
              placeholder="বিস্তারিত বর্ণনা..."
            />
          </div>
        </div>
      );
    }

    // 4. Standard section components rendering (Hero, features, comparison, bundle blocks)
    return (
      <div 
        className={`w-full min-h-[380px] flex flex-col justify-center transition-all ${padClass}`}
        style={{ backgroundColor: data.bgColor, color: data.textColor }}
      >
        <div className={`max-w-lg mx-auto flex flex-col gap-3.5 w-full ${alignStyle}`}>
          {/* Subheading Badge tag */}
          {data.icon_text !== undefined && (
            <input
              type="text"
              value={data.icon_text || ''}
              onChange={(e) => handleUpdateValue(activeSection, 'icon_text', e.target.value)}
              className="text-[9px] font-black tracking-wider uppercase px-2.5 py-1 bg-white/10 rounded-full border border-white/20 outline-none hover:border-indigo-400 focus:border-indigo-500 text-center inline-block w-fit focus:ring-0 transition"
              style={{ color: data.textColor, borderColor: `${data.textColor}35`, backgroundColor: `${data.textColor}15` }}
              placeholder="প্রোমোশনাল ট্যাগলাইন..."
            />
          )}

          {/* Heading 1 */}
          {data.title_1 !== undefined && (
            <input
              type="text"
              value={data.title_1 || ''}
              onChange={(e) => handleUpdateValue(activeSection, 'title_1', e.target.value)}
              className="w-full font-black text-sm bg-transparent border-b border-dashed hover:border-indigo-400 focus:border-indigo-500 focus:ring-0 outline-none transition"
              style={{ color: data.textColor, textAlign: data.textAlign, borderColor: `${data.textColor}25` }}
              placeholder="প্রধান শিরোনাম লাইন ১..."
            />
          )}

          {/* Heading 2 */}
          {data.title_2 !== undefined && (
            <input
              type="text"
              value={data.title_2 || ''}
              onChange={(e) => handleUpdateValue(activeSection, 'title_2', e.target.value)}
              className="w-full font-black text-xs bg-transparent border-b border-dashed hover:border-indigo-400 focus:border-indigo-500 focus:ring-0 outline-none transition opacity-90"
              style={{ color: data.textColor, textAlign: data.textAlign, borderColor: `${data.textColor}25` }}
              placeholder="প্রধান শিরোনাম লাইন ২ (ঐচ্ছিক)..."
            />
          )}

          {/* Banner picture inside preview */}
          {data.image_url && (
            <div className="w-full my-1.5 h-[130px] rounded-xl overflow-hidden shadow-sm border border-black/10 bg-white flex items-center justify-center">
              <img src={data.image_url} alt="Section Image" className="h-full object-contain max-h-[130px]" referrerPolicy="no-referrer" />
            </div>
          )}

          {/* Paragraph explanation body */}
          {data.body !== undefined && (
            <textarea
              rows={3}
              value={data.body || ''}
              onChange={(e) => handleUpdateValue(activeSection, 'body', e.target.value)}
              className="w-full text-[10px] bg-transparent border-b border-dashed hover:border-indigo-400 focus:border-indigo-500 focus:ring-0 outline-none leading-relaxed resize-none transition opacity-80"
              style={{ color: data.textColor, textAlign: data.textAlign, borderColor: `${data.textColor}20` }}
              placeholder="বিস্তারিত বর্ণনা লিখুন এখানে..."
            />
          )}

          {/* Video Section Mockup buttons */}
          {activeSection === 'raincoat_live_video' && (
            <div className="w-full aspect-video bg-black/60 border border-white/10 rounded-2xl flex flex-col justify-center items-center cursor-pointer select-none group hover:bg-black/70 transition">
              <div className="w-10 h-10 rounded-full bg-red-601 bg-red-600 flex items-center justify-center text-white text-base shadow-lg group-hover:scale-105 transition">▶</div>
              <span className="text-[9px] text-slate-300 mt-2 font-mono">{data.video_url || 'YouTube Video Player (Mock)'}</span>
            </div>
          )}

          {activeSection === 'combo_video' && (
            <div className="grid grid-cols-2 gap-2.5 w-full mt-2">
              <div className="aspect-video bg-slate-900 border border-white/10 rounded-xl flex flex-col justify-center items-center select-none cursor-pointer">
                <div className="w-7 h-7 rounded-full bg-red-600 flex items-center justify-center text-white text-xs">▶</div>
                <span className="text-[8px] text-slate-400 mt-1 truncate max-w-full px-1">{data.video_url || 'Video 1'}</span>
              </div>
              <div className="aspect-video bg-slate-900 border border-white/10 rounded-xl flex flex-col justify-center items-center select-none cursor-pointer">
                <div className="w-7 h-7 rounded-full bg-red-600 flex items-center justify-center text-white text-xs">▶</div>
                <span className="text-[8px] text-slate-400 mt-1 truncate max-w-full px-1">{data.video_url_2 || 'Video 2'}</span>
              </div>
            </div>
          )}

          {/* Gallery Section Mockup */}
          {activeSection === 'combo_gallery' && (
            <div className="grid grid-cols-3 gap-2 w-full mt-2">
              {(data.gallery_images || []).slice(0, 6).map((imgUrl: string, idx: number) => (
                <div key={idx} className="aspect-square bg-white border border-slate-200 rounded-lg overflow-hidden flex items-center justify-center">
                  {imgUrl ? (
                    <img src={imgUrl} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <span className="text-slate-400 text-[10px]">Image {idx + 1}</span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* CTA Buttons in hero/packages */}
          {(activeSection.includes('hero') || activeSection === 'raincoat_bundle') && (
            <div className="pt-2.5">
              <button className="bg-amber-400 text-slate-950 font-black px-4.5 py-1.5 rounded-lg text-[9px] shadow-sm shadow-amber-400/20 active:scale-95 transition-all">
                ⚡ আজই অর্ডার করুন (CTA Button)
              </button>
            </div>
          )}
        </div>
      </div>
    );
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
    combo: [
      { id: 'combo_hero', name: '📦 কম্বো হিরো সেকশন (Combo Hero)' },
      { id: 'combo_video', name: '🎥 ২-ভিডিও এম্বেড সেকশন' },
      { id: 'combo_gallery', name: '🖼️ রেইনকোট ৫-৬ ইমেজ গ্যালারি' },
      { id: 'combo_features', name: '💡 কম্বো প্রোডাক্ট বৈশিষ্ট্যসমূহ' },
      { id: 'combo_checkout', name: '✍️ চেকআউট শিরোনাম ও বিবরণ' }
    ],
    boxer: [
      { id: 'boxer_hero', name: '🩲 বক্সার হিরো ব্যানার (Boxer Hero)' },
      { id: 'boxer_specs', name: '🧶 বক্সার প্রিমিয়াম স্পেসিফিকেশনস' },
      { id: 'boxer_video', name: '🎥 ১-ভিডিও রিভিউ এম্বেড সেকশন' },
      { id: 'boxer_gallery', name: '🖼️ বক্সার ক্যারাসল গ্যালারি ৬-ইমেজ' },
      { id: 'boxer_checkout', name: '✍️ বক্সার চেকআউট হেডার ও বার্তা' }
    ],
    global: [
      { id: 'global_branding', name: '🌐 গ্লোবাল থিম পরিচিতি' },
      { id: 'homepage_products_customizer', name: '🏠 হোমপেজ ক্যাটাগরি প্রোডাক্ট কাস্টমাইজার' }
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

      {/* 🟢 QUICK CHANNELS CONTROLLER: EASY VIDEO & PERSISTENT LINK MANAGER */}
      <div id="quick-links-and-videos-helper-widget" className="bg-gradient-to-r from-indigo-950 via-slate-900 to-zinc-950 text-white rounded-2xl p-5 shadow-lg border border-slate-950 flex flex-col gap-4 relative overflow-hidden">
        <div className="absolute right-0 top-0 opacity-10 pointer-events-none transform translate-x-8 -translate-y-8">
          <Tv className="h-64 w-64" />
        </div>
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-indigo-400 shrink-0">
            <Tv className="h-5 w-5" />
          </div>
          <div className="space-y-0.5">
            <h3 className="text-xs font-black uppercase tracking-wider text-indigo-300">🎥 কুইক ভিডিও ও ইউটিউব লিংক ম্যানেজার (Video Settings)</h3>
            <p className="text-[11px] text-slate-300 leading-relaxed font-semibold">
              যেকোনো লাইভ ভিডিও, প্লেয়ার লিংক বা ইউটিউব ডেমো সরাসরি পেজে পরিবর্তনের সবচেয়ে সহজ পদ্ধতি। নিচের ঘরগুলোতে লিংক বসিয়ে দিয়ে উপরের বা নিচের সবুজ <b>"ডিজাইল পাবলিশ করুন"</b> বোতামে ক্লিক করলেই রিয়েল-টাইম কাস্টমার পেজগুলোতে সেভ হয়ে যাবে।
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-1.5 z-10 select-none">
          {/* 1. Raincoat Live Video */}
          <div className="bg-slate-800/60 border border-slate-750 p-3.5 rounded-xl space-y-2.5">
            <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest block">🧥 রেইনকোট পেজ ভিডিও (Raincoat Video)</span>
            <div className="space-y-1">
              <label className="text-[9px] text-slate-300 block font-bold">ইউটিউব / ফেসবুক ভিডিও লিংক:</label>
              <input 
                type="text" 
                value={settings?.section_customizations?.['raincoat_live_video']?.video_url || ''}
                onChange={(e) => handleUpdateValue('raincoat_live_video', 'video_url', e.target.value)}
                placeholder="যেমন: https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                className="w-full text-[10px] p-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="text-[9px] text-slate-400 flex items-center gap-1 pt-1 border-t border-slate-800/40">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
              <span>রিয়েল-টাইম রেইনকোট ওয়াটারপ্রুফ টেস্ট ভিডিও</span>
            </div>
          </div>

          {/* 2. Combo Premium Videos */}
          <div className="bg-slate-800/60 border border-slate-750 p-3.5 rounded-xl space-y-2.5">
            <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest block">📦 কম্বো পেজ ভিডিও ১ ও ২ (Combo Videos)</span>
            <div className="space-y-1.5">
              <div>
                <label className="text-[9px] text-slate-300 block font-bold">ভিডিও ১ (রেইনকোট টেস্ট):</label>
                <input 
                  type="text" 
                  value={settings?.section_customizations?.['combo_video']?.video_url || ''}
                  onChange={(e) => handleUpdateValue('combo_video', 'video_url', e.target.value)}
                  placeholder="যেমন: https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                  className="w-full text-[10px] p-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="text-[9px] text-slate-300 block font-bold">ভিডিও ২ (বাইক কভার টেস্ট):</label>
                <input 
                  type="text" 
                  value={settings?.section_customizations?.['combo_video']?.video_url_2 || ''}
                  onChange={(e) => handleUpdateValue('combo_video', 'video_url_2', e.target.value)}
                  placeholder="যেমন: https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                  className="w-full text-[10px] p-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* 3. Boxer Premium Video */}
          <div className="bg-slate-800/60 border border-slate-750 p-3.5 rounded-xl space-y-2.5">
            <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest block">🩲 বক্সার পেজ ভিডিও (Boxer Video)</span>
            <div className="space-y-1">
              <label className="text-[9px] text-slate-300 block font-bold">ভিডিও টেস্ট লিংক:</label>
              <input 
                type="text" 
                value={settings?.section_customizations?.['boxer_video']?.video_url || ''}
                onChange={(e) => handleUpdateValue('boxer_video', 'video_url', e.target.value)}
                placeholder="যেমন: https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                className="w-full text-[10px] p-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="text-[9px] text-slate-400 flex items-center gap-1 pt-1 border-t border-slate-800/40">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
              <span>বক্সার কাপড়ের কোয়ালিটি ডেমোস্ট্রেশন ও টেস্ট ভিডিও</span>
            </div>
          </div>
        </div>
      </div>

      {/* Editor Options Mode Bar with responsive visual layouts */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider pl-1 block sm:inline">৩. এডিটর মোড নির্বাচন (Workspace Mode):</span>
          <div className="flex gap-1.5 bg-slate-200/60 p-1 rounded-xl w-fit">
            <button
              type="button"
              onClick={() => setEditorMode('classic')}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-extrabold flex items-center gap-1.5 transition cursor-pointer ${
                editorMode === 'classic'
                  ? 'bg-slate-800 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-850'
              }`}
            >
              <Sliders className="h-3.5 w-3.5" />
              📝 ক্লাসিক ফরম এডিটর
            </button>
            <button
              type="button"
              onClick={() => setEditorMode('visual')}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-extrabold flex items-center gap-1.5 transition cursor-pointer ${
                editorMode === 'visual'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-850'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-300" />
              🎨 ভিজ্যুয়াল লাইভ এডিটর
            </button>
          </div>
        </div>

        {editorMode === 'visual' && (
          <div className="flex flex-wrap items-center gap-2.5 bg-white p-1.5 rounded-xl border border-slate-150">
            {/* Device Selector Controls */}
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg">
              <button
                type="button"
                onClick={() => setPreviewDevice('mobile')}
                className={`p-1 px-2 rounded-md text-[10px] font-extrabold flex items-center gap-1 transition cursor-pointer ${
                  previewDevice === 'mobile'
                    ? 'bg-white text-slate-800 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Smartphone className="h-3 w-3" />
                মোবাইল
              </button>
              <button
                type="button"
                onClick={() => setPreviewDevice('tablet')}
                className={`p-1 px-2 rounded-md text-[10px] font-extrabold flex items-center gap-1 transition cursor-pointer ${
                  previewDevice === 'tablet'
                    ? 'bg-white text-slate-800 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Tablet className="h-3 w-3" />
                ট্যাবলেট
              </button>
              <button
                type="button"
                onClick={() => setPreviewDevice('desktop')}
                className={`p-1 px-2 rounded-md text-[10px] font-extrabold flex items-center gap-1 transition cursor-pointer ${
                  previewDevice === 'desktop'
                    ? 'bg-white text-slate-800 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Tv className="h-3 w-3" />
                ডেস্কটপ
              </button>
            </div>

            <div className="h-4 w-px bg-slate-200" />

            {/* View Mode Tabs Selector */}
            <div className="flex gap-1 bg-slate-100 p-0.5 rounded-lg">
              <button
                type="button"
                onClick={() => setPreviewTab('mockup')}
                className={`p-1 px-2 rounded-md text-[10px] font-extrabold flex items-center gap-1 transition cursor-pointer ${
                  previewTab === 'mockup'
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Sparkles className="h-3 w-3 animate-pulse" />
                লাইভ টাইপিং এডিটর
              </button>
              <button
                type="button"
                onClick={() => setPreviewTab('iframe')}
                className={`p-1 px-2 rounded-md text-[10px] font-extrabold flex items-center gap-1 transition cursor-pointer ${
                  previewTab === 'iframe'
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Eye className="h-3 w-3" />
                ফুল সাইট আইফ্রেম
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Core Customizer Panel */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden flex flex-col lg:flex-row min-h-[500px]">

        {/* Left Side: Navigation Map of Landing page sections */}
        <div className="w-full lg:w-72 bg-slate-50 border-r border-slate-100 p-4 space-y-4 shrink-0 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="pb-3 border-b border-slate-150">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Globe className="h-4 w-4 text-slate-405" />
                ল্যান্ডিং পেজ সেকশন ম্যাপ
              </h3>
              <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">সম্পাদনা করার জন্য যেকোনো একটি সেকশনে ক্লিক করুন:</p>
            </div>

            <div className="space-y-1.5">
              {pageSections[activePage]?.map((sec) => (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => setActiveSection(sec.id)}
                  className={`w-full text-left p-3 rounded-xl border transition-all text-xs font-semibold leading-normal flex items-start gap-2 cursor-pointer ${
                    activeSection === sec.id
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-950 shadow-3xs'
                      : 'bg-white hover:bg-slate-50 border-slate-150 text-slate-650'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 animate-pulse ${
                    activeSection === sec.id ? 'bg-indigo-600' : 'bg-slate-300'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <div className="font-extrabold truncate">{sec.name}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Quick toggle between products at bottom of sidebar */}
          <div className="pt-4 border-t border-slate-150 space-y-2 select-none">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">
              সরাসরি পেজ পরিবর্তন করুন (Quick switcher)
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setActivePage('raincoat');
                  setActiveSection('raincoat_hero');
                }}
                className={`py-1.5 px-2.5 rounded-lg border text-[10px] font-bold text-center cursor-pointer transition ${
                  activePage === 'raincoat' ? 'bg-slate-900 border-slate-950 text-white shadow-2xs' : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                রেইনকোট
              </button>
              <button
                type="button"
                onClick={() => {
                  setActivePage('bikecover');
                  setActiveSection('bikecover_hero');
                }}
                className={`py-1.5 px-2.5 rounded-lg border text-[10px] font-bold text-center cursor-pointer transition ${
                  activePage === 'bikecover' ? 'bg-slate-900 border-slate-950 text-white shadow-2xs' : 'text-slate-705 text-slate-700 bg-white hover:bg-slate-50 border-slate-200'
                }`}
              >
                বাইক কভার
              </button>
              <button
                type="button"
                onClick={() => {
                  setActivePage('combo');
                  setActiveSection('combo_hero');
                }}
                className={`py-1.5 px-2.5 rounded-lg border text-[10px] font-bold text-center cursor-pointer transition ${
                  activePage === 'combo' ? 'bg-slate-900 border-slate-950 text-white shadow-2xs' : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                ডাবল কম্বো
              </button>
              <button
                type="button"
                onClick={() => {
                  setActivePage('boxer');
                  setActiveSection('boxer_hero');
                }}
                className={`py-1.5 px-2.5 rounded-lg border text-[10px] font-bold text-center cursor-pointer transition ${
                  activePage === 'boxer' ? 'bg-slate-900 border-slate-950 text-white shadow-2xs' : 'text-slate-700 bg-white hover:bg-slate-50 border-slate-200'
                }`}
              >
                মেন্স বক্সার
              </button>
              <button
                type="button"
                onClick={() => {
                  setActivePage('global');
                  setActiveSection('shop_catalog');
                }}
                className={`col-span-2 py-1.5 px-2.5 rounded-lg border text-[10px] font-bold text-center cursor-pointer transition ${
                  activePage === 'global' ? 'bg-indigo-600 border-indigo-700 text-white shadow-2xs' : 'bg-white hover:bg-indigo-50/70 border-slate-200 text-indigo-950'
                }`}
              >
                গ্লোবাল পার্ট ও স্টোর কাস্টমাইজেশন
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Editor Workspace & Live visual simulator */}
        <div className="flex-1 flex flex-col xl:flex-row min-w-0">
          
          {/* Classic Form Controller Column */}
          <div className="w-full xl:w-[460px] p-4 sm:p-6 border-b xl:border-b-0 xl:border-r border-slate-200/80 overflow-y-auto custom-scrollbar flex flex-col justify-between">
            <div className="space-y-5">
              
              {/* Active Section Header and Visibility */}
              <div className="pb-3 border-b border-slate-150 flex items-center justify-between gap-3">
                <div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">সম্পাদনা করছেন:</span>
                  <h4 className="text-xs font-black text-indigo-650 uppercase tracking-wide flex items-center gap-1">
                    <Sliders className="h-3.5 w-3.5" />
                    {pageSections[activePage]?.find(s => s.id === activeSection)?.name || 'কাস্টম সেকশন'}
                  </h4>
                </div>
              </div>

              {/* Wrapper to hide the duplicate fields down to line 1393 */}
              <div className="hidden">
                <div className={`grid gap-5 pt-1 ${editorMode === 'visual' ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
                  
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
                        className="w-full px-3 py-1.8 bg-slate-550 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none text-xs text-slate-700 font-bold cursor-pointer"
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
                          onChange={async (e) => {
                            const f = e.target.files?.[0];
                            if (f) {
                              const base64 = await compressImage(f);
                              handleUpdateValue(activeSection, 'image_url', base64);
                            }
                          }}
                          className="hidden" 
                        />
                      </label>
                    </div>

                    <input 
                      type="text" 
                      value={currentSectionData.image_url || ''}
                      onChange={(e) => handleUpdateValue(activeSection, 'image_url', e.target.value)}
                      placeholder="অথবা ফটো হোস্ট ক্যাশিং URL লিংকটি দিন..."
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-850 focus:outline-none"
                    />
                  </div>

                  {/* Visibility control switches */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-1.5">
                      <input 
                        type="checkbox" 
                        id="visible_mobile_chk"
                        checked={currentSectionData.visible_mobile}
                        onChange={(e) => handleUpdateValue(activeSection, 'visible_mobile', e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-505 cursor-pointer"
                      />
                      <label htmlFor="visible_mobile_chk" className="text-[11px] font-bold text-slate-700 cursor-pointer">📱 মোবাইলে দেখান</label>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <input 
                        type="checkbox" 
                        id="visible_desktop_chk"
                        checked={currentSectionData.visible_desktop}
                        onChange={(e) => handleUpdateValue(activeSection, 'visible_desktop', e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-505 cursor-pointer"
                      />
                      <label htmlFor="visible_desktop_chk" className="text-[11px] font-bold text-slate-700 cursor-pointer">💻 কম্পিউটারে দেখান</label>
                    </div>
                  </div>

                </div>

                {/* COLUMN 2: HEADING CONTENTS & VIDEOS */}
                <div className="space-y-4">
                  <div className="flex items-center gap-1 border-b border-slate-100 pb-1.5">
                    <Type className="h-4 w-4 text-slate-400" />
                    <h5 className="text-[11px] font-black text-slate-800 uppercase tracking-wider">ট্যাগলাইন, হেডিং ও ডেমো লিংক সমূহ</h5>
                  </div>

                  {/* Sub-header / Badge promo text */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">প্রোমোショナル ট্যাগলাইন বা ব্যাজ টেক্সট</label>
                    <input 
                      type="text" 
                      value={currentSectionData.icon_text}
                      onChange={(e) => handleUpdateValue(activeSection, 'icon_text', e.target.value)}
                      placeholder="যেমন: ১০০% প্রিমিয়াম ওয়াটারপ্রুফ গিয়ার"
                      className="w-full text-xs p-2.5 bg-slate-550 bg-slate-50 border border-slate-200 rounded-lg text-slate-850 focus:outline-none"
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

                  {/* Vertical Padding Spacing height modifier */}
                  <div className="pt-1.5">
                    <label className="block text-xs font-bold text-slate-700 mb-1">প্যাডিং স্পেসিং (Section Height / Padding)</label>
                    <select
                      value={currentSectionData.padding_vertical || 'normal'}
                      onChange={(e) => handleUpdateValue(activeSection, 'padding_vertical', e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none text-xs text-slate-750 font-bold cursor-pointer"
                    >
                      <option value="compact">কম দূরত্ব (Compact - py-6)</option>
                      <option value="normal">স্ট্যান্ডার্ড (Normal - py-10)</option>
                      <option value="generous">বিশাল এবং উচু স্পেস (Generous - py-16)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {editorMode === 'visual' ? (
              <div className="bg-indigo-50 border border-indigo-100 p-4.5 rounded-2xl flex items-start gap-3 select-none">
                <Sparkles className="h-5 w-5 text-indigo-650 shrink-0 mt-0.5 animate-pulse" />
                <div className="text-xs">
                  <strong className="text-indigo-950 font-extrabold block">লাইভ ভিজ্যুয়াল মোড সক্রিয় (Live Visual Sandbox)</strong>
                  <span className="text-indigo-700/95 mt-0.5 block leading-relaxed font-semibold">
                    ডানদিকের লাইভ সিমুলেটরে যেকোনো লেখার উপর সরাসরি ক্লিক বা টাইপ করে কন্টেন্ট ইনস্ট্যান্ট পরিবর্তন করতে পারবেন। টেক্সট বা ব্যাকগ্রাউন্ড কালার ও প্যাডিং সাইজ সূক্ষ্মভাবে বদলাতে উপরে "ফর্ম সেটিংস" মোড নির্বাচন করে কাস্টমাইজ করুন।
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-6 pt-1">

                {/* CARD 1: ডিজাইন ও কালার স্টাইল (Styles, Colors & Appearance) */}
                <div id="card-design-styles-customizer" className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
                  <div className="flex items-center gap-2 border-b border-rose-100 pb-2.5">
                    <div className="p-1.5 bg-rose-50 text-rose-600 rounded-lg shrink-0">
                      <Palette className="h-4 w-4" />
                    </div>
                    <div>
                      <h5 className="text-[11px] font-black text-slate-800 uppercase tracking-wider">১. ডিজাইন ও কালার স্টাইল (Design & Style Settings)</h5>
                      <p className="text-[9px] text-slate-400 font-medium">... ... </p>
                    </div>
                  </div>

                  {/* Background Color Customization */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-700">সেকশন ব্যাকগ্রাউন্ড কালার (Background Color)</label>
                    <div className="flex gap-2">
                      <input 
                        type="color" 
                        value={currentSectionData.bgColor}
                        onChange={(e) => handleUpdateValue(activeSection, 'bgColor', e.target.value)}
                        className="w-10 h-10 border border-slate-200 rounded-xl cursor-pointer p-0 shrink-0"
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
                    <div className="flex flex-wrap gap-1 pt-1">
                      {predefinedBgColors.map((color) => (
                        <button
                          key={color.hex}
                          type="button"
                          onClick={() => handleUpdateValue(activeSection, 'bgColor', color.hex)}
                          className="px-2 py-0.8 text-[8px] font-extrabold border border-slate-150 rounded-lg hover:border-slate-400 hover:bg-slate-50 transition cursor-pointer bg-white text-slate-600"
                          title={color.name}
                        >
                          <span className="inline-block w-1.5 h-1.5 rounded-full mr-1" style={{ backgroundColor: color.hex }}></span>
                          {color.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Text Alignments & Fonts Scale */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">টেক্সট এলাইনমেন্ট (Text Align)</label>
                      <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl w-fit border border-slate-200/60">
                        <button
                          type="button"
                          onClick={() => handleUpdateValue(activeSection, 'textAlign', 'left')}
                          className={`p-2 rounded-lg transition ${
                            currentSectionData.textAlign === 'left' ? 'bg-indigo-650 text-white shadow-xs' : 'text-slate-500 hover:bg-slate-200/70'
                          }`}
                          title="Left"
                        >
                          <AlignLeft className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateValue(activeSection, 'textAlign', 'center')}
                          className={`p-2 rounded-lg transition ${
                            currentSectionData.textAlign === 'center' ? 'bg-indigo-650 text-white shadow-xs' : 'text-slate-500 hover:bg-slate-200/70'
                          }`}
                          title="Center"
                        >
                          <AlignCenter className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateValue(activeSection, 'textAlign', 'right')}
                          className={`p-2 rounded-lg transition ${
                            currentSectionData.textAlign === 'right' ? 'bg-indigo-650 text-white shadow-xs' : 'text-slate-500 hover:bg-slate-200/70'
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
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none text-xs text-slate-750 font-bold cursor-pointer"
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
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none text-xs text-slate-755 font-bold cursor-pointer"
                    >
                      <option value="compact">কম দূরত্ব (Compact - py-6)</option>
                      <option value="normal">স্ট্যান্ডার্ড (Normal - py-10)</option>
                      <option value="generous">বিশাল এবং উচু স্পেস (Generous - py-16)</option>
                    </select>
                  </div>
                </div>

                {/* CARD 2: মিডিয়া ও ইমেজ সেটিংস (Media Files & Image Host) */}
                <div id="card-media-images-customizer" className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
                  <div className="flex items-center gap-2 border-b border-blue-100 pb-2.5">
                    <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg shrink-0">
                      <ImageIcon className="h-4 w-4" />
                    </div>
                    <div>
                      <h5 className="text-[11px] font-black text-slate-800 uppercase tracking-wider">২. মিডিয়া ফাইল ও ইমেজ হোস্ট (Media & Image Settings)</h5>
                      <p className="text-[9px] text-slate-400 font-medium">ল্যান্ডিং পেজের প্রধান ছবি, ব্যানার ও স্লাইডার সাজান</p>
                    </div>
                  </div>

                  {/* Custom Image URL background / section illustration */}
                  <div className="space-y-3">
                    <label className="block text-xs font-bold text-slate-700">সেকশন ইমেজ বা ব্যানার (Section Image URL)</label>

                    {/* Image Preview Box */}
                    {currentSectionData.image_url && (
                      <div className="w-full h-32 bg-slate-50 rounded-xl overflow-hidden relative flex items-center justify-center border border-dashed border-slate-250">
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
                      <label className="block cursor-pointer bg-slate-900 border border-slate-850 hover:bg-slate-800 active:scale-98 text-white text-[11px] font-extrabold py-2 text-center rounded-xl shadow-xs transition-all">
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
                      className="w-full text-xs p-2.5 bg-slate-555 bg-slate-50 border border-slate-200 rounded-lg text-slate-850 focus:ring-1 focus:ring-blue-500 outline-none"
                    />
                    <span className="text-[9px] text-slate-400 mt-1 block leading-relaxed font-semibold">
                      {activeSection === 'raincoat_comparison' 
                        ? 'বাজারের সাধারণ রেইনকোট বনাম আমাদের প্রিমিয়াম রেইনকোট সেকশনের প্রধান তুলনা কার্টুন/ছবি কাস্টমাইজ করুন। ফাঁকা রাখলে এটি প্রদর্শিত হবে না।'
                        : 'যেসব সেকশনে স্লাইডার বা ব্যানার রয়েছে, সেখানে ছবির লিংক দিলে তা প্রদর্শন হবে। ফাঁকা রাখলে বাই-ডিফল্ট প্রোডাক্ট ড্রপ কন্টেন্ট ব্যবহার হবে।'
                      }
                    </span>
                  </div>

                  {/* Combo/Boxer 6-Image Gallery Manager */}
                  {(activeSection === 'combo_gallery' || activeSection === 'boxer_gallery') && (
                    <div className="space-y-3.5 border-t border-slate-100 pt-3.5">
                      <span className="text-amber-600 font-extrabold text-[10px] uppercase block tracking-wider">🖼️ গ্যালারি ৬-ইमेज कैटलॉग সেটিংস</span>
                      <p className="text-[9px] text-slate-400 font-bold leading-normal">গ্যালারির ৫-৬টি ছবির সরাসরি প্রাকদর্শন ও আপলোড লিঙ্ক:</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        {[0, 1, 2, 3, 4, 5].map((idx) => {
                          const imgs = currentSectionData.gallery_images || [];
                          const currentVal = imgs[idx] || '';
                          return (
                            <div key={idx} className="bg-slate-50 p-3 rounded-xl border border-slate-250/70 space-y-2">
                              <div className="flex justify-between items-center text-[9px] font-black text-slate-600 uppercase">
                                <span>ছবি নং: {idx + 1}</span>
                                {currentVal && <span className="text-emerald-600">✓ সংযুক্ত</span>}
                              </div>
                              
                              {currentVal && (
                                <div className="h-12 w-full rounded-md overflow-hidden bg-white border border-slate-200 flex items-center justify-center">
                                  <img src={currentVal} alt={`Thumb ${idx + 1}`} className="h-full object-contain" referrerPolicy="no-referrer" />
                                </div>
                              )}

                              <label className="block cursor-pointer bg-white border border-slate-350 hover:bg-slate-50 text-slate-700 text-[9px] font-black py-1 text-center rounded-lg shadow-3xs transition-all">
                                📤 আপলোড ({idx + 1})
                                <input 
                                  type="file" 
                                  accept="image/*"
                                  onChange={async (e) => {
                                    const f = e.target.files?.[0];
                                    if (f) {
                                      const base64 = await compressImage(f);
                                      const newImgs = [...imgs];
                                      newImgs[idx] = base64;
                                      handleUpdateValue(activeSection, 'gallery_images', newImgs);
                                    }
                                  }}
                                  className="hidden" 
                                />
                              </label>

                              <input 
                                type="text"
                                value={currentVal}
                                onChange={(e) => {
                                  const newImgs = [...imgs];
                                  newImgs[idx] = e.target.value;
                                  handleUpdateValue(activeSection, 'gallery_images', newImgs);
                                }}
                                placeholder="অথবা https://example.com/photo.jpg"
                                className="w-full text-[9px] px-2 py-1.5 bg-white border border-slate-200 rounded text-slate-800 focus:outline-none"
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* CARD 3: ভিডিও ও অ্যাকশন বোতাম সেটিংস (Links, Videos & Playback) */}
                <div id="card-links-videos-customizer" className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
                  <div className="flex items-center gap-2 border-b border-amber-100 pb-2.5">
                    <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg shrink-0">
                      <Tv className="h-4 w-4" />
                    </div>
                    <div>
                      <h5 className="text-[11px] font-black text-slate-800 uppercase tracking-wider">৩. লিংক, ভিডিও ও অ্যাকশন বাটন সেটিংস (Links & Video Player)</h5>
                      <p className="text-[9px] text-slate-400 font-medium">ভিডিও রিভিও ক্লিপ প্লেয়ার ও বাটন রিডাইরেক্ট সেটিংস</p>
                    </div>
                  </div>

                  {/* Videos block for different sections */}
                  {(activeSection === 'raincoat_live_video' || activeSection === 'boxer_video') && (
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700 mb-1">ইউটিউব / ফেসবুক ভিডিও লিংক (YouTube / Video URL)</label>
                      <input 
                        type="text" 
                        value={currentSectionData.video_url || ''}
                        onChange={(e) => handleUpdateValue(activeSection, 'video_url', e.target.value)}
                        placeholder="যেমন: https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                        className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-855 focus:outline-none"
                      />
                    </div>
                  )}

                  {activeSection === 'combo_video' && (
                    <div className="space-y-4 pt-1">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">முதல் ভিডিও লিংক (Raincoat Review Video 1)</label>
                        <input 
                          type="text" 
                          value={currentSectionData.video_url || ''}
                          onChange={(e) => handleUpdateValue(activeSection, 'video_url', e.target.value)}
                          placeholder="যেমন: https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                          className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-850 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">দ্বিতীয় ভিডিও লিংক (Bike Cover Review Video 2)</label>
                        <input 
                          type="text" 
                          value={currentSectionData.video_url_2 || ''}
                          onChange={(e) => handleUpdateValue(activeSection, 'video_url_2', e.target.value)}
                          placeholder="যেমন: https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                          className="w-full text-xs p-2.5 bg-slate-550 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none"
                        />
                      </div>
                    </div>
                  )}

                  {activeSection !== 'raincoat_live_video' && activeSection !== 'boxer_video' && activeSection !== 'combo_video' && (
                    <div className="bg-slate-50 p-4 border border-slate-200 rounded-xl space-y-1 text-center select-none">
                      <span className="text-[11px] font-bold text-slate-600 block">কোনো অ্যাক্টিভ সেকশন ভিডিও উপলব্ধ নয়</span>
                      <p className="text-[9px] text-slate-400">এই সেকশনে সরাসরি ভিডিও লিঙ্কের সুযোগ নেই। ভিডিও বদলাতে চাইলে বামে "ভিডিও সেকশন" বা কুইক চ্যানেলে যান।</p>
                    </div>
                  )}
                </div>

                {/* CARD 4: কন্টেন্ট ও কপিরাইটিং সেটিংস (Copywriting Content) */}
                <div id="card-content-texts-customizer" className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
                  <div className="flex items-center gap-2 border-b border-indigo-100 pb-2.5">
                    <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg shrink-0">
                      <Type className="h-4 w-4" />
                    </div>
                    <div>
                      <h5 className="text-[11px] font-black text-slate-800 uppercase tracking-wider">৪. টেক্সট কন্টেন্ট ও কপিরাইটিং (Content & Titles)</h5>
                      <p className="text-[9px] text-slate-400 font-medium pb-0.5">শিরোনাম, স্লোগান, সাব-হেডার ও প্যারাগ্রাফের বিবরণী</p>
                    </div>
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
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-850 focus:outline-none font-bold"
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

          {/* Visual Live Device Simulator Panel */}
          {editorMode === 'visual' && (
            <div className="flex-1 bg-slate-100 p-4 sm:p-6 flex flex-col justify-start items-center min-h-[500px] overflow-hidden border-t xl:border-t-0 border-slate-200/80">
              
              {/* Simulator Device Frame wrapper */}
              <div 
                className="bg-white rounded-3xl shadow-xl border border-slate-350 overflow-hidden flex flex-col transition-all duration-300 w-full"
                style={{
                  maxWidth: previewDevice === 'mobile' ? '360px' : previewDevice === 'tablet' ? '680px' : '100%',
                  minHeight: '480px',
                  maxHeight: '740px',
                }}
              >
                
                {/* Browser address bar chrome */}
                <div className="bg-slate-150 px-4 py-2 border-b border-slate-200 flex items-center justify-between select-none text-[10px] font-mono text-slate-400 shrink-0">
                  <div className="flex gap-1 shrink-0">
                    <span className="w-1.5 h-1.5 bg-rose-400 rounded-full"></span>
                    <span className="w-1.5 h-1.5 bg-amber-400 rounded-full"></span>
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></span>
                  </div>
                  <div className="flex-1 max-w-[280px] mx-auto text-center bg-white border border-slate-200 py-0.5 rounded text-slate-500 font-sans font-extrabold text-[10px] truncate px-1.5">
                    🌐 raincoat-factory.bd/{activePage === 'combo' ? 'rancoatcovercombo' : activePage === 'boxer' ? 'boxer' : activePage}
                  </div>
                  <div className="shrink-0 flex items-center gap-1.5 font-sans">
                    {previewTab === 'iframe' && (
                      <button
                        type="button"
                        onClick={() => {
                          const iframe = document.getElementById('preview-iframe') as HTMLIFrameElement;
                          if (iframe) iframe.src = iframe.src;
                        }}
                        className="hover:text-indigo-600 transition p-0.5 cursor-pointer text-slate-500"
                        title="রিফ্রেশ প্রিভিউ"
                      >
                        <RefreshCw className="h-3 w-3" />
                      </button>
                    )}
                    <span className="text-[9px] font-black text-slate-500 uppercase">{previewDevice}</span>
                  </div>
                </div>

                {/* Simulator Inner Workspace */}
                <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50 flex flex-col justify-start">
                  
                  {previewTab === 'iframe' ? (
                    <div className="w-full h-full min-h-[440px] bg-white relative flex-1">
                      <iframe
                        id="preview-iframe"
                        src={`${window.location.origin}${activePage === 'raincoat' ? '/raincoat' : activePage === 'bikecover' ? '/bikecover' : activePage === 'combo' ? '/rancoatcovercombo' : '/boxer'}`}
                        className="w-full h-full min-h-[440px] border-0"
                        title="Visual Site Preview iframe"
                      />
                      <div className="absolute bottom-2.5 right-2.5 bg-indigo-900/90 text-white text-[9px] font-black px-2.5 py-1 rounded-lg backdrop-blur-xs select-none pointer-events-none uppercase tracking-wide">
                        আইফ্রেম লাইভ
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-full flex flex-col justify-start flex-1">
                      {renderVisualMockup()}
                    </div>
                  )}

                </div>

              </div>
              
              {/* Floating micro instruction tip */}
              <div className="mt-3 text-center text-[10px] text-slate-500 font-bold flex items-center gap-1 justify-center max-w-md px-4 leading-normal">
                <Sparkles className="h-3.5 w-3.5 text-indigo-500 animate-pulse shrink-0" />
                <span>প্রিভিউতে ড্যাশবোর্ডে সরাসরি লেখার উপর টাইপ করে টেক্সট ইনস্ট্যান্ট রি-ফিট করুন! পরিবর্তনগুলো পার্মানেন্টলি সেভ করতে ডানদিকের "ডিজাইন পাবলিশ করুন" বাটনে ক্লিক করে ক্লাউডে পোস্ট করুন।</span>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
}
