import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Tag, ShoppingBag, Edit, Save, RefreshCw, Star, Upload, X } from 'lucide-react';
import { getProductsFromFirestore, saveProductToFirestore, deleteProductFromFirestore, saveAllProductsToFirestore } from '../../lib/firebase';
import { compressImage } from '../../lib/imageCompressor';

interface Product {
  id: string;
  title: string;
  slug?: string;
  description: string;
  price: number;
  image: string;
  category: string;
  sizes: string[];
  colors: string[];
  images?: string[];
  addDeliveryCharge?: boolean;
}

interface ProductsAdminProps {
  onRefreshProducts: () => void;
  userRole: string; // 'Admin' | 'Editor' | 'ReadOnly'
}

export default function ProductsAdmin({ onRefreshProducts, userRole }: ProductsAdminProps) {
  const [products, setProducts] = useState<Product[]>([]);
  
  // Form states to create/edit products
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState(490);
  const [image, setImage] = useState('');
  const [category, setCategory] = useState('বাইকিং গিয়ার');
  const [sizes, setSizes] = useState('M,L,XL');
  const [colors, setColors] = useState('Black');
  const [additionalImages, setAdditionalImages] = useState<string[]>([]);
  const [addDeliveryCharge, setAddDeliveryCharge] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleMainImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        if (typeof reader.result === 'string') {
          try {
            const compressed = await compressImage(reader.result);
            setImage(compressed);
          } catch (e) {
            console.error("Compression failed:", e);
            setImage(reader.result);
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAdditionalImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const updated = [...additionalImages];
      const remainingSlots = 8 - updated.length;
      const filesToProcess = (Array.from(files).slice(0, remainingSlots)) as File[];

      let processedCount = 0;
      if (filesToProcess.length === 0) return;

      filesToProcess.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = async () => {
          if (typeof reader.result === 'string') {
            try {
              const compressed = await compressImage(reader.result);
              updated.push(compressed);
            } catch (err) {
              updated.push(reader.result);
            }
            processedCount++;
            if (processedCount === filesToProcess.length) {
              setAdditionalImages(updated.slice(0, 8));
            }
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const addAdditionalImageUrl = (url: string) => {
    if (!url.trim()) return;
    if (additionalImages.length >= 8) {
      alert('সর্বোচ্চ ৮ টি অতিরিক্ত ছবি যোগ করতে পারবেন!');
      return;
    }
    setAdditionalImages(prev => [...prev, url.trim()].slice(0, 8));
  };

  const removeAdditionalImage = (index: number) => {
    setAdditionalImages(prev => prev.filter((_, i) => i !== index));
  };

  const loadProducts = async () => {
    try {
      const fbProducts = await getProductsFromFirestore();
      if (fbProducts && fbProducts.length > 0) {
        setProducts(fbProducts as any);
        return;
      }
    } catch (e) {
      console.warn("Could not retrieve products from Firestore, looking for local storage fallback...", e);
    }

    const list = localStorage.getItem('raincoat_shop_products');
    if (list) {
      try {
        const parsed = JSON.parse(list);
        if (parsed && parsed.length > 0) {
          setProducts(parsed);
          await saveAllProductsToFirestore(parsed as any);
          return;
        }
      } catch (e) {}
    }
    
    const defaults = [
      {
        id: 'p-1',
        title: 'প্রিমিয়াম ওয়াটারপ্রুফ রেইনকোট জ্যাকেট ও প্যান্ট সেট (Navy Blue & Black)',
        description: 'ডাবল পার্ট প্রিমিয়াম ফ্যাব্রিক ও হিট সিলিং টেকনোলজি সহ বর্ষাকালের সেরা রেনকোট গিয়ার।',
        price: 990,
        image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=600',
        category: 'রেইনকোট',
        sizes: ['XL', 'XXL', '3XL', '4XL'],
        colors: ['Black', 'Navy Blue']
      },
      {
        id: 'p-2',
        title: 'হেভি ডিউটি ওয়াটারপ্রুফ মোটরসাইকেল সু কাভার (Shoe Guard)',
        description: 'বর্ষায় বাইক ট্রাভেলে আপনার জুতো কাঁদা জল থেকে শতভাগ শুকনো রাখতে জুতো প্রোটেক্টর শু কাভার।',
        price: 490,
        image: 'https://images.unsplash.com/photo-1622434641406-a158123450f9?auto=format&fit=crop&q=80&w=600',
        category: 'বাইকিং গিয়ার',
        sizes: ['M', 'L', 'XL'],
        colors: ['Black']
      },
      {
        id: 'p-3',
        title: 'ডাবল পার্ট উইন্ডপ্রুফ আমব্রেলা ছাতা (Premium Laptop Defense)',
        description: 'ভারী ঝড়ে উল্টে যাবে না এমন বিশেষ উইন্ড কন্ডাক্টর ও ইউভি কোটিং সমৃদ্ধ ছাতা।',
        price: 680,
        image: 'https://images.unsplash.com/photo-1510200378107-1601ee036683?auto=format&fit=crop&q=80&w=600',
        category: 'অনুষঙ্গ',
        sizes: ['Universal'],
        colors: ['Black', 'Blue']
      },
      {
        id: 'p-4',
        title: 'মোটরসাইকেল হ্যান্ডেলবার ওয়াটারপ্রুফ হ্যান্ড গ্লাভস',
        description: 'বর্ষায় আর কনকনে ঠান্ডায় বাইক চালানোর জন্য শতভাগ ওয়াটারপ্রুফ ও আরামদায়ক হ্যান্ডগ্লাভস সেট। গরম ও শুষ্ক গ্রিপ।',
        price: 350,
        image: 'https://images.unsplash.com/photo-1516257984-b1b4d707412e?auto=format&fit=crop&q=80&w=600',
        category: 'বাইকিং গিয়ার',
        sizes: ['M', 'L'],
        colors: ['Black', 'Red']
      },
      {
        id: 'p-5',
        title: 'প্রিমিয়াম সেলফ-লকিং ওয়াটারপ্রুফ বাইক মোবাইল হোল্ডার',
        description: 'যেকোনো সাইকেল বা মোটরসাইকেল হ্যান্ডেলে সহজে ফিট করা যায়। সম্পূর্ণ ওয়াটারপ্রুফ কভার সহ টাচ স্ক্রিন সাপোর্টেড।',
        price: 590,
        image: 'https://images.unsplash.com/photo-1584438784894-089d6a128f3e?auto=format&fit=crop&q=80&w=600',
        category: 'বাইকিং গিয়ার',
        sizes: ['L', 'XL'],
        colors: ['Midnight Black']
      },
      {
        id: 'p-6',
        title: 'ব্যাকপ্যাক ওয়াটারপ্রুফ আল্ট্রা-শিল্ড রেইন কাভার',
        description: '৩৫ থেকে ৪৫ লিটার সাইজের যেকোনো স্কুল, college বা ট্রাভেল ব্যাগ সম্পূর্ণ পানি ও ধুলোবালি থেকে সুরক্ষিত রাখার কাভার।',
        price: 190,
        image: 'https://images.unsplash.com/photo-1622560480654-d96214fdc887?auto=format&fit=crop&q=80&w=600',
        category: 'অনুষঙ্গ',
        sizes: ['Standard'],
        colors: ['Neon Yellow', 'Black']
      },
      {
        id: 'p-7',
        title: 'স্পোর্টস আল্ট্রা-লাইট ব্রিদাবল উইন্ডব্রেকার রেইন জ্যাকেট',
        description: 'রানিং, সাইক্লিং এবং ট্র্যাকিংয়ের জন্য হালকা ও আরামদায়ক রেইনপ্রুফ জ্যাকেট। সহজেই ভাজ করে পকেটে রাখা যায়।',
        price: 790,
        image: 'https://images.unsplash.com/photo-1548883354-7622d03aca27?auto=format&fit=crop&q=80&w=600',
        category: 'রেইনকোট',
        sizes: ['M', 'L', 'XL', 'XXL'],
        colors: ['Lime Green', 'Navy Blue', 'Silver Gray']
      },
      {
        id: 'p-8',
        title: 'কিডস ফানি কার্টুন ওয়াটারপ্রুফ রেইনকোট (স্কুল ব্যাগ স্পেস সহ)',
        description: 'ছোট সোনামণিদের সহজে স্কুলে যাতায়াত করতে আকর্ষণীয় কার্টুন ডিজাইন সম্পন্ন রেইনকোট যা খুব দ্রুত শুকিয়ে যায়।',
        price: 450,
        image: 'https://images.unsplash.com/photo-1515621061946-eff1c2a352bd?auto=format&fit=crop&q=80&w=600',
        category: 'রেইনকোট',
        sizes: ['S', 'M', 'L'],
        colors: ['Pink Rose', 'Sky Blue', 'Yellow Duck']
      },
      {
        id: 'p-9',
        title: 'লেডিস ক্লাসিক লং বেল্ট রেনকোট ট্রেইল কোট',
        description: 'স্টাইলিশ ও অভিজাত নারীদের জন্য লং বেল্টেড ওয়াটারপ্রুফ ট্রেনচ কোট। আরামদায়ক ও ১০০% প্রিমিয়াম পলিয়েস্টার ফ্যাব্রিক।',
        price: 1190,
        image: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=600',
        category: 'রেইনকোট',
        sizes: ['M', 'L', 'XL'],
        colors: ['Beige', 'Black', 'Wine Red']
      },
      {
        id: 'p-10',
        title: 'আউটডোর ট্রাভেলার্স ওয়াটারপ্রুফ ড্রাই ব্যাগ (২০ লিটার)',
        description: 'নদী পারাপার, ট্র্যাকিং বা ক্যাম্পিংয়ে ক্যামেরা, মোবাইল ও কাপড় সম্পূর্ণ ওয়াটার টাইট ও ভাসমান রাখতে হেভি ডিউটি ড্রাই ব্যাগ।',
        price: 550,
        image: 'https://images.unsplash.com/photo-1611002214172-792c1f90b59a?auto=format&fit=crop&q=80&w=600',
        category: 'অনুষঙ্গ',
        sizes: ['20 Liters'],
        colors: ['Orange Orange', 'Black Shield']
      },
      {
        id: 'p-11',
        title: 'নাইট-সেফ হাই-ভিজিবিলিটি রিফ্লেক্টভ সেফটি রেইন ভেস্ট',
        description: 'ঝড়ো বৃষ্টির রাতে বাইকিং বা সড়ক মেরামতে অনন্য সুরক্ষী রিফ্লেক্টিভ স্ট্রিপ সমৃদ্ধ ওয়াটারপ্রুফ ভেস্ট জ্যাকেট।',
        price: 280,
        image: 'https://images.unsplash.com/photo-1604176354204-9268737828e4?auto=format&fit=crop&q=80&w=600',
        category: 'বাইকিং গিয়ার',
        sizes: ['L', 'XL'],
        colors: ['Neon Green']
      },
      {
        id: 'p-12',
        title: 'হেভি হিট-সিলড প্রিমিয়াম রেন পনচো (হুড যুক্ত)',
        description: 'সহজে গায়ে জড়িয়ে নেয়ার উপযোগী আল্ট্রা-সুপিরিয়র ফিতা যুক্ত পনচো। ১০০% ওয়াটার ব্লক ফ্যাব্রিক যা সহজে ফাটে না।',
        price: 690,
        image: 'https://images.unsplash.com/photo-1601924638867-3a6de6b7a500?auto=format&fit=crop&q=80&w=600',
        category: 'রেইনকোট',
        sizes: ['Universal Free Size'],
        colors: ['Hunter Green', 'Royal Blue']
      },
      {
        id: 'p-13',
        title: 'সিলিকন ইলাস্টিক অ্যান্টি-স্লিপ রেইন শু কাভার (পকেট সাইজ)',
        description: 'পকেটে রাখা মতো পাতলা কিন্তু অত্যন্ত মজবুত ও ১০০% ওয়াটারপ্রুফ ইলাস্টিক সিলিকন সু গার্ড। রাস্তায় পিচ্ছিল কাদা রোধক গ্রিপ।',
        price: 190,
        image: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&q=80&w=600',
        category: 'অনুষঙ্গ',
        sizes: ['S', 'M', 'L'],
        colors: ['Sky Blue', 'Transparent Clear', 'Coal Black']
      },
      {
        id: 'p-14',
        title: '১০০% ওয়াটারপ্রুফ ও ডাস্টপ্রুফ প্রিমিয়াম বাইক কভার (Premium Bike Cover)',
        description: '৩০০০ মিলি ওজনের ছাতা কাপড়ের তৈরি শতভাগ ওয়াটারপ্রুফ ও ডাস্টপ্রুফ বাইক কভার। রোদ, বৃষ্টি ও ধুলোবালি প্রতিরোধক সিলভার হিট প্রুফ কোটিং এবং চাকার দুই পাশে ইলাস্টিক জ্যাকিং বেল্ট সহ সম্পূর্ণ স্ট্যান্ডার্ড সাইজ।',
        price: 600,
        image: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&q=80&w=600',
        category: 'বাইকিং গিয়ার',
        sizes: ['XL'],
        colors: ['Navy Blue', 'Black'],
        addDeliveryCharge: false
      }
    ];
    setProducts(defaults);
    await saveAllProductsToFirestore(defaults as any);
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const resetForm = () => {
    setTitle('');
    setSlug('');
    setIsSlugManuallyEdited(false);
    setEditingProductId(null);
    setDescription('');
    setImage('');
    setPrice(490);
    setCategory('বাইকিং গিয়ার');
    setSizes('M,L,XL');
    setColors('Black');
    setAdditionalImages([]);
    setAddDeliveryCharge(true);
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (userRole === 'ReadOnly') {
      return setErrorMsg('আপনার রিড-অনলি রোল রয়েছে! আপনি প্রোডাক্ট যোগ বা এডিট করতে পারবেন না।');
    }

    if (!title.trim() || !description.trim()) {
      return setErrorMsg('অনুগ্রহ করে টাইটেল ও বিবরণ লিখুন!');
    }

    const cleanSlug = (slug.trim() || title.trim())
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    if (editingProductId) {
      // Dynamic updates for existing products
      const match = products.find(p => p.id === editingProductId);
      if (!match) return;

      const updatedProduct = {
        ...match,
        title: title.trim(),
        slug: cleanSlug,
        description: description.trim(),
        price: Number(price) || 0,
        image: image.trim() || match.image,
        category: category,
        sizes: sizes.split(',').map(s => s.trim()).filter(Boolean),
        colors: colors.split(',').map(c => c.trim()).filter(Boolean),
        images: additionalImages,
        addDeliveryCharge: addDeliveryCharge,
      };

      const updated = products.map(p => p.id === editingProductId ? updatedProduct : p);
      setProducts(updated);
      await saveProductToFirestore(updatedProduct as any);
      setSuccessMsg('প্রোডাক্ট সফলভাবে আপডেট (WordPress-Style) সম্পন্ন হয়েছে!');
      onRefreshProducts();
      resetForm();
      return;
    }

    // Creating new product
    const newProduct: Product = {
      id: 'p-' + Math.floor(Math.random() * 10000),
      title: title.trim(),
      slug: cleanSlug,
      description: description.trim(),
      price: Number(price) || 0,
      image: image.trim() || 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=600',
      category: category,
      sizes: sizes.split(',').map(s => s.trim()).filter(Boolean),
      colors: colors.split(',').map(c => c.trim()).filter(Boolean),
      images: additionalImages,
      addDeliveryCharge: addDeliveryCharge,
    };

    const updated = [...products, newProduct];
    setProducts(updated);
    await saveProductToFirestore(newProduct as any);

    setSuccessMsg('প্রোডাক্ট সফলভাবে শপ ক্যাটালগে যুক্ত হয়েছে!');
    onRefreshProducts();
    resetForm();
  };

  const handleStartEditProduct = (p: Product) => {
    setEditingProductId(p.id);
    setTitle(p.title);
    setSlug(p.slug || p.id);
    setIsSlugManuallyEdited(true); // freeze auto-regenerating on loaded titles
    setDescription(p.description);
    setPrice(p.price);
    setImage(p.image);
    setCategory(p.category);
    setSizes(p.sizes.join(', '));
    setColors(p.colors.join(', '));
    setAdditionalImages(p.images || []);
    setAddDeliveryCharge(p.addDeliveryCharge !== false);
  };

  const handleDeleteProduct = async (id: string) => {
    if (userRole === 'ReadOnly') {
      alert('দুঃখিত! রিড-অনলি এক্সেস দিয়ে এটি ড্রপ করা সম্ভব নয়।');
      return;
    }

    if (!window.confirm('আপনি কি নিশ্চিতভাবে এই প্রোডাক্টটি চিরতরে ডিলিট করতে চান?')) return;

    const updated = products.filter(p => p.id !== id);
    setProducts(updated);
    await deleteProductFromFirestore(id);
    onRefreshProducts();
  };

  return (
    <div className="space-y-6 font-sans text-xs sm:text-sm">
      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* Left Form: Add customized product */}
        <div className="w-full lg:w-2/5 bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <div className="flex items-center gap-1.5">
              <ShoppingBag className="h-4 w-4 text-orange-500" />
              <h3 className="font-extrabold text-slate-900 text-sm">
                {editingProductId ? 'প্রোডাক্ট এডিট করুন' : 'নতুন প্রোডাক্ট যুক্ত করুন'}
              </h3>
            </div>
            {editingProductId && (
              <span className="text-[9px] bg-indigo-100 text-indigo-800 font-bold rounded px-1.5 py-0.5">
                এডিট মোড অ্যাক্টিভ
              </span>
            )}
          </div>

          {errorMsg && (
            <div className="p-2.5 bg-rose-50 border border-rose-250 text-rose-700 text-xs rounded-xl font-bold">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="p-2.5 bg-emerald-50 border border-emerald-250 text-emerald-700 text-xs rounded-xl font-bold">
              {successMsg}
            </div>
          )}

          <form onSubmit={handleAddProduct} className="space-y-3">
            <div>
              <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">প্রোডাক্টের নাম (Product Name)</label>
              <input 
                type="text" 
                placeholder="যেমন: উইন্ডপ্রুফ জিপার উইন্ডব্রেকার"
                className="w-full px-3 py-1.8 border rounded-lg focus:outline-none focus:border-indigo-500 text-slate-800 text-xs font-bold bg-white"
                value={title}
                onChange={(e) => {
                  const val = e.target.value;
                  setTitle(val);
                  if (!isSlugManuallyEdited) {
                    const generated = val
                      .toLowerCase()
                      .replace(/[^a-zA-Z0-9\s-]/g, '')
                      .trim()
                      .replace(/\s+/g, '-')
                      .replace(/-+/g, '-');
                    setSlug(generated);
                  }
                }}
                required
              />
            </div>

            <div>
              <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">ইউনিক লিংক আইডি / Slug (Permalink)</label>
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-slate-400 font-mono select-none">#</span>
                <input 
                  type="text" 
                  placeholder="যেমন: premium-jacket"
                  className="w-full px-3 py-1.8 border rounded-lg focus:outline-none focus:border-indigo-500 text-indigo-700 font-mono text-xs bg-white"
                  value={slug}
                  onChange={(e) => {
                    setIsSlugManuallyEdited(true);
                    setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9\-]/g, ''));
                  }}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">ক্যাটাগরি</label>
                <select 
                  value={category} 
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-1.8 bg-white border rounded-lg focus:outline-none text-slate-800 text-xs"
                >
                  <option value="রেইনকোট">রেইনকোট (Raincoat)</option>
                  <option value="বাইকিং গিয়ার">বাইকিং গিয়ার (Biking Gear)</option>
                  <option value="অনুষঙ্গ">ছাতা ও অনুষঙ্গ (Accessories)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">মূল্য (Price TK)</label>
                <input 
                  type="number" 
                  className="w-full px-3 py-1.8 bg-white border rounded-lg focus:outline-none focus:border-indigo-500 text-slate-800 text-xs font-mono"
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  required
                />
              </div>
            </div>

            {/* 📦 Courier Delivery Charge Active Checkbox */}
            <div className="p-3 bg-indigo-50/60 border border-indigo-150 rounded-xl flex items-center justify-between">
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-black text-slate-900 leading-normal">📦 কুরিয়ার চার্জ কি এড হবে?</span>
                <span className="text-[9px] text-slate-500 font-medium">টিক দিলে কুরিয়ার চার্জ মূল হিসাবের সাথে যোগ হবে।</span>
              </div>
              <input 
                type="checkbox" 
                checked={addDeliveryCharge}
                onChange={(e) => setAddDeliveryCharge(e.target.checked)}
                className="w-4 h-4 text-indigo-600 border-slate-350 rounded focus:ring-indigo-500 cursor-pointer"
              />
            </div>

            {/* 📸 MAIN PRODUCT IMAGE PANEL with UPLOAD and REMOVE */}
            <div className="space-y-2 border border-slate-100 bg-slate-50/50 p-4 rounded-2xl">
              <label className="block text-[10px] text-slate-700 font-extrabold uppercase tracking-wider">
                🖼️ প্রধান প্রোডাক্ট ছবি (Main Product Image)
              </label>
              
              <div className="flex flex-col sm:flex-row items-center gap-3">
                {/* Main image preview */}
                <div className="w-20 h-20 bg-slate-100 rounded-xl border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center relative group">
                  {image ? (
                    <>
                      <img src={image} className="w-full h-full object-cover" alt="Main" />
                      <button 
                        type="button"
                        onClick={() => setImage('')}
                        className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white font-extrabold text-[10px] cursor-pointer"
                      >
                        রিমুভ ✖
                      </button>
                    </>
                  ) : (
                    <span className="text-[10px] text-slate-400 italic font-medium">কোনো ছবি নেই</span>
                  )}
                </div>

                {/* Main image input fields */}
                <div className="flex-1 w-full space-y-1.5">
                  <input 
                    type="text" 
                    placeholder="ছবির লিংক দিন (https://images.unsplash.com/...)"
                    className="w-full px-3 py-1.8 border rounded-lg focus:outline-none focus:border-indigo-500 text-slate-800 text-[11px] bg-white"
                    value={image}
                    onChange={(e) => setImage(e.target.value)}
                  />
                  <div className="flex items-center gap-2">
                    <label className="flex items-center justify-center gap-1.5 px-3.5 py-1.5 hover:bg-slate-200 text-slate-700 bg-slate-100 border border-slate-300 rounded-lg text-[10px] font-black cursor-pointer transition">
                      <Upload className="h-3.5 w-3.5 text-slate-550" />
                      <span>কম্পিউটার থেকে ছবি আপলোড করুন</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleMainImageUpload}
                        className="hidden" 
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* 📸 ADDITIONAL GALLERY IMAGES PANEL (UP TO 8) with UPLOAD, REMOVE, ADD VIA URL */}
            <div className="space-y-3.5 border border-slate-200/60 bg-white p-4 rounded-2xl">
              <div className="flex items-center justify-between">
                <label className="block text-[10px] text-slate-700 font-extrabold uppercase tracking-wider">
                  📂 অতিরিক্ত প্রোডাক্ট গ্যালারি ছবি ({additionalImages.length}/৮ টি)
                </label>
                {additionalImages.length > 0 && (
                  <button 
                    type="button"
                    onClick={() => setAdditionalImages([])}
                    className="text-[10px] text-red-500 font-black hover:underline cursor-pointer"
                  >
                    সবগুলো মুছুন
                  </button>
                )}
              </div>

              {/* 8 horizontal grid/flex slots */}
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                {[...Array(8)].map((_, i) => {
                  const url = additionalImages[i];
                  return (
                    <div 
                      key={i} 
                      className="aspect-square bg-slate-50 border border-dashed border-slate-350 rounded-xl overflow-hidden relative group flex flex-col items-center justify-center"
                    >
                      {url ? (
                        <>
                          <img src={url} className="w-full h-full object-cover" alt={`Gallery-${i}`} />
                          <button 
                            type="button" 
                            onClick={() => removeAdditionalImage(i)}
                            className="absolute -top-1 -right-1 bg-red-500 hover:bg-red-650 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold shadow-xs cursor-pointer z-10 transition scale-90"
                            title="রিমুভ করুন"
                          >
                            ✖
                          </button>
                        </>
                      ) : (
                        <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100/80 transition">
                          <Plus className="h-4 w-4 text-slate-400 group-hover:scale-110 transition" />
                          <span className="text-[8px] text-slate-400 font-medium mt-0.5">আপলোড</span>
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={handleAdditionalImageUpload}
                            className="hidden" 
                          />
                        </label>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Back up URL adder input for additional images */}
              <div className="flex gap-2">
                <input 
                  type="text" 
                  id="add-gallery-url-input"
                  placeholder="লিংক দিয়ে গ্যালারিতে ছবি যোগ করুন..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const target = e.currentTarget;
                      addAdditionalImageUrl(target.value);
                      target.value = '';
                    }
                  }}
                  className="flex-1 px-3 py-1.8 border rounded-lg focus:outline-none focus:border-indigo-500 text-slate-800 text-[11px] bg-slate-50"
                />
                <button 
                  type="button"
                  onClick={() => {
                    const el = document.getElementById('add-gallery-url-input') as HTMLInputElement;
                    if (el) {
                      addAdditionalImageUrl(el.value);
                      el.value = '';
                    }
                  }}
                  className="px-3.5 py-1.8 bg-slate-850 hover:bg-slate-950 text-white rounded-lg text-xs font-black cursor-pointer transition"
                >
                  যোগ করুন
                </button>
              </div>
              <p className="text-[10px] text-rose-500/80 font-bold leading-normal">
                * আপনি প্লাস আইকনে ক্লিক করে সর্বোচ্চ ৮ টি ছবি গ্যালারিতে আপলোড করতে পারবেন।
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">সাইজসমূহ (Comma-Separated)</label>
                <input 
                  type="text" 
                  placeholder="M,L,XL,3XL"
                  className="w-full px-3 py-1.8 bg-white border rounded-lg focus:outline-none text-slate-800 text-xs font-mono"
                  value={sizes}
                  onChange={(e) => setSizes(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">কালারসমূহ (Comma-Separated)</label>
                <input 
                  type="text" 
                  placeholder="Black,Navy Blue"
                  className="w-full px-3 py-1.8 bg-white border rounded-lg focus:outline-none text-slate-800 text-xs font-mono"
                  value={colors}
                  onChange={(e) => setColors(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">প্রোডাক্টের বিবরণ (Short Description)</label>
              <textarea 
                rows={3}
                placeholder="পণ্যটির বিশেষ ওয়াটারপ্রুফ বা উইন্ডপ্রুফ উপকারিতা সংক্ষেপে উল্লেখ করুন..."
                className="w-full px-3 py-1.8 border rounded-lg focus:outline-none text-slate-800 text-xs bg-white"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>

            <button 
              type="submit"
              className="w-full py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-black rounded-lg shadow-sm transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              {editingProductId ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {editingProductId ? 'প্রোডাক্ট আপডেট নিশ্চিত করুন' : 'প্রোডাক্ট শপে যোগ করুন'}
            </button>
            {editingProductId && (
              <button 
                type="button"
                onClick={resetForm}
                className="w-full py-2 bg-slate-200 hover:bg-slate-300 text-slate-705 text-xs font-bold rounded-lg transition cursor-pointer"
              >
                বাতিল করুন (Cancel)
              </button>
            )}
          </form>
        </div>

        {/* Right side: Present product grid */}
        <div className="flex-1 bg-white border border-slate-200 p-5 rounded-2xl">
          <div className="flex justify-between items-center pb-2.5 border-b border-slate-150 mb-4">
            <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-1">
              🏷️ শপ ক্যাটালগ লিস্ট ({products.length} আইটেমস)
            </h3>
            <button 
              onClick={loadProducts}
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 flex items-center gap-1 cursor-pointer font-bold"
            >
              <RefreshCw className="h-3.5 w-3.5" /> রিলোড
            </button>
          </div>

          {products.length === 0 ? (
            <div className="text-center py-20 text-slate-400 italic">শপে কোনো আইটেম তালিকাভুক্ত নেই!</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {products.map(p => (
                <div key={p.id} className="border border-slate-201/80 hover:border-slate-300 p-3.5 rounded-xl bg-slate-50/50 flex gap-3 text-xs items-start">
                  <div className="w-16 h-16 bg-slate-100 rounded-lg overflow-hidden shrink-0 border">
                    <img 
                      src={p.image} 
                      alt={p.title} 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="space-y-1 overflow-hidden flex-1">
                    <div className="flex justify-between items-start gap-1">
                      <h4 className="font-extrabold text-slate-900 truncate" title={p.title}>{p.title}</h4>
                      <div className="flex items-center gap-0.5 shrink-0">
                        <button 
                          onClick={() => handleStartEditProduct(p)}
                          className="text-indigo-600 hover:bg-indigo-50 hover:text-indigo-800 p-1 rounded transition cursor-pointer"
                          title="এডিট করুন"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        <button 
                          onClick={() => handleDeleteProduct(p.id)}
                          className="text-rose-500 hover:bg-rose-50 hover:text-rose-700 p-1 rounded transition cursor-pointer"
                          title="মুছে ফেলুন"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    
                    <p className="text-[10px] text-slate-500 line-clamp-1 leading-snug">{p.description}</p>
                    
                    <div className="pt-1 flex items-center justify-between text-[10px] font-mono">
                      <span className="font-extrabold text-indigo-600 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded uppercase">
                        {p.category}
                      </span>
                      <span className="font-bold text-orange-650 font-sans text-xs">
                        {p.price} TK
                      </span>
                    </div>

                    <div className="text-[9px] text-slate-400 font-mono mt-1">
                      আইডি: {p.id} | সাইজ: {p.sizes.join(', ')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
