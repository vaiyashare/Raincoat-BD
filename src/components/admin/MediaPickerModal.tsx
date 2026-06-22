import React, { useState, useEffect } from 'react';
import { Search, X, Loader2, Image as ImageIcon, CheckCircle, Database } from 'lucide-react';
import { MediaItem } from '../../types';
import { getMediaFromFirestore } from '../../lib/firebase';

interface MediaPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
  title?: string;
}

export default function MediaPickerModal({ isOpen, onClose, onSelect, title = "মিডিয়া গ্যালারি থেকে ছবি সিলেক্ট করুন" }: MediaPickerModalProps) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadMediaItems();
    }
  }, [isOpen]);

  const loadMediaItems = async () => {
    setLoading(true);
    try {
      const mediaList = await getMediaFromFirestore();
      setItems(mediaList || []);
    } catch (err) {
      console.warn("Failed to retrieve media items inside picker", err);
      // fallback from localStorage
      try {
        const cached = localStorage.getItem('raincoat_media_gallery_fallback') || localStorage.getItem('raincoat_media_gallery');
        if (cached) {
          setItems(JSON.parse(cached));
        }
      } catch (_) {}
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Filter items matching search
  const filteredItems = items.filter(item => {
    const term = searchQuery.toLowerCase();
    return (
      (item.title || '').toLowerCase().includes(term) ||
      (item.tag || '').toLowerCase().includes(term) ||
      (item.description || '').toLowerCase().includes(term) ||
      (item.url || '').toLowerCase().includes(term)
    );
  });

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-4xl h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-indigo-600" />
            <h3 className="font-extrabold text-slate-900 text-base">{title}</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 px-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-slate-100 bg-white">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input 
              type="text"
              placeholder="মিডিয়া বা ইমেজ টাইটেল, ট্যাগ, অথবা ডেসক্রিপশন দিয়ে খুঁজুন..."
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm placeholder:text-slate-400"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 p-5 overflow-y-auto bg-slate-50">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full py-12">
              <Loader2 className="h-8 w-8 text-indigo-600 animate-spin mb-2" />
              <p className="text-sm font-bold text-slate-500">মিডিয়া গ্যালারি লোড হচ্ছে...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-16 text-center">
              <ImageIcon className="h-12 w-12 text-slate-300 mb-2" />
              <p className="text-base font-bold text-slate-700">কোন ছবি পাওয়া যায়নি</p>
              <p className="text-xs text-slate-400 mt-1">অনুগ্রহ করে মিডিয়া প্যানেলে গিয়ে নতুন ইমেজ আপলোড করুন।</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filteredItems.map((item) => (
                <div 
                  key={item.id}
                  onClick={() => {
                    onSelect(item.url);
                    onClose();
                  }}
                  className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:border-indigo-500 hover:shadow-md cursor-pointer group transition duration-200 relative"
                >
                  {/* Thumbnail */}
                  <div className="aspect-square w-full relative bg-slate-100 overflow-hidden border-b">
                    <img 
                      src={item.url} 
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition duration-200 flex items-center justify-center">
                      <span className="bg-white/90 text-indigo-700 text-[11px] font-bold px-2.5 py-1 rounded-full shadow flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        সিলেক্ট করুন
                      </span>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-2 gap-0.5 flex flex-col">
                    <span className="text-[10px] font-extrabold text-indigo-600 tracking-wider">
                      {item.tag || 'ইমেজ'}
                    </span>
                    <h4 className="font-bold text-slate-800 text-[11px] line-clamp-1 group-hover:text-indigo-600">
                      {item.title || 'শিরোনামহীন ছবি'}
                    </h4>
                    {item.page && (
                      <span className="text-[8px] bg-slate-100 text-slate-600 px-1 py-0.5 rounded self-start mt-1 font-bold font-mono">
                        {item.page}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-white flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5 font-medium">
            <Database className="h-4 w-4 text-emerald-500" />
            <span>মোট {items.length} টি ছবি সিস্টেমে সেভ করা আছে</span>
          </div>
          <button 
            onClick={onClose}
            className="px-4 py-2 border rounded-xl hover:bg-slate-50 font-bold text-slate-700 text-xs transition"
          >
            বন্ধ করুন
          </button>
        </div>

      </div>
    </div>
  );
}
