import React, { useState } from 'react';
import { 
  Globe, 
  Sparkles, 
  ShoppingBag, 
  Layers, 
  ChevronRight, 
  Copy, 
  Check, 
  ExternalLink,
  Code,
  FileText,
  Search,
  ArrowLeft
} from 'lucide-react';

interface SitemapItem {
  url: string;
  label: string;
  type: 'core' | 'landing' | 'product';
  priority: number;
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly';
  description: string;
}

export default function SitemapPanel() {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedXml, setCopiedXml] = useState(false);
  const [activeTab, setActiveTab] = useState<'visual' | 'xml'>('visual');
  const [searchQuery, setSearchQuery] = useState('');

  const sitemapItems: SitemapItem[] = [
    // Core pages
    {
      url: '/',
      label: 'হোমপেজ (Alibaba/Amazon Marketplace)',
      type: 'core',
      priority: 1.0,
      changefreq: 'daily',
      description: 'রেইনকোট ফ্যাক্টরির সম্পূর্ণ মার্কেটপ্লেস ও প্রোডাক্ট ক্যাটালগ।'
    },
    {
      url: '/shop',
      label: 'শপ বাজার (Full Product Grid Shop)',
      type: 'core',
      priority: 0.9,
      changefreq: 'daily',
      description: 'সহজ ফিল্টারিং সহ সমস্ত প্রোডাক্ট কেনার গ্রিড।'
    },
    {
      url: '/cart',
      label: 'শপিং কার্ট ও চেকআউট (Interactive Cart)',
      type: 'core',
      priority: 0.8,
      changefreq: 'always',
      description: 'অর্ডার সুনিশ্চিত করার শপিং কার্ট ও চেকআউট পেইজ।'
    },
    {
      url: '/track-order',
      label: 'অর্ডার ট্র্যাকিং প্যানেল (Order Tracking)',
      type: 'core',
      priority: 0.8,
      changefreq: 'always',
      description: 'মোবাইল নাম্বার বা অর্ডার আইডি ব্যবহার করে লাইভ ডেলিভারি স্ট্যাটাস।'
    },
    {
      url: '/order-history',
      label: 'অর্ডার হিস্টোরি (Customer Order Log)',
      type: 'core',
      priority: 0.7,
      changefreq: 'weekly',
      description: 'গ্রাহকের পূর্ববর্তী সফল ও পেন্ডিং অর্ডার সমূহের তালিকা।'
    },
    {
      url: '/write-review',
      label: 'রিভিউ ও ফিডব্যাক লিখুন (Write Review)',
      type: 'core',
      priority: 0.6,
      changefreq: 'monthly',
      description: 'গ্রাহকদের মতামত ও রেটিং প্রদানের বিশেষ ফর্ম।'
    },

    // Landing pages
    {
      url: '/raincoat',
      label: '১০০% প্রিমিয়াম রেইনকোট ল্যান্ডিং পেইজ',
      type: 'landing',
      priority: 0.9,
      changefreq: 'weekly',
      description: 'থার্মাল হিট সিল করা বাইকিং ও হাইকিং রেইনকোট কালেকশন।'
    },
    {
      url: '/bikecover',
      label: 'ডাস্টপ্রুফ ও হিট সিল্ড বাইক কাভার ল্যান্ডিং পেইজ',
      type: 'landing',
      priority: 0.8,
      changefreq: 'weekly',
      description: 'বাইকের সুরক্ষায় শতভাগ ওয়াটারপ্রুফ আল্ট্রা-প্রিমিয়াম কাভার।'
    },
    {
      url: '/rancoatcovercombo',
      label: 'রেইনকোট ও বাইক কাভার সুপার কম্বো ডিল (Combo Landing)',
      type: 'landing',
      priority: 0.9,
      changefreq: 'weekly',
      description: 'বর্ষাকালের ধামাকা স্পেশাল কম্বো অফার পেইজ।'
    },
    {
      url: '/boxer',
      label: 'হিম-শীতল আরামদায়ক কটন বক্সার ল্যান্ডিং পেইজ (Boxer combo)',
      type: 'landing',
      priority: 0.9,
      changefreq: 'weekly',
      description: '১০০% প্রিমিয়াম সুতি কম্বো বক্সার স্লিভ শর্টস প্যানেল।'
    },

    // Products
    {
      url: '/product/premium-waterproof-raincoat',
      label: 'Premium Waterproof Raincoat and Pants Set',
      type: 'product',
      priority: 0.8,
      changefreq: 'weekly',
      description: '১০০% সিলড থার্মাল কোটিং রেইনপ্রুফ জ্যাকেট প্যান্ট সেট।'
    },
    {
      url: '/product/heavy-duty-waterproof-motorcycle-shoe-cover',
      label: 'Heavy Duty Waterproof Motorcycle Shoe Cover (Shoe Guard)',
      type: 'product',
      priority: 0.8,
      changefreq: 'weekly',
      description: 'বর্ষায় জুতো কাদা-পানি থেকে সুরক্ষিত রাখার মজবুত কাভার।'
    },
    {
      url: '/product/double-part-windproof-umbrella',
      label: 'Double Part Windproof Umbrella (Premium Laptop Defense)',
      type: 'product',
      priority: 0.8,
      changefreq: 'weekly',
      description: 'ঝড়ো বাতাসে উল্টে না যাওয়া ক্যাটারপিলার ডিজাইন ছাতা।'
    },
    {
      url: '/product/motorcycle-handlebar-waterproof-gloves',
      label: 'Motorcycle Handlebar Waterproof Hand Gloves',
      type: 'product',
      priority: 0.7,
      changefreq: 'weekly',
      description: 'বাইকারদের বর্ষা ও শীতে আরামদায়ক ড্রাই হ্যান্ডলার গ্লাভস।'
    },
    {
      url: '/product/premium-self-locking-bike-mobile-holder',
      label: 'Premium Self-Locking Waterproof Bike Mobile Holder',
      type: 'product',
      priority: 0.7,
      changefreq: 'weekly',
      description: 'ধাক্কা প্রতিরোধী শতভাগ পানিনিরোধী মোবাইল ধারক।'
    },
    {
      url: '/product/backpack-waterproof-ultra-shield',
      label: 'Backpack Waterproof Ultra-Shield Rain Cover',
      type: 'product',
      priority: 0.7,
      changefreq: 'weekly',
      description: 'ব্যাগ ও ভেতরের মূল্যবান ল্যাপটপ শুকনা রাখার হাইপার কাভার।'
    },
    {
      url: '/product/sports-ultra-light-windbreaker',
      label: 'Sports Ultra-Light Breathable Windbreaker Rain Jacket',
      type: 'product',
      priority: 0.7,
      changefreq: 'weekly',
      description: 'অত্যন্ত হালকা ট্র্যাকিং ও অ্যাথলেটিক্স উইন্ডব্রেকার ভেস্ট।'
    },
    {
      url: '/product/kids-funny-cartoon-raincoat',
      label: 'Kids Funny Cartoon Waterproof Raincoat',
      type: 'product',
      priority: 0.7,
      changefreq: 'weekly',
      description: 'স্কুলগামী বাচ্চাদের জন্য আকর্ষণীয় কমফোর্ট ওয়াটারপ্রুফ কোট।'
    },
    {
      url: '/product/ladies-classic-long-belt-raincoat',
      label: 'Ladies Classic Long Belted Raincoat Trail Coat',
      type: 'product',
      priority: 0.7,
      changefreq: 'weekly',
      description: 'অভিজাত নারীদের আকর্ষণীয় লং কোট ভিন্টেজ রেইন বেল্ট।'
    },
    {
      url: '/product/outdoor-travelers-waterproof-dry-bag',
      label: 'Outdoor Travelers Waterproof Dry Bag (20 Liters)',
      type: 'product',
      priority: 0.7,
      changefreq: 'weekly',
      description: 'ক্যাম্পিং ও অ্যাডভেঞ্চারে ওয়াটার ট্রাভেল প্রো ড্রাই কিট ব্যাগ।'
    },
    {
      url: '/product/night-safe-reflective-safety-vest',
      label: 'Night-Safe High-Visibility Reflective Safety Rain Vest',
      type: 'product',
      priority: 0.7,
      changefreq: 'weekly',
      description: 'ঘন কুয়াশা বা রাতে বাইকার ও ইঞ্জিনিয়ারদের হাই-ভিজিবিলিটি জ্যাকেট।'
    },
    {
      url: '/product/heavy-heat-sealed-rain-poncho',
      label: 'Heavy Heat-Sealed Premium Rain Poncho',
      type: 'product',
      priority: 0.7,
      changefreq: 'weekly',
      description: 'সহজে মাথা দিয়ে গলিয়ে নেওয়ার ওয়াটারপ্রুফ পনচো হুডিস।'
    },
    {
      url: '/product/silicon-elastic-anti-slip-shoe-cover',
      label: 'Silicon Elastic Anti-Slip Rain Shoe Cover (Pocket Size)',
      type: 'product',
      priority: 0.7,
      changefreq: 'weekly',
      description: 'অত্যন্ত ইলাস্টিক পকেট-বান্ধব দীর্ঘস্থায়ী সিলিকন সু শিল্ড।'
    },
    {
      url: '/product/premium-bike-cover',
      label: '100% Waterproof & Dustproof Premium Bike Cover',
      type: 'product',
      priority: 0.8,
      changefreq: 'weekly',
      description: 'রোদ, বৃষ্টি ও ধুলোবালি থেকে দ্বিগুণ সুরক্ষী বাইকিং কাভার।'
    }
  ];

  const filteredItems = sitemapItems.filter(item => {
    const searchableText = `${item.url} ${item.label} ${item.description}`.toLowerCase();
    return searchableText.includes(searchQuery.toLowerCase());
  });

  const handleCopy = (url: string, index: number) => {
    const fullUrl = `${window.location.origin}${url}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const dynamicXmlSnippet = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapItems.map(item => `  <url>
    <loc>${window.location.origin}${item.url}</loc>
    <lastmod>${new Date().toISOString().substring(0, 10)}</lastmod>
    <changefreq>${item.changefreq}</changefreq>
    <priority>${item.priority.toFixed(1)}</priority>
  </url>`).join('\n')}
</urlset>`;

  const handleCopyXml = () => {
    navigator.clipboard.writeText(dynamicXmlSnippet);
    setCopiedXml(true);
    setTimeout(() => setCopiedXml(false), 2000);
  };

  const coreItems = filteredItems.filter(i => i.type === 'core');
  const landingItems = filteredItems.filter(i => i.type === 'landing');
  const productItems = filteredItems.filter(i => i.type === 'product');

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-rose-600 selection:text-white flex flex-col justify-start">
      {/* Alert Header strip */}
      <div className="bg-gradient-to-r from-teal-700 via-pink-600 to-indigo-800 text-center py-2 px-4 shadow-md text-xs font-bold leading-tight flex justify-center items-center gap-1.5 shrink-0">
        <Sparkles className="h-3 text-yellow-300 animate-pulse" />
        <span>রেইনকোট ফ্যাক্টরি ও বক্সার কম্বো সাইট ম্যাপ ডিরেক্টরি সূচী (Search Engine Index Console)</span>
      </div>

      {/* Main Container */}
      <main className="max-w-5xl w-full mx-auto p-4 sm:p-8 flex-1 flex flex-col justify-start gap-6">
        
        {/* Banner Card */}
        <div className="bg-slate-800 rounded-2xl p-6 sm:p-8 border border-white/5 relative overflow-hidden shadow-2xl shrink-0">
          <div className="absolute top-0 right-0 p-12 bg-indigo-500/10 rounded-full blur-3xl" />
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="bg-indigo-500/10 text-indigo-400 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border border-indigo-500/20">
                SEO Directory
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
                <Globe className="h-6 w-6 text-indigo-400 shrink-0" />
                অফিসিয়াল সাইটম্যাপ প্যানেল
              </h1>
              <p className="text-slate-400 text-xs sm:text-sm font-medium leading-relaxed max-w-xl">
                সার্চ ইঞ্জিন ক্রলার ও কাস্টমারদের সহায়তায় আমাদের রেনকোডের বাজারের সমস্ত লিঙ্ক ও ল্যান্ডিং পেইজ সমূহের গতিশীল সুবিন্যস্ত তালিকা।
              </p>
            </div>

            <button 
              onClick={() => {
                window.history.pushState(null, '', '/');
                window.dispatchEvent(new Event('popstate'));
              }}
              className="flex items-center gap-1 text-slate-400 hover:text-white text-xs font-bold bg-slate-700/50 hover:bg-slate-750 px-3.5 py-2 rounded-xl transition border border-white/5 cursor-pointer shrink-0"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> হোম পেইজ
            </button>
          </div>
        </div>

        {/* Tab & Search controllers */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-slate-800/40 p-3.5 rounded-2xl border border-white/5 shrink-0">
          {/* Tabs switch */}
          <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-white/5 self-start">
            <button
              onClick={() => setActiveTab('visual')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-black tracking-wide transition cursor-pointer ${
                activeTab === 'visual'
                  ? 'bg-slate-800 text-white shadow-sm border border-white/5'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="h-3.5 w-3.5" /> লেআউট ভিউ
            </button>
            <button
              onClick={() => setActiveTab('xml')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-black tracking-wide transition cursor-pointer ${
                activeTab === 'xml'
                  ? 'bg-slate-800 text-white shadow-sm border border-white/5'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Code className="h-3.5 w-3.5" /> XML সোর্স
            </button>
          </div>

          {/* Real-time search inside visual items */}
          {activeTab === 'visual' && (
            <div className="flex-1 max-w-sm relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input 
                type="text" 
                placeholder="নির্দিষ্ট পেইজ বা প্রোডাক্ট খুঁজুন..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-white/5 rounded-xl py-2 pl-9 pr-4 text-xs font-medium text-white placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition"
              />
            </div>
          )}
        </div>

        {/* Contents area */}
        {activeTab === 'visual' ? (
          <div className="space-y-8 pb-10">
            
            {/* Core pages block */}
            {coreItems.length > 0 && (
              <div className="space-y-3.5 bg-slate-800/15 p-1 rounded-2xl">
                <div className="flex items-center gap-2 px-3.5">
                  <span className="w-2 h-2 bg-indigo-500 rounded-full" />
                  <h3 className="text-sm font-black tracking-wider text-slate-300 uppercase">মূল সার্ভিস পেইজ সমূহ ({coreItems.length})</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {coreItems.map((item, idx) => {
                    const globalIdx = sitemapItems.findIndex(i => i.url === item.url);
                    return renderListItem(item, globalIdx);
                  })}
                </div>
              </div>
            )}

            {/* Landing pages block */}
            {landingItems.length > 0 && (
              <div className="space-y-3.5 bg-slate-800/15 p-1 rounded-2xl">
                <div className="flex items-center gap-2 px-3.5">
                  <span className="w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
                  <h3 className="text-sm font-black tracking-wider text-slate-300 uppercase">ল্যান্ডিং পেইজ শো-রুম ({landingItems.length})</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {landingItems.map((item, idx) => {
                    const globalIdx = sitemapItems.findIndex(i => i.url === item.url);
                    return renderListItem(item, globalIdx);
                  })}
                </div>
              </div>
            )}

            {/* Product items block */}
            {productItems.length > 0 && (
              <div className="space-y-3.5 bg-slate-800/15 p-1 rounded-2xl">
                <div className="flex items-center gap-2 px-3.5">
                  <span className="w-2 h-2 bg-teal-500 rounded-full" />
                  <h3 className="text-sm font-black tracking-wider text-slate-300 uppercase">ইংরেজি টাইটেল সম্পন্ন পণ্য ডিরেক্টরি ({productItems.length})</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {productItems.map((item, idx) => {
                    const globalIdx = sitemapItems.findIndex(i => i.url === item.url);
                    return renderListItem(item, globalIdx);
                  })}
                </div>
              </div>
            )}

            {/* Empty view search filter output */}
            {filteredItems.length === 0 && (
              <div className="text-center py-12 bg-slate-800/25 rounded-2xl border border-white/5 border-dashed">
                <span className="text-4xl text-slate-600 block mb-3">🕳️</span>
                <p className="text-slate-400 text-xs font-black">আপনার খোঁজা ক্যোয়ারীর সাথে মিল থাকা কোনো পেইজ পাওয়া যায়নি।</p>
                <button 
                  onClick={() => setSearchQuery('')}
                  className="mt-3.5 px-4 py-2 bg-slate-800 text-slate-300 text-[10px] font-black rounded-lg hover:bg-slate-700 transition cursor-pointer"
                >
                  সার্চ বাতিল করুন
                </button>
              </div>
            )}

          </div>
        ) : (
          <div className="bg-slate-950 rounded-2xl border border-white/5 overflow-hidden flex flex-col flex-1 pb-10">
            <div className="bg-slate-900 border-b border-white/5 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-rose-500 rounded-full" />
                <span className="w-2.5 h-2.5 bg-amber-500 rounded-full" />
                <span className="w-2.5 h-2.5 bg-green-500 rounded-full" />
                <span className="text-[10px] font-mono text-slate-500 ml-2">sitemap.xml — Raw XML payload response</span>
              </div>

              <button
                onClick={handleCopyXml}
                className="flex items-center gap-1 bg-indigo-650 hover:bg-indigo-700 text-white text-[10px] font-black px-3.5 py-1.5 rounded-lg transition overflow-hidden shadow-sm cursor-pointer"
              >
                {copiedXml ? (
                  <>
                    <Check className="h-3 w-3 text-emerald-300" /> ক্লিপবোর্ডে কপিড!
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" /> সম্পূর্ণ XML কপি করুন
                  </>
                )}
              </button>
            </div>
            
            <pre className="p-4 sm:p-6 overflow-x-auto text-[11px] sm:text-xs font-mono text-slate-300 bg-slate-950 leading-relaxed max-h-[500px] select-all custom-scrollbar">
              <code>{dynamicXmlSnippet}</code>
            </pre>
          </div>
        )}

      </main>

      {/* Footer information */}
      <footer className="bg-slate-950 border-t border-white/5 py-6 px-4 mt-auto text-center shrink-0">
        <p className="text-[11px] text-slate-500 font-bold select-none leading-relaxed">
          সুরক্ষিত ক্রলার ইন্ডেক্সিং প্রযুক্তি • Raincoat Factory & Boxer Co.
          <br />
          সরাসরি ক্রলার রেসপন্স পেতে ব্রাউজ করুন {window.location.origin}/sitemap.xml
        </p>
      </footer>
    </div>
  );

  function renderListItem(item: SitemapItem, globalIndex: number) {
    const isCopied = copiedIndex === globalIndex;
    
    return (
      <div 
        key={item.url} 
        className="bg-slate-800 rounded-xl p-4 border border-white/5 hover:border-slate-700 hover:bg-slate-750 transition flex flex-col justify-between gap-3 group relative overflow-hidden"
      >
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-2">
            <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
              item.type === 'core' 
                ? 'bg-blue-500/10 text-blue-400' 
                : item.type === 'landing'
                  ? 'bg-rose-500/10 text-rose-400'
                  : 'bg-teal-500/10 text-teal-400'
            }`}>
              {item.type === 'core' ? 'সার্ভিস পেইজ' : item.type === 'landing' ? 'ল্যান্ডিং পেইজ' : 'ইংরেজি পণ্য'}
            </span>
            
            <div className="flex items-center gap-1 text-[9px] text-slate-400 font-mono">
              <span>ক্রিয়াশীলতা: {item.changefreq}</span>
              <span className="text-slate-600">|</span>
              <span className="font-bold text-indigo-400">অগ্রাধিকার: {item.priority.toFixed(1)}</span>
            </div>
          </div>

          <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-indigo-400 transition leading-snug">
            {item.label}
          </h4>
          
          <code className="text-[10px] font-mono text-indigo-300 block bg-slate-900 px-2 py-1 rounded border border-white/5 select-all truncate mt-2">
            {item.url}
          </code>

          <p className="text-[11px] text-slate-400 leading-normal font-medium pt-1">
            {item.description}
          </p>
        </div>

        {/* Action utility row */}
        <div className="flex items-center gap-2 pt-1 border-t border-white/5 mt-1">
          <button
            onClick={() => handleCopy(item.url, globalIndex)}
            className="flex-1 flex items-center justify-center gap-1 bg-slate-900 hover:bg-indigo-900/10 hover:text-indigo-300 text-slate-400 hover:border-indigo-500/20 py-1.5 rounded-lg text-[10px] sm:text-xs font-bold transition border border-white/5 cursor-pointer"
            title="লিঙ্ক ক্লিপবোর্ডে কপি করুন"
          >
            {isCopied ? (
              <>
                <Check className="h-3 w-3 text-emerald-400 shrink-0" /> কপিড!
              </>
            ) : (
              <>
                <Copy className="h-3 w-3 shrink-0" /> লিঙ্ক কপি
              </>
            )}
          </button>

          <button
            onClick={() => {
              window.history.pushState(null, '', item.url);
              window.dispatchEvent(new Event('popstate'));
            }}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-700 text-slate-300 border border-white/5 hover:border-slate-600 rounded-lg text-[10px] sm:text-xs font-bold flex items-center justify-center gap-1 transition cursor-pointer"
            title="পেইজে প্রবেশ করুন"
          >
            ভিজিট করুন <ExternalLink className="h-3 w-3 shrink-0" />
          </button>
        </div>
      </div>
    );
  }
}
