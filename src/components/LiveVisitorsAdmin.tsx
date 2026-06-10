import React, { useState, useEffect } from 'react';
import { 
  Activity, MapPin, Smartphone, Laptop, Eye, RefreshCw, 
  Clock, Globe, Users, TrendingUp, Sparkles, CheckCircle, Info
} from 'lucide-react';
import { getActiveSessionsFromFirestore, deleteSessionFromFirestore, db } from '../lib/firebase';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { ActiveSession } from '../types';

export default function LiveVisitorsAdmin() {
  const [realSessions, setRealSessions] = useState<ActiveSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'reconnecting' | 'failed'>('connected');

  // Real-time Firestore Live Subscription
  useEffect(() => {
    setLoading(true);
    let unsubscribe: () => void = () => {};

    try {
      const q = query(collection(db, 'activeSessions'));
      
      unsubscribe = onSnapshot(q, (snapshot) => {
        const dbSessions: ActiveSession[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (data && data.id) {
            dbSessions.push(data as ActiveSession);
          }
        });

        // Filter out stale sessions (no heartbeat updated in the last 90 seconds)
        const now = Date.now();
        const activeDbSessions = dbSessions.filter(sess => {
          if (!sess.updatedAt) return false;
          const lastActive = new Date(sess.updatedAt).getTime();
          return (now - lastActive) <= 90 * 1000; // 90 seconds threshold
        });

        setRealSessions(activeDbSessions);
        setLoading(false);
        setLastRefreshed(new Date());
        setConnectionStatus('connected');
      }, (err) => {
        console.warn("Real-time onSnapshot listener failed, falling back to direct polling:", err);
        setConnectionStatus('reconnecting');
        
        // Dynamic fallback query fallback if onSnapshot hits permission/quota errors temporarily
        const intervalId = setInterval(async () => {
          try {
            const dbSessions = await getActiveSessionsFromFirestore();
            const now = Date.now();
            const activeDbSessions = dbSessions.filter(sess => {
              if (!sess.updatedAt) return false;
              const lastActive = new Date(sess.updatedAt).getTime();
              return (now - lastActive) <= 90 * 1000;
            });
            setRealSessions(activeDbSessions);
            setLoading(false);
            setLastRefreshed(new Date());
            setConnectionStatus('connected');
          } catch (pollingErr) {
            console.error("Polling fallback failed:", pollingErr);
            setConnectionStatus('failed');
          }
        }, 15000);

        unsubscribe = () => clearInterval(intervalId);
      });
    } catch (e) {
      console.error("Error setting up real-time listener:", e);
      setLoading(false);
      setConnectionStatus('failed');
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  // Force-fetch wrapper if the user manual refreshes
  const handleForceRefresh = async () => {
    setLoading(true);
    try {
      const dbSessions = await getActiveSessionsFromFirestore();
      const now = Date.now();
      const activeDbSessions = dbSessions.filter(sess => {
        if (!sess.updatedAt) return false;
        const lastActive = new Date(sess.updatedAt).getTime();
        return (now - lastActive) <= 90 * 1000;
      });
      setRealSessions(activeDbSessions);
      setLastRefreshed(new Date());
      setConnectionStatus('connected');
    } catch (err) {
      console.error("Manual refresh failed:", err);
    } finally {
      setLoading(false);
    }
  };

  // Stats computed from REAL tracking data ONLY
  const totalVisitors = realSessions.length;
  const desktopCount = realSessions.filter(s => s.os === 'Windows' || s.os === 'macOS' || s.os === 'Linux').length;
  const mobileCount = realSessions.filter(s => s.os === 'Android' || s.os === 'iOS').length;

  // Group by page
  const pageGroup: { [key: string]: number } = {};
  realSessions.forEach(s => {
    if (s.page) pageGroup[s.page] = (pageGroup[s.page] || 0) + 1;
  });
  const pageStats = Object.entries(pageGroup).sort((a, b) => b[1] - a[1]);

  // Group by city
  const cityGroup: { [key: string]: number } = {};
  realSessions.forEach(s => {
    if (s.city) cityGroup[s.city] = (cityGroup[s.city] || 0) + 1;
  });
  const cityStats = Object.entries(cityGroup).sort((a, b) => b[1] - a[1]);

  // Get current active cities for visual dots on radar
  const uniqueCities = Object.keys(cityGroup);

  return (
    <div className="space-y-6 font-sans">
      
      {/* Header and Live Tracker Indicators */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 text-white p-5 rounded-3xl border border-slate-800 shadow-xl overflow-hidden relative">
        <div className="absolute inset-x-0 bottom-0 top-0 bg-[radial-gradient(circle_at_right,_var(--tw-gradient-stops))] from-indigo-950/40 via-transparent to-transparent opacity-70 pointer-events-none" />
        
        <div className="space-y-1 z-10">
          <div className="flex items-center gap-2">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <h2 id="live_visitor_header" className="text-xl font-extrabold tracking-tight flex items-center gap-2">
              রিয়েল-টাইম লাইভ কাস্টমার ভিজিটর ট্র্যাকার
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            সম্পূর্ণ রিয়েল-টাইম লাইভ ট্র্যাকিং। কোনো সিমুলেটর বা ফেক ডেটা ছাড়া সরাসরি ডেটাবেজ থেকে অ্যাক্টিভ গ্রাহক পর্যবেক্ষণ করুন।
          </p>
        </div>

        <div className="flex items-center gap-3 z-10 self-stretch md:self-auto justify-between md:justify-end">
          <div className="text-right">
            <div className="text-[10px] text-slate-400 flex items-center gap-1 justify-end">
              <Clock className="w-3 h-3" /> শেষ রিফ্রেশ: {lastRefreshed.toLocaleTimeString()}
            </div>
            <div className="text-[10px] font-semibold text-emerald-400 flex items-center gap-1 mt-0.5 justify-end">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
              {connectionStatus === 'connected' ? 'সরাসরি ডেটাবেজ কানেক্টেড' : 'পুনরায় কানেক্ট করার চেষ্টা করা হচ্ছে...'}
            </div>
          </div>
          <button
            id="force_refresh_sessions_btn"
            onClick={handleForceRefresh}
            disabled={loading}
            className="p-2 sm:p-2.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-indigo-400 hover:text-indigo-300 rounded-xl transition-all border border-slate-700/60 cursor-pointer"
            title="ম্যানুয়ালি আপডেট করুন"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Guide notice explaining how they can check to verify actual live visitor tracking */}
      <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-start gap-3">
        <div className="p-2 bg-indigo-100 text-indigo-700 rounded-xl shrink-0">
          <Sparkles className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-indigo-950">
            ১০০% রিয়েল-টাইম কীভাবে পরীক্ষা করবেন?
          </h4>
          <p className="text-[11px] sm:text-xs text-indigo-900 leading-relaxed font-semibold">
            ভিজিটর ট্র্যাকারটি সরাসরি রিয়েল-টাইম কাজ করছে কিনা তা দেখতে চাইলে, <span className="text-indigo-700 font-bold underline">নতুন একটি ব্রাউজার ট্যাব</span> খুলে আপনার রেইনকোড শপ পেইজ বা যেকোনো লিংকে প্রবেশ করুন। সাথে সাথে আপনার নতুন সেশনটি এই প্যানেলে ৩ সেকেন্ডের মধ্যে লাইভ যুক্ত হয়ে যাবে!
          </p>
        </div>
      </div>

      {totalVisitors === 0 ? (
        /* Squeaky clean visual empty state for zero visitors */
        <div id="no_active_visitors_alert" className="border border-dashed border-slate-300 p-8 rounded-3xl text-center bg-slate-50/50 space-y-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 animate-pulse">
            <Users className="w-6 h-6" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="font-bold text-slate-800 text-sm">বর্তমানে কোনো সক্রিয় ভিজিটর নেই</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              এই মুহূর্তে ওয়েবসাইটে কোনো সক্রিয় কাস্টমার নেই। ডেটা সেভ ও কুয়েরি অপ্টিমাইজড রাখতে stale ব্রাউজার সেশনগুলোকে ৯০ সেকেন্ড নিষ্ক্রিয়তার পর স্বয়ংক্রিয়ভাবে ক্লিন আউট করা হয়েছে।
            </p>
            <p className="text-xs text-indigo-600 bg-indigo-50 p-2.5 rounded-xl border border-indigo-100/60 font-semibold mt-3">
              💡 আপনি এখনই আপনার শপের অন্য একটি লিংক বা কাস্টমার ভিউ অন্য ট্যাবে ওপেন করে ট্র্যাকিংয়ের লাইভ প্রতিক্রিয়া পরীক্ষা করতে পারেন।
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Overview Analytics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            
            {/* Metric 1: Live Visitors */}
            <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl flex items-center justify-between shadow-sm relative overflow-hidden">
              <div className="space-y-1.5 z-10">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">লাইভে ভিজিটর</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-extrabold text-slate-900 tracking-tight">{totalVisitors}</span>
                  <span className="text-xs font-semibold text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                    ● real
                  </span>
                </div>
              </div>
              <div className="p-3 bg-indigo-100 text-indigo-700 rounded-2xl z-10">
                <Users className="w-6 h-6 animate-pulse" />
              </div>
            </div>

            {/* Metric 2: Device Breakdown */}
            <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl flex items-center justify-between shadow-sm relative overflow-hidden">
              <div className="space-y-1.5 z-10">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">মোবাইল বনাম ডেক্সটপ</span>
                <div className="flex items-center gap-4 text-slate-800">
                  <div className="flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-indigo-500" />
                    <span className="text-lg font-bold">{mobileCount}</span>
                    <span className="text-[10px] text-slate-400">(Mod)</span>
                  </div>
                  <div className="border-r border-slate-200 h-6" />
                  <div className="flex items-center gap-1.5">
                    <Laptop className="w-4 h-4 text-emerald-500" />
                    <span className="text-lg font-bold">{desktopCount}</span>
                    <span className="text-[10px] text-slate-400">(PC)</span>
                  </div>
                </div>
              </div>
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl z-10">
                <Smartphone className="w-6 h-6" />
              </div>
            </div>

            {/* Metric 3: Hotspots */}
            <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl flex items-center justify-between shadow-sm relative overflow-hidden">
              <div className="space-y-1.5 z-10">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">প্রধান আইপি জোন/শহর</span>
                <div className="text-sm font-bold text-slate-850 line-clamp-1">
                  {cityStats[0] ? `${cityStats[0][0]} (${cityStats[0][1]} জন)` : 'Dhaka'}
                </div>
                <span className="text-[10px] text-slate-400 block">এই মুহূর্তে সর্বাধিক ভিজিটেড জোন</span>
              </div>
              <div className="p-3 bg-sky-50 text-sky-600 rounded-2xl z-10">
                <MapPin className="w-6 h-6" />
              </div>
            </div>

            {/* Metric 4: Direct Action */}
            <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl flex items-center justify-between shadow-sm relative overflow-hidden">
              <div className="space-y-1.5 z-10">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">পেইজ ভিউ ট্রেন্ডিং</span>
                <div className="text-sm font-bold text-indigo-650 line-clamp-1 flex items-center gap-1">
                  <TrendingUp className="w-4 h-4 text-rose-500" /> {pageStats[0] ? pageStats[0][0] : 'রেইনকোট ল্যান্ডিং পেইজ'}
                </div>
                <span className="text-[10px] text-slate-400 block">সবচেয়ে বেশি মানুষ দেখছে এখন</span>
              </div>
              <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl z-10">
                <Eye className="w-6 h-6" />
              </div>
            </div>

          </div>

          {/* Dynamic Radar and Regional Hotspots */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Column: Visual Map / Dynamic Radar */}
            <div className="bg-slate-900 text-white rounded-3xl border border-slate-800 p-6 flex flex-col justify-between items-center text-center shadow-xl relative overflow-hidden lg:col-span-2">
              <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-30 pointer-events-none" />
              
              <div className="w-full text-left space-y-1 z-10">
                <h3 className="text-md font-bold text-slate-200 flex items-center gap-1.5 font-sans">
                  <Globe className="w-5 h-5 text-indigo-400" /> লাইভ লোকেশন রাডার (সক্রিয় কাস্টমার)
                </h3>
                <p className="text-xs text-slate-400">
                  সরাসরি সার্ভার থেকে সনাক্তকৃত গ্রাহকদের আনুমানিক মানচিত্র ট্র্যাক।
                </p>
              </div>

              {/* Animated SVG Radar Graph representing actual user positions */}
              <div className="my-8 relative w-64 h-64 flex items-center justify-center">
                
                {/* Pulsing Outer Rings */}
                <div className="absolute w-56 h-56 border border-indigo-500/10 rounded-full animate-[ping_3s_linear_infinite]" />
                <div className="absolute w-44 h-44 border border-rose-500/15 rounded-full animate-[ping_4.5s_linear_infinite_delay-1000]" />
                <div className="absolute w-64 h-64 border border-slate-700/20 rounded-full" />
                <div className="absolute w-48 h-48 border border-slate-700/35 rounded-full" />
                <div className="absolute w-32 h-32 border border-slate-700/50 rounded-full" />
                <div className="absolute w-16 h-16 border border-slate-700/60 rounded-full" />
                
                {/* Spinning Radar Sweeper */}
                <div className="absolute inset-0 rounded-full bg-[conic-gradient(from_0deg,_transparent_50%,_rgba(99,102,241,0.15))] animate-[spin_4s_linear_infinite]" />
                
                {/* Center Hub */}
                <div className="absolute w-4 h-4 bg-indigo-500 rounded-full shadow-lg shadow-indigo-500/50 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-white rounded-full" />
                </div>

                {/* Show actual cities detected in activeSessions */}
                {uniqueCities.map((city, idx) => {
                  // Distribute on coordinates pseudo-randomly but deterministically based on city name length
                  const angle = (city.length * 45) % 360;
                  const radius = 40 + ((city.length * 20) % 70); 
                  const rad = (angle * Math.PI) / 180;
                  const x = radius * Math.cos(rad);
                  const y = radius * Math.sin(rad);

                  return (
                    <div 
                      key={city} 
                      className="absolute animate-bounce"
                      style={{ transform: `translate(${x}px, ${y}px)` }}
                    >
                      <span className="relative flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-80"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border border-slate-900 justify-center items-center">
                          <span className="w-1.5 h-1.5 bg-white rounded-full" />
                        </span>
                      </span>
                      <span className="absolute left-5 -top-1 px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-[9px] font-bold whitespace-nowrap text-emerald-300">
                        {city} ({cityGroup[city]})
                      </span>
                    </div>
                  );
                })}

                {uniqueCities.length === 0 && (
                  <div className="text-xs text-slate-400 italic">No City Data</div>
                )}

              </div>

              <div className="w-full text-center text-slate-500 text-[10px] md:text-xs z-10 border-t border-slate-800 pt-3 flex justify-around">
                <span className="flex items-center gap-1"><span className="w-2 h-2 bg-indigo-500 rounded-full" /> রাডার ট্র্যাক রুট</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 bg-emerald-500 rounded-full" /> সক্রিয় গ্রাহক এরিয়া</span>
              </div>

            </div>

            {/* Right Column: Hotspots Table Breakdown */}
            <div className="border border-slate-200 rounded-3xl p-5 flex flex-col justify-between h-full bg-white shadow-sm font-sans">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                    <MapPin className="text-indigo-600" /> সক্রিয় গ্রাহকদের এরিয়া
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    কোন কোন এরিয়া থেকে কাস্টমাররা এই মুহূর্তে সাইটে ভিজিট করছেন।
                  </p>
                </div>

                <div className="space-y-3">
                  {cityStats.slice(0, 5).map(([city, count], idx) => {
                    const percentage = Math.round((count / totalVisitors) * 100);
                    return (
                      <div key={city} className="space-y-1">
                        <div className="flex justify-between text-xs font-bold text-slate-700">
                          <span className="flex items-center gap-1">
                            <span className="text-slate-400 font-sans text-[10px]">#{idx+1}</span> {city}
                          </span>
                          <span>{count} জন ({percentage}%)</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5">
                          <div 
                            className={`h-1.5 rounded-full ${
                              idx === 0 ? 'bg-indigo-600' : idx === 1 ? 'bg-teal-500' : 'bg-slate-400'
                            }`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4 mt-6 text-[11px] text-slate-500 font-medium">
                💡 <span className="text-slate-700">টিপস</span>: কোনো এরিয়াতে অতিরিক্ত ভিজিটর থাকলে ফেসবুকে বা স্থানীয়ভাবে পেইড বুস্টিং বাড়িয়ে ডেলিভারি কনভার্সন বাড়াতে পারেন।
              </div>

            </div>

          </div>

          {/* Pages Breakdown Stats Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans">
            
            {/* Left List: Page Breakdown */}
            <div className="lg:col-span-1 border border-slate-200 rounded-3xl p-5 bg-white shadow-sm space-y-4">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                  <Eye className="text-indigo-600" /> কোন পেইজে কাস্টমাররা ব্রাউজ করছেন
                </h3>
                <p className="text-[11px] text-slate-500">
                  গ্রাহকদের ভিউ পয়েন্ট এবং রানিং অ্যাক্টিভিটি।
                </p>
              </div>

              <div className="divide-y divide-slate-100">
                {pageStats.map(([page, count]) => (
                  <div key={page} className="py-2.5 flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-700 truncate max-w-[190px]" title={page}>{page}</span>
                    <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 font-extrabold rounded-full font-mono">
                      {count} জন
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Tabular Feed: Live Action Stream / Active Ticker */}
            <div className="lg:col-span-2 border border-slate-200 rounded-3xl p-5 bg-white shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                    <Activity className="text-emerald-500 animate-pulse" /> লাইভ অ্যাক্টিভিটি স্ট্রিম ফিড
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    প্রতিটি সক্রিয় গ্রাহকের সুনির্দিষ্ট রিয়েল-টাইম লাইভ পরিবর্তনসমূহ।
                  </p>
                </div>
                
                <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-1 rounded-full flex items-center gap-1 uppercase">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" /> LIVE DATABASE SYNC
                </span>
              </div>

              <div className="space-y-3.5 max-h-[360px] overflow-y-auto pr-1">
                {realSessions.map((sess) => {
                  // Calculate timing
                  const updatedTime = new Date(sess.updatedAt || new Date()).getTime();
                  const diffSec = Math.max(1, Math.floor((Date.now() - updatedTime) / 1000));
                  const displayTime = diffSec < 60 ? `${diffSec} সেকেন্ড আগে` : `${Math.floor(diffSec/60)} মিনিট আগে`;

                  return (
                    <div 
                      key={sess.id} 
                      className="p-3.5 rounded-2xl border border-emerald-100/40 bg-emerald-50/10 transition-all hover:bg-slate-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3"
                    >
                      
                      {/* Visitor location & identity */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                          </span>

                          <span className="text-xs font-extrabold text-slate-850">
                            গ্রাহক #{sess.id ? sess.id.substring(sess.id.length - 6) : 'SESS-X'}
                          </span>

                          <span className="text-[10px] bg-sky-50 text-sky-700 px-2 py-0.5 rounded-full font-bold flex items-center gap-1 border border-sky-100/85">
                            <MapPin className="w-2.5 h-2.5" /> {sess.city || 'বাংলাদেশ'}
                          </span>
                        </div>

                        <div className="text-[11px] sm:text-xs text-indigo-950 font-bold flex items-center gap-1.5">
                          <Eye className="w-3.5 h-3.5 text-slate-450" /> {sess.page || 'শপ ভিজিট করছেন'}
                        </div>
                      </div>

                      {/* Browser, OS and action timing */}
                      <div className="flex sm:flex-col items-end gap-2 sm:gap-1.5 text-right w-full sm:w-auto justify-between sm:justify-start pt-2 sm:pt-0 border-t sm:border-0 border-slate-100">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
                          {sess.os === 'Windows' || sess.os === 'macOS' ? (
                            <Laptop className="w-3 h-3 text-indigo-400" />
                          ) : (
                            <Smartphone className="w-3 h-3 text-teal-400" />
                          )}
                          <span>{sess.os || 'Unknown Device'} · {sess.browser || 'Browser'}</span>
                        </div>

                        <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md flex items-center gap-1 self-end">
                          <Clock className="w-3 h-3" /> {displayTime}
                        </span>
                      </div>

                    </div>
                  );
                })}
              </div>

              <div className="text-right text-[10px] text-slate-400 font-medium">
                * ট্র্যাকারটি সরাসরি অন-চেঞ্জ সকেট লিসেনারের মাধ্যমে রিয়েল-টাইমে কোনো বাফারিং ছাড়াই আপডেট প্রদর্শন করে।
              </div>

            </div>

          </div>
        </>
      )}

    </div>
  );
}
