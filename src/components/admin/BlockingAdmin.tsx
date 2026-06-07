import React, { useState, useEffect } from 'react';
import { ShieldCheck, AlertOctagon, Flame, ToggleLeft, ToggleRight, CheckSquare, Trash2 } from 'lucide-react';

interface BlockingAdminProps {
  userRole: string; // 'Admin' | 'Editor' | 'ReadOnly'
}

export default function BlockingAdmin({ userRole }: BlockingAdminProps) {
  const [isEnabled, setIsEnabled] = useState(true);
  const [blockDurationHours, setBlockDurationHours] = useState(2);
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Read current settings
    const spamEnabled = localStorage.getItem('raincoat_antispam_enabled') !== 'false';
    const spamDuration = localStorage.getItem('raincoat_antispam_duration') || '2';
    
    setIsEnabled(spamEnabled);
    setBlockDurationHours(parseInt(spamDuration, 10));
  }, []);

  const handleSaveSpamRules = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');

    if (userRole === 'ReadOnly') {
      return setMessage('দয়া করে আপনার এক্সেস রোল চেক করুন (রিড-অনলি মোডে পরিবর্তন করা সম্ভব নয়)!');
    }

    localStorage.setItem('raincoat_antispam_enabled', isEnabled.toString());
    localStorage.setItem('raincoat_antispam_duration', blockDurationHours.toString());

    setMessage('এন্টি-ব্লকিং ও স্প্যাম প্রোটেকশন সেটিংস সফলভাবে সেভ হয়েছে!');
    setTimeout(() => setMessage(''), 3000);
  };

  const clearBlockedHistory = () => {
    if (userRole === 'ReadOnly') {
      alert('রিড-অনলি মোডে থাকা অবস্থায় হিস্ট্রি ক্লিয়ার করা সম্ভব নয়!');
      return;
    }
    
    if (window.confirm('আপনি কি নিশ্চিতভাবে আপনার নিজের ব্রাউজারের বুকিং ব্লকিং হিস্ট্রি মুছে দিয়ে পুনরায় অর্ডার ট্রায়াল করতে চান?')) {
      localStorage.removeItem('raincoat_last_placed_timestamp');
      alert('সফলভাবে আপনার ট্রায়াল ব্লকার বা টাইমস্ট্যাম্প মুছে ফেলা হয়েছে!');
    }
  };

  return (
    <form onSubmit={handleSaveSpamRules} className="space-y-6 font-sans text-xs sm:text-sm text-slate-705">
      <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-4">
        
        {/* Title */}
        <div className="flex items-center gap-1.5 pb-2 border-b border-slate-200">
          <AlertOctagon className="h-5 w-5 text-orange-500 animate-bounce" />
          <div>
            <h3 className="font-extrabold text-slate-900 text-sm">এন্টি-ব্লগিং ও স্প্যাম কাস্টমার প্রোটেকশন (Spam Order Protection)</h3>
            <p className="text-[10px] text-slate-400">একের পর এক ডুপ্লিকেট কাস্টমার অর্ডার, একই নাম্বারে বারবার অর্ডার হওয়া এবং অসৎ প্র্যাঙ্ক রোধ করুন স্বয়ংক্রিয় উপায়ে।</p>
          </div>
        </div>

        {message && (
          <div className="p-3 bg-emerald-50 border border-emerald-250 text-emerald-800 text-xs rounded-xl font-bold">
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
            <h4 className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
              🛡️ ব্লকার স্ট্যাটাস (Spam Blocker Status)
            </h4>
            <p className="text-[10px] text-slate-450 leading-relaxed">
              যদি এটি চালু থাকে, কোনো কাস্টমার তার ফোন নাম্বার ব্যবহার করে পরপর দুটি অর্ডার করতে পারবেন না। একই ব্রাউজারের সেশন থেকেও ২ ঘণ্টার মাঝে নতুন অর্ডার ব্লক থাকবে।
            </p>

            <button
              type="button"
              onClick={() => {
                if (userRole !== 'ReadOnly') setIsEnabled(!isEnabled);
              }}
              className="flex items-center gap-2 text-slate-800 font-extrabold text-xs cursor-pointer focus:outline-none"
            >
              {isEnabled ? (
                <>
                  <ToggleRight className="h-9 w-9 text-indigo-600 fill-indigo-100" />
                  <span className="text-emerald-600 font-black">ব্লকিং সুরক্ষিত সক্রিয় (Active)</span>
                </>
              ) : (
                <>
                  <ToggleLeft className="h-9 w-9 text-slate-350" />
                  <span className="text-slate-400">ব্লকার নিষ্ক্রিয় (Inactive)</span>
                </>
              )}
            </button>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
            <h4 className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
              ⏱️ ব্লকিং সময় নির্ধারণ
            </h4>
            <p className="text-[10px] text-slate-450 leading-relaxed">
              একটি অর্ডার করার কত সময় পর্যন্ত একই নাম্বার ও সেশন থেকে পুনরায় অর্ডার জমা নেওয়া বন্ধ থাকবে (ঘণ্টায়):
            </p>
            
            <div className="flex items-center gap-2">
              <select
                value={blockDurationHours}
                onChange={(e) => setBlockDurationHours(Number(e.target.value))}
                className="bg-slate-50 border border-slate-200 text-xs rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-indigo-500 font-bold"
                disabled={userRole === 'ReadOnly'}
              >
                <option value={1}>১ ঘণ্টা (1 Hour block)</option>
                <option value={2}>২ ঘণ্টা (2 Hours block - Default)</option>
                <option value={6}>৬ ঘণ্টা (6 Hours block)</option>
                <option value={12}>১২ ঘণ্টা (12 Hours block)</option>
                <option value={24}>২৪ ঘণ্টা (24 Hours block)</option>
              </select>
            </div>
          </div>

        </div>

        {/* Action controls */}
        <div className="pt-2 flex flex-col sm:flex-row gap-3">
          <button
            type="submit"
            className="py-2.5 px-6 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black rounded-xl transition duration-150 flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
          >
            <CheckSquare className="h-4 w-4 text-orange-400" /> সেটিংস সংরক্ষণ করুন
          </button>

          <button
            type="button"
            onClick={clearBlockedHistory}
            className="py-2.5 px-5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Trash2 className="h-4 w-4 text-rose-500" /> টেস্ট করার জন্য আমার ব্লকার রিলিজ করুন
          </button>
        </div>

      </div>
    </form>
  );
}
