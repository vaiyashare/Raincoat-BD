import React, { useState, useEffect } from 'react';
import { 
  Package, Save, AlertTriangle, CheckCircle, RefreshCw, Sparkles, 
  Settings, ShoppingBag, ArrowUpRight, TrendingUp, Paintbrush, ShieldCheck
} from 'lucide-react';
import { InventoryItem, ProductColor, Size } from '../../types';
import { getInventoryFromFirestore, saveInventoryItemToFirestore } from '../../lib/firebase';

const COLORS: ProductColor[] = ['Black', 'Navy Blue'];
const SIZES: Size[] = ['XL', 'XXL', '3XL', '4XL'];

export default function InventoryAdmin({ userRole }: { userRole: string }) {
  const [loading, setLoading] = useState(true);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSaving, setIsSaving] = useState<string | null>(null);

  // Load inventory from Firestore or local storage fallback
  const fetchInventory = async () => {
    setLoading(true);
    let items: InventoryItem[] = [];
    try {
      items = await getInventoryFromFirestore();
    } catch (e) {
      console.warn("Could not retrieve inventory from Firestore.", e);
    }

    if (items.length === 0) {
      // Create default mock/initial database elements if none exist
      const defaults: InventoryItem[] = [];
      COLORS.forEach(color => {
        SIZES.forEach(size => {
          defaults.push({
            id: `${color}-${size}`,
            color,
            size,
            quantity: 50, // default starter stock
            lowStockAlert: 10
          });
        });
      });

      // Save defaults synchronously
      for (const d of defaults) {
        try {
          await saveInventoryItemToFirestore(d);
        } catch (err) {
          console.error("Initialization write failed:", err);
        }
      }
      setInventory(defaults);
      localStorage.setItem('raincoat_inventory', JSON.stringify(defaults));
    } else {
      // Ensure all 8 variants are protected
      const completeList: InventoryItem[] = [...items];
      let updatedAny = false;
      
      COLORS.forEach(color => {
        SIZES.forEach(size => {
          const key = `${color}-${size}`;
          if (!completeList.some(item => item.id === key)) {
            const newItem: InventoryItem = {
              id: key,
              color,
              size,
              quantity: 0,
              lowStockAlert: 10
            };
            completeList.push(newItem);
            saveInventoryItemToFirestore(newItem).catch(console.error);
            updatedAny = true;
          }
        });
      });

      setInventory(completeList);
      localStorage.setItem('raincoat_inventory', JSON.stringify(completeList));
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleUpdateQuantity = (id: string, value: number) => {
    setInventory(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, quantity: Math.max(0, value) };
      }
      return item;
    }));
  };

  const handleUpdateAlertThreshold = (id: string, value: number) => {
    setInventory(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, lowStockAlert: Math.max(0, value) };
      }
      return item;
    }));
  };

  const handleSaveItem = async (item: InventoryItem) => {
    if (userRole === 'ReadOnly') {
      setErrorMsg('আপমার রিড-অনলি এক্সেস রয়েছে! কোনো ইনভেন্টরি এডিট করা সম্ভব নয়।');
      setTimeout(() => setErrorMsg(''), 4000);
      return;
    }

    setIsSaving(item.id);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      await saveInventoryItemToFirestore(item);
      
      // Update local storage too to ensure persistence consistency
      const currentLocalsJson = localStorage.getItem('raincoat_inventory') || '[]';
      let currentLocals: InventoryItem[] = [];
      try {
        currentLocals = JSON.parse(currentLocalsJson);
      } catch (e) {}
      
      const idx = currentLocals.findIndex(i => i.id === item.id);
      if (idx > -1) {
        currentLocals[idx] = item;
      } else {
        currentLocals.push(item);
      }
      localStorage.setItem('raincoat_inventory', JSON.stringify(currentLocals));

      setSuccessMsg(`"${item.color} - ${item.size}" এর ইনভেন্টরি সফলভাবে আপডেট করা হয়েছে!`);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (error) {
      setErrorMsg('ইনভেন্টরি পরিবর্তন সংরক্ষণ করতে ত্রুটি ঘটেছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
    } finally {
      setIsSaving(null);
    }
  };

  const handleBulkSet = async (qty: number) => {
    if (userRole === 'ReadOnly') {
      setErrorMsg('আপনার রিড-অনলি এক্সেস রয়েছে!');
      return;
    }
    if (!window.confirm(`আপনি কি নিশ্চিতভাবে সব গুলো ভ্যারিয়েন্টের স্টক সংখ্যা ${qty} টি তে সেট করতে চান?`)) {
      return;
    }

    setLoading(true);
    const updated = inventory.map(item => ({ ...item, quantity: qty }));
    setInventory(updated);

    for (const item of updated) {
      await saveInventoryItemToFirestore(item);
    }
    
    localStorage.setItem('raincoat_inventory', JSON.stringify(updated));
    setLoading(false);
    setSuccessMsg('সকল ভ্যারিয়েন্টের স্টক সফলভাবে একই সংখ্যায় সেট করা হয়েছে!');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  // Get aggregated stats
  const totalInStock = inventory.reduce((total, item) => total + (item.quantity || 0), 0);
  const lowStockCount = inventory.filter(item => item.quantity <= (item.lowStockAlert || 10)).length;
  const outOfStockCount = inventory.filter(item => item.quantity === 0).length;

  return (
    <div className="space-y-6 font-sans text-xs sm:text-sm">
      
      {/* Quick Dashboard Header Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 text-white rounded-2xl p-5 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] text-slate-400 font-extrabold uppercase block tracking-wider">রিয়েল-টাইম লাইভ ইনভেন্টরি</span>
            <span className="text-3xl font-black font-sans mt-1 block text-orange-400">{totalInStock} <span className="text-xs font-normal text-slate-350">পিস</span></span>
          </div>
          <div className="p-3 bg-slate-800 rounded-2xl text-orange-400">
            <Package className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-emerald-500/10 border border-emerald-500/20 text-slate-900 rounded-2xl p-5 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-emerald-800 font-extrabold uppercase block tracking-wider">চলতি স্টক ভ্যারিয়েন্ট</span>
            <span className="text-3xl font-black font-sans mt-1 block text-emerald-700">৮ টি <span className="text-xs font-normal text-slate-500">কালার-সাইজ</span></span>
          </div>
          <div className="p-3 bg-emerald-500/20 rounded-2xl text-emerald-700">
            <TrendingUp className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-amber-500/10 border border-amber-500/25 text-slate-905 rounded-2xl p-5 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-amber-805 font-extrabold uppercase block tracking-wider">কম স্টক লেভেল অ্যালার্ট</span>
            <span className="text-3xl font-black font-sans mt-1 block text-amber-700">{lowStockCount} <span className="text-xs font-normal text-slate-500">ভ্যারিয়েন্টে</span></span>
          </div>
          <div className="p-3 bg-amber-500/20 rounded-2xl text-amber-700">
            <AlertTriangle className="h-6 w-6 animate-pulse" />
          </div>
        </div>

        <div className="bg-rose-500/10 border border-rose-500/20 text-slate-905 rounded-2xl p-5 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-rose-805 font-extrabold uppercase block tracking-wider">স্টক আউট (অর্ডার বন্ধ)</span>
            <span className="text-3xl font-black font-sans mt-1 block text-rose-700 font-mono">{outOfStockCount} <span className="text-xs font-normal text-slate-500">ভ্যারিয়েন্ট</span></span>
          </div>
          <div className="p-3 bg-rose-500/20 rounded-2xl text-rose-700">
            <ShoppingBag className="h-6 w-6" />
          </div>
        </div>
      </div>

      {successMsg && (
        <div className="p-3.5 bg-emerald-550/10 border border-emerald-500/30 text-emerald-800 text-xs rounded-xl font-bold flex items-center gap-2">
          <CheckCircle className="h-4.5 w-4.5 text-emerald-600" />
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 bg-rose-550/10 border border-rose-500/30 text-rose-800 text-xs rounded-xl font-bold flex items-center gap-2">
          <AlertTriangle className="h-4.5 w-4.5 text-rose-600" />
          {errorMsg}
        </div>
      )}

      {/* Main Stock Table */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
        <div className="p-5 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
              📦 প্রিমিয়াম ইনভেন্টরি কন্ট্রোল প্যানেল
            </h3>
            <p className="text-[10px] text-slate-500 mt-1">সব কালার ও সাইজ ভ্যারিয়েন্টের স্টক সীমা ও অ্যালার্ট লেভেল নিয়ন্ত্রণ করুন</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button 
              onClick={fetchInventory} 
              className="px-3.5 py-1.8 hover:bg-slate-200 text-slate-700 bg-slate-100 rounded-xl font-bold flex items-center gap-1 cursor-pointer transition"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> রিফ্রেশ করুন
            </button>
            <button 
              onClick={() => handleBulkSet(100)} 
              disabled={userRole === 'ReadOnly'}
              className="px-3 py-1.8 hover:bg-slate-900 text-white bg-slate-800 disabled:opacity-50 rounded-xl font-bold flex items-center gap-1 cursor-pointer transition text-[11px]"
            >
              <Sparkles className="h-3 w-3" /> সবগুলিতে ১০০ স্টক দিন
            </button>
            <button 
              onClick={() => handleBulkSet(0)} 
              disabled={userRole === 'ReadOnly'}
              className="px-3 py-1.8 hover:bg-rose-600 text-white bg-rose-500 disabled:opacity-50 rounded-xl font-bold flex items-center gap-1 cursor-pointer transition text-[11px]"
            >
              সব স্টক আউট করুন
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 text-slate-450 italic flex flex-col items-center gap-2">
            <RefreshCw className="h-7 w-7 text-indigo-500 animate-spin" />
            <span>ইনভেন্টরি ডাটাবেস লোড হচ্ছে... অনুগ্রহ করে অপেক্ষা করুন</span>
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-xs text-left text-slate-500">
              <thead className="bg-slate-100/80 text-slate-700 uppercase font-mono text-[10px] tracking-wider border-b border-slate-200 sticky top-0">
                <tr>
                  <th scope="col" className="px-5 py-4 text-left">ভ্যারিয়েন্ট বিবরণ (Color & Size)</th>
                  <th scope="col" className="px-4 py-4 text-center">কালার (Color)</th>
                  <th scope="col" className="px-4 py-4 text-center">সাইজ (Size)</th>
                  <th scope="col" className="px-5 py-4 text-center">বর্তমান স্টক ক্যাপাসিটি (Quantity)</th>
                  <th scope="col" className="px-5 py-4 text-center">লো-স্টক অ্যালার্ট থ্রেশহোল্ড</th>
                  <th scope="col" className="px-4 py-4 text-center">স্টক লেভেল স্ট্যাটাস</th>
                  <th scope="col" className="px-5 py-4 text-center">সংরক্ষণ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {inventory.map(item => {
                  const isLow = item.quantity <= (item.lowStockAlert || 10);
                  const isOut = item.quantity === 0;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-4.5">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-3.5 h-3.5 rounded-full border border-slate-350 shadow-sm ${item.color === 'Black' ? 'bg-black' : 'bg-blue-800'}`} />
                          <div>
                            <span className="font-extrabold text-slate-900 font-sans text-sm">{item.color} — {item.size}</span>
                            <span className="text-[9px] text-slate-450 font-mono block mt-0.5">ডিভাইস কি: invariant-{item.id}</span>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4.5 text-center">
                        <span className={`px-2.5 py-1 text-[10px] font-black rounded-full border uppercase ${
                          item.color === 'Black' ? 'bg-black text-white border-black/30' : 'bg-blue-900 text-blue-50 border-blue-900/40'
                        }`}>
                          {item.color === 'Black' ? 'কালো (Black)' : 'নেভি ব্লু (Navy)'}
                        </span>
                      </td>

                      <td className="px-4 py-4.5 text-center">
                        <span className="bg-slate-100 border border-slate-200 text-slate-800 font-black px-2 mt-0.5 py-1 text-xs font-mono rounded-lg">
                          {item.size}
                        </span>
                      </td>

                      <td className="px-5 py-4.5 text-center">
                        <div className="flex items-center justify-center gap-2.5 max-w-[120px] mx-auto">
                          <button
                            type="button"
                            onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                            className="w-7 h-7 bg-slate-100 border border-slate-300 rounded-lg hover:bg-slate-200 text-slate-750 font-extrabold text-sm flex items-center justify-center cursor-pointer select-none"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleUpdateQuantity(item.id, parseInt(e.target.value) || 0)}
                            className="w-16 px-1.5 py-1 border border-slate-300 rounded-lg text-center font-extrabold text-xs text-slate-800 bg-white"
                          />
                          <button
                            type="button"
                            onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                            className="w-7 h-7 bg-slate-100 border border-slate-300 rounded-lg hover:bg-slate-200 text-slate-750 font-extrabold text-sm flex items-center justify-center cursor-pointer select-none"
                          >
                            +
                          </button>
                        </div>
                      </td>

                      <td className="px-5 py-4.5 text-center">
                        <div className="flex items-center justify-center gap-2.5 max-w-[100px] mx-auto">
                          <input
                            type="number"
                            value={item.lowStockAlert || 10}
                            onChange={(e) => handleUpdateAlertThreshold(item.id, parseInt(e.target.value) || 0)}
                            className="w-14 px-1.5 py-1 border border-slate-350 rounded-lg text-center font-medium font-mono text-slate-650 bg-white text-xs"
                          />
                        </div>
                      </td>

                      <td className="px-4 py-4.5 text-center">
                        {isOut ? (
                          <span className="px-2.5 py-1 bg-red-100 border border-red-200 text-red-700 text-[10px] font-extrabold rounded-full animate-pulse select-none inline-flex items-center gap-1">
                            ● স্টক শেষ (Sold Out)
                          </span>
                        ) : isLow ? (
                          <span className="px-2.5 py-1 bg-amber-100 border border-amber-200 text-amber-700 text-[10px] font-extrabold rounded-full select-none inline-flex items-center gap-1">
                            ⚠ লো স্টক ({item.quantity} পিস মাত্র)
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 bg-emerald-150 text-emerald-800 border border-emerald-250 text-[10px] font-extrabold rounded-full select-none inline-flex items-center gap-1">
                            ✓ ইন স্টক ({item.quantity} পিস)
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleSaveItem(item)}
                          disabled={isSaving === item.id}
                          className="px-3.5 py-1.5 bg-indigo-650 text-white hover:bg-indigo-755 disabled:opacity-50 text-[10px] font-black rounded-lg shadow-sm transition flex items-center gap-1 cursor-pointer mx-auto"
                        >
                          {isSaving === item.id ? (
                            <RefreshCw className="h-3 w-3 animate-spin" />
                          ) : (
                            <Save className="h-3 w-3" />
                          )}
                          সেভ করুন
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
