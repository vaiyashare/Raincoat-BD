import React, { useState, useEffect, useRef } from 'react';
import { 
  Scan, CheckCircle2, AlertTriangle, Printer, Trash2, 
  Search, ShieldAlert, Phone, User, Clock, Check, RefreshCw, Sparkles, Volume2, VolumeX, HelpCircle, Eye, CornerDownLeft
} from 'lucide-react';
import { RaincoatOrder } from '../../types';
import Barcode from '../Barcode';

interface BarcodeReaderAdminProps {
  orders: RaincoatOrder[];
  incompleteOrders: any[];
  onChangeStatus: (id: string, newStatus: any) => void;
  onToggleConfirmOrder: (id: string) => void;
  onRefreshOrders: () => void;
  perms: {
    canEdit: boolean;
    canDelete: boolean;
  };
}

export default function BarcodeReaderAdmin({
  orders,
  incompleteOrders,
  onChangeStatus,
  onToggleConfirmOrder,
  onRefreshOrders,
  perms
}: BarcodeReaderAdminProps) {
  const [scanInput, setScanInput] = useState('');
  const [scannedRecords, setScannedRecords] = useState<{
    phone: string;
    timestamp: Date;
    success: boolean;
    type: 'success' | 'not_found' | 'multiple';
    ordersCount: number;
  }[]>([]);
  const [activeScannedPhone, setActiveScannedPhone] = useState<string | null>(null);
  const [soundOn, setSoundOn] = useState<boolean>(() => {
    return localStorage.getItem('barcode_scan_sound') !== 'false';
  });

  const inputRef = useRef<HTMLInputElement>(null);

  // Keep input focused in scanner mode
  useEffect(() => {
    const focusTimer = setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 400);

    // Click handler to re-focus automatically
    const handleBodyClick = () => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    };

    document.addEventListener('click', handleBodyClick);
    return () => {
      clearTimeout(focusTimer);
      document.removeEventListener('click', handleBodyClick);
    };
  }, []);

  const playSound = (type: 'success' | 'error') => {
    if (!soundOn) return;
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;
      if (type === 'success') {
        // High-pitched double-beep (typical premium barcode scanner beep)
        osc.frequency.setValueAtTime(1200, now);
        gain.gain.setValueAtTime(0.12, now);
        osc.start(now);
        osc.stop(now + 0.08);

        // Second beep
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.frequency.setValueAtTime(1500, now + 0.1);
        gain2.gain.setValueAtTime(0.12, now + 0.1);
        osc2.start(now + 0.1);
        osc2.stop(now + 0.18);
      } else {
        // Flat buzz error sound
        osc.frequency.setValueAtTime(220, now);
        gain.gain.setValueAtTime(0.15, now);
        osc.start(now);
        osc.stop(now + 0.35);
      }
    } catch (e) {
      console.warn('Audio context playback blocked or unsupported:', e);
    }
  };

  const normalizePhone = (phoneStr: string): string => {
    const clean = phoneStr.replace(/[^0-9]/g, '');
    return clean.slice(-11); // return last 11 digits to avoid matching country code prefixes (+88, etc)
  };

  const handleScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    processScannedValue(scanInput);
    setScanInput('');
  };

  const processScannedValue = (rawVal: string) => {
    const cleanInput = rawVal.trim().replace(/[^0-9]/g, '');
    if (!cleanInput) return;

    const normalizedInput = cleanInput.slice(-11);

    // Look for matching completed orders & incomplete drafts
    const foundOrders = orders.filter(o => o && normalizePhone(o.phone || '') === normalizedInput);
    const foundDrafts = incompleteOrders.filter(o => o && normalizePhone(o.phone || '') === normalizedInput);

    const totalMatches = foundOrders.length + foundDrafts.length;

    const success = totalMatches > 0;
    const type = !success ? 'not_found' : totalMatches > 1 ? 'multiple' : 'success';

    // Add to historic scans log
    setScannedRecords(prev => [
      {
        phone: rawVal.trim(),
        timestamp: new Date(),
        success,
        type,
        ordersCount: totalMatches
      },
      ...prev.slice(0, 49) // Keep last 50 scan records
    ]);

    if (success) {
      playSound('success');
      setActiveScannedPhone(normalizedInput);
    } else {
      playSound('error');
      // Briefly show mismatch alert
      setActiveScannedPhone(null);
    }
  };

  const handleSimulateScan = (phoneNum: string) => {
    processScannedValue(phoneNum);
  };

  const getScannedOrders = () => {
    if (!activeScannedPhone) return [];
    return orders.filter(o => o && normalizePhone(o.phone || '') === activeScannedPhone);
  };

  const getScannedDrafts = () => {
    if (!activeScannedPhone) return [];
    return incompleteOrders.filter(o => o && normalizePhone(o.phone || '') === activeScannedPhone);
  };

  const scannedOrdersList = getScannedOrders();
  const scannedDraftsList = getScannedDrafts();

  return (
    <div className="space-y-6 font-sans text-slate-800">
      
      {/* Dynamic Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6.5 rounded-2xl text-white shadow-lg border border-slate-800/50 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="space-y-1.5 text-center md:text-left">
          <span className="text-[10px] bg-indigo-500/20 text-indigo-300 font-extrabold tracking-widest uppercase px-2.5 py-1 rounded-full border border-indigo-400/20 inline-flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
            EAN-128 বারকোড রিডার সচল
          </span>
          <h2 className="text-xl font-black tracking-tight text-white flex items-center justify-center md:justify-start gap-2">
            🖨️ কাস্টমার নম্বর বারকোড কন্ট্রোল প্যানেল
          </h2>
          <p className="text-[11px] text-slate-400 font-medium max-w-xl">
            লেবেলে প্রিন্টকৃত বারকোড হ্যান্ডহেল্ড স্ক্যানার দিয়ে স্ক্যান করুন। সিস্টেম ২ মিলিসেকেন্ডে সঠিক কাস্টমার প্রোফাইল, অর্ডার হিস্ট্রি ও ড্রাফট বের করে দ্রুত শিপমেন্ট আপডেট করার সুযোগ দেবে।
          </p>
        </div>

        {/* Audio feedback control */}
        <button
          type="button"
          onClick={() => {
            const nextSound = !soundOn;
            setSoundOn(nextSound);
            localStorage.setItem('barcode_scan_sound', String(nextSound));
          }}
          className={`px-4 py-2.5 rounded-xl border font-bold text-xs flex items-center gap-2 transition cursor-pointer select-none shrink-0 ${
            soundOn 
            ? 'bg-emerald-600 border-emerald-500 text-white hover:bg-emerald-700 shadow-md shadow-emerald-600/15'
            : 'bg-white/10 border-white/10 text-slate-350 hover:bg-white/15'
          }`}
        >
          {soundOn ? (
            <>
              <Volume2 className="h-4 w-4 text-emerald-250 animate-bounce" />
              <span>স্ক্যান সাউন্ড সচল (অন)</span>
            </>
          ) : (
            <>
              <VolumeX className="h-4 w-4 text-slate-500" />
              <span>স্ক্যান সাউন্ড বন্ধ (অফ)</span>
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left column: Laser scanning station & simulation controller */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Virtual scanning laser block */}
          <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 text-center relative overflow-hidden shadow-inner">
            <div className="absolute inset-0 bg-radial-at-t from-indigo-500/5 to-transparent pointer-events-none" />
            
            {/* Blinking scanning red line */}
            <div className="absolute left-0 right-0 h-0.5 bg-rose-500 shadow-[0_0_10px_#f43f5e] animate-[pulse_1.5s_infinite] opacity-65 top-1/2" />

            <div className="space-y-4">
              <Scan className="h-10 w-10 text-indigo-400 mx-auto animate-pulse" />
              <div className="space-y-1">
                <h4 className="text-sm font-black text-slate-100">শিপিং হ্যান্ডহেল্ড রিডার এন্ট্রি</h4>
                <p className="text-[10px] text-slate-400">বারকোড স্ক্যানারটি এই নিচে অটো-ফোকাস ইনপুটে রিড করবে</p>
              </div>

              {/* Scan form submissions */}
              <form onSubmit={handleScanSubmit} className="relative max-w-xs mx-auto">
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="এখানে বারকোড স্ক্যান করুন..."
                  value={scanInput}
                  onChange={(e) => setScanInput(e.target.value)}
                  className="w-full text-center tracking-widest font-mono text-base font-bold bg-slate-950 text-emerald-450 text-emerald-400 border border-slate-700 rounded-xl py-3 px-4 focus:border-indigo-500 focus:ring-0 placeholder-slate-600 focus:outline-none transition duration-200"
                />
                
                <span className="absolute right-3.5 top-3.5 text-[9px] font-black text-slate-600 flex items-center gap-1 pointer-events-none">
                  [ENTER]
                </span>
              </form>

              <div className="flex items-center justify-center gap-1.5 text-[10px] text-indigo-300 font-semibold bg-indigo-500/10 py-1.5 px-3.5 rounded-lg border border-indigo-500/15 max-w-max mx-auto">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                কী-বোর্ড ও ইউএসবি স্ক্যানার লিসেনার সক্রিয় রয়েছে
              </div>
            </div>
          </div>

          {/* Quick Simulation block */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="border-b border-slate-150 pb-2.5 flex items-center justify-between">
              <div>
                <strong className="text-xs font-black text-slate-800 block">স্মার্ট বারকোড জেনারেটর ও স্ক্যানার সিমুলেটর</strong>
                <span className="text-[10px] text-slate-500">আপনার ডেটাবেসের সাম্প্রতিক অর্ডার নিয়ে টেস্ট স্ক্যান করুন</span>
              </div>
              <Sparkles className="h-4.5 w-4.5 text-indigo-600 animate-pulse" />
            </div>

            <div className="space-y-3.5 max-h-[380px] overflow-y-auto pr-1">
              {orders.slice(0, 4).map((order) => {
                const cleanPhone = (order.phone || '').replace(/[^0-9]/g, '');
                return (
                  <div key={order.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl hover:border-indigo-300 hover:bg-indigo-50/20 transition group flex flex-col items-center justify-between gap-3 text-center">
                    <div className="flex items-center justify-between w-full">
                      <div className="text-left leading-tight">
                        <span className="text-[11px] font-black text-slate-900 block truncate max-w-[150px]">{order.name}</span>
                        <span className="text-[10px] font-mono text-slate-500 block">{order.phone}</span>
                      </div>
                      <span className="text-[8.5px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded font-black font-mono">
                        #{order.id.replace('ord-', '').slice(0, 5)}
                      </span>
                    </div>

                    {/* Simple Barcode Preview SVG as specified */}
                    <div className="py-2.5 px-4 bg-white border border-slate-200/80 rounded-lg shadow-sm w-full">
                      <Barcode value={cleanPhone} height={20} width={1.2} fontSize={8} />
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSimulateScan(cleanPhone)}
                      className="w-full py-1.5 text-[10px] font-black bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-600 hover:text-white cursor-pointer hover:border-indigo-600 transition rounded-lg flex items-center justify-center gap-1"
                    >
                      <span>⚡ টেস্ট স্ক্যান সিমুলেট করুন (Click to Scan)</span>
                    </button>
                  </div>
                );
              })}
              {orders.length === 0 && (
                <p className="text-xs text-slate-400 italic text-center py-4">সিমুলেট করার জন্য ডেটাবেসে কোনো অর্ডার পাওয়া যায়নি।</p>
              )}
            </div>
          </div>

          {/* Quick Logs of recent scans */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
            <span className="text-xs font-black text-slate-800 block">সাম্প্রতিক স্ক্যান তালিকা (Scan History)</span>
            
            <div className="space-y-2 max-h-[160px] overflow-y-auto">
              {scannedRecords.map((rec, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded-xl text-xs bg-slate-50 border border-slate-150">
                  <span className="font-mono text-slate-600 flex items-center gap-1.5">
                    {rec.success ? (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                    )}
                    {rec.phone}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className={`text-[8.5px] font-black px-2 py-0.5 rounded ${
                      rec.type === 'success' ? 'bg-emerald-100 text-emerald-800' :
                      rec.type === 'multiple' ? 'bg-amber-100 text-amber-800' :
                      'bg-rose-100 text-rose-800'
                    }`}>
                      {rec.type === 'success' ? 'মিলছে (Found)' :
                       rec.type === 'multiple' ? `একাধিক (${rec.ordersCount})` : 'কোনো মিল নেই'}
                    </span>
                    <span className="text-[9px] font-mono text-slate-400">
                      {rec.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
              {scannedRecords.length === 0 && (
                <span className="text-[10px] text-slate-400 italic text-center block py-1">কোনো বারকোড এখনো স্ক্যান করা হয়নি।</span>
              )}
            </div>
          </div>

        </div>

        {/* Right column: Target Profile Detail & Fast Updates */}
        <div className="lg:col-span-7 space-y-6">
          
          {!activeScannedPhone ? (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-12 text-center space-y-4">
              <div className="w-20 h-20 bg-indigo-50 border border-indigo-150 rounded-full flex items-center justify-center mx-auto text-indigo-500 text-3xl shadow-sm">
                🔍
              </div>
              <div className="space-y-1.5">
                <h4 className="text-sm font-black text-slate-900">স্ক্যান ফলাফলের অপেক্ষায়...</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  বারকোড স্ক্যানার দিয়ে স্ক্যান করলে বা বামদিকের সিমুলেটর বোতামে ক্লিক করলে কাস্টমারের ডিটেইল প্রফাইল এখানে প্রদর্শিত হবে।
                </p>
              </div>

              {/* Instructions checklist */}
              <div className="bg-white border border-slate-150 rounded-xl p-4.5 max-w-md mx-auto text-left text-xs font-semibold space-y-2 text-slate-650">
                <span className="text-[10px] font-black text-slate-400 tracking-wider uppercase block">ব্যবহার করার নিয়মাবলী:</span>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[9px] font-bold">১</span>
                  <span>ইনভয়েস বা প্রিন্ট লেবেল পিডিএফের বারকোডের মান হল গ্রাহকের মোবাইল নম্বর।</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[9px] font-bold">২</span>
                  <span>স্ক্যান করার সময় আপনার কী-বোর্ড ইনপুট ভাষা ইংরেজি আছে কিনা নিশ্চিত করুন।</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[9px] font-bold">৩</span>
                  <span>একটি সচল স্ক্যানার ইনপুট শেষে স্বয়ংক্রিয় এন্টার [Enter] পাঠিয়ে ডেটা লোড করবে।</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">

              {/* Alert: If multiple records match the same phone number */}
              {(scannedOrdersList.length + scannedDraftsList.length) > 1 && (
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start gap-2.5">
                  <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-xs font-semibold text-amber-900">
                    <strong className="font-extrabold block">মনোযোগ দিন: একাধিক রেকর্ড পাওয়া গেছে!</strong>
                    এই মোবাইল নম্বরে মোট {scannedOrdersList.length + scannedDraftsList.length}টি অর্ডার পাওয়া গেছে। নিচে প্রতিটি রেকর্ড আলাদাভাবে দেওয়া হল।
                  </div>
                </div>
              )}

              {/* RENDER SUCCESS MATCHED ORDERS */}
              {scannedOrdersList.map((order, idx) => {
                const isCanceled = order.status === 'Cancelled' || order.status === 'Canceled' || order.status === 'Canceled Fake Order';
                
                return (
                  <div key={order.id} className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden border-t-4 border-t-indigo-600">
                    
                    {/* Order header information */}
                    <div className="bg-slate-50/70 p-4.5 border-b border-slate-150 flex flex-wrap items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-slate-900">অর্ডার রেকর্ড #{idx + 1}</span>
                          <span className="text-[10px] bg-slate-200 text-slate-800 font-extrabold font-mono px-2 py-0.5 rounded-md">
                            {order.id}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500 block">
                          অর্ডারের সময়: {order.createdAt ? new Date(order.createdAt).toLocaleString('bn-BD') : 'অজানা'}
                        </span>
                      </div>

                      {/* Display current status banner */}
                      <span className={`text-[11px] font-extrabold px-3 py-1 rounded-full ${
                        order.status === 'Delivered' ? 'bg-emerald-100 text-emerald-800 border border-emerald-250' :
                        order.status === 'Shipped' ? 'bg-blue-100 text-blue-800 border border-blue-200 animate-pulse' :
                        isCanceled ? 'bg-rose-100 text-rose-800 border border-rose-200' :
                        'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}>
                        {order.status === 'Pending' ? '🕒 অপেক্ষমান (Pending)' :
                         order.status === 'Shipped' ? '🚚 পাঠানো হয়েছে (Shipped)' :
                         order.status === 'Delivered' ? '✅ ডেলিভারড (Delivered)' :
                         '❌ বাতিলকৃত (Canceled)'}
                      </span>
                    </div>

                    {/* Order Inner Details Card */}
                    <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5 border-b border-slate-150">
                      
                      {/* Customer contact block */}
                      <div className="space-y-3 text-left">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">গ্রাহকের বিবরণ</span>
                        
                        <div className="flex items-center gap-2 text-xs">
                          <User className="h-4 w-4 text-slate-400 shrink-0" />
                          <span className="font-extrabold text-slate-900">{order.name}</span>
                        </div>

                        <div className="flex items-center gap-2 text-xs font-mono">
                          <Phone className="h-4 w-4 text-emerald-600 shrink-0" />
                          <strong className="text-slate-900 font-black">{order.phone}</strong>
                        </div>

                        <div className="text-xs text-slate-600 bg-slate-25 bg-slate-50/50 p-2.5 rounded-lg border border-slate-200/60 leading-relaxed font-semibold">
                          📍 <strong className="text-slate-800">ঠিকানা:</strong> {order.district}, {order.village}, {order.orderNotes || 'কোনো নোট দেওয়া হয়নি'}
                        </div>
                      </div>

                      {/* Item lists, size, price */}
                      <div className="space-y-3 text-left">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">অর্ডার আইটেম ও বিলিং</span>

                        <div className="p-3 bg-indigo-50/20 border border-indigo-100 rounded-xl space-y-2">
                          <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                            <span>সাইজ (Size):</span>
                            <span className="bg-indigo-600 text-white px-2 py-0.5 rounded font-mono text-[10px]">{order.size || 'XL'}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                            <span>রং (Color):</span>
                            <span className="bg-slate-200 text-slate-800 px-2.5 py-0.5 rounded text-[10px]">{order.color || 'Premium Black'}</span>
                          </div>
                          
                          <div className="h-px bg-slate-150 my-1" />
                          
                          <div className="flex items-center justify-between text-xs font-black text-indigo-950">
                            <span>সর্বমোট পরিশোধযোগ্য:</span>
                            <span className="text-sm font-mono text-indigo-700">{order.price} TK</span>
                          </div>
                        </div>
                      </div>

                    </div>

                    {/* ACTION SHELF: Fast controls specifically for the barcode handler */}
                    <div className="p-4 bg-slate-50/40 flex flex-wrap items-center justify-between gap-4 font-sans border-t border-slate-100">
                      
                      {/* Left helper toggle */}
                      <button
                        type="button"
                        onClick={() => onToggleConfirmOrder(order.id)}
                        className={`text-xs font-bold px-3 py-1.5 rounded-lg transition border cursor-pointer ${
                          order.isConfirmed 
                          ? 'bg-emerald-50 border-emerald-250 text-emerald-800 hover:bg-emerald-100' 
                          : 'bg-amber-50 border-amber-250 text-amber-800 hover:bg-amber-100'
                        }`}
                      >
                        {order.isConfirmed ? '✓ কনফার্মড অর্ডার' : '○ কাস্টমার কল দিন (Unconfirmed)'}
                      </button>

                      <div className="flex items-center gap-2">
                        
                        {/* Change status action bar */}
                        <div className="flex items-center gap-1">
                          
                          <button
                            type="button"
                            onClick={() => onChangeStatus(order.id, 'Pending')}
                            disabled={!perms.canEdit}
                            className={`px-3 py-1.5 rounded-lg text-[11px] font-extrabold border transition cursor-pointer ${
                              order.status === 'Pending' 
                              ? 'bg-amber-600 border-amber-500 text-white shadow-sm' 
                              : 'bg-white border-slate-205 text-slate-600 hover:bg-slate-50/80 hover:text-slate-900 border-slate-200'
                            }`}
                          >
                            🕒 অপেক্ষমান
                          </button>

                          <button
                            type="button"
                            onClick={() => onChangeStatus(order.id, 'Shipped')}
                            disabled={!perms.canEdit}
                            className={`px-3 py-1.5 rounded-lg text-[11px] font-extrabold border transition cursor-pointer ${
                              order.status === 'Shipped' 
                              ? 'bg-blue-600 border-blue-500 text-white shadow-sm' 
                              : 'bg-white border-slate-205 text-slate-600 hover:bg-slate-50/80 hover:text-slate-900 border-slate-200'
                            }`}
                          >
                            🚚 পাঠান
                          </button>

                          <button
                            type="button"
                            onClick={() => onChangeStatus(order.id, 'Delivered')}
                            disabled={!perms.canEdit}
                            className={`px-3 py-1.5 rounded-lg text-[11px] font-extrabold border transition cursor-pointer ${
                              order.status === 'Delivered' 
                              ? 'bg-emerald-600 border-emerald-500 text-white shadow-sm' 
                              : 'bg-white border-slate-205 text-slate-600 hover:bg-slate-50/80 hover:text-slate-900 border-slate-200'
                            }`}
                          >
                            ✓ ডেলিভারড
                          </button>

                          <button
                            type="button"
                            onClick={() => onChangeStatus(order.id, 'Canceled')}
                            disabled={!perms.canEdit}
                            className={`px-3 py-1.5 rounded-lg text-[11px] font-extrabold border transition cursor-pointer ${
                              isCanceled 
                              ? 'bg-rose-600 border-rose-500 text-white shadow-sm' 
                              : 'bg-white border-slate-205 text-slate-650 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-100 border-slate-200'
                            }`}
                          >
                            ❌ বাতিল
                          </button>

                        </div>

                      </div>
                    </div>

                  </div>
                );
              })}

              {/* RENDER SUCCESS MATCHED INCOMPLETE DRAFTS */}
              {scannedDraftsList.map((draft, idx) => {
                return (
                  <div key={draft.id} className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden border-t-4 border-t-amber-500">
                    
                    {/* Draft order header */}
                    <div className="bg-slate-50/70 p-4.5 border-b border-slate-150 flex flex-wrap items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-amber-750 text-amber-700">ড্রাফট রেকর্ড #{idx + 1}</span>
                          <span className="text-[10px] bg-slate-205 text-slate-700 font-extrabold font-mono px-2 py-0.5 rounded-md bg-slate-200">
                            {draft.id}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500 block">
                          আংশিক চেষ্টার সময়: {draft.createdAt ? new Date(draft.createdAt).toLocaleString('bn-BD') : 'অজানা'}
                        </span>
                      </div>

                      <span className="text-[10px] bg-amber-50 text-amber-750 border border-amber-250 px-2.5 py-1 rounded-full font-black">
                        ⚠️ ইনকমপ্লিট ড্রাফট (Incomplete Order)
                      </span>
                    </div>

                    {/* Customer Info */}
                    <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
                      
                      <div className="space-y-3 text-left">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">গ্রাহকের বিবরণ</span>
                        
                        <div className="flex items-center gap-2 text-xs">
                          <User className="h-4 w-4 text-slate-400 shrink-0" />
                          <span className="font-extrabold text-slate-900">{draft.name || 'অজানা গ্রাহক'}</span>
                        </div>

                        <div className="flex items-center gap-2 text-xs font-mono">
                          <Phone className="h-4 w-4 text-amber-600 shrink-0" />
                          <strong className="text-slate-900 font-black">{draft.phone}</strong>
                        </div>

                        <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200/60 leading-relaxed font-semibold">
                          📍 <strong className="text-slate-800">ঠিকানা:</strong> {draft.district || 'অজানা'}, {draft.village || 'অজানা'}
                        </div>
                      </div>

                      <div className="space-y-3 text-left">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">আইটেম ও মূল্য</span>

                        <div className="p-3 bg-amber-50/20 border border-amber-100 rounded-xl space-y-1.5">
                          <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                            <span>সাইজ (Size):</span>
                            <span className="bg-amber-600 text-white px-2 py-0.5 rounded font-mono text-[10px]">{draft.size || 'XL'}</span>
                          </div>
                          
                          <div className="h-px bg-slate-150 my-1" />
                          
                          <p className="text-[10.5px] text-amber-900 font-semibold leading-relaxed leading-normal">
                             গ্রাহক অর্ডারটি সম্পন্ন করতে পারেনি। এই ফোন নম্বরে কল করে কনফার্ম করার চেষ্টা করুন!
                          </p>
                        </div>
                      </div>

                    </div>

                  </div>
                );
              })}

            </div>
          )}

        </div>
        
      </div>
      
    </div>
  );
}
