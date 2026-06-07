import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Tag, ShoppingBag, Edit, Save, RefreshCw, Star } from 'lucide-react';

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
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const loadProducts = () => {
    const list = localStorage.getItem('raincoat_shop_products');
    if (list) {
      setProducts(JSON.parse(list));
    } else {
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
        }
      ];
      localStorage.setItem('raincoat_shop_products', JSON.stringify(defaults));
      setProducts(defaults);
    }
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
  };

  const handleAddProduct = (e: React.FormEvent) => {
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
      const updated = products.map(p => {
        if (p.id === editingProductId) {
          return {
            ...p,
            title: title.trim(),
            slug: cleanSlug,
            description: description.trim(),
            price: Number(price) || 0,
            image: image.trim() || p.image,
            category: category,
            sizes: sizes.split(',').map(s => s.trim()).filter(Boolean),
            colors: colors.split(',').map(c => c.trim()).filter(Boolean),
          };
        }
        return p;
      });
      localStorage.setItem('raincoat_shop_products', JSON.stringify(updated));
      setProducts(updated);
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
    };

    const updated = [...products, newProduct];
    localStorage.setItem('raincoat_shop_products', JSON.stringify(updated));
    setProducts(updated);

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
  };

  const handleDeleteProduct = (id: string) => {
    if (userRole === 'ReadOnly') {
      alert('দুঃখিত! রিড-অনলি এক্সেস দিয়ে এটি ড্রপ করা সম্ভব নয়।');
      return;
    }

    if (!window.confirm('আপনি কি নিশ্চিতভাবে এই প্রোডাক্টটি চিরতরে ডিলিট করতে চান?')) return;

    const updated = products.filter(p => p.id !== id);
    localStorage.setItem('raincoat_shop_products', JSON.stringify(updated));
    setProducts(updated);
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

            <div>
              <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">ইমেজ লিংক (Unsplash/Direct Img Web Address)</label>
              <input 
                type="text" 
                placeholder="https://images.unsplash.com/..."
                className="w-full px-3 py-1.8 border rounded-lg focus:outline-none focus:border-indigo-500 text-slate-800 focus:bg-white text-xs bg-white"
                value={image}
                onChange={(e) => setImage(e.target.value)}
              />
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
