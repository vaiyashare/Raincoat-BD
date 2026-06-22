import React, { useState, useEffect } from 'react';
import { getSEOConfigs, saveSEOConfig, deleteSEOConfig } from '../../lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { SEOConfig } from '../../types';
import { 
  Globe, Sparkles, Check, Trash2, Search, Edit2, 
  Eye, RefreshCw, Layers, FileText, Image, ChevronRight, HelpCircle
} from 'lucide-react';

interface SEOAdminProps {
  userRole?: string;
}

export default function SEOAdmin({ userRole }: SEOAdminProps) {
  const [configs, setConfigs] = useState<SEOConfig[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Editor form state
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [path, setPath] = useState('/');
  const [seoTitle, setSeoTitle] = useState('');
  const [description, setDescription] = useState('');
  const [keywords, setKeywords] = useState('');
  const [ogImage, setOgImage] = useState('');
  const [ogTitle, setOgTitle] = useState('');
  const [ogDescription, setOgDescription] = useState('');
  
  // Quick presets list
  const prebuiltPaths = [
    { label: 'হোমপেইজ (Homepage)', value: '/' },
    { label: 'সমস্ত শপ বাজার (All Shop)', value: '/shop' },
    { label: 'প্রিমিয়াম রেইনকোট ল্যান্ডিং (Raincoat)', value: '/raincoat' },
    { label: 'মোটরসাইকেল কাভার ল্যান্ডিং (Bike Cover)', value: '/bikecover' },
    { label: 'সুপার কম্বো অফার ল্যান্ডিং (Combo Deal)', value: '/rancoatcovercombo' },
    { label: 'কটন বক্সার কম্বো ল্যান্ডিং (Boxer)', value: '/boxer' },
    { label: 'অর্ডার ট্র্যাকার পেইজ (Order Tracker)', value: '/track-order' },
    { label: 'অর্ডার হিস্টোরি (Customer History)', value: '/order-history' },
    { label: 'কার্ট পেইজ (Cart Page)', value: '/cart' },
    { label: 'কাস্টমার রিভিউ ফর্ম (Review Submission)', value: '/write-review' }
  ];

  // Load configs and products
  const loadData = async () => {
    setLoading(true);
    try {
      const items = await getSEOConfigs();
      setConfigs(items);

      // Load products to fetch slugs
      const productSnap = await getDocs(collection(db, 'products'));
      const productList = productSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProducts(productList);
    } catch (e) {
      console.error('Failed to load SEO configuration list:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const selectConfigForEdit = (config: SEOConfig) => {
    setSelectedId(config.id);
    setPath(config.path);
    setSeoTitle(config.title || '');
    setDescription(config.description || '');
    setKeywords(config.keywords || '');
    setOgImage(config.ogImage || '');
    setOgTitle(config.ogTitle || '');
    setOgDescription(config.ogDescription || '');
  };

  const handleResetForm = () => {
    setSelectedId(null);
    setPath('/');
    setSeoTitle('');
    setDescription('');
    setKeywords('');
    setOgImage('');
    setOgTitle('');
    setOgDescription('');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!path || !seoTitle || !description) {
      alert('দয়া করে লিংক/পথ, এসইও শিরোনাম এবং ডেসক্রিপশন সঠিকভাবে প্রদান করুন।');
      return;
    }

    setSubmitting(true);
    try {
      // Set document identifier based on slug/id
      const finalId = selectedId || path.toLowerCase().replace(/[^a-zA-Z0-9_.-]/g, '_');
      const newConfig: SEOConfig = {
        id: finalId,
        path: path.trim(),
        title: seoTitle.trim(),
        description: description.trim(),
        keywords: keywords.trim(),
        ogImage: ogImage.trim(),
        ogTitle: ogTitle.trim() || seoTitle.trim(),
        ogDescription: ogDescription.trim() || description.trim(),
        lastUpdated: new Date().toISOString()
      };

      await saveSEOConfig(newConfig);
      try {
        window.dispatchEvent(new CustomEvent('raincoat_seo_updated'));
      } catch (_) {}
      await loadData();
      handleResetForm();
      alert('সফলভাবের এসইও কনফিগারেশন ক্লাউডে আপডেট করা হয়েছে! এটি স্যোশাল মিডিয়া এবং গুগল সার্চ ট্যাগে লাইভ হয়ে গেছে।');
    } catch (err) {
      alert(`ত্রুটি দেখা দিয়েছে: ${err}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('আপনি কি নিশ্চিতভাবে এই পেইজের এসইও কনফিগারেশন মুছে ফেলতে চান? এটি মুছে ফেললে ডিফল্ট এসইও ট্যাগ সক্রিয় হবে।')) {
      return;
    }
    try {
      await deleteSEOConfig(id);
      try {
        window.dispatchEvent(new CustomEvent('raincoat_seo_updated'));
      } catch (_) {}
      await loadData();
      if (selectedId === id) {
        handleResetForm();
      }
      alert('পেইজের কাস্টম এসইও কনফিগারেশন মুছে ফেলা হয়েছে।');
    } catch (e) {
      alert('মুছে ফেলা সম্ভব হয়নি। আবার চেষ্টা করুন।');
    }
  };

  const filteredConfigs = configs.filter(c => 
    c.path.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-md">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1 px-2.5 bg-rose-500/10 text-rose-450 border border-rose-500/20 text-[10px] font-black rounded-lg uppercase">
              RANK MATH SEO PLUGIN DIRECT COMPEER
            </span>
            <span className="text-[10px] bg-indigo-500/20 text-indigo-300 font-extrabold px-1.5 py-0.5 rounded animate-pulse">LIVE ADVANCED</span>
          </div>
          <h2 className="text-xl font-black flex items-center gap-2">⚡ RankMath প্রফেশনাল এসইও প্লাগইন (All-in-One SEO Engine)</h2>
          <p className="text-xs text-slate-300">এখানে আপনি লিংক বাই লিংক, ক্যাটাগরি পেইজ, ল্যান্ডিং পেইজ এবং ইন্ডিভিজুয়াল প্রোডাক্ট অনুযায়ী মেটা টাইটেল, কিওয়ার্ডস এবং সোশ্যাল মিডিয়া ওজি থাম্বনেইল সেট করতে পারেন।</p>
        </div>
        <button 
          onClick={loadData}
          className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-slate-200 rounded-xl text-xs font-bold font-sans transition flex items-center gap-1.5 shrink-0 grow-0"
        >
          <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} /> রিফ্রেশ করুন
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: Editor Form & Live snippet previews */}
        <div className="lg:col-span-7 space-y-6">
          <form onSubmit={handleSave} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex justify-between items-center border-b border-rose-100 pb-3">
              <h3 className="text-sm font-black text-slate-800 flex items-center gap-1.5 uppercase">
                <Globe className="h-4.5 w-4.5 text-rose-600" /> 
                {selectedId ? 'মেটা এডিট করুন (Modify SEO Config)' : 'নতুন পেইজ বা লিংক যোগ করুন (Add SEO Link-by-Link)'}
              </h3>
              {selectedId && (
                <button 
                  type="button" 
                  onClick={handleResetForm}
                  className="text-slate-400 hover:text-slate-650 text-[10px] font-bold border border-slate-200 bg-slate-50 px-2 py-1 rounded-md"
                >
                  নতুন তৈরি করুন
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 text-left">
              {/* Target Link Selector */}
              <div>
                <label className="block text-[10px] text-slate-500 font-extrabold uppercase mb-1 flex justify-between">
                  <span>সাইটের লিংক / পথ (Target Page Route Path) *</span>
                  <span className="text-rose-600 font-semibold lowercase">যেমন: /shop বা প্রোডাক্ট লিংক</span>
                </label>
                <div className="flex gap-2">
                  <input 
                    type="text"
                    value={path}
                    onChange={(e) => setPath(e.target.value)}
                    placeholder="যেমন: /product/premium-waterproof-raincoat"
                    className="flex-1 bg-slate-50 border border-slate-250 text-slate-800 text-xs rounded-xl px-3.5 py-2.5 font-bold focus:outline-none focus:ring-1 focus:ring-rose-500 font-mono"
                    required
                  />
                  
                  {/* Preset Quick Loader dropdown */}
                  <select
                    className="bg-slate-50 border border-slate-250 text-[11px] font-bold text-slate-600 rounded-xl px-2 focus:outline-none cursor-pointer text-left"
                    onChange={(e) => {
                      if(e.target.value) {
                        setPath(e.target.value);
                        e.target.value = '';
                      }
                    }}
                    defaultValue=""
                  >
                    <option value="" disabled>কোর ল্যান্ডিং সমুহ</option>
                    {prebuiltPaths.map((p, i) => (
                      <option key={i} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>
                
                {/* Dynamically listings products fast selector */}
                {products.length > 0 && (
                  <div className="mt-2.5 p-2 bg-indigo-50/40 rounded-xl border border-indigo-100/50 flex flex-wrap items-center gap-1.5">
                    <span className="text-[9.5px] font-black text-indigo-700 font-sans pl-1">প্রোডাক্ট শর্টকাট:</span>
                    {products.map((p) => {
                      const computedPath = `/product/${p.slug || p.id}`;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setPath(computedPath)}
                          className="text-[9.5px] font-bold bg-white hover:bg-indigo-100 border border-indigo-150 text-indigo-950 px-2.5 py-1 rounded-lg transition"
                        >
                          📦 {p.title || p.id}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* SEO Title */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[10px] text-slate-500 font-extrabold uppercase">মেটা টাইটেল (SEO Title Tag) *</label>
                  <span className={`text-[9px] font-bold font-mono ${seoTitle.length >= 50 && seoTitle.length <= 60 ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {seoTitle.length} / ৬০ অক্ষর {seoTitle.length >= 50 && seoTitle.length <= 60 ? '✔️ চমৎকার' : ''}
                  </span>
                </div>
                <input 
                  type="text"
                  value={seoTitle}
                  onChange={(e) => setSeoTitle(e.target.value)}
                  placeholder="যেমন: প্রিমিয়াম রেইংকোট জ্যাকেট ও প্যান্ট কম্বো - ২০% বর্ষা ধামাকা ছাড়!"
                  className="w-full bg-slate-50 border border-slate-250 text-slate-800 text-xs rounded-xl px-3.5 py-2.5 font-bold focus:outline-none focus:ring-1 focus:ring-rose-500 font-sans"
                  required
                />
              </div>

              {/* SEO Description */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[10px] text-slate-500 font-extrabold uppercase">এসইও ডেসক্রিপশন (Meta Description Tag) *</label>
                  <span className={`text-[9px] font-bold font-mono ${description.length >= 120 && description.length <= 160 ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {description.length} / ১৬০ অক্ষর {description.length >= 120 && description.length <= 160 ? '✔️ চমৎকার' : ''}
                  </span>
                </div>
                <textarea 
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="レインকোটের বিবরণ, গ্রাহকদের রিভিউসহ একটি চমৎকার সার্চ ইঞ্জিন সামারি বিবরণ টাইপ করুন এখানে..."
                  className="w-full bg-slate-50 border border-slate-250 text-slate-800 text-xs rounded-xl px-3.5 py-2.5 font-bold focus:outline-none focus:ring-1 focus:ring-rose-500 font-sans leading-relaxed"
                  required
                />
              </div>

              {/* Focus Keywords */}
              <div>
                <label className="block text-[10px] text-slate-500 font-extrabold uppercase mb-1">ফোকাস কিওয়ার্ডস (Focus Keywords List - Comma Separated)</label>
                <input 
                  type="text"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  placeholder="যেমন: raincoat, best premium raincoat in bangladesh, বাইক কভার দাম"
                  className="w-full bg-slate-50 border border-slate-250 text-slate-800 text-xs rounded-xl px-3.5 py-2.5 font-bold focus:outline-none focus:ring-1 focus:ring-rose-500 font-sans"
                />
              </div>

              <div className="border-t border-dashed border-slate-200 my-2 pt-4">
                <h4 className="text-xs font-black text-rose-700 flex items-center gap-1.5 uppercase mb-3">
                  <Image className="h-4 w-4" /> সোশ্যাল শেয়ার অপটিমাইজেশন (Facebook OpenGraph Settings - Highly Recommended)
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* OG Title */}
                  <div>
                    <label className="block text-[10px] text-slate-500 font-extrabold uppercase mb-1">স্যোশাল টাইটেল (OG Share Title)</label>
                    <input 
                      type="text"
                      value={ogTitle}
                      onChange={(e) => setOgTitle(e.target.value)}
                      placeholder="খালি রাখলে মূল এসইও টাইটেল ব্যবহার হবে"
                      className="w-full bg-slate-50 border border-slate-250 text-slate-800 text-xs rounded-xl px-3.5 py-2.5 font-bold focus:outline-none focus:ring-1 focus:ring-rose-500 font-sans"
                    />
                  </div>

                  {/* OG Description */}
                  <div>
                    <label className="block text-[10px] text-slate-500 font-extrabold uppercase mb-1">স্যোশাল ডেসক্রিপশন (OG Description)</label>
                    <input 
                      type="text"
                      value={ogDescription}
                      onChange={(e) => setOgDescription(e.target.value)}
                      placeholder="খালি রাখলে মূল এসইও ডেসক্রিপশন ব্যবহার হবে"
                      className="w-full bg-slate-50 border border-slate-250 text-slate-800 text-xs rounded-xl px-3.5 py-2.5 font-bold focus:outline-none focus:ring-1 focus:ring-rose-500 font-sans"
                    />
                  </div>
                </div>

                {/* Social Share Image Thumbnail URL */}
                <div className="mt-3">
                  <label className="block text-[10px] text-slate-500 font-extrabold uppercase mb-1">স্যোশাল স্ক্রিনশট থাম্বনেইল ছবি (Social OG Image Thumbnail URL)</label>
                  <input 
                    type="text"
                    value={ogImage}
                    onChange={(e) => setOgImage(e.target.value)}
                    placeholder="যেমন: https://images.unsplash.com/photo-1534349762230-e0cadf78f5da... অথবা প্রোডাক্টের ছবি"
                    className="w-full bg-slate-50 border border-slate-250 text-slate-800 text-xs rounded-xl px-3.5 py-2.5 font-bold focus:outline-none focus:ring-1 focus:ring-rose-500 font-mono"
                  />
                  <p className="text-[9px] text-slate-400 mt-1">ফেসবুকে শেয়ার করার সময় যে প্রোডাক্টের প্রিভিউ ইমেজ দেখা যাবে তা এখানে কপি-পেস্ট করুন।</p>
                </div>
              </div>

            </div>

            <div className="flex justify-end gap-3.5 pt-4 border-t border-slate-100">
              <button 
                type="button" 
                onClick={handleResetForm}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200/85 text-slate-600 font-extrabold rounded-xl text-xs transition cursor-pointer"
              >
                রিসেট লিখুন
              </button>
              
              <button 
                type="submit" 
                disabled={submitting}
                className="px-6 py-2.5 bg-gradient-to-r from-rose-600 to-indigo-650 text-white font-black rounded-xl text-xs shadow-md hover:scale-102 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
              >
                {submitting ? 'সংরক্ষিত হচ্ছে...' : (selectedId ? '💾 মেটা তথ্য আপডেট করুন' : '➕ এসইও পথ সংরক্ষণ করুন')}
              </button>
            </div>
          </form>

          {/* REALTIME VISUAL MOCKUP COMPARTMENTS (Google Search Snippet & Facebook Share Card) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* 1. Google Desktop & Mobile Search Engine Snippet Mockup */}
            <div className="bg-white border border-slate-250 rounded-2xl p-5 shadow-xs text-left">
              <div className="flex items-center gap-1.5 text-xs font-black text-slate-800 border-b border-slate-100 pb-2 mb-3 font-sans">
                <ChevronRight className="h-4 w-4 text-slate-400" />
                গুগল ক্লাসিক সার্চ রেন্ডার (Google Snippet Mockup)
              </div>
              
              <div className="space-y-1 font-sans p-3 bg-slate-50 rounded-xl border border-slate-100">
                {/* Mock breadcrumb */}
                <div className="text-[11px] text-slate-600 flex items-center gap-1">
                  <span>https://raincoatfactory.com</span>
                  <span className="text-[9px]">›</span>
                  <span className="text-slate-500 font-mono truncate max-w-[120px]">{path}</span>
                </div>
                
                {/* Mock search result link title */}
                <h4 className="text-indigo-850 hover:underline text-base font-medium leading-tight cursor-pointer text-blue-800 break-words line-clamp-2">
                  {seoTitle || 'রেইনকোট এবং বাইক কাভার অনলাইন স্টোর বাংলাদেশ - Raincoat Factory'}
                </h4>
                
                {/* Mock description text */}
                <p className="text-[12px] text-slate-800 leading-snug break-words line-clamp-3">
                  <span className="text-slate-550 font-semibold">{new Date().toLocaleDateString('bn-BD', { month: 'short', day: 'numeric' })} — </span>
                  {description || ' বর্ষা ধামাকা অফারে ১০০% ওয়াটারপ্রুফ এবং থার্মাল সীমিং সিল কোটিং জ্যাকেট ও প্যান্ট অর্ডার করুন ক্যাশ অন ডেলিভারিতে। সম্পূর্ণ ডাস্টপ্রুফ ও টেকসই কোটিং কাভার।'}
                </p>
              </div>
            </div>

            {/* 2. Facebook OpenGraph Social Share Snippet Mockup */}
            <div className="bg-white border border-slate-250 rounded-2xl p-5 shadow-xs text-left">
              <div className="flex items-center gap-1.5 text-xs font-black text-slate-800 border-b border-slate-100 pb-2 mb-3 font-sans">
                <ChevronRight className="h-4 w-4 text-slate-400" />
                ফেসবুক স্যোশাল শেয়ার রেন্ডার (Facebook Card Mockup)
              </div>
              
              <div className="border border-slate-200/80 rounded-xl overflow-hidden shadow-2xs font-sans bg-[#F2F4F7]">
                {/* Mock Facebook preview image */}
                <div className="aspect-[1.91/1] w-full bg-slate-100 relative overflow-hidden flex items-center justify-center">
                  {ogImage ? (
                    <img src={ogImage} alt="Social media sharing preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="text-slate-350 flex flex-col items-center justify-center p-4">
                      <Image className="h-8 w-8 text-slate-300 mb-1" />
                      <span className="text-[9px] font-bold">ছবি যুক্ত করা হয়নি (প্রোডাক্টের থাম্বনেইল ছবি প্রদর্শিত হবে)</span>
                    </div>
                  )}
                </div>
                
                {/* Mock Facebook URL & Context info */}
                <div className="p-3 border-t border-slate-205 text-left bg-white font-sans space-y-0.5">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono block">raincoatfactory.com</span>
                  <h4 className="text-xs font-black text-slate-900 truncate">
                    {ogTitle || seoTitle || 'প্রিমিয়াম রেইনকোট এবং মোটরসাইকেল কাভার অনলাইন স্টোর বাংলাদেশ'}
                  </h4>
                  <p className="text-[10.5px] text-slate-500 truncate">
                    {ogDescription || description || '১০০% উচ্চমানের থার্মাল কোটিং সিলড প্রটেক티브 বাইকিং কম্বো অফার...'}
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* RIGHT COLUMN: Database SEO configs list with search */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs text-left">
            <h3 className="text-sm font-black text-slate-800 border-b border-slate-100 pb-2.5 mb-3 uppercase flex items-center justify-between">
              <span>🗂️ সংরক্ষিত লিস্টিং ({configs.length} টি)</span>
              <span className="text-[9px] bg-slate-150 text-slate-500 font-extrabold px-2 py-0.5 rounded-full">{filteredConfigs.length} টি পাওয়া গেছে</span>
            </h3>

            {/* Search Input */}
            <div className="relative mb-4 w-full">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                <Search className="h-4 w-4" />
              </span>
              <input
                type="text"
                placeholder="পথ, শিরোনাম বা বিবরণ খুঁজি..."
                className="w-full bg-slate-50 border border-slate-250 text-xs rounded-xl pl-9.5 pr-4 py-2.5 font-bold focus:outline-none focus:ring-1 focus:ring-rose-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {loading ? (
              <div className="py-12 text-center text-xs font-bold text-slate-400 animate-pulse flex flex-col items-center justify-center gap-2">
                <RefreshCw className="h-6 w-6 animate-spin text-slate-350" />
                লোড করা হচ্ছে...
              </div>
            ) : filteredConfigs.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400 font-medium font-sans">
                কোনো কাস্টম এসইও মেটা কনফিগারেশন রেন্ডার পাওয়া যায়নি!
              </div>
            ) : (
              <div className="space-y-3 max-h-[750px] overflow-y-auto pr-1">
                {filteredConfigs.map((config) => (
                  <div 
                    key={config.id}
                    className={`p-3.5 rounded-xl border transition text-left space-y-1 bg-gradient-to-r ${
                      selectedId === config.id 
                        ? 'border-indigo-500 from-indigo-50/20 to-white ring-1 ring-indigo-500' 
                        : 'border-slate-200 from-slate-50/50 to-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-1.5 flex-wrap">
                      <span className="text-[10px] font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md font-mono">
                        {config.path}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => selectConfigForEdit(config)}
                          className="p-1.5 hover:bg-indigo-150/50 text-indigo-700 bg-indigo-50 rounded-md transition"
                          title="মেটা তথ্য পরিবর্তন করুন"
                        >
                          <Edit2 className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(config.id)}
                          className="p-1.5 hover:bg-rose-100 text-rose-600 bg-rose-50 rounded-md transition"
                          title="মুছে ফেলুন"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                    
                    <h4 className="text-xs font-black text-slate-800 line-clamp-1">{config.title}</h4>
                    <p className="text-[10.5px] text-slate-500 line-clamp-2 leading-snug">{config.description}</p>
                    
                    {config.keywords && (
                      <div className="pt-1 flex flex-wrap items-center gap-1">
                        <span className="text-[8.5px] font-extrabold text-slate-400 tracking-wider">কিওয়ার্ডস:</span>
                        {config.keywords.split(',').map((kw, i) => (
                          <span key={i} className="text-[8.5px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-sans">{kw.trim()}</span>
                        ))}
                      </div>
                    )}
                    
                    <span className="text-[8px] text-slate-400 block pt-1.5 font-bold">
                      সর্বশেষ সিঙ্ক: {new Date(config.lastUpdated).toLocaleString('bn-BD')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
