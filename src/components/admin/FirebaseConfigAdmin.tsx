import React, { useState, useEffect } from 'react';
import { Save, Database, Key, RefreshCw, AlertCircle, CheckCircle2, Lock, Server, ArrowRight, Play, Check } from 'lucide-react';
import { migrateAllData, MigrationProgress } from '../../lib/firebase';

interface FirebaseConfig {
  projectId: string;
  appId: string;
  apiKey: string;
  authDomain: string;
  firestoreDatabaseId: string;
  storageBucket: string;
  messagingSenderId: string;
  measurementId?: string;
}

export default function FirebaseConfigAdmin() {
  const [config, setConfig] = useState<FirebaseConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Migration tools states
  const [migrating, setMigrating] = useState(false);
  const [migrationProgress, setMigrationProgress] = useState<Record<string, MigrationProgress> | null>(null);
  const [migrationSuccess, setMigrationSuccess] = useState(false);
  const [sourceProjectId, setSourceProjectId] = useState('gen-lang-client-0382926351');
  const [sourceDatabaseId, setSourceDatabaseId] = useState('ai-studio-e96a9d5f-9e04-4248-a4e5-49a2955072ec');
  const [sourceApiKey, setSourceApiKey] = useState('AIzaSyDeKf0X8_h_wTbyON5W69vLRG2Uh0g4kEc');

  const fetchConfig = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const response = await fetch('/api/firebase-config');
      if (response.ok) {
        const data = await response.json();
        setConfig(data);
      } else {
        throw new Error('সেটিংস লোড করা সম্ভব হয়নি।');
      }
    } catch (err: any) {
      console.error('Failed to load Firebase config:', err);
      setErrorMsg(err.message || 'Error occurred while loading config.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config) return;

    if (!config.projectId || !config.apiKey || !config.appId) {
      alert('Project ID, API Key এবং App ID আবশ্যিক ফিল্ড!');
      return;
    }

    setSaving(true);
    setSaveSuccess(false);
    setErrorMsg(null);

    try {
      const response = await fetch('/api/firebase-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      if (response.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 4000);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'সেটিংস আপডেট করা সম্ভব হয়নি।');
      }
    } catch (err: any) {
      console.error('Failed to save Firebase config:', err);
      setErrorMsg(err.message || 'Error occurred while saving config.');
    } finally {
      setSaving(false);
    }
  };

  const handleMigrate = async () => {
    if (migrating) return;
    const confirmMigrate = window.confirm('আপনি কি পূর্বের স্যান্ডবক্স ফায়ারবেস থেকে আপনার নতুন বিলিং রেডি ফায়ারবেসে সকল কাস্টমার রেকর্ড, অর্ডার হিস্ট্রি, প্রোডাক্ট এবং জেনারেল কনফিগারেশন ট্রান্সফার করতে নিশ্চিত?');
    if (!confirmMigrate) return;

    setMigrating(true);
    setMigrationSuccess(false);
    try {
      await migrateAllData(
        (progress) => {
          setMigrationProgress({ ...progress });
        },
        sourceProjectId,
        sourceDatabaseId,
        sourceApiKey
      );
      setMigrationSuccess(true);
    } catch (err: any) {
      console.error('Migration failed:', err);
      alert('ডাটা ট্রান্সফার ব্যাহত হয়েছে: ' + err.message);
    } finally {
      setMigrating(false);
    }
  };

  const handleChange = (field: keyof FirebaseConfig, value: string) => {
    if (!config) return;
    setConfig({
      ...config,
      [field]: value,
    });
  };

  if (loading) {
    return (
      <div className="p-8 text-center bg-slate-900 rounded-2xl border border-slate-800 flex flex-col items-center justify-center gap-3">
        <RefreshCw className="h-8 w-8 text-cyan-400 animate-spin" />
        <p className="text-slate-400 text-xs font-bold">ফায়ারবেস ডাটাবেস ও এপিআই কনফিগারেশন লোড করা হচ্ছে...</p>
      </div>
    );
  }

  if (errorMsg && !config) {
    return (
      <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl text-rose-400 space-y-3">
        <AlertCircle className="h-8 w-8 mx-auto" />
        <p className="font-bold">ত্রুটি: {errorMsg}</p>
        <button
          onClick={fetchConfig}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
        >
          আবার চেষ্টা করুন
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 sm:p-8 space-y-6 font-sans text-white">
        {/* Header section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-850 pb-5 gap-4">
          <div>
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <Database className="h-5 w-5 text-amber-500 animate-pulse" />
              <span>ফায়ারবেস এপিআই কানেকশন সেটিংস (Firebase Database Credentials)</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              আপনার অ্যাপ্লিকেশনের ফায়ারস্টোর ডাটাবেস এবং ক্লাউড এপিআই লিংক সেটিংস আপডেট ও পরিবর্তন করুন।
            </p>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-600 hover:to-rose-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-amber-500/15 flex items-center gap-1.5 cursor-pointer"
          >
            {saving ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span>কনফিগারেশন সেভ করুন</span>
          </button>
        </div>

        {saveSuccess && (
          <div className="bg-emerald-950/40 border border-emerald-900/60 p-4 rounded-xl flex items-center gap-3 text-emerald-400 text-xs animate-fadeIn">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
            <div>
              <p className="font-bold">ফায়ারবেস এপিআই কানেকশন সফলভাবে পরিবর্তিত ও সংরক্ষিত হয়েছে!</p>
              <p className="text-[10px] text-emerald-500 mt-0.5">রিমোট ডাটাবেস হ্যান্ডলার নতুন কনফিগারেশন অনুযায়ী আপডেট হয়েছে।</p>
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="bg-rose-950/40 border border-rose-900/60 p-4 rounded-xl flex items-center gap-3 text-rose-450 text-xs">
            <AlertCircle className="h-5 w-5 shrink-0 text-rose-400" />
            <span>ত্রুটি: {errorMsg}</span>
          </div>
        )}

        {/* Warning Tip */}
        <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl text-xs text-slate-400 leading-relaxed flex gap-3">
          <Lock className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-slate-350">গুরুত্বপূর্ণ সতর্কতা (Security Guidance):</span> এই কানেকশন তথ্যগুলো আপনার অ্যাপের ডাটা উৎস নিয়ন্ত্রণ করে। এখানে ভুল তথ্য প্রদান করলে ডাটাবেস কানেকশন বিচ্ছিন্ন হয়ে যেতে পারে এবং পুরো অ্যাপ্লিকেশন অচল হয়ে পড়তে পারে। যেকোনো পরিবর্তনের পর অ্যাপটি রিলোড করে যাচাই করুন।
          </div>
        </div>

        {/* Configuration Form */}
        <form onSubmit={handleSave} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            {/* Project ID */}
            <div className="space-y-1.5">
              <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Project ID <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 pointer-events-none">
                  <Server className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  required
                  value={config?.projectId || ''}
                  onChange={(e) => handleChange('projectId', e.target.value)}
                  placeholder="e.g. gen-lang-client-..."
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-850 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-hidden focus:border-amber-500 transition font-mono"
                />
              </div>
              <p className="text-[10px] text-slate-500">আপনার গুগল ক্লাউড বা ফায়ারবেস প্রজেক্টের ইউনিক আইডি।</p>
            </div>

            {/* API Key */}
            <div className="space-y-1.5">
              <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                API Key <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 pointer-events-none">
                  <Key className="h-4 w-4" />
                </span>
                <input
                  type="password"
                  required
                  value={config?.apiKey || ''}
                  onChange={(e) => handleChange('apiKey', e.target.value)}
                  placeholder="e.g. AIzaSyB6d..."
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-850 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-hidden focus:border-amber-500 transition font-mono"
                />
              </div>
              <p className="text-[10px] text-slate-500">ফায়ারবেস গেটওয়ে অথরাইজেশন কী (Web API Key)।</p>
            </div>

            {/* App ID */}
            <div className="space-y-1.5">
              <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                App ID <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={config?.appId || ''}
                onChange={(e) => handleChange('appId', e.target.value)}
                placeholder="e.g. 1:766465967071:web:44dc54f0c8755ce075ba6a"
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-850 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-hidden focus:border-amber-500 transition font-mono"
              />
              <p className="text-[10px] text-slate-500">আপনার ফায়ারবেস ওয়েব অ্যাপ্লিকেশনের ইউনিক আইডি।</p>
            </div>

            {/* Firestore Database ID */}
            <div className="space-y-1.5">
              <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Firestore Database ID (Optional)
              </label>
              <input
                type="text"
                value={config?.firestoreDatabaseId || ''}
                onChange={(e) => handleChange('firestoreDatabaseId', e.target.value)}
                placeholder="e.g. (default)"
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-850 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-hidden focus:border-amber-500 transition font-mono"
              />
              <p className="text-[10px] text-slate-500">ডিফল্ট ছাড়াও কাস্টম ডাটাবেস ইন্সট্যান্স কানেকশন আইডি (যেমন: AI Studio DB)।</p>
            </div>

            {/* Auth Domain */}
            <div className="space-y-1.5">
              <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Auth Domain
              </label>
              <input
                type="text"
                value={config?.authDomain || ''}
                onChange={(e) => handleChange('authDomain', e.target.value)}
                placeholder="e.g. projectname.firebaseapp.com"
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-850 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-hidden focus:border-amber-500 transition font-mono"
              />
            </div>

            {/* Storage Bucket */}
            <div className="space-y-1.5">
              <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Storage Bucket
              </label>
              <input
                type="text"
                value={config?.storageBucket || ''}
                onChange={(e) => handleChange('storageBucket', e.target.value)}
                placeholder="e.g. projectname.firebasestorage.app"
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-850 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-hidden focus:border-amber-500 transition font-mono"
              />
            </div>

            {/* Messaging Sender ID */}
            <div className="space-y-1.5">
              <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Messaging Sender ID
              </label>
              <input
                type="text"
                value={config?.messagingSenderId || ''}
                onChange={(e) => handleChange('messagingSenderId', e.target.value)}
                placeholder="e.g. 766465967071"
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-850 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-hidden focus:border-amber-500 transition font-mono"
              />
            </div>

            {/* Measurement ID */}
            <div className="space-y-1.5">
              <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Measurement ID
              </label>
              <input
                type="text"
                value={config?.measurementId || ''}
                onChange={(e) => handleChange('measurementId', e.target.value)}
                placeholder="e.g. G-XXXXXX"
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-850 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-hidden focus:border-amber-500 transition font-mono"
              />
            </div>

          </div>

          <div className="flex justify-end pt-4 border-t border-slate-850">
            <button
              type="submit"
              disabled={saving}
              className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-600 hover:to-rose-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-amber-500/15 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {saving ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              <span>সেটিংস পরিবর্তন করুন</span>
            </button>
          </div>
        </form>
      </div>

      {/* 🔄 Firebase Data Migrator Card */}
      <div className="bg-slate-900 rounded-2xl border border-slate-850 p-6 sm:p-8 space-y-5 font-sans text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-rose-500/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-850 pb-4 gap-4">
          <div>
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <RefreshCw className={`h-5 w-5 text-cyan-400 ${migrating ? 'animate-spin' : ''}`} />
              <span>ফায়ারবেস ডেটা ট্রান্সফার টুল (Firebase Old-to-New Data Migrator)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              আপনার আগের স্যান্ডবক্স ফায়ারবেস থেকে নতুন বিলিং রেডি ফায়ারবেসে সকল কাস্টমার রেকর্ড, অর্ডার হিস্ট্রি, প্রোডাক্ট এবং জেনারেল সেটিংস ওয়ান-ক্লিকে ট্রান্সফার করুন।
            </p>
          </div>

          <button
            onClick={handleMigrate}
            disabled={migrating}
            className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 disabled:opacity-60 text-slate-950 font-black rounded-xl text-xs transition-all shadow-md shadow-cyan-500/15 flex items-center gap-2 cursor-pointer"
          >
            {migrating ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>ট্রান্সফার হচ্ছে...</span>
              </>
            ) : (
              <>
                <Play className="h-4 w-4 fill-slate-950" />
                <span>ট্রান্সফার শুরু করুন</span>
              </>
            )}
          </button>
        </div>

        {/* Source Configuration Inputs */}
        <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl space-y-3">
          <h4 className="text-xs font-extrabold text-slate-350 flex items-center gap-1.5">
            <span>🔗 স্যান্ডবক্স বা পূর্বের ফায়ারবেস প্রজেক্টের তথ্য (Source Firebase Info)</span>
          </h4>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            ডিফল্টভাবে আপনার পূর্বের স্যান্ডবক্স প্রজেক্টের আইডি এবং এপিআই কী সেট করা আছে। আপনি চাইলে অন্য যেকোনো সোর্স প্রজেক্ট থেকে ডাটা মাইগ্রেট করতে এই ঘরগুলো পরিবর্তন করতে পারেন।
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider">Source Project ID</label>
              <input
                type="text"
                value={sourceProjectId}
                onChange={(e) => setSourceProjectId(e.target.value)}
                placeholder="e.g. gen-lang-client-..."
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-600 font-mono tracking-wide focus:outline-hidden focus:border-cyan-400"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider">Source Database ID</label>
              <input
                type="text"
                value={sourceDatabaseId}
                onChange={(e) => setSourceDatabaseId(e.target.value)}
                placeholder="e.g. (default)"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-600 font-mono tracking-wide focus:outline-hidden focus:border-cyan-400"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider">Source API Key</label>
              <input
                type="password"
                value={sourceApiKey}
                onChange={(e) => setSourceApiKey(e.target.value)}
                placeholder="e.g. AIzaSyB..."
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-600 font-mono tracking-wide focus:outline-hidden focus:border-cyan-400"
              />
            </div>
          </div>
        </div>

        {migrationSuccess && (
          <div className="bg-emerald-950/40 border border-emerald-900/60 p-4 rounded-xl flex items-center gap-3 text-emerald-400 text-xs animate-fadeIn">
            <CheckCircle2 className="h-6 w-6 shrink-0 text-emerald-400" />
            <div>
              <p className="font-extrabold text-sm">সফলভাবে ট্রান্সফার সম্পন্ন হয়েছে (Migration Succeeded)!</p>
              <p className="text-[11px] text-emerald-500 mt-0.5 leading-relaxed">
                আলহামদুলিল্লাহ! আপনার পূর্বের সকল সফল অর্ডার, ড্রাফট হিস্টরি, পণ্যসমূহ, কুপন এবং স্টোর কনফিগারেশন সেটিংস সফলভাবে নতুন ডাটাবেসে স্থানান্তরিত হয়েছে।
              </p>
            </div>
          </div>
        )}

        {/* Live progress indicators */}
        <div className="space-y-3.5 bg-slate-950/70 border border-slate-850/60 p-5 rounded-2xl">
          <h4 className="text-xs font-black text-slate-350 flex items-center justify-between">
            <span>📊 রিয়েল-টাইম ডাটা মাইগ্রেশন স্ট্যাটাস</span>
            {migrating && (
              <span className="text-[10px] text-cyan-400 animate-pulse font-bold flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-cyan-400 inline-block animate-ping"></span>
                ডাটা রিড ও রাইট করা হচ্ছে...
              </span>
            )}
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {migrationProgress ? (
              (Object.entries(migrationProgress) as [string, MigrationProgress][]).map(([key, item]) => {
                const isCompleted = item.status === 'completed';
                const isProcessing = item.status === 'processing';
                const isError = item.status === 'error';
                
                let pct = 0;
                if (item.total > 0) {
                  pct = Math.round((item.current / item.total) * 100);
                } else if (isCompleted) {
                  pct = 100;
                }

                return (
                  <div key={key} className="bg-slate-900 border border-slate-850 p-3.5 rounded-xl space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold flex items-center gap-1.5">
                        {isCompleted && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />}
                        {isProcessing && <RefreshCw className="h-3.5 w-3.5 text-cyan-400 animate-spin" />}
                        {!isCompleted && !isProcessing && <div className="h-3.5 w-3.5 rounded-full border border-slate-700 bg-slate-950"></div>}
                        <span className={isCompleted ? 'text-slate-300' : 'text-slate-400'}>{item.collection}</span>
                      </span>
                      <span className="font-mono text-[10px] text-slate-400 font-extrabold bg-slate-950 px-2 py-0.5 rounded">
                        {isCompleted ? 'Finished' : isProcessing ? `${item.current} / ${item.total}` : 'Queued'}
                      </span>
                    </div>

                    {/* Simple progress bar */}
                    <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-850">
                      <div 
                        className={`h-full transition-all duration-300 ${
                          isCompleted ? 'bg-emerald-500' : isError ? 'bg-rose-500' : 'bg-cyan-400 animate-pulse'
                        }`}
                        style={{ width: `${pct}%` }}
                      ></div>
                    </div>

                    {isError && item.errorMessage && (
                      <p className="text-[10px] text-rose-400">{item.errorMessage}</p>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="col-span-2 text-center py-6 text-xs text-slate-500 font-bold border border-dashed border-slate-800 rounded-xl bg-slate-900/30">
                ডাটা ট্রান্সফার দেখার জন্য উপরের "ট্রান্সফার শুরু করুন" বাটনে ক্লিক করুন।
              </div>
            )}
          </div>
        </div>

        <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl text-[11px] text-slate-400 leading-relaxed space-y-1.5">
          <p className="font-extrabold text-slate-300 flex items-center gap-1.5">
            <Check className="h-4 w-4 text-cyan-400" />
            কেন এটি ব্যবহার করা আবশ্যক?
          </p>
          <ul className="list-disc list-inside space-y-1 pl-1 text-slate-400">
            <li><strong>সম্পূর্ণ ডাটা মাইগ্রেশন:</strong> কাস্টমার ইনফরমেশন যেমন ফোন নাম্বার, ঠিকানা, সাইজ, কালার ইত্যাদি সব কিছু সঠিক ফাইলে কপি হবে।</li>
            <li><strong>কনফিগারেশন প্রিজারভেশন:</strong> কুরিয়ার এপিআই সেটিংস এবং অটোমেশন কনফিগারেশন পুরোপুরি অক্ষুণ্ণ থাকবে।</li>
            <li><strong>রিয়েল-টাইম রেভিনিউ ট্র্যাকিং:</strong> ডাটা ট্রান্সফারের পরে আপনার অ্যাডমিন প্যানেল গ্রাফ এবং চার্টগুলি স্বয়ংক্রিয়ভাবে রিলোড হয়ে সব তথ্য দেখাবে।</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
