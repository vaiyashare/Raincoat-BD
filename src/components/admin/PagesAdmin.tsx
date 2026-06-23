import React, { useState, useEffect } from 'react';
import { 
  Plus, Trash2, ArrowUp, ArrowDown, Settings, ChevronRight, 
  Sparkles, Save, Edit, Layout, AlignLeft, AlignCenter, AlignRight, FileText,
  Copy, Globe, Star, Image as ImageIcon, Heart, MapPin
} from 'lucide-react';
import { 
  savePagesToFirestore, 
  getPagesFromFirestore,
  getCustomReviewsFromFirestore,
  saveReviewToFirestore
} from '../../lib/firebase';
import { PageBlock, CustomPage, CustomerReview } from '../../types';

interface PagesAdminProps {
  onRefreshPages: () => void;
  userRole: string; // 'Admin' | 'Editor' | 'ReadOnly'
}

export default function PagesAdmin({ onRefreshPages, userRole }: PagesAdminProps) {
  const [pages, setPages] = useState<CustomPage[]>([]);
  const [selectedPage, setSelectedPage] = useState<CustomPage | null>(null);
  const [customReviews, setCustomReviews] = useState<CustomerReview[]>([]);
  
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

  const fetchAllReviews = async () => {
    try {
      const list = await getCustomReviewsFromFirestore();
      setCustomReviews(list);
    } catch (err) {
      console.error('Error fetching reviews:', err);
    }
  };

  useEffect(() => {
    loadPages();
    fetchAllReviews();
  }, []);

  const savePagesList = async (newList: CustomPage[]) => {
    setPages(newList);
    try {
      await savePagesToFirestore(newList);
      window.dispatchEvent(new CustomEvent('raincoat_pages_updated', { detail: { pages: newList } }));
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
      image: '',
      video: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      button: '#checkout-form',
      form: 'ঝুঁকিমুক্ত উপায়ে ঘরে বসেই রেইনকোটটি বুঝে নিন!',
      shop: 'আমাদের আকর্ষনীয় রেইনকোট শপ কালেকশন',
      carousel: 'ঘুরন্ত গ্যালারি স্লাইডার',
      icons: 'ফিচার উইজেট তালিকা',
      dropdown: 'প্রশ্নোত্তর ড্রপডাউন',
      'reviews-slider': 'কাস্টমার রিভিউ স্লাইডার'
    };

    const newBlock: PageBlock = {
      id: 'blk-' + Math.floor(Math.random() * 100000),
      type,
      content: defaultContents[type] || '',
      styles: {
        color: type === 'headline' ? '#0f172a' : '#475569',
        bgColor: '#ffffff',
        fontSize: 'md',
        padding: 'normal',
        textAlign: 'left'
      },
      carouselImages: type === 'carousel' ? [] : undefined,
      items: type === 'icons' ? [
        { id: 'i-1', icon: '🛡️', title: '১০০% ওয়াটারপ্রুফ গ্যারান্টি', text: 'আমাদের রেনকোটে ডাবল থার্মাল-সিল কোটিং রয়েছে।' },
        { id: 'i-2', icon: '🚚', title: 'সারাদেশে ক্যাশ অন ডেলিভারি', text: 'কোনো অগ্রিম পেমেন্ট ছাড়া হাতে পেয়ে টাকা পরিশোধ করুন।' },
        { id: 'i-3', icon: '📞', title: '২৪/৭ গ্রাহক সেবা', text: 'যেকোনো প্রয়োজনে আমাদের মোবাইল নাম্বারে যোগাযোগ করুন।' }
      ] : undefined,
      dropdownOptions: type === 'dropdown' ? [
        { id: 'd-1', label: '১. রেইনকোটটির সাইজ কি কি আছে?', value: 'আমাদের কাছে M থেকে 4XL পর্যন্ত সকল সাইজ পাবেন।' },
        { id: 'd-2', label: '২. কাপড় ধুতে পারবো কি?', value: 'জি অবশ্যই, আপনি সাধারণ ডিটারজেন্ট দিয়ে হাত দিয়ে ধুয়ে নিতে পারবেন।' },
        { id: 'd-3', label: '৩. ট্র্যাকিং লিংক পাবো কিভাবে?', value: 'অর্ডার করার পর আপনার মোবাইল ফোনে সরাসরি ট্র্যাকিং লিংক চলে যাবে।' }
      ] : undefined,
      reviewIds: type === 'reviews-slider' ? [] : undefined,
      customButtonText: type === 'form' ? 'অর্ডার কনফার্ম করুন (ক্যাশ অন ডেলিভারি)' : undefined,
      hideMetrics: type === 'form' ? false : undefined
    };

    const updatedPage = {
      ...selectedPage,
      blocks: [...selectedPage.blocks, newBlock]
    };

    const updatedPages = pages.map(p => p.id === selectedPage.id ? updatedPage : p);
    await savePagesList(updatedPages);
    setSelectedPage(updatedPage);
  };

  // Carousel Image mutations
  const addCarouselImage = async (blockId: string, url: string) => {
    if (!selectedPage || userRole === 'ReadOnly') return;
    const updatedBlocks = selectedPage.blocks.map(b => {
      if (b.id === blockId) {
        return {
          ...b,
          carouselImages: [...(b.carouselImages || []), url]
        };
      }
      return b;
    });
    const updatedPage = { ...selectedPage, blocks: updatedBlocks };
    const updatedPages = pages.map(p => p.id === selectedPage.id ? updatedPage : p);
    await savePagesList(updatedPages);
    setSelectedPage(updatedPage);
  };

  const updateCarouselImage = async (blockId: string, imgIndex: number, url: string) => {
    if (!selectedPage || userRole === 'ReadOnly') return;
    const updatedBlocks = selectedPage.blocks.map(b => {
      if (b.id === blockId) {
        const arr = [...(b.carouselImages || [])];
        arr[imgIndex] = url;
        return { ...b, carouselImages: arr };
      }
      return b;
    });
    const updatedPage = { ...selectedPage, blocks: updatedBlocks };
    const updatedPages = pages.map(p => p.id === selectedPage.id ? updatedPage : p);
    await savePagesList(updatedPages);
    setSelectedPage(updatedPage);
  };

  const deleteCarouselImage = async (blockId: string, imgIndex: number) => {
    if (!selectedPage || userRole === 'ReadOnly') return;
    const updatedBlocks = selectedPage.blocks.map(b => {
      if (b.id === blockId) {
        const arr = (b.carouselImages || []).filter((_, i) => i !== imgIndex);
        return { ...b, carouselImages: arr };
      }
      return b;
    });
    const updatedPage = { ...selectedPage, blocks: updatedBlocks };
    const updatedPages = pages.map(p => p.id === selectedPage.id ? updatedPage : p);
    await savePagesList(updatedPages);
    setSelectedPage(updatedPage);
  };

  // Icon item mutations
  const updateIconItem = async (blockId: string, itemId: string, field: 'icon' | 'title' | 'text', value: string) => {
    if (!selectedPage || userRole === 'ReadOnly') return;
    const updatedBlocks = selectedPage.blocks.map(b => {
      if (b.id === blockId) {
        const items = (b.items || []).map(item => {
          if (item.id === itemId) return { ...item, [field]: value };
          return item;
        });
        return { ...b, items };
      }
      return b;
    });
    const updatedPage = { ...selectedPage, blocks: updatedBlocks };
    const updatedPages = pages.map(p => p.id === selectedPage.id ? updatedPage : p);
    await savePagesList(updatedPages);
    setSelectedPage(updatedPage);
  };

  const addIconItem = async (blockId: string) => {
    if (!selectedPage || userRole === 'ReadOnly') return;
    const newItem = { id: 'i-' + Math.floor(Math.random() * 100000), icon: '🌟', title: 'নতুন ফিচার টাইটেল', text: 'এখানে সুন্দর বর্ণনা লিখুন।' };
    const updatedBlocks = selectedPage.blocks.map(b => {
      if (b.id === blockId) {
        return { ...b, items: [...(b.items || []), newItem] };
      }
      return b;
    });
    const updatedPage = { ...selectedPage, blocks: updatedBlocks };
    const updatedPages = pages.map(p => p.id === selectedPage.id ? updatedPage : p);
    await savePagesList(updatedPages);
    setSelectedPage(updatedPage);
  };

  const deleteIconItem = async (blockId: string, itemId: string) => {
    if (!selectedPage || userRole === 'ReadOnly') return;
    const updatedBlocks = selectedPage.blocks.map(b => {
      if (b.id === blockId) {
        return { ...b, items: (b.items || []).filter(item => item.id !== itemId) };
      }
      return b;
    });
    const updatedPage = { ...selectedPage, blocks: updatedBlocks };
    const updatedPages = pages.map(p => p.id === selectedPage.id ? updatedPage : p);
    await savePagesList(updatedPages);
    setSelectedPage(updatedPage);
  };

  // Dropdown item mutations
  const updateDropdownOption = async (blockId: string, optionId: string, field: 'label' | 'value', value: string) => {
    if (!selectedPage || userRole === 'ReadOnly') return;
    const updatedBlocks = selectedPage.blocks.map(b => {
      if (b.id === blockId) {
        const dropdownOptions = (b.dropdownOptions || []).map(opt => {
          if (opt.id === optionId) return { ...opt, [field]: value };
          return opt;
        });
        return { ...b, dropdownOptions };
      }
      return b;
    });
    const updatedPage = { ...selectedPage, blocks: updatedBlocks };
    const updatedPages = pages.map(p => p.id === selectedPage.id ? updatedPage : p);
    await savePagesList(updatedPages);
    setSelectedPage(updatedPage);
  };

  const addDropdownOption = async (blockId: string) => {
    if (!selectedPage || userRole === 'ReadOnly') return;
    const newOpt = { id: 'd-' + Math.floor(Math.random() * 100000), label: 'নতুন প্রশ্নোত্তর ড্রপডাউন প্রশ্ন', value: 'এখানে বিস্তারিত উত্তর বা মন্তব্য লিখুন।' };
    const updatedBlocks = selectedPage.blocks.map(b => {
      if (b.id === blockId) {
        return { ...b, dropdownOptions: [...(b.dropdownOptions || []), newOpt] };
      }
      return b;
    });
    const updatedPage = { ...selectedPage, blocks: updatedBlocks };
    const updatedPages = pages.map(p => p.id === selectedPage.id ? updatedPage : p);
    await savePagesList(updatedPages);
    setSelectedPage(updatedPage);
  };

  const deleteDropdownOption = async (blockId: string, optionId: string) => {
    if (!selectedPage || userRole === 'ReadOnly') return;
    const updatedBlocks = selectedPage.blocks.map(b => {
      if (b.id === blockId) {
        return { ...b, dropdownOptions: (b.dropdownOptions || []).filter(opt => opt.id !== optionId) };
      }
      return b;
    });
    const updatedPage = { ...selectedPage, blocks: updatedBlocks };
    const updatedPages = pages.map(p => p.id === selectedPage.id ? updatedPage : p);
    await savePagesList(updatedPages);
    setSelectedPage(updatedPage);
  };

  // Form custom config mutations
  const updateFormConfig = async (blockId: string, field: 'customButtonText' | 'hideMetrics', value: any) => {
    if (!selectedPage || userRole === 'ReadOnly') return;
    const updatedBlocks = selectedPage.blocks.map(b => {
      if (b.id === blockId) {
        return { ...b, [field]: value };
      }
      return b;
    });
    const updatedPage = { ...selectedPage, blocks: updatedBlocks };
    const updatedPages = pages.map(p => p.id === selectedPage.id ? updatedPage : p);
    await savePagesList(updatedPages);
    setSelectedPage(updatedPage);
  };

  // Reviews-slider reviewIds selection toggle helper
  const toggleReviewOnBlock = async (blockId: string, reviewId: string) => {
    if (!selectedPage || userRole === 'ReadOnly') return;
    const updatedBlocks = selectedPage.blocks.map(b => {
      if (b.id === blockId) {
        const selected = b.reviewIds || [];
        const updated = selected.includes(reviewId)
          ? selected.filter(id => id !== reviewId)
          : [...selected, reviewId];
        return { ...b, reviewIds: updated };
      }
      return b;
    });
    const updatedPage = { ...selectedPage, blocks: updatedBlocks };
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
            <h3 className="font-extrabold text-slate-900 text-sm">সকল ল্যান্ডিং পেইজ</h3>
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
                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest block mb-1">➕ এলিমেন্টর কন্টেন্ট উইজেটস (Elementor Pro Widgets)</span>
                <div className="flex flex-wrap gap-1.5 text-[11px]">
                  <button 
                    onClick={() => addBlock('headline')}
                    className="py-1 px-2.5 bg-white hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200 text-slate-700 font-extrabold rounded-lg shadow-2xs flex items-center gap-1 cursor-pointer transition text-[11px]"
                  >
                    H1 হেডিং
                  </button>
                  <button 
                    onClick={() => addBlock('text')}
                    className="py-1 px-2.5 bg-white hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200 text-slate-700 font-extrabold rounded-lg shadow-2xs flex items-center gap-1 cursor-pointer transition text-[11px]"
                  >
                    T বর্ণনা কপি
                  </button>
                  <button 
                    onClick={() => addBlock('image')}
                    className="py-1 px-2.5 bg-white hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200 text-slate-700 font-extrabold rounded-lg shadow-2xs flex items-center gap-1 cursor-pointer transition text-[11px]"
                  >
                    🖼️ ছবি URL
                  </button>
                  <button 
                    onClick={() => addBlock('carousel')}
                    className="py-1 px-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-extrabold rounded-lg shadow-2xs flex items-center gap-1 cursor-pointer transition text-[11px]"
                  >
                    🎠 স্লাইডার গ্যালারি
                  </button>
                  <button 
                    onClick={() => addBlock('icons')}
                    className="py-1 px-2.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 font-extrabold rounded-lg shadow-2xs flex items-center gap-1 cursor-pointer transition text-[11px]"
                  >
                    ✨ ফিচার আইকন
                  </button>
                  <button 
                    onClick={() => addBlock('dropdown')}
                    className="py-1 px-2.5 bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 font-extrabold rounded-lg shadow-2xs flex items-center gap-1 cursor-pointer transition text-[11px]"
                  >
                    🔽 ড্রপডাউন FAQ
                  </button>
                  <button 
                    onClick={() => addBlock('video')}
                    className="py-1 px-2.5 bg-white hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200 text-slate-700 font-extrabold rounded-lg shadow-2xs flex items-center gap-1 cursor-pointer transition text-[11px]"
                  >
                    🎥 ভিডিও এমবেড
                  </button>
                  <button 
                    onClick={() => addBlock('button')}
                    className="py-1 px-2.5 bg-white hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200 text-slate-700 font-extrabold rounded-lg shadow-2xs flex items-center gap-1 cursor-pointer transition text-[11px]"
                  >
                    🔗 অ্যাকশন বাটন
                  </button>
                  <button 
                    onClick={() => addBlock('form')}
                    className="py-1 px-2.5 bg-emerald-50 hover:bg-emerald-150 text-emerald-700 border border-emerald-200 font-extrabold rounded-lg shadow-2xs flex items-center gap-1 cursor-pointer transition text-[11px]"
                  >
                    📝 কাস্টম অর্ডার ফর্ম
                  </button>
                  <button 
                    onClick={() => addBlock('reviews-slider')}
                    className="py-1 px-2.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 font-extrabold rounded-lg shadow-2xs flex items-center gap-1 cursor-pointer transition text-[11px]"
                  >
                    ⭐ রিভিউ স্লাইডার
                  </button>
                  <button 
                    onClick={() => addBlock('shop')}
                    className="py-1 px-2.5 bg-amber-500 hover:bg-amber-600 text-white border border-amber-600 font-black rounded-lg shadow-2xs flex items-center gap-1 cursor-pointer transition text-[11px]"
                  >
                    🛒 লাইভ ক্যাটালগ
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
                           block.type === 'button' ? '🔗 কাস্টম অ্যাকশন লিঙ্ক বা বাটন' :
                           block.type === 'form' ? '📝 কাস্টমার ক্যাশ-অন ফর্ম' :
                           block.type === 'carousel' ? '🎠 ঘুরন্ত ইমেজ স্লাইডার (Carousel)' :
                           block.type === 'icons' ? '✨ ফিচার আইকন উইজেট তালিকা' :
                           block.type === 'dropdown' ? '🔽 প্রশ্নোত্তর ড্রপডাউন (Accordion)' :
                           block.type === 'reviews-slider' ? '⭐ কাস্টমার রিভিউ স্লাইডার' :
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
                             block.type === 'carousel' ? 'স্লাইডারের কাস্টম টাইটেল বা সেকশন হেডিং (ঐচ্ছিক)' :
                             block.type === 'icons' ? 'ফিচার সেকশন এর কাস্টম হেডিং (ঐচ্ছিক)' :
                             block.type === 'dropdown' ? 'প্রশ্নোত্তর ড্রপডাউন সেকশন কাস্টম টাইটেল (ঐচ্ছিক)' :
                             block.type === 'reviews-slider' ? 'টেস্টিমোনিয়াল স্লাইডার কাস্টম শিরোনাম (ঐচ্ছিক)' :
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
                                block.type === 'carousel' ? 'যেমন: আমাদের কুইক গ্যালারি ভিউ স্লাইডার...' :
                                'বাটন এর সঠিক লিংক (যেমন: #checkout-form)'
                              }
                              disabled={userRole === 'ReadOnly'}
                            />
                          )}
                        </div>

                        {/* Carousel deep config */}
                        {block.type === 'carousel' && (
                          <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                            <span className="text-[10px] font-black text-indigo-700 block uppercase">🎠 স্লাইডার ইমেজ তালিকা (Carousel Gallery Images)</span>
                            <div className="space-y-2">
                              {(block.carouselImages || []).map((imgUrl, imgIdx) => (
                                <div key={imgIdx} className="flex gap-1.5 items-center">
                                  <span className="text-[10px] text-slate-400 font-mono font-bold">#{imgIdx+1}</span>
                                  <input
                                    type="text"
                                    value={imgUrl}
                                    onChange={(e) => updateCarouselImage(block.id, imgIdx, e.target.value)}
                                    className="flex-1 px-2 py-1 text-xs bg-white border border-slate-200 rounded-md focus:outline-none"
                                    placeholder="ছবির ডিরেক্ট URL"
                                    disabled={userRole === 'ReadOnly'}
                                  />
                                  <button
                                    onClick={() => deleteCarouselImage(block.id, imgIdx)}
                                    className="p-1 hover:bg-rose-50 text-rose-500 rounded cursor-pointer"
                                    disabled={userRole === 'ReadOnly'}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                            <button
                              onClick={() => addCarouselImage(block.id, '')}
                              className="px-2 py-1 text-[10px] bg-white border border-slate-300 text-slate-700 font-bold rounded-md hover:bg-slate-100 cursor-pointer flex items-center gap-1"
                              disabled={userRole === 'ReadOnly'}
                            >
                              <Plus className="h-3 w-3" /> নতুন ছবি যোগ করুন
                            </button>
                          </div>
                        )}

                        {/* Icons deep config */}
                        {block.type === 'icons' && (
                          <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                            <span className="text-[10px] font-black text-indigo-700 block uppercase">✨ ফিচার আইকন ও টেক্সট কলাম (Features List)</span>
                            <div className="space-y-3">
                              {(block.items || []).map((item) => (
                                <div key={item.id} className="p-2 bg-white border border-slate-200 rounded-md space-y-2 relative">
                                  <div className="flex gap-2 items-center">
                                    <input
                                      type="text"
                                      value={item.icon || '🛡️'}
                                      onChange={(e) => updateIconItem(block.id, item.id, 'icon', e.target.value)}
                                      className="w-10 px-1 py-1 text-center text-xs border border-slate-200 rounded-md bg-slate-50 font-sans"
                                      placeholder="আইকন"
                                      disabled={userRole === 'ReadOnly'}
                                    />
                                    <input
                                      type="text"
                                      value={item.title || ''}
                                      onChange={(e) => updateIconItem(block.id, item.id, 'title', e.target.value)}
                                      className="flex-1 px-2 py-1 text-xs border border-slate-200 rounded-md font-extrabold focus:outline-none"
                                      placeholder="হেডিং বা শিরোনাম"
                                      disabled={userRole === 'ReadOnly'}
                                    />
                                    <button
                                      onClick={() => deleteIconItem(block.id, item.id)}
                                      className="p-1 hover:bg-rose-50 text-rose-500 rounded cursor-pointer"
                                      disabled={userRole === 'ReadOnly'}
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </button>
                                  </div>
                                  <textarea
                                    rows={1.5}
                                    value={item.text || ''}
                                    onChange={(e) => updateIconItem(block.id, item.id, 'text', e.target.value)}
                                    className="w-full px-2 py-1 text-xs border border-slate-200 rounded-md focus:outline-none text-slate-500"
                                    placeholder="সংক্ষিপ্ত বর্ণনা বা বিস্তারিত কপি..."
                                    disabled={userRole === 'ReadOnly'}
                                  />
                                </div>
                              ))}
                            </div>
                            <button
                              onClick={() => addIconItem(block.id)}
                              className="px-2 py-1 text-[10px] bg-white border border-slate-300 text-slate-700 font-bold rounded-md hover:bg-slate-100 cursor-pointer flex items-center gap-1"
                              disabled={userRole === 'ReadOnly'}
                            >
                              <Plus className="h-3 w-3" /> নতুন আইকন সেকশন যোগ করুন
                            </button>
                          </div>
                        )}

                        {/* Dropdown FAQ deep config */}
                        {block.type === 'dropdown' && (
                          <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                            <span className="text-[10px] font-black text-indigo-700 block uppercase">🔽 প্রশ্নোত্তর একর্ডিয়ন ড্রপডাউন (Accordion FAQ)</span>
                            <div className="space-y-3">
                              {(block.dropdownOptions || []).map((opt) => (
                                <div key={opt.id} className="p-2 bg-white border border-slate-200 rounded-md space-y-2">
                                  <div className="flex gap-2 items-center">
                                    <span className="text-[10px] text-slate-400 font-bold uppercase">প্রশ্ন:</span>
                                    <input
                                      type="text"
                                      value={opt.label}
                                      onChange={(e) => updateDropdownOption(block.id, opt.id, 'label', e.target.value)}
                                      className="flex-1 px-2 py-1 text-xs border border-slate-200 rounded-md font-bold focus:outline-none"
                                      placeholder="যেমন: ১. ওয়াটারপ্রুফ কি শতভাগ?"
                                      disabled={userRole === 'ReadOnly'}
                                    />
                                    <button
                                      onClick={() => deleteDropdownOption(block.id, opt.id)}
                                      className="p-1 hover:bg-rose-50 text-rose-500 rounded cursor-pointer"
                                      disabled={userRole === 'ReadOnly'}
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </button>
                                  </div>
                                  <div className="flex gap-2 items-start">
                                    <span className="text-[10px] text-slate-400 mt-1 font-bold uppercase">উত্তর:</span>
                                    <textarea
                                      rows={2}
                                      value={opt.value}
                                      onChange={(e) => updateDropdownOption(block.id, opt.id, 'value', e.target.value)}
                                      className="flex-1 px-2 py-1 text-xs border border-slate-200 rounded-md focus:outline-none text-slate-600"
                                      placeholder="বিস্তারিত উত্তর এখানে দিন..."
                                      disabled={userRole === 'ReadOnly'}
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                            <button
                              onClick={() => addDropdownOption(block.id)}
                              className="px-2 py-1 text-[10px] bg-white border border-slate-300 text-slate-700 font-bold rounded-md hover:bg-slate-100 cursor-pointer flex items-center gap-1"
                              disabled={userRole === 'ReadOnly'}
                            >
                              <Plus className="h-3 w-3" /> নতুন প্রশ্ন/উত্তর কলাম যোগ করুন
                            </button>
                          </div>
                        )}

                        {/* Order quick form configuration */}
                        {block.type === 'form' && (
                          <div className="mt-3 p-3 bg-emerald-50/50 border border-emerald-200 rounded-lg space-y-3 text-[11px]">
                            <span className="text-[10px] font-black text-emerald-800 block uppercase">⚙️ অর্ডার ফর্ম কাস্টমাইজেশন (Checkout Options)</span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[10px] font-bold text-slate-600 mb-1">অর্ডার বাটন লেখা (CTA Text):</label>
                                <input
                                  type="text"
                                  value={block.customButtonText || ''}
                                  onChange={(e) => updateFormConfig(block.id, 'customButtonText', e.target.value)}
                                  className="w-full px-2 py-1 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none font-bold"
                                  placeholder="অর্ডার কনফার্ম করুন (ক্যাশ অন ডেলিভারি)"
                                  disabled={userRole === 'ReadOnly'}
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-slate-600 mb-1">ওজন ও উচ্চতা অপশন:</label>
                                <div className="flex items-center h-8">
                                  <input
                                    type="checkbox"
                                    id={`hide-metrics-chk-${block.id}`}
                                    checked={block.hideMetrics || false}
                                    onChange={(e) => updateFormConfig(block.id, 'hideMetrics', e.target.checked)}
                                    className="h-4 w-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500 cursor-pointer"
                                    disabled={userRole === 'ReadOnly'}
                                  />
                                  <label htmlFor={`hide-metrics-chk-${block.id}`} className="ml-2 text-slate-700 font-bold cursor-pointer">ওজন ও উচ্চতা ইনপুট হাইড করুন</label>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Reviews slider select config */}
                        {block.type === 'reviews-slider' && (
                          <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                            <span className="text-[10px] font-black text-amber-800 block uppercase">⭐ রিভিউ স্লাইডার কাস্টম সিলেক্টর (Review Testimonial Slider)</span>
                            <p className="text-[10px] text-slate-500 leading-normal">স্লাইডারে প্রদর্শনের জন্য কাস্টমার ফিডব্যাক/রিভিউ নির্বাচন করুন। একসাথে একাধিক নির্বাচন করতে পারবেন:</p>
                            
                            <div className="max-h-48 overflow-y-auto space-y-1.5 p-1.5 bg-white border border-slate-200 rounded-lg">
                              {customReviews.length === 0 ? (
                                <p className="text-[10px] text-center py-4 italic text-slate-400">কোনো কাস্টমার রিভিউ পাওয়া যায়নি। বাম কলামের "কাস্টমার রিভিউ" তালিকা থেকে রিভিউ লিখে রাখুন।</p>
                              ) : (
                                customReviews.map((rev) => {
                                  const isSelected = (block.reviewIds || []).includes(rev.id);
                                  return (
                                    <label key={rev.id} className="flex items-start gap-2 p-1.5 hover:bg-slate-50 rounded cursor-pointer transition text-xs border border-b border-slate-100 last:border-b-0">
                                      <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() => toggleReviewOnBlock(block.id, rev.id)}
                                        className="mt-0.5"
                                        disabled={userRole === 'ReadOnly'}
                                      />
                                      <div className="flex-1">
                                        <div className="flex justify-between items-center bg-slate-50/50 px-1 py-0.5 rounded">
                                          <span className="font-extrabold text-slate-800 text-[10px]">{rev.name} ({rev.location})</span>
                                          <span className="text-amber-500 font-black text-[10px] flex items-center">⭐ {rev.stars}</span>
                                        </div>
                                        <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5 font-sans italic">"{rev.comment}"</p>
                                      </div>
                                    </label>
                                  );
                                })
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400 font-bold">
                              নির্বাচিত রিভিউ সংখ্যা: <strong className="text-indigo-600">{(block.reviewIds || []).length} টি</strong>
                            </div>
                          </div>
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
