import React, { useState, useEffect } from 'react';
import { 
  getMenuBarConfigFromFirestore, 
  saveMenuBarConfigToFirestore, 
  MenuBarConfig 
} from '../../lib/firebase';
import { Save, Plus, Trash2, Eye, EyeOff, LayoutGrid, Info, ArrowUpRight } from 'lucide-react';

export default function MenuBarAdmin() {
  const [config, setConfig] = useState<MenuBarConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    async function fetchConfig() {
      try {
        const data = await getMenuBarConfigFromFirestore();
        setConfig(data);
      } catch (err) {
        console.error("Failed to load MenuBar configuration", err);
      } finally {
        setLoading(false);
      }
    }
    fetchConfig();
  }, []);

  const handleSave = async () => {
    if (!config) return;
    setSaving(true);
    setSaveSuccess(false);
    try {
      await saveMenuBarConfigToFirestore(config);
      setSaveSuccess(true);
      // Dispatch updating event instantly for user previews
      window.dispatchEvent(new Event('menu-bar-config-updated'));
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to save MenuBar config", err);
      alert("মেনুবার সেটিংস সেভ করতে ব্যর্থ হয়েছে।");
    } finally {
      setSaving(false);
    }
  };

  const updateLink = (index: number, field: 'text' | 'url', value: string) => {
    if (!config) return;
    const links = [...config.links];
    links[index] = { ...links[index], [field]: value };
    setConfig({ ...config, links });
  };

  const addLink = () => {
    if (!config) return;
    const links = [...config.links, { text: 'নতুন পেজ', url: '#checkout-form' }];
    setConfig({ ...config, links });
  };

  const removeLink = (index: number) => {
    if (!config) return;
    const links = config.links.filter((_, i) => i !== index);
    setConfig({ ...config, links });
  };

  if (loading) {
    return (
      <div className="p-8 text-center bg-slate-900 rounded-2xl border border-slate-800 flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-400 text-xs font-bold">মেনুবার কনফিগারেশন লোড করা হচ্ছে...</p>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="p-8 text-center text-rose-400 bg-slate-900 border border-slate-800 rounded-2xl">
        ত্রুটি: মেনুবার কনফিগারেশন লোড করা সম্ভব হয়নি।
      </div>
    );
  }

  return (
    <div className="bg-slate-900 rounded-2x border border-slate-800 p-6 sm:p-8 space-y-6 font-sans text-white">
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-800 pb-5 gap-4">
        <div>
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <LayoutGrid className="h-5 w-5 text-cyan-400" />
            <span>টপ মেনুবার কাস্টমাইজার (Dynamic Menu Editor)</span>
          </h2>
          <p className="text-xs text-slate-450 mt-1 leading-relaxed">
            ল্যান্ডিং পেজের উপরে প্রদর্শিত নেভিগেশন বার, ব্র্যান্ড লোগো টেক্সট এবং ক্যাটাগরি শর্টকাট লিংক সহজে কাস্টমাইজ করুন।
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full sm:w-auto px-5 py-2.5 bg-cyan-500 hover:bg-cyan-600 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 active:scale-95 transition shadow-lg shrink-0 cursor-pointer"
        >
          <Save className="h-4 w-4" />
          <span>{saving ? 'সংরক্ষণ করা হচ্ছে...' : 'সেটিংস সেভ করুন'}</span>
        </button>
      </div>

      {saveSuccess && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl text-xs font-bold animate-fadeIn">
          🎉 মেনুবার কনফিগারেশন সফলভাবে ডাটাবেজে সংরক্ষিত হয়েছে! পেজের প্রিভিউতে রিয়েল-টাইম আপডেট হয়ে যাবে।
        </div>
      )}

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-950 p-5 rounded-2xl border border-slate-850">
        
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">ব্র্যান্ড বা শপের নাম (Logo Text)</label>
          <input
            type="text"
            value={config.brandName}
            onChange={(e) => setConfig({ ...config, brandName: e.target.value })}
            className="w-full px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm font-semibold focus:outline-hidden focus:border-[#00e3cd]"
            placeholder="PREMIUM SHOP"
          />
          <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">ল্যান্ডিং পেজের বাম কর্নারে শপের নাম বা টাইটেল হিসেবে প্রদর্শিত হবে।</p>
        </div>

        <div className="flex flex-col gap-4">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">টগল সেটিংসসমূহ</label>
          <div className="grid grid-cols-2 gap-4 mt-1">
            <label className="bg-slate-900 p-3 rounded-xl border border-slate-800 flex items-center justify-between cursor-pointer select-none">
              <span className="text-xs font-semibold text-slate-200">মেনুবার দৃশ্যমান</span>
              <input
                type="checkbox"
                checked={config.visible}
                onChange={(e) => setConfig({ ...config, visible: e.target.checked })}
                className="rounded text-cyan-500 focus:ring-cyan-500 h-4 w-4"
              />
            </label>

            <label className="bg-slate-900 p-3 rounded-xl border border-slate-800 flex items-center justify-between cursor-pointer select-none">
              <span className="text-xs font-semibold text-slate-200">ক্যাটাগরি ড্রপডাউন</span>
              <input
                type="checkbox"
                checked={config.enableCategories}
                onChange={(e) => setConfig({ ...config, enableCategories: e.target.checked })}
                className="rounded text-cyan-500 focus:ring-cyan-500 h-4 w-4"
              />
            </label>
          </div>
        </div>

      </div>

      {/* Menu Links Customizer Table */}
      <div className="space-y-3.5">
        <div className="flex justify-between items-center bg-slate-950 px-4 py-3 rounded-xl border border-slate-850">
          <span className="text-xs font-black uppercase tracking-wider text-slate-400">মেনু লিংক কাস্টমাইজেশন</span>
          <button
            onClick={addLink}
            className="py-1.5 px-3 bg-slate-900 border border-slate-800 hover:bg-slate-800 hover:text-cyan-400 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition active:scale-95"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>নতুন লিংক দিন</span>
          </button>
        </div>

        <div className="overflow-x-auto border border-slate-850 rounded-2xl">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950 border-b border-slate-850 text-slate-400 uppercase tracking-wider font-extrabold text-[10px]">
                <th className="p-4 w-12 text-center">ক্রম</th>
                <th className="p-4 w-52">লিংকের নাম (Text)</th>
                <th className="p-4">লিংক পাথ বা সেকশন আইডি (URL / Section Hash)</th>
                <th className="p-4 w-20 text-center">মুছে ফেলুন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850 bg-slate-900/60">
              {config.links.map((link, idx) => (
                <tr key={idx} className="hover:bg-slate-950/40 transition">
                  <td className="p-4 text-center text-slate-500 font-mono font-bold">
                    {idx + 1}
                  </td>
                  <td className="p-4">
                    <input
                      type="text"
                      value={link.text}
                      onChange={(e) => updateLink(idx, 'text', e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-950 border border-slate-850 rounded-lg focus:outline-hidden focus:border-cyan-400 text-slate-200 font-semibold"
                    />
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={link.url}
                        onChange={(e) => updateLink(idx, 'url', e.target.value)}
                        className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-850 rounded-lg focus:outline-hidden focus:border-cyan-400 text-slate-300 font-mono text-xs"
                      />
                      <span className="text-[10px] text-slate-500 font-bold hidden xl:inline">
                        {link.url.startsWith('#') ? 'ইন-পেজ সেকশন স্ক্রল' : 'এক্সটার্নাল পেজ লিংক'}
                      </span>
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() => removeLink(idx)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-400/10 p-2 rounded-lg cursor-pointer transition active:scale-95"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-850/60 text-[11px] text-slate-400 leading-relaxed flex items-start gap-2">
          <Info className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-slate-300">💡 প্রফেশনাল গাইডলাইন:</p>
            <p>১. রেইনকোট শপের সেকশনগুলো স্ক্রল করাতে লিংকে সেকশনগুলোর আইডি ব্যবহার করুন (যেমন: হোমের জন্য <strong className="font-mono text-cyan-455">#home</strong>, অর্ডারের জন্য <strong className="font-mono text-cyan-455">#checkout-form</strong>, অথবা রিভিউর জন্য <strong className="font-mono text-cyan-455">#reviews</strong>)।</p>
            <p>২. বাইক কভার সেকশনে রাউট করাতে লিংক ব্যবহার করুন <strong className="font-mono text-cyan-455">#/bikecover</strong>।</p>
          </div>
        </div>
      </div>

    </div>
  );
}
