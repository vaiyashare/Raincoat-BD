import React, { useState, useEffect } from 'react';
import { Mail, Search, Trash2, Copy, Check, Download, AlertCircle, RefreshCw } from 'lucide-react';
import { Subscriber } from '../../types';
import { getSubscribers, deleteSubscriber } from '../../lib/firebase';

export default function SubscribersAdmin() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedAll, setCopiedAll] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchSubscribers = async () => {
    setLoading(true);
    try {
      const list = await getSubscribers();
      setSubscribers(list);
    } catch (err) {
      console.error('Failed to load subscribers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscribers();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await deleteSubscriber(id);
      setSubscribers((prev) => prev.filter((s) => s.id !== id));
      setDeletingId(null);
    } catch (err) {
      console.error('Failed to delete subscriber:', err);
    }
  };

  const handleCopyAll = () => {
    if (subscribers.length === 0) return;
    const emails = subscribers.map((s) => s.email).join(', ');
    navigator.clipboard.writeText(emails);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const filteredSubscribers = subscribers.filter((s) =>
    s.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 font-sans">
      {/* Header section with counts and actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div className="space-y-1">
          <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
            <Mail className="h-5 w-5 text-orange-550 animate-pulse" />
            <span>ইমেইল সাবস্ক্রিপশন তালিকা (Newsletter Subscribers)</span>
          </h2>
          <p className="text-xs text-slate-400">
            ল্যান্ডিং পেজের সাবস্ক্রিপশন ফর্ম থেকে সংগ্রহ করা সকল ইমেইল এড্রেসের রিয়েল-টাইম ডাটা।
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={fetchSubscribers}
            className="p-2.5 bg-slate-800 hover:bg-slate-755 text-slate-300 hover:text-white rounded-xl transition cursor-pointer flex items-center gap-1.5 text-xs font-bold"
            title="রিফ্রেশ করুন"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            রিফ্রেশ
          </button>
          
          <button
            onClick={handleCopyAll}
            disabled={subscribers.length === 0}
            className="px-4 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white font-extrabold text-xs rounded-xl flex items-center gap-2 cursor-pointer transition shadow-lg shadow-orange-950/20"
          >
            {copiedAll ? (
              <>
                <Check className="h-4 w-4" />
                কপি করা হয়েছে!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                সব ইমেইল কপি করুন
              </>
            )}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <RefreshCw className="h-8 w-8 text-orange-500 animate-spin" />
          <p className="text-xs text-slate-400">সাবস্ক্রাইবার ডেটাবেস লোড হচ্ছে...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex items-center gap-3 bg-slate-900/50 border border-slate-800/80 px-4 py-3 rounded-xl max-w-md">
            <Search className="h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="ইমেইল সার্চ করুন..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 bg-transparent border-0 text-white placeholder-slate-500 text-xs focus:outline-hidden"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="text-[10px] text-slate-400 hover:text-white font-extrabold cursor-pointer"
              >
                ক্লিয়ার
              </button>
            )}
          </div>

          {/* Table list */}
          <div className="bg-slate-950 border border-slate-850 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900/80 border-b border-slate-850">
                    <th className="py-3.5 px-6 text-[10px] tracking-wider text-slate-400 uppercase font-black">ক্রমিক</th>
                    <th className="py-3.5 px-6 text-[10px] tracking-wider text-slate-400 uppercase font-black">ইমেইল এড্রেস</th>
                    <th className="py-3.5 px-6 text-[10px] tracking-wider text-slate-400 uppercase font-black">সাবস্ক্রিপশনের সময়</th>
                    <th className="py-3.5 px-6 text-right text-[10px] tracking-wider text-slate-400 uppercase font-black">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900">
                  {filteredSubscribers.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-16 text-center text-slate-500 font-sans text-xs">
                        <AlertCircle className="h-8 w-8 mx-auto text-slate-600 mb-2.5" />
                        {searchTerm ? 'অনুসন্ধানের সাথে মিল পাওয়া যায়নি।' : 'এখনো কোনো সাবস্ক্রাইবার পাওয়া যায়নি।'}
                      </td>
                    </tr>
                  ) : (
                    filteredSubscribers.map((sub, index) => (
                      <tr key={sub.id} className="hover:bg-slate-900/40 transition">
                        <td className="py-4 px-6 text-xs text-slate-500 font-mono">
                          {index + 1}
                        </td>
                        <td className="py-4 px-6 text-xs text-white font-mono tracking-wide">
                          {sub.email}
                        </td>
                        <td className="py-4 px-6 text-xs text-slate-400 font-mono">
                          {sub.createdAt ? new Date(sub.createdAt).toLocaleString('bn-BD', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true
                          }) : 'N/A'}
                        </td>
                        <td className="py-4 px-6 text-right">
                          {deletingId === sub.id ? (
                            <div className="flex items-center justify-end gap-1.5 animate-fadeIn">
                              <span className="text-[10px] text-red-400 font-bold">ডিলিট করব?</span>
                              <button
                                onClick={() => handleDelete(sub.id)}
                                className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[10px] font-bold cursor-pointer"
                              >
                                হ্যাঁ
                              </button>
                              <button
                                onClick={() => setDeletingId(null)}
                                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[10px] font-bold cursor-pointer"
                              >
                                না
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeletingId(sub.id)}
                              className="p-1.5 hover:bg-red-950/20 text-slate-500 hover:text-red-400 rounded-lg transition-all cursor-pointer inline-flex"
                              title="সাবস্ক্রাইবার ডিলিট করুন"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination / Summary block footer */}
            <div className="bg-slate-900/50 px-6 py-4 border-t border-slate-900 text-slate-500 text-[11px] font-semibold flex items-center justify-between">
              <span>মোট {subscribers.length} জন সাবস্ক্রাইবার নিবন্ধিত আছেন</span>
              {filteredSubscribers.length !== subscribers.length && (
                <span>(সার্চ ফিল্টার করা হয়েছে: {filteredSubscribers.length} জন)</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
