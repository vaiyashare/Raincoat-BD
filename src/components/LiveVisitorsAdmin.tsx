import React, { useState, useEffect, useRef } from 'react';
import { 
  Activity, MapPin, Smartphone, Laptop, Eye, RefreshCw, 
  Clock, Globe, Users, TrendingUp, Sparkles, CheckCircle, Info,
  Volume2, VolumeX, Shield, MousePointer, Cpu, Compass, HardDrive,
  Bell, Zap, Play, ChevronDown, ChevronUp, Link
} from 'lucide-react';
import { getActiveSessionsFromFirestore, deleteSessionFromFirestore, db } from '../lib/firebase';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { ActiveSession } from '../types';

export default function LiveVisitorsAdmin() {
  const [realSessions, setRealSessions] = useState<ActiveSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'reconnecting' | 'failed'>('connected');
  
  // Expandable inspectors State (stores ID of session being viewed in-depth)
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);

  // Audio Notifications sound system toggle
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    return localStorage.getItem('raincoat_visitor_sound_enabled') !== 'false';
  });

  // Live Visitor Activity Toast stream list
  const [notifications, setNotifications] = useState<{ id: string; type: 'land' | 'page' | 'action'; text: string; time: string }[]>([]);

  // Ref to hold old sessions state array to compare changes
  const prevSessionsRef = useRef<ActiveSession[]>([]);

  // Web Audio synth chime function (C5 -> E5 -> G5 chord)
  const playVisitorChime = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const now = audioCtx.currentTime;

      // Note 1: C5
      const osc1 = audioCtx.createOscillator();
      const gain1 = audioCtx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(523.25, now);
      gain1.gain.setValueAtTime(0.04, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc1.connect(gain1);
      gain1.connect(audioCtx.destination);
      osc1.start(now);
      osc1.stop(now + 0.35);

      // Note 2: E5
      setTimeout(() => {
        try {
          const osc2 = audioCtx.createOscillator();
          const gain2 = audioCtx.createGain();
          osc2.type = 'sine';
          osc2.frequency.setValueAtTime(659.25, audioCtx.currentTime);
          gain2.gain.setValueAtTime(0.04, audioCtx.currentTime);
          gain2.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);
          osc2.connect(gain2);
          gain2.connect(audioCtx.destination);
          osc2.start();
          osc2.stop(audioCtx.currentTime + 0.35);
        } catch (_) {}
      }, 95);

      // Note 3: G5
      setTimeout(() => {
        try {
          const osc3 = audioCtx.createOscillator();
          const gain3 = audioCtx.createGain();
          osc3.type = 'sine';
          osc3.frequency.setValueAtTime(783.99, audioCtx.currentTime);
          gain3.gain.setValueAtTime(0.06, audioCtx.currentTime);
          gain3.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.45);
          osc3.connect(gain3);
          gain3.connect(audioCtx.destination);
          osc3.start();
          osc3.stop(audioCtx.currentTime + 0.45);
        } catch (_) {}
      }, 190);

    } catch (e) {
      console.warn("Real-time Audio synth blocked/unsupported:", e);
    }
  };

  // Toggle Sound state & save in local storage
  const handleToggleSound = () => {
    const newVal = !soundEnabled;
    setSoundEnabled(newVal);
    localStorage.setItem('raincoat_visitor_sound_enabled', String(newVal));
  };

  // Real-time Firestore Live Subscription with advanced detection checks
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

        // Filter out stale sessions (no heartbeat updated in the last 75 seconds)
        const now = Date.now();
        const activeDbSessions = dbSessions.filter(sess => {
          if (!sess.updatedAt) return false;
          const lastActive = new Date(sess.updatedAt).getTime();
          return (now - lastActive) <= 75 * 1000; // 75 seconds threshold
        });

        setRealSessions(activeDbSessions);
        setLoading(false);
        setLastRefreshed(new Date());
        setConnectionStatus('connected');
      }, (err) => {
        console.warn("Real-time onSnapshot listener issues, active fallback polling active:", err);
        setConnectionStatus('reconnecting');
        
        // Backup query fallback
        const intervalId = setInterval(async () => {
          try {
            const dbSessions = await getActiveSessionsFromFirestore();
            const now = Date.now();
            const activeDbSessions = dbSessions.filter(sess => {
              if (!sess.updatedAt) return false;
              const lastActive = new Date(sess.updatedAt).getTime();
              return (now - lastActive) <= 75 * 1000;
            });
            setRealSessions(activeDbSessions);
            setLoading(false);
            setLastRefreshed(new Date());
            setConnectionStatus('connected');
          } catch (pollingErr) {
            console.error("Polling database fallback crashed:", pollingErr);
            setConnectionStatus('failed');
          }
        }, 12000);

        unsubscribe = () => clearInterval(intervalId);
      });
    } catch (e) {
      console.error("Error setting up live listeners:", e);
      setLoading(false);
      setConnectionStatus('failed');
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  // Sync logic to run advanced comparisons (Lands, Page changes, actions) on realSessions updates
  useEffect(() => {
    if (loading) {
      // populate baseline on first load
      if (realSessions.length > 0) {
        prevSessionsRef.current = realSessions;
      }
      return;
    }

    const previousSessions = prevSessionsRef.current;

    // A. Detect new users who landed (not present in previous list)
    const newlyLanded = realSessions.filter(curr => !previousSessions.some(prev => prev.id === curr.id));
    if (newlyLanded.length > 0) {
      // Sound chime trigger
      if (soundEnabled) {
        playVisitorChime();
      }
      newlyLanded.forEach(user => {
        const userId = user.id ? user.id.substring(user.id.length - 6) : 'SESS';
        const browserBadge = user.browser || 'Chrome';
        const osBadge = user.os || 'Mobile';
        const modelBadge = user.deviceModel ? ` via ${user.deviceModel}` : ` via ${osBadge}`;
        const newNotif = {
          id: `land_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
          type: 'land' as const,
          text: `🎯 কাস্টমার #${userId} (${user.city || 'বাংলাদেশ'}) ওয়েবসাইটে প্রবেশ করেছেন! Device: ${browserBadge}${modelBadge}`,
          time: new Date().toLocaleTimeString()
        };
        setNotifications(prev => [newNotif, ...prev].slice(0, 15));
      });
    }

    // B. Detect actions, navigations and clicks of continuing users
    realSessions.forEach(curr => {
      const matchedPrev = previousSessions.find(prev => prev.id === curr.id);
      if (matchedPrev) {
        const userId = curr.id ? curr.id.substring(curr.id.length - 6) : 'SESS';
        // Check if page changed
        if (matchedPrev.page !== curr.page && curr.page) {
          if (soundEnabled) {
            // soft single tick for transitions
            try {
              const audioCtx = new (window.AudioContext || (window as any).webkitContext)();
              const osc = audioCtx.createOscillator();
              const gain = audioCtx.createGain();
              osc.frequency.setValueAtTime(600, audioCtx.currentTime);
              gain.gain.setValueAtTime(0.015, audioCtx.currentTime);
              gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
              osc.connect(gain);
              gain.connect(audioCtx.destination);
              osc.start();
              osc.stop(audioCtx.currentTime + 0.1);
            } catch (_) {}
          }
          setNotifications(prev => [{
            id: `page_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
            type: 'page' as const,
            text: `🔄 কাস্টমার #${userId} নতুন পেজে গেছেন: "${curr.page}"`,
            time: new Date().toLocaleTimeString()
          }, ...prev].slice(0, 15));
        }
        // Check if lastAction changed
        else if (matchedPrev.lastAction !== curr.lastAction && curr.lastAction && curr.lastAction !== 'ভিজিট শুরু করেছেন') {
          if (soundEnabled) {
            try {
              const audioCtx = new (window.AudioContext || (window as any).webkitContext)();
              const osc = audioCtx.createOscillator();
              const gain = audioCtx.createGain();
              osc.frequency.setValueAtTime(880, audioCtx.currentTime);
              gain.gain.setValueAtTime(0.02, audioCtx.currentTime);
              gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
              osc.connect(gain);
              gain.connect(audioCtx.destination);
              osc.start();
              osc.stop(audioCtx.currentTime + 0.15);
            } catch (_) {}
          }
          setNotifications(prev => [{
            id: `action_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
            type: 'action' as const,
            text: `⚡ কাস্টমার #${userId} অ্যাকশন করেছেন: "${curr.lastAction}"`,
            time: new Date().toLocaleTimeString()
          }, ...prev].slice(0, 15));
        }
      }
    });

    // Save state representer
    prevSessionsRef.current = realSessions;
  }, [realSessions, loading, soundEnabled]);

  // Force-fetch database trigger
  const handleForceRefresh = async () => {
    setLoading(true);
    try {
      const dbSessions = await getActiveSessionsFromFirestore();
      const now = Date.now();
      const activeDbSessions = dbSessions.filter(sess => {
        if (!sess.updatedAt) return false;
        const lastActive = new Date(sess.updatedAt).getTime();
        return (now - lastActive) <= 75 * 1000;
      });
      setRealSessions(activeDbSessions);
      setLastRefreshed(new Date());
      setConnectionStatus('connected');
    } catch (err) {
      console.error("Refresh request error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Metrics computation from realtime actual sessions
  const totalVisitors = realSessions.length;
  const desktopCount = realSessions.filter(s => s.os === 'Windows' || s.os === 'macOS' || s.os === 'Linux').length;
  const mobileCount = realSessions.filter(s => s.os && (s.os.indexOf('Android') > -1 || s.os.indexOf('iOS') > -1 || s.os.indexOf('iPad') > -1)).length;

  // Grouping systems
  const pageGroup: { [key: string]: number } = {};
  realSessions.forEach(s => {
    if (s.page) pageGroup[s.page] = (pageGroup[s.page] || 0) + 1;
  });
  const pageStats = Object.entries(pageGroup).sort((a, b) => b[1] - a[1]);

  const cityGroup: { [key: string]: number } = {};
  realSessions.forEach(s => {
    if (s.city) cityGroup[s.city] = (cityGroup[s.city] || 0) + 1;
  });
  const cityStats = Object.entries(cityGroup).sort((a, b) => b[1] - a[1]);

  // Unique listed locations for radar
  const uniqueCities = Object.keys(cityGroup);

  return (
    <div className="space-y-6 font-sans">
      
      {/* HEADER AND AUDIO CONTROL AREA */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-slate-900 text-white p-6 rounded-3xl border border-slate-800 shadow-xl overflow-hidden relative">
        <div className="absolute inset-x-0 bottom-0 top-0 bg-[radial-gradient(circle_at_right,_var(--tw-gradient-stops))] from-indigo-950/40 via-transparent to-transparent opacity-80 pointer-events-none" />
        
        <div className="space-y-1.5 z-10 flex-1">
          <div className="flex items-center flex-wrap gap-2.5">
            <span className="flex h-3.5 w-3.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-duration-1000"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
            </span>
            <h2 id="live_visitor_header" className="text-lg sm:text-xl font-extrabold tracking-tight flex items-center gap-2 text-white">
              রিয়েল-টাইম লাইভ কাস্টমার ভিজিটর ট্র্যাকার <span className="text-xs px-2.5 py-0.5 bg-indigo-500/30 text-indigo-300 rounded-full border border-indigo-500/20">PRO v2.4</span>
            </h2>
          </div>
          <p className="text-xs text-slate-400 font-medium">
            উন্নত ক্লায়েন্ট ট্র্যাকিং অ্যালগরিদম। কাস্টমারদের মোবাইল মডেল, স্ক্রিন সাইজ, গ্রাফিক্স কার্ড, সোর্সলিংক এবং লাইভ ক্লিক অ্যাকশন রিয়েল টাইমে দেখুন।
          </p>
        </div>

        {/* Dynamic Buttons Rail */}
        <div className="flex flex-wrap items-center gap-2.5 z-10 w-full lg:w-auto justify-between sm:justify-end">
          
          {/* Audio toggle button */}
          <button
            type="button"
            onClick={handleToggleSound}
            className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
              soundEnabled 
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-400 hover:bg-emerald-950'
                : 'bg-slate-800/80 border-slate-700/60 text-slate-400 hover:bg-slate-800'
            }`}
            title={soundEnabled ? 'সাউন্ড নোটিফিকেশন অন করা আছে' : 'সাউন্ড নোটিফিকেশন অফ করা আছে'}
          >
            {soundEnabled ? (
              <>
                <Volume2 className="w-4 h-4 text-emerald-400 animate-bounce" />
                <span>সাউন্ড অন</span>
              </>
            ) : (
              <>
                <VolumeX className="w-4 h-4 text-slate-400" />
                <span>সাউন্ড অফ</span>
              </>
            )}
          </button>

          <div className="text-right hidden sm:block">
            <div className="text-[10px] text-slate-400 flex items-center gap-1 justify-end font-medium">
              <Clock className="w-3 h-3 text-slate-500" /> লাস্ট সিঙ্ক: {lastRefreshed.toLocaleTimeString()}
            </div>
            <div className="text-[10px] font-bold text-emerald-400 flex items-center gap-1.5 mt-0.5 justify-end">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
              {connectionStatus === 'connected' ? 'সরাসরি সকেট সিঙ্কড' : 'সকেট রিকানেক্টিং...'}
            </div>
          </div>

          <button
            id="force_refresh_sessions_btn"
            onClick={handleForceRefresh}
            disabled={loading}
            className="p-2 bg-slate-800 hover:bg-slate-700 active:scale-95 text-indigo-400 hover:text-indigo-300 rounded-xl transition-all border border-slate-700/60 cursor-pointer"
            title="ম্যানুয়ালি আপডেট করুন"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* LIVE EVENT LOG NOTIFICATION BOARD */}
      <div className="bg-slate-950 text-slate-100 rounded-2xl border border-indigo-500/20 overflow-hidden shadow-2xl">
        <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-4.5 h-4.5 text-indigo-400 animate-pulse" />
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">রিয়েল-টাইম নোটিফিকেশন ফিড (Live Event Logs)</h3>
              <p className="text-[10px] text-slate-400 font-medium">গ্রাহকদের লাইভ প্রবেশ, পেজ চেঞ্জ এবং ক্লিক অ্যাকশন এখানে তাত্ক্ষণিক ভেসে উঠবে।</p>
            </div>
          </div>
          <span className="text-[9.5px] font-black bg-indigo-950 text-indigo-300 px-2.5 py-0.5 rounded border border-indigo-900">
            রিয়েল-টাইম লাইভ ট্র্যাকিং সচল
          </span>
        </div>

        <div className="p-3.5 max-h-[160px] overflow-y-auto font-mono text-[11px] leading-relaxed divide-y divide-slate-900 max-h-[160px] pr-2">
          {notifications.length === 0 ? (
            <div className="text-center py-6 text-slate-500 font-sans flex flex-col items-center justify-center gap-1.5 grayscale opacity-60">
              <Activity className="w-5 h-5 text-indigo-400 animate-pulse" />
              <p className="text-[11px] font-bold">কোনো নতুন ভিজিটর অ্যাকশন মেলেনি</p>
              <p className="text-[9.5px]">কাস্টমার অন্য ব্রাউজার থেকে ওয়েবসাইটে ঢুকলে বা কোনো বাটনে ক্লিক করলে লাইভ নোটিফিকেশন আসবে।</p>
            </div>
          ) : (
            notifications.map((notif) => (
              <div key={notif.id} className="py-2.5 flex items-start gap-2.5 animate-[fadeIn_0.2s_ease-out]">
                <span className="text-[10.5px] text-indigo-400 font-medium whitespace-nowrap shrink-0">[{notif.time}]</span>
                <span className="shrink-0 font-bold">
                  {notif.type === 'land' ? (
                    <span className="text-emerald-400">● LAND</span>
                  ) : notif.type === 'page' ? (
                    <span className="text-orange-400">● PAGE</span>
                  ) : (
                    <span className="text-indigo-400">● CLICK</span>
                  )}
                </span>
                <span className="text-slate-100 flex-1">{notif.text}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {totalVisitors === 0 ? (
        <div id="no_active_visitors_alert" className="border border-dashed border-slate-300 p-10 rounded-3xl text-center bg-slate-50/50 space-y-4">
          <div className="mx-auto w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 animate-pulse">
            <Users className="w-7 h-7" />
          </div>
          <div className="max-w-md mx-auto space-y-1.5">
            <h3 className="font-extrabold text-slate-800 text-sm">বর্তমানে কোনো সক্রিয় ভিজিটর নেই</h3>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              এই মুহূর্তে ওয়েবসাইটে কোনো সক্রিয় কাস্টমার নেই। ডেটা সেভ ও কুয়েরি অপ্টিমাইজড রাখতে stale ব্রাউজার সেশনগুলোকে ৭৫ সেকেন্ড নিষ্ক্রিয়তার পর স্বয়ংক্রিয়ভাবে ক্লিন আউট করা হয়েছে।
            </p>
            <p className="text-xs text-indigo-600 bg-indigo-50/80 p-3 rounded-xl border border-indigo-100 font-semibold mt-3">
              💡 আপনি এখনই আপনার শপের অন্য একটি লিংক বা কাস্টমার ভিউ অন্য ট্যাবে ওপেন করে ট্র্যাকিংয়ের লাইভ প্রতিক্রিয়া ও সাউন্ড নোটিফিকেশন পরীক্ষা করতে পারেন।
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* OVERVIEW METRIC CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            
            {/* Metric 1: Live Visitors count */}
            <div className="bg-white border border-slate-100 p-5 rounded-2xl flex items-center justify-between shadow-sm relative overflow-hidden">
              <div className="space-y-1 z-10">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">লাইভে ভিজিটর</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-slate-900 tracking-tight">{totalVisitors}</span>
                  <span className="text-[10px] font-extrabold text-rose-500 bg-rose-50 px-2 py-0.5 rounded-full flex items-center gap-1 border border-rose-100">
                    <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-ping" /> Real-time
                  </span>
                </div>
              </div>
              <div className="p-3 bg-indigo-50 text-indigo-650 rounded-2xl z-10 shrink-0">
                <Users className="w-5.5 h-5.5 animate-pulse" />
              </div>
            </div>

            {/* Metric 2: Device Models */}
            <div className="bg-white border border-slate-100 p-5 rounded-2xl flex items-center justify-between shadow-sm relative overflow-hidden">
              <div className="space-y-1 z-10">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">ডিভাইস ব্রেকডাউন</span>
                <div className="flex items-center gap-3.5 text-slate-850">
                  <div className="flex items-center gap-1">
                    <Smartphone className="w-4 h-4 text-indigo-500" />
                    <span className="text-base font-bold">{mobileCount}</span>
                    <span className="text-[9.5px] text-slate-400 font-bold">মোবাইল</span>
                  </div>
                  <div className="border-r border-slate-200 h-5" />
                  <div className="flex items-center gap-1">
                    <Laptop className="w-4 h-4 text-emerald-500" />
                    <span className="text-base font-bold">{desktopCount}</span>
                    <span className="text-[9.5px] text-slate-400 font-bold">ডেস্কটপ</span>
                  </div>
                </div>
              </div>
              <div className="p-3 bg-indigo-50 text-indigo-650 rounded-2xl z-10 shrink-0">
                <Smartphone className="w-5.5 h-5.5" />
              </div>
            </div>

            {/* Metric 3: Top Hotspot Zone */}
            <div className="bg-white border border-slate-100 p-5 rounded-2xl flex items-center justify-between shadow-sm relative overflow-hidden">
              <div className="space-y-1 z-10">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">প্রধান আইপি জোন / শহর</span>
                <div className="text-sm font-bold text-slate-900 line-clamp-1 max-w-[150px]">
                  {cityStats[0] ? `${cityStats[0][0]} (${cityStats[0][1]} জন)` : 'Mirpur (Dhaka)'}
                </div>
                <span className="text-[10px] text-indigo-600 font-semibold block">তাত্ক্ষণিক সর্বাধিক ভিজিটেড জোন</span>
              </div>
              <div className="p-3 bg-sky-50 text-sky-600 rounded-2xl z-10 shrink-0">
                <MapPin className="w-5.5 h-5.5" />
              </div>
            </div>

            {/* Metric 4: Trending Page Viewed */}
            <div className="bg-white border border-slate-100 p-5 rounded-2xl flex items-center justify-between shadow-sm relative overflow-hidden">
              <div className="space-y-1 z-10">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">পেইজ ভিউ ট্রেন্ডিং</span>
                <div className="text-sm font-bold text-rose-650 line-clamp-1 max-w-[160px] flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5 text-rose-500 shrink-0" /> 
                  <span>{pageStats[0] ? pageStats[0][0] : 'রেইনকোট ল্যান্ডিং'}</span>
                </div>
                <span className="text-[10px] text-slate-400 block font-medium">সবচেয়ে বেশি মানুষ দেখছে এখন</span>
              </div>
              <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl z-10 shrink-0">
                <Eye className="w-5.5 h-5.5 animate-bounce" />
              </div>
            </div>

          </div>

          {/* VISUAL RADAR AND AREA BREAKDOWN */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Visual Radar Tracker */}
            <div className="bg-slate-900 text-white rounded-3xl border border-slate-800 p-6 flex flex-col justify-between items-center text-center shadow-xl relative overflow-hidden lg:col-span-2">
              <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-30 pointer-events-none" />
              
              <div className="w-full text-left space-y-1 z-10">
                <h3 className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
                  <Globe className="w-4.5 h-4.5 text-indigo-400" /> লাইভ লোকেশন রাডার (সক্রিয় কাস্টমার জিপিএস মানচিত্র)
                </h3>
                <p className="text-[11px] text-slate-400">
                  আইপি এপিআই এর মাধ্যমে ট্র্যাককৃত লাইভ গ্রাহকদের আনুমানিক ট্র্যাকিং রাডার সুইপ।
                </p>
              </div>

              {/* Animated Radar Node Graph representation */}
              <div className="my-8 relative w-56 h-56 flex items-center justify-center">
                <div className="absolute w-44 h-44 border border-indigo-500/10 rounded-full animate-[ping_3s_linear_infinite]" />
                <div className="absolute w-36 h-36 border border-rose-500/15 rounded-full animate-[ping_4.5s_linear_infinite_delay-1000]" />
                <div className="absolute w-56 h-56 border border-slate-700/25 rounded-full" />
                <div className="absolute w-44 h-44 border border-slate-700/40 rounded-full" />
                <div className="absolute w-28 h-28 border border-slate-700/50 rounded-full" />
                <div className="absolute w-14 h-14 border border-slate-700/60 rounded-full" />
                
                <div className="absolute inset-0 rounded-full bg-[conic-gradient(from_0deg,_transparent_50%,_rgba(99,102,241,0.1))] animate-[spin_4.5s_linear_infinite] pointer-events-none" />
                
                <div className="absolute w-3.5 h-3.5 bg-indigo-500 rounded-full shadow-lg shadow-indigo-500/50 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
                </div>

                {uniqueCities.map((city, idx) => {
                  const angle = (city.length * 45) % 360;
                  const radius = 35 + ((city.length * 15) % 65); 
                  const rad = (angle * Math.PI) / 180;
                  const x = radius * Math.cos(rad);
                  const y = radius * Math.sin(rad);

                  return (
                    <div 
                      key={city} 
                      className="absolute duration-500"
                      style={{ transform: `translate(${x}px, ${y}px)` }}
                    >
                      <span className="relative flex h-3.5 w-3.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-80 animate-duration-1000"></span>
                        <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border border-slate-900 justify-center items-center">
                          <span className="w-1 h-1 bg-white rounded-full" />
                        </span>
                      </span>
                      <span className="absolute left-4.5 -top-1 px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-[9px] font-black whitespace-nowrap text-emerald-300">
                        {city} ({cityGroup[city]})
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="w-full text-center text-slate-500 text-[10px] sm:text-xs z-10 border-t border-slate-800 pt-3 flex justify-around">
                <span className="flex items-center gap-1"><span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" /> প্রধান রাডার সোর্স</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" /> সক্রিয় কাস্টমার নোড</span>
              </div>
            </div>

            {/* Geographical Hotspots List */}
            <div className="border border-slate-200 rounded-3xl p-5 flex flex-col justify-between h-full bg-white shadow-sm font-sans">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                    <MapPin className="text-indigo-600" /> সক্রিয় গ্রাহকদের এরিয়া
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    কোন কোন এরিয়া থেকে কাস্টমাররা এই মুহূর্তে হোম, শপ বা কভার পেইজ দেখছেন।
                  </p>
                </div>

                <div className="space-y-3.5">
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
                              idx === 0 ? 'bg-indigo-600' : idx === 1 ? 'bg-indigo-400' : 'bg-slate-400'
                            }`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4 mt-6 text-[10.5px] text-slate-500 font-medium leading-relaxed">
                📢 <span className="text-slate-700 font-bold">টিপস</span>: কোনো এরিয়াতে অ্যাক্টিভিটি রেট অনেক বেশি থাকলে ফেসবুক বা টিকটকে ঐ রিজিওন টার্গেট করে অ্যাড ক্যাম্পেইন বুস্ট করতে পারেন!
              </div>
            </div>

          </div>

          {/* ADVANCED VISITOR LOGS DETAILED STREAM GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans">
            
            {/* Page breakdowns list */}
            <div className="lg:col-span-1 border border-slate-200 rounded-3xl p-5 bg-white shadow-sm space-y-4">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                  <Eye className="text-indigo-600" /> কোন কোন লিংকে কাস্টমার ব্রাউজ করছে
                </h3>
                <p className="text-[11px] text-slate-500">
                  গ্রাহকদের লাইভ পেজ বা লিংক ভিউ পয়েন্ট।
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

            {/* Main Interactive Live Detail Cards Stream */}
            <div className="lg:col-span-2 border border-slate-200 rounded-3xl p-5 bg-white shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                    <Activity className="text-emerald-500 animate-pulse" /> লাইভ অ্যাক্টিভিটি স্ট্রিম ফিড (বিস্তারিত ট্র্যাকিং)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    প্রতিটি সক্রিয় গ্রাহকের সুনির্দিষ্ট রিয়েল-টাইম লাইভ পরিবর্তনসমূহ। ক্লিক করে এডভান্স প্রোফাইল দেখুন।
                  </p>
                </div>
                
                <span className="text-[9.5px] bg-emerald-50 text-emerald-700 font-extrabold px-2.5 py-1 rounded-full flex items-center gap-1 uppercase border border-emerald-100 self-start sm:self-auto">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" /> LIVE DATABASE SYNC
                </span>
              </div>

              <div className="space-y-3.5 max-h-[440px] overflow-y-auto pr-1">
                {realSessions.map((sess) => {
                  const updatedTime = new Date(sess.updatedAt || new Date()).getTime();
                  const diffSec = Math.max(1, Math.floor((Date.now() - updatedTime) / 1000));
                  const displayTime = diffSec < 60 ? `${diffSec} সেকেন্ড আগে` : `${Math.floor(diffSec/60)} মিনিট আগে`;
                  const isExpanded = expandedSessionId === sess.id;

                  // Determine precise OS icon representation or defaults
                  const isMobile = sess.os && (sess.os.indexOf('Android') > -1 || sess.os.indexOf('iOS') > -1 || sess.os.indexOf('iPad') > -1);

                  return (
                    <div 
                      key={sess.id} 
                      className={`rounded-2xl border transition-all duration-300 p-4 relative ${
                        isExpanded 
                          ? 'border-indigo-500 bg-slate-50 shadow-md ring-1 ring-indigo-500/20' 
                          : 'border-slate-100 bg-slate-50/40 hover:bg-slate-50 hover:border-slate-200'
                      }`}
                    >
                      {/* Top Header line */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        
                        {/* Session primary info row */}
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="relative flex h-2 w-2">
                              {diffSec <= 15 ? (
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              ) : null}
                              <span className={`relative inline-flex rounded-full h-2 w-2 ${diffSec <= 15 ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                            </span>

                            <span className="text-xs font-black text-slate-800">
                              কাস্টমার #{sess.id ? sess.id.substring(sess.id.length - 6).toUpperCase() : 'SESS-X'}
                            </span>

                            <span className="text-[10px] bg-sky-50 text-sky-700 px-2 py-0.5 rounded-full font-bold flex items-center gap-1 border border-sky-100">
                              <MapPin className="w-2.5 h-2.5 text-sky-500" /> {sess.city || 'বাংলাদেশ'}
                            </span>

                            {sess.deviceModel && (
                              <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-bold flex items-center gap-1 border border-indigo-100">
                                {isMobile ? <Smartphone className="w-2.5 h-2.5 text-indigo-500" /> : <Laptop className="w-2.5 h-2.5" />}
                                {sess.deviceModel}
                              </span>
                            )}
                          </div>

                          <div className="text-[11px] sm:text-xs text-indigo-950 font-extrabold flex items-center gap-1.5 pt-0.5">
                            <Eye className="w-3.5 h-3.5 text-indigo-500 shrink-0 animate-pulse" /> 
                            <span>লিংক ব্রাউজ করছেন: </span>
                            <span className="text-indigo-700 px-1 bg-indigo-50 rounded select-all font-mono font-black">{sess.page || 'রেইনকোট ল্যান্ডিং পেইজ (হোম)'}</span>
                          </div>
                        </div>

                        {/* Timing and Expand Action Trigger */}
                        <div className="flex sm:flex-col items-start sm:items-end gap-2 sm:gap-1.5 self-stretch sm:self-auto justify-between border-t sm:border-t-0 border-slate-100 pt-2 sm:pt-0 shrink-0">
                          <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1.5">
                            {!sess.deviceModel && (
                              <>
                                {isMobile ? <Smartphone className="w-3 h-3 text-teal-500" /> : <Laptop className="w-3 h-3 text-indigo-400" />}
                                <span>{sess.os || 'Unknown OS'}</span>
                              </>
                            )}
                            <span>{sess.browser || 'Browser'}</span>
                          </span>

                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md flex items-center gap-1 self-end whitespace-nowrap">
                              <Clock className="w-3 h-3 animate-spin animate-duration-3000" /> {displayTime}
                            </span>
                            
                            <button
                              type="button"
                              onClick={() => setExpandedSessionId(isExpanded ? null : sess.id)}
                              className="p-1 hover:bg-slate-200 text-slate-600 hover:text-indigo-600 rounded transition cursor-pointer"
                              title={isExpanded ? "ডিভাইস ও ক্লিক প্যানেল বন্ধ করুন" : "ডিভাইস ও ক্লিক প্যানেল বিস্তারিত দেখুন"}
                            >
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4 animate-bounce" />}
                            </button>
                          </div>
                        </div>

                      </div>

                      {/* EXPANDED PROFILE METRICS SHEET */}
                      {isExpanded && (
                        <div className="mt-4 pt-3.5 border-t border-slate-200/80 grid grid-cols-1 md:grid-cols-2 gap-4">
                          
                          {/* Left Column: Device Profile Details */}
                          <div className="bg-slate-900 text-slate-200 p-3.5 rounded-xl border border-slate-800 space-y-2.5 text-left shadow-inner">
                            <span className="text-[10px] font-black text-indigo-400 block uppercase tracking-wider flex items-center gap-1">
                              <Shield className="w-3 h-3 text-indigo-400" /> CLIENT INFORMATION PROFILE
                            </span>
                            
                            <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px] sm:text-[11px] font-mono leading-normal">
                              <div>
                                <span className="text-slate-400 block select-none">Traffic referrer:</span>
                                <span className="text-white font-bold flex items-center gap-1 truncate" title={sess.referrer}>
                                  <Link className="w-2.5 h-2.5 text-sky-400 shrink-0" /> {sess.referrer || 'Direct Link'}
                                </span>
                              </div>

                              <div>
                                <span className="text-slate-400 block select-none">GPU Core graphics:</span>
                                <span className="text-emerald-300 truncate block font-bold" title={sess.gpu}>
                                  <Cpu className="w-2.5 h-2.5 inline mr-1 text-emerald-400" /> {sess.gpu || 'Integrated GPU'}
                                </span>
                              </div>

                              <div className="mt-1">
                                <span className="text-slate-400 block select-none">Screen resolution:</span>
                                <span className="text-white font-bold block">
                                  <HardDrive className="w-2.5 h-2.5 inline mr-1 text-indigo-400" /> {sess.screenResolution || 'Standard Frame'}
                                </span>
                              </div>

                              <div className="mt-1">
                                <span className="text-slate-400 block select-none">Network connection:</span>
                                <span className="text-indigo-305 font-bold block">
                                  <Compass className="w-2.5 h-2.5 inline mr-1 text-indigo-400" /> {sess.networkType || '4G Tunnel'}
                                </span>
                              </div>

                              <div className="mt-1 col-span-2">
                                <span className="text-slate-400 block select-none">Browser locale language:</span>
                                <span className="text-white font-bold flex items-center gap-1 font-sans">
                                  <Globe className="w-3 h-3 text-slate-400" /> {sess.language === 'bn-BD' || sess.language?.startsWith('bn') ? 'বাংলা (bn-BD / Bengali)' : `English (${sess.language || 'en-US'})`}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Right Column: Dynamic clickstream actions Timeline */}
                          <div className="bg-slate-950 text-slate-300 p-3.5 rounded-xl border border-slate-900 flex flex-col justify-between text-left shadow-inner">
                            <div>
                              <span className="text-[10px] font-black text-emerald-400 block uppercase tracking-wider flex items-center gap-1 mb-1.5">
                                <MousePointer className="w-3 h-3 text-emerald-400" /> গ্রাহকের লাইভ অ্যাকশন সিকোয়েন্স (Clickstream)
                              </span>
                              
                              <div className="space-y-1.5 max-h-[120px] overflow-y-auto pr-1">
                                {sess.actionsHistory && sess.actionsHistory.length > 0 ? (
                                  sess.actionsHistory.map((act, index) => (
                                    <div key={index} className="flex items-start gap-1.5 text-[10.5px] font-mono leading-tight">
                                      <span className="text-slate-500 shrink-0 font-bold font-sans">#{index + 1}</span>
                                      <span className="text-emerald-500 font-bold font-sans">➔</span>
                                      <span className={index === (sess.actionsHistory ? sess.actionsHistory.length - 1 : 0) ? 'text-white font-extrabold underline decoration-emerald-500 decoration-2' : 'text-slate-450'}>
                                        {act}
                                      </span>
                                    </div>
                                  ))
                                ) : (
                                  <div className="text-[10px] text-slate-500 italic py-3 text-center">কোনো ক্লিকে সাড়া মেলেনি।</div>
                                )}
                              </div>
                            </div>

                            {sess.lastAction && (
                              <div className="text-[10px] text-indigo-300 font-bold border-t border-slate-900 pt-1.5 mt-2 font-sans select-all">
                                💡 সর্বশেষ অ্যাক্টিভিটি: <span className="text-yellow-400 font-extrabold">{sess.lastAction}</span>
                              </div>
                            )}
                          </div>

                        </div>
                      )}

                    </div>
                  );
                })}
              </div>

              <div className="text-right text-[10px] text-slate-400 font-medium">
                * কাস্টমার ব্রাউজার থেকে মাউস ক্লিকে বা নেভিগেশন পরিবর্তনে ডেটাবেজ তাত্ক্ষণিক সতেজ হয়।
              </div>

            </div>

          </div>
        </>
      )}

    </div>
  );
}
