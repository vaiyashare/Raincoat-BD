import React, { useState, useEffect } from 'react';
import { 
  Plus, Trash2, ArrowUp, ArrowDown, Settings, ChevronRight, 
  Sparkles, Save, Edit, Layout, AlignLeft, AlignCenter, AlignRight, FileText,
  Copy
} from 'lucide-react';
import { savePagesToFirestore, getPagesFromFirestore } from '../../lib/firebase';

interface PageBlock {
  id: string;
  type: 'headline' | 'text' | 'image' | 'video' | 'button' | 'form' | 'shop';
  content: string;
  styles?: {
    color?: string;
    bgColor?: string;
    fontSize?: string;
    padding?: string;
    textAlign?: 'left' | 'center' | 'right';
  };
}

interface CustomPage {
  id: string;
  title: string;
  slug: string;
  blocks: PageBlock[];
}

interface PagesAdminProps {
  onRefreshPages: () => void;
  userRole: string; // 'Admin' | 'Editor' | 'ReadOnly'
}

export default function PagesAdmin({ onRefreshPages, userRole }: PagesAdminProps) {
  const [pages, setPages] = useState<CustomPage[]>([]);
  const [selectedPage, setSelectedPage] = useState<CustomPage | null>(null);
  
  // Page creation form
  const [newPageTitle, setNewPageTitle] = useState('');
  const [newPageSlug, setNewPageSlug] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Loaded from storage
  const loadPages = async () => {
    try {
      const fbPages = await getPagesFromFirestore();
      if (fbPages && fbPages.length > 0) {
        setPages(fbPages);
      } else {
        const list = localStorage.getItem('raincoat_pages');
        if (list) {
          const parsed = JSON.parse(list);
          setPages(parsed);
          await savePagesToFirestore(parsed);
        } else {
          // Add a default sample custom page
          const sample: CustomPage = {
            id: 'page-1',
            title: 'विशेष বর্ষাকালীন অফার (Exclusive Monsoon Offers)',
            slug: 'monsoon-offers',
            blocks: [
              {
                id: 'b-1',
                type: 'headline',
                content: 'খাঁটি বর্ষার সেরা কাঁপানো থার্মাল-সিলড রেইনকোট!',
                styles: { color: '#ffffff', bgColor: '#1e3a8a', fontSize: 'lg', padding: 'tall', textAlign: 'center' }
              },
              {
                id: 'b-2',
                type: 'text',
                content: 'আমাদের এই বিশেষ ল্যান্ডিং পেজে পাচ্ছেন অত্যন্ত প্রিমিয়াম জ্যাকেট ও প্যান্টের এক অনন্য কম্বো প্যাক। সম্পূর্ণ ফ্রি কুরিয়ার ডেলিভারি চার্জে আজই নিজের কালার পছন্দ করুন।',
                styles: { color: '#334155', bgColor: '#f8fafc', fontSize: 'md', padding: 'normal', textAlign: 'center' }
              },
              {
                id: 'b-3',
                type: 'form',
                content: '',
                styles: { padding: 'tall' }
              }
            ]
          };
          setPages([sample]);
          await savePagesToFirestore([sample]);
        }
      }
    } catch (err) {
      console.error("Failed to load custom pages:", err);
    }
  };

  useEffect(() => {
    loadPages();
  }, []);

  const savePagesList = async (newList: CustomPage[]) => {
    setPages(newList);
    try {
      await savePagesToFirestore(newList);
      window.dispatchEvent(new Event('raincoat_pages_updated'));
    } catch (err) {
      console.warn("Could not save pages to Firestore, fallback local only:", err);
    }
    onRefreshPages();
  };

  const handleCreatePage = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (userRole === 'ReadOnly') {
      return setErrorMsg('দুঃখিত, রিড-অনলি এক্সেস দিয়ে নতুন পেজ তৈরি সম্ভব নয়!');
    }

    if (!newPageTitle.trim()) return setErrorMsg('পেজ টাইটেল দিন!');
    
    const cleanSlug = newPageSlug.toLowerCase().replace(/[^a-z0-0\-]/g, '');
    if (!cleanSlug) return setErrorMsg('সঠিক ইংরেজি Slug তৈরি করুন (যেমন: special-discount)!');

    // Check if slug already exists
    if (pages.some(p => p.slug === cleanSlug)) {
      setErrorMsg('ঐ Slug সংবলিত পেজ ইতিমধ্যে তৈরি আছে! অন্য Slug ব্যবহার করুন।');
      return;
    }

    const newPage: CustomPage = {
      id: 'subpage-' + Math.floor(Math.random() * 10000),
      title: newPageTitle,
      slug: cleanSlug,
      blocks: []
    };

    const updated = [...pages, newPage];
    await savePagesList(updated);
    setSelectedPage(newPage);
    setNewPageTitle('');
    setNewPageSlug('');
  };

  const handleDuplicatePage = async (pageToDup: CustomPage, e: React.MouseEvent) => {
    e.stopPropagation();
    if (userRole === 'ReadOnly') {
      alert('দুঃখিত, রিড-অনলি এক্সেস দিয়ে পেজ অনুলিপি করা সম্ভব নয়!');
      return;
    }

    const cleanSlug = `${pageToDup.slug}-copy-${Math.floor(Math.random() * 1000)}`;
    const duplicatedPage: CustomPage = {
      ...pageToDup,
      id: 'subpage-' + Math.floor(Math.random() * 10000),
      title: `${pageToDup.title} (অনুলিপি)`,
      slug: cleanSlug,
      // Deep clone blocks to prevent shared mutate references
      blocks: pageToDup.blocks.map(b => ({
        ...b,
        id: 'blk-' + Math.floor(Math.random() * 100000),
        styles: b.styles ? { ...b.styles } : undefined
      }))
    };

    const updated = [...pages, duplicatedPage];
    await savePagesList(updated);
    setSelectedPage(duplicatedPage);
    alert(`পেইজটি সফলভাবে অনুলিপি করা হয়েছে! নতুন পেইজের শিরোনাম: ${duplicatedPage.title}`);
  };

  const handleDeletePage = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (userRole === 'ReadOnly') {
      alert('দুঃখিত, আপনার রিড-অনলি এক্সেস রয়েছে!');
      return;
    }

    if (!window.confirm('আপনি কি নিশ্চিতভাবে এই ল্যান্ডিং পেজটি ডিলিট করতে চান?')) return;
    
    const updated = pages.filter(p => p.id !== id);
    await savePagesList(updated);
    if (selectedPage?.id === id) {
      setSelectedPage(null);
    }
  };

  // Block management
  const addBlock = async (type: PageBlock['type']) => {
    if (!selectedPage) return;
    if (userRole === 'ReadOnly') {
      alert('দুঃখিত! আপনার এক্সেস লেভেল এটিকে ব্লক করেছে।');
      return;
    }

    const defaultContents = {
      headline: 'নতুন আকর্ষণীয় হেডিং যোগ করুন',
      text: 'এখানে আপনার চমৎকার প্যারাগ্রাফ বা আকর্ষণীয় বিবরণ লিখুন। এলিমেন্টরের মত কালার ও মেজারমেন্ট পরিবর্তন করতে পারবেন।',
      image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=600',
      video: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      button: '#checkout-form',
      form: 'ঝুঁকিমুক্ত উপায়ে ঘরে বসেই রেইনকোটটি বুঝে নিন!',
      shop: 'আমাদের আকর্ষনীয় রেইনকোট শপ কালেকশন'
    };

    const newBlock: PageBlock = {
      id: 'blk-' + Math.floor(Math.random() * 100000),
      type,
      content: defaultContents[type],
      styles: {
        color: type === 'headline' ? '#0f172a' : '#475569',
        bgColor: '#ffffff',
        fontSize: 'md',
        padding: 'normal',
        textAlign: 'left'
      }
    };

    const updatedPage = {
      ...selectedPage,
      blocks: [...selectedPage.blocks, newBlock]
    };

    const updatedPages = pages.map(p => p.id === selectedPage.id ? updatedPage : p);
    await savePagesList(updatedPages);
    setSelectedPage(updatedPage);
  };

  const updateBlockContent = async (blockId: string, value: string) => {
    if (!selectedPage) return;
    if (userRole === 'ReadOnly') return;

    const updatedBlocks = selectedPage.blocks.map(b => {
      if (b.id === blockId) {
        return { ...b, content: value };
      }
      return b;
    });

    const updatedPage = { ...selectedPage, blocks: updatedBlocks };
    const updatedPages = pages.map(p => p.id === selectedPage.id ? updatedPage : p);
    await savePagesList(updatedPages);
    setSelectedPage(updatedPage);
  };

  const updateBlockStyle = async (blockId: string, styleKey: keyof PageBlock['styles'], value: string) => {
    if (!selectedPage) return;
    if (userRole === 'ReadOnly') return;

    const updatedBlocks = selectedPage.blocks.map(b => {
      if (b.id === blockId) {
        return {
          ...b,
          styles: {
            ...(b.styles || {}),
            [styleKey]: value
          }
        };
      }
      return b;
    });

    const updatedPage = { ...selectedPage, blocks: updatedBlocks };
    const updatedPages = pages.map(p => p.id === selectedPage.id ? updatedPage : p);
    await savePagesList(updatedPages);
    setSelectedPage(updatedPage);
  };

  const moveBlock = async (index: number, direction: 'up' | 'down') => {
    if (!selectedPage) return;
    if (userRole === 'ReadOnly') return;

    const blocks = [...selectedPage.blocks];
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === blocks.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const temp = blocks[index];
    blocks[index] = blocks[targetIndex];
    blocks[targetIndex] = temp;

    const updatedPage = { ...selectedPage, blocks };
    const updatedPages = pages.map(p => p.id === selectedPage.id ? updatedPage : p);
    await savePagesList(updatedPages);
    setSelectedPage(updatedPage);
  };

  const deleteBlock = async (blockId: string) => {
    if (!selectedPage) return;
    if (userRole === 'ReadOnly') return;

    const updatedBlocks = selectedPage.blocks.filter(b => b.id !== blockId);
    const updatedPage = { ...selectedPage, blocks: updatedBlocks };
    const updatedPages = pages.map(p => p.id === selectedPage.id ? updatedPage : p);
    await savePagesList(updatedPages);
    setSelectedPage(updatedPage);
  };

  return (
    <div className="space-y-6 font-sans text-xs sm:text-sm text-slate-700">
      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* Left column: Pages list & simple creator */}
        <div className="w-full lg:w-1/3 bg-slate-50 border border-slate-200/80 p-5 rounded-2xl space-y-4 shrink-0">
          <div className="flex items-center gap-1.5 pb-2.5 border-b border-slate-200">
            <Layout className="h-4 w-4 text-indigo-600" />
            <h3 className="font-extrabold text-slate-900 text-sm">সকল ল্যান্ডিং পেজেস</h3>
          </div>

          {pages.length === 0 ? (
            <p className="text-slate-400 italic text-center py-4">কোনো পেজ পাওয়া যায়নি!</p>
          ) : (
            <div className="space-y-2">
              {pages.map(p => (
                <div 
                  key={p.id}
                  onClick={() => setSelectedPage(p)}
                  className={`flex justify-between items-center p-3 rounded-xl border border-slate-205 transition duration-150 cursor-pointer ${
                    selectedPage?.id === p.id 
                      ? 'bg-indigo-600 text-white border-indigo-700' 
                      : 'bg-white text-slate-800 hover:bg-slate-100'
                  }`}
                >
                  <div className="truncate pr-2">
                    <div className="font-extrabold truncate text-xs">{p.title}</div>
                    <div className={`font-mono text-[9px] mt-0.5 ${selectedPage?.id === p.id ? 'text-indigo-200' : 'text-slate-400'}`}>
                      /{p.slug}
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5 shrink-0">
                    <button 
                      onClick={(e) => handleDuplicatePage(p, e)}
                      title="অনুলিপি বা ডুপ্লিকেট করুন"
                      className={`p-1.5 rounded-lg transition ${
                        selectedPage?.id === p.id ? 'text-indigo-200 hover:bg-white/10 hover:text-white' : 'text-slate-400 hover:bg-slate-100 hover:text-indigo-600'
                      }`}
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                    <button 
                      onClick={(e) => handleDeletePage(p.id, e)}
                      title="মুছুন"
                      className={`p-1.5 rounded-lg transition ${
                        selectedPage?.id === p.id ? 'text-indigo-200 hover:bg-white/10 hover:text-white' : 'text-slate-400 hover:bg-rose-50 hover:text-rose-600'
                      }`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Quick page builder form */}
          <form onSubmit={handleCreatePage} className="border-t border-slate-200 pt-4 space-y-3">
            <h4 className="font-bold text-slate-900 text-xs">🆕 নতুন পেজ বা ল্যান্ডিং লিংক খুলুন</h4>
            
            {errorMsg && (
              <div className="p-2 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-[11px] font-bold">
                {errorMsg}
              </div>
            )}

            <div className="space-y-2 text-xs">
              <div>
                <label className="block text-[10px] text-slate-500 font-bold mb-1 font-sans">পেইজের নাম (Page Title)</label>
                <input 
                  type="text" 
                  placeholder="যেমন: বর্ষা ধামাকা ২০% ছাড়"
                  className="w-full px-3 py-1.8 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 text-slate-800 text-xs"
                  value={newPageTitle}
                  onChange={(e) => {
                    setNewPageTitle(e.target.value);
                    // Propose low-case slug auto-fill
                    setNewPageSlug(e.target.value.toLowerCase().replace(/[^a-zA-Z0-9\s]/g, '').trim().replace(/\s+/g, '-'));
                  }}
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 font-bold mb-1 font-sans">পেইজ লিঙ্ক (Slug)</label>
                <div className="flex items-center">
                  <span className="bg-slate-200/80 px-2 py-1.8 border border-r-0 border-slate-200 text-slate-500 text-[10px] font-mono rounded-l-lg">/</span>
                  <input 
                    type="text" 
                    placeholder="discount-offer"
                    className="w-full px-3 py-1.8 bg-white border border-slate-200 rounded-r-lg focus:outline-none focus:border-indigo-500 text-slate-800 font-mono text-xs"
                    value={newPageSlug}
                    onChange={(e) => setNewPageSlug(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            <button 
              type="submit"
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-lg transition duration-150 flex items-center justify-center gap-1 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" /> ল্যান্ডিং পেইজ খুলুন
            </button>
          </form>
        </div>

        {/* Right column: Selected page visual content builder (Elementor Like!) */}
        <div className="flex-1 bg-white border border-slate-200 p-5 rounded-2xl min-h-[450px] space-y-4">
          {!selectedPage ? (
            <div className="flex flex-col items-center justify-center h-full py-16 space-y-3 text-center">
              <span className="text-4xl text-slate-300">⚙️</span>
              <h3 className="font-extrabold text-slate-800 text-sm">কোনো পেইজ সিলেক্ট করা নেই</h3>
              <p className="text-slate-500 text-xs max-w-sm">
                বাম কলামের পেইজ তালিকার ওপর ক্লিক করুন অথবা নতুন কাস্টম পেজ তৈরি করে তার কন্টেন্ট হুবহু চমৎকারভাবে সাজাতে থাকুন।
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3.5 border-b border-slate-250">
                <div>
                  <h3 className="font-extrabold text-slate-950 text-sm flex items-center gap-1.5">
                    ✏️ পেইজ কাস্টমাইজেশন: <span className="text-indigo-600">{selectedPage.title}</span>
                  </h3>
                  <p className="text-[10px] sm:text-xs text-slate-400 mt-1">
                    পেইজে উপাদানসমূহ ক্রমানুসারে সাজান। যেকোনো লিংক, ছবি, টেক্সট বা রঙ পরিবর্তনযোগ্য।
                  </p>
                </div>
                <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200">
                  <span className="text-[11px] font-bold text-slate-600 px-2">রোল: {userRole}</span>
                </div>
              </div>

              {/* Add block elements buttons (Elementor Toolbox) */}
              <div className="bg-slate-50 border border-slate-200 border-dashed p-4 rounded-xl space-y-2">
                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest block mb-2">➕ এলিমেন্টর কন্টেন্ট উইজেটস (Elementor Widgets)</span>
                <div className="flex flex-wrap gap-2 text-[11px]">
                  <button 
                    onClick={() => addBlock('headline')}
                    className="py-1.5 px-3 bg-white hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200 text-slate-700 font-extrabold rounded-lg shadow-2xs flex items-center gap-1 cursor-pointer transition"
                  >
                    H1 হেডিং
                  </button>
                  <button 
                    onClick={() => addBlock('text')}
                    className="py-1.5 px-3 bg-white hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200 text-slate-700 font-extrabold rounded-lg shadow-2xs flex items-center gap-1 cursor-pointer transition"
                  >
                    T বিবরণ কপি
                  </button>
                  <button 
                    onClick={() => addBlock('image')}
                    className="py-1.5 px-3 bg-white hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200 text-slate-700 font-extrabold rounded-lg shadow-2xs flex items-center gap-1 cursor-pointer transition"
                  >
                    🖼️ ছবি URL
                  </button>
                  <button 
                    onClick={() => addBlock('video')}
                    className="py-1.5 px-3 bg-white hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200 text-slate-700 font-extrabold rounded-lg shadow-2xs flex items-center gap-1 cursor-pointer transition"
                  >
                    🎥 ভিডিও এমবেড
                  </button>
                  <button 
                    onClick={() => addBlock('button')}
                    className="py-1.5 px-3 bg-white hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200 text-slate-700 font-extrabold rounded-lg shadow-2xs flex items-center gap-1 cursor-pointer transition"
                  >
                    🔗 অ্যাকশন বাটন
                  </button>
                  <button 
                    onClick={() => addBlock('form')}
                    className="py-1.5 px-3 bg-white hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200 text-slate-700 font-extrabold rounded-lg shadow-2xs flex items-center gap-1 cursor-pointer transition"
                  >
                    📝 কুইক অর্ডার ফর্ম
                  </button>
                  <button 
                    onClick={() => addBlock('shop')}
                    className="py-1.5 px-3 bg-amber-500 hover:bg-amber-600 text-white border border-amber-600 font-black rounded-lg shadow-2xs flex items-center gap-1 cursor-pointer transition"
                  >
                    🛒 লাইভ শপ ক্যাটালগ
                  </button>
                </div>
              </div>

              {/* Installed blocks visual editor canvas */}
              {selectedPage.blocks.length === 0 ? (
                <div className="text-center py-12 border border-slate-100 bg-slate-50/50 rounded-xl">
                  <p className="text-slate-400 italic">এখনো এই পেজে কোনো এলিমেন্ট যুক্ত করা হয়নি। উপর থেকে উইজেড নির্বাচন করে পেজ বিল্ডিং শুরু করুন!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedPage.blocks.map((block, index) => (
                    <div key={block.id} className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs relative group bg-slate-50/40">
                      
                      {/* Block metadata header & actions panel */}
                      <div className="bg-slate-150/90 py-1.8 px-3 flex justify-between items-center text-[10px] text-slate-600 font-bold border-b border-slate-200">
                        <span className="flex items-center gap-1 text-slate-800 font-black uppercase tracking-wider">
                          <Layout className="h-3.5 w-3.5 text-indigo-500" />
                          {block.type === 'headline' ? 'H1 দৃষ্টিনন্দন শিরোনাম' :
                           block.type === 'text' ? 'T প্যারাগ্রাফ ও বিবরণ' :
                           block.type === 'image' ? '🖼️ ছবি ব্লক' :
                           block.type === 'video' ? '🎥 ভিডিও (ইউটিউব/ফেসবুক)' :
                           block.type === 'button' ? '🔗 কাস্টম অ্যাকশন লিঙ্ক বা অন্য বাটন' :
                           block.type === 'form' ? '📝 কাস্টমার ক্যাশ-অন ফর্ম' :
                           '🛒 শপ ক্যাটালগ ব্লক'}
                        </span>
                        
                        {/* Control buttons */}
                        <div className="flex items-center gap-1">
                          <button 
                            onClick={() => moveBlock(index, 'up')}
                            disabled={index === 0}
                            className="p-1 text-slate-500 hover:bg-slate-200 rounded-md disabled:opacity-30 cursor-pointer"
                          >
                            <ArrowUp className="h-3 w-3" />
                          </button>
                          <button 
                            onClick={() => moveBlock(index, 'down')}
                            disabled={index === selectedPage.blocks.length - 1}
                            className="p-1 text-slate-500 hover:bg-slate-200 rounded-md disabled:opacity-30 cursor-pointer"
                          >
                            <ArrowDown className="h-3 w-3" />
                          </button>
                          <button 
                            onClick={() => deleteBlock(block.id)}
                            className="p-1 text-rose-500 hover:bg-rose-50 hover:text-rose-700 rounded-md cursor-pointer ml-1"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>

                      {/* Content parameters fields */}
                      <div className="p-4 space-y-3 bg-white">
                        <div>
                          <label className="block text-[9px] text-slate-400 font-bold uppercase mb-1">
                            {block.type === 'headline' ? 'শিরোনাম টেক্সট' :
                             block.type === 'text' ? 'প্যারাগ্রাফ টেক্সট' :
                             block.type === 'image' ? 'ছবি এর ডাইরেক্ট ইমেজ বা হোস্ট করা URL' :
                             block.type === 'video' ? 'ইউটিউব বা ফেসবুক ভিডিও লিংক' :
                             block.type === 'button' ? 'বাটন অ্যাকশন লিঙ্ক (যেমন: #checkout-form বা কোনো বাহ্যিক লিঙ্ক)' :
                             block.type === 'form' ? 'ক্যাশবুকিং অর্ডার ফর্মের কাস্টম শিরোনাম (ফাঁকা রাখলে ডিফল্ট শিরোনাম দেখাবে)' :
                             'শপ ক্যাটালগের কাস্টম বিবরণ বা স্লোগান শিরোনাম'}
                          </label>
                          {block.type === 'text' || block.type === 'form' ? (
                            <textarea
                              rows={2.5}
                              value={block.content}
                              onChange={(e) => updateBlockContent(block.id, e.target.value)}
                              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none"
                              placeholder={
                                block.type === 'form' ? 'যেমন: বিশেষ বর্ষাকালীন ধামাকা অফার পেতে ফর্মটি পূরণ করুন...' :
                                'এখানে আপনার কন্টেন্ট অথবা টেক্সট লিখুন...'
                              }
                              disabled={userRole === 'ReadOnly'}
                            />
                          ) : (
                            <input 
                              type="text"
                              value={block.content}
                              onChange={(e) => updateBlockContent(block.id, e.target.value)}
                              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none"
                              placeholder={
                                block.type === 'image' ? 'ছবি এর সঠিক Unsplash / হোস্ট করা ইমেজ URL দিন' :
                                block.type === 'video' ? 'ইউটিউব বা ফেসবুক রিলস ভিডিও লিংক' :
                                block.type === 'shop' ? 'যেমন: আমাদের প্রিমিয়াম রেইনকোট শপ কালেকশন...' :
                                'বাটন এর সঠিক লিংক (যেমন: #checkout-form)'
                              }
                              disabled={userRole === 'ReadOnly'}
                            />
                          )}
                        </div>

                        {/* Styling controls */}
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-2 border-t border-slate-100 flex-wrap text-[10px]">
                          <div>
                            <span className="text-slate-400 font-bold block mb-1">এলাইনমেন্ট</span>
                            <div className="flex items-center gap-1 bg-slate-50 border rounded-md p-0.5 w-fit">
                              <button 
                                onClick={() => updateBlockStyle(block.id, 'textAlign', 'left')}
                                className={`p-1.5 rounded ${block.styles?.textAlign === 'left' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-200'}`}
                              >
                                <AlignLeft className="h-3.5 w-3.5" />
                              </button>
                              <button 
                                onClick={() => updateBlockStyle(block.id, 'textAlign', 'center')}
                                className={`p-1.5 rounded ${block.styles?.textAlign === 'center' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-200'}`}
                              >
                                <AlignCenter className="h-3.5 w-3.5" />
                              </button>
                              <button 
                                onClick={() => updateBlockStyle(block.id, 'textAlign', 'right')}
                                className={`p-1.5 rounded ${block.styles?.textAlign === 'right' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-200'}`}
                              >
                                <AlignRight className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>

                          <div>
                            <span className="text-slate-400 font-bold block mb-1">ফন্ট সাইজ</span>
                            <select
                              value={block.styles?.fontSize || 'md'}
                              onChange={(e) => updateBlockStyle(block.id, 'fontSize', e.target.value)}
                              className="bg-slate-50 border border-slate-200 text-[11px] rounded-md px-2 py-1 w-full"
                            >
                              <option value="sm">ছোট (Small)</option>
                              <option value="md">মাঝারি (Normal)</option>
                              <option value="lg">বড় (Giant Header)</option>
                            </select>
                          </div>

                          <div>
                            <span className="text-slate-400 font-bold block mb-1">প্যাডিং (উচ্চতা)</span>
                            <select
                              value={block.styles?.padding || 'normal'}
                              onChange={(e) => updateBlockStyle(block.id, 'padding', e.target.value)}
                              className="bg-slate-50 border border-slate-200 text-[11px] rounded-md px-2 py-1 w-full"
                            >
                              <option value="compact">কম (Compact)</option>
                              <option value="normal">মাঝারি (Normal)</option>
                              <option value="tall">উচু (Generous Height)</option>
                            </select>
                          </div>

                          <div>
                            <span className="text-slate-400 font-bold block mb-1">টেক্সট কালার</span>
                            <div className="flex items-center gap-1.5">
                              <input 
                                type="color" 
                                value={block.styles?.color || '#0f172a'}
                                onChange={(e) => updateBlockStyle(block.id, 'color', e.target.value)}
                                className="w-6 h-6 border rounded cursor-pointer p-0"
                              />
                              <span className="font-mono text-[9px] text-slate-500">{block.styles?.color || '#0f172a'}</span>
                            </div>
                          </div>

                          <div>
                            <span className="text-slate-400 font-bold block mb-1">ব্যাকগ্রাউন্ড কালার</span>
                            <div className="flex items-center gap-1.5">
                              <input 
                                type="color" 
                                value={block.styles?.bgColor || '#ffffff'}
                                onChange={(e) => updateBlockStyle(block.id, 'bgColor', e.target.value)}
                                className="w-6 h-6 border rounded cursor-pointer p-0"
                              />
                              <span className="font-mono text-[9px] text-slate-500">{block.styles?.bgColor || '#ffffff'}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
