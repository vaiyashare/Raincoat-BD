import React, { useState, useEffect } from 'react';
import { 
  Package, Save, AlertTriangle, CheckCircle, RefreshCw, Sparkles, 
  Settings, ShoppingBag, ArrowUpRight, TrendingUp, Paintbrush, ShieldCheck
} from 'lucide-react';
import { InventoryItem, ProductColor, Size } from '../../types';
import { getInventoryFromFirestore, saveInventoryItemToFirestore } from '../../lib/firebase';

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

    // 1. Load active products from Raincoat Marketplace
    const listJson = localStorage.getItem('raincoat_shop_products');
    let productsList: any[] = [];
    if (listJson) {
      try {
        productsList = JSON.parse(listJson);
      } catch (e) {}
    }

    // Seeding fallback if empty
    if (!productsList || productsList.length === 0) {
      productsList = [
        {
          id: 'p-1',
          title: 'প্রিমিয়াম ওয়াটারপ্রুফ রেইনকোট জ্যাকেট ও প্যান্ট সেট (Navy Blue & Black)',
          sizes: ['XL', 'XXL', '3XL', '4XL'],
          colors: ['Black', 'Navy Blue']
        },
        {
          id: 'p-2',
          title: 'হেভি ডিউটি ওয়াটারপ্রুফ মোটরসাইকেল সু কাভার (Shoe Guard)',
          sizes: ['M', 'L', 'XL'],
          colors: ['Black']
        },
        {
          id: 'p-3',
          title: 'ডাবল পার্ট উইন্ডপ্রুফ আমব্রেলা ছাতা (Premium Laptop Defense)',
          sizes: ['Universal'],
          colors: ['Black', 'Blue']
        },
        {
          id: 'p-4',
          title: 'মোটরসাইকেল হ্যান্ডেলবার ওয়াটারপ্রুফ হ্যান্ড গ্লাভস',
          sizes: ['M', 'L'],
          colors: ['Black', 'Red']
        },
        {
          id: 'p-5',
          title: 'প্রিমিয়াম সেলফ-লকিং ওয়াটারপ্রুফ বাইক মোবাইল হোল্ডার',
          sizes: ['L', 'XL'],
          colors: ['Midnight Black']
        }
      ];
    }

    const finalItems: InventoryItem[] = [];

    // Walk through every product & generate exact key combination
    productsList.forEach(product => {
      const colors = (product.colors && product.colors.length > 0) ? product.colors : ['Default'];
      const sizes = (product.sizes && product.sizes.length > 0) ? product.sizes : ['Standard'];

      colors.forEach((color: string) => {
        sizes.forEach((size: string) => {
          const idCandidate1 = `${product.id}-${color}-${size}`;
          const idCandidate2 = `${color}-${size}`;

          // Find existing item from firestore results
          let existing = items.find(i => i.id === idCandidate1);
          if (!existing && product.id === 'p-1') {
            existing = items.find(i => i.id === idCandidate2);
          }

          if (existing) {
            finalItems.push({
              ...existing,
              id: idCandidate1, // enforce canonical template
              productId: product.id,
              productTitle: product.title,
              color,
              size
            });
          } else {
            // New variant initialization
            finalItems.push({
              id: idCandidate1,
              productId: product.id,
              productTitle: product.title,
              color,
              size,
              quantity: 50, // default starter stock
              lowStockAlert: 10
            });
          }
        });
      });
    });

    setInventory(finalItems);
    localStorage.setItem('raincoat_inventory', JSON.stringify(finalItems));
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

      setSuccessMsg(`"${item.productTitle || 'পণ্য'} - ${item.color} - ${item.size}" এর ইনভেন্টরি সফলভাবে আপডেট করা হয়েছে!`);
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
            <span className="text-3xl font-black font-sans mt-1 block text-emerald-700">{inventory.length} টি <span className="text-xs font-normal text-slate-500">কালার-সাইজ</span></span>
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
        <div className="p-3.5 bg-emerald-555/10 border border-emerald-500/30 text-emerald-800 text-xs rounded-xl font-bold flex items-center gap-2">
          <CheckCircle className="h-4.5 w-4.5 text-emerald-600" />
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 bg-rose-555/10 border border-rose-500/30 text-rose-800 text-xs rounded-xl font-bold flex items-center gap-2">
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
          <div className="text-center py-20 text-slate-455 italic flex flex-col items-center gap-2">
            <RefreshCw className="h-7 w-7 text-indigo-500 animate-spin" />
            <span>ইনভেন্টরি ডাটাবেস লোড হচ্ছে... অনুগ্রহ করে অপেক্ষা করুন</span>
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-xs text-left text-slate-500 col-span-1 border-collapse">
              <thead className="bg-slate-100/80 text-slate-700 uppercase font-mono text-[10px] tracking-wider border-b border-slate-200 sticky top-0">
                <tr>
                  <th scope="col" className="px-5 py-4 text-left">প্রোডাক্টের বিবরণ (Product & Variant)</th>
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
                      <td className="px-5 py-4.5 max-w-[280px]">
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-tight block truncate">
                            {item.productTitle || 'অন্যান্য পণ্য'}
                          </span>
                          <span className="font-extrabold text-slate-900 font-sans text-sm">
                            {item.color} — {item.size}
                          </span>
                          <span className="text-[9px] text-slate-400 font-mono block">
                            আইডি: {item.id}
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-4.5 text-center">
                        <span className="px-2.5 py-1 text-[10px] font-black rounded-full border uppercase bg-slate-100 border-slate-300 text-slate-800">
                          {item.color}
                        </span>
                      </td>

                      <td className="px-4 py-4.5 text-center">
                        <span className="bg-slate-100 border border-slate-200 text-slate-800 font-black px-2 py-1 text-xs font-mono rounded-lg">
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
                          className="px-3.5 py-1.5 bg-indigo-650 text-black hover:bg-indigo-755 disabled:opacity-50 text-[10px] font-black rounded-lg shadow-sm transition flex items-center gap-1 cursor-pointer mx-auto"
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
