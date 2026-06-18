import React, { useState, useEffect } from 'react';
import { Menu as MenuIcon, X, LayoutGrid, ShoppingCart, ChevronDown, Phone, ArrowUpRight } from 'lucide-react';
import { getMenuBarConfigFromFirestore, MenuBarConfig } from '../lib/firebase';

interface MenuBarProps {
  onCategoryFilter?: (category: string) => void;
  brandName?: string;
  activeSection?: string;
}

export default function MenuBar({ onCategoryFilter, activeSection }: MenuBarProps) {
  const [config, setConfig] = useState<MenuBarConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);

  useEffect(() => {
    async function loadMenu() {
      try {
        const menuData = await getMenuBarConfigFromFirestore();
        setConfig(menuData);
      } catch (err) {
        console.error('Failed to load menu config', err);
      } finally {
        setLoading(false);
      }
    }
    loadMenu();

    // Listen for custom event when configuration changes in AdminPanel
    const handleUpdate = () => {
      loadMenu();
    };
    window.addEventListener('menu-bar-config-updated', handleUpdate);
    return () => {
      window.removeEventListener('menu-bar-config-updated', handleUpdate);
    };
  }, []);

  if (loading) {
    return (
      <div className="bg-slate-900 text-white py-4 px-6 flex justify-between items-center animate-pulse border-b border-slate-800">
        <div className="h-6 w-32 bg-slate-850 rounded"></div>
        <div className="hidden md:flex gap-6">
          <div className="h-4 w-16 bg-slate-850 rounded"></div>
          <div className="h-4 w-16 bg-slate-850 rounded"></div>
          <div className="h-4 w-16 bg-slate-850 rounded"></div>
        </div>
        <div className="h-8 w-8 bg-slate-850 rounded-full"></div>
      </div>
    );
  }

  if (!config || !config.visible) {
    return null;
  }

  const handleLinkClick = (url: string, e: React.MouseEvent) => {
    setMobileMenuOpen(false);
    if (url.startsWith('#')) {
      e.preventDefault();
      const targetId = url.substring(1);
      const targetElement = document.getElementById(targetId);
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        // Update URL hash without jumping
        window.history.pushState(null, '', url);
      } else {
        // If the target element is somewhere on the other page, go there
        window.location.hash = url;
      }
    } else {
      // If there is an external page path, handle normally
      if (url.startsWith('https://') || url.startsWith('http://')) {
        window.open(url, '_blank');
      } else {
        window.location.hash = url;
      }
    }
  };

  const categories = [
    { name: 'রেইনকোট (Raincoat)', filterVal: 'রেইনকোট', anchor: '#checkout-form' },
    { name: 'বাইকিং গিয়ার ও কভার (Bike Cover)', filterVal: 'বাইকিং গিয়ার', anchor: 'bikecover' },
    { name: 'অন্যান্য অনুষঙ্গ (Accessories)', filterVal: 'অনুষঙ্গ', anchor: '#checkout-form' }
  ];

  const handleCategoryClick = (cat: typeof categories[0]) => {
    setCategoriesOpen(false);
    setMobileMenuOpen(false);
    
    if (onCategoryFilter) {
      onCategoryFilter(cat.filterVal);
    }

    if (cat.anchor === 'bikecover') {
      window.location.hash = '#/bikecover';
    } else {
      // Scroll to checkout or shop-view
      const checkoutForm = document.getElementById('checkout-form');
      if (checkoutForm) {
        checkoutForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  return (
    <div className="sticky top-0 bg-slate-900/95 backdrop-blur-md text-white border-b border-slate-800 z-50 shadow-md font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand/Shop Name Logo */}
          <div className="flex-shrink-0 flex items-center">
            <a href="#home" className="flex items-center gap-2 text-lg sm:text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-[#00e3cd] to-rose-400 hover:opacity-95 transition">
              <ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6 text-orange-400 animate-bounce" />
              <span>{config.brandName || 'PREMIUM SHOP'}</span>
            </a>
          </div>

          {/* Desktop Links Navigation */}
          <div className="hidden md:flex items-center space-x-1 lg:space-x-4">
            {config.links.map((link, idx) => (
              <a
                key={idx}
                href={link.url}
                onClick={(e) => handleLinkClick(link.url, e)}
                className={`px-3 py-2 rounded-lg text-sm font-semibold transition duration-150 ease-in-out cursor-pointer ${
                  activeSection === link.url.substring(1)
                    ? 'bg-slate-800 text-[#00e3cd]'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                {link.text}
              </a>
            ))}

            {/* Categories Action Dropdown */}
            {config.enableCategories && (
              <div className="relative">
                <button
                  onClick={() => setCategoriesOpen(!categoriesOpen)}
                  onBlur={() => setTimeout(() => setCategoriesOpen(false), 200)}
                  className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-bold bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white rounded-md shadow-xs active:scale-95 transition cursor-pointer"
                >
                  <LayoutGrid className="h-4 w-4" />
                  <span>ক্যাটাগরি সমূহ</span>
                  <ChevronDown className={`h-3 w-3 transition ${categoriesOpen ? 'rotate-180' : ''}`} />
                </button>

                {categoriesOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-slate-950 border border-slate-800 rounded-xl shadow-2xl py-2 z-50 animate-fade-in">
                    <div className="px-3 py-1 text-[10px] uppercase font-black tracking-wider text-slate-500 border-b border-slate-900 mb-1">
                      পণ্য ক্যাটাগরি ফিল্টার করুন
                    </div>
                    {categories.map((cat, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleCategoryClick(cat)}
                        className="w-full text-left px-4 py-2.5 text-sm font-semibold text-slate-300 hover:bg-slate-850 hover:text-cyan-300 transition duration-150 flex items-center justify-between"
                      >
                        <span>{cat.name}</span>
                        <ArrowUpRight className="h-3 w-3 opacity-50" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mobile Categories Shortcut & Hamburger Menu */}
          <div className="flex md:hidden items-center gap-2">
            {config.enableCategories && (
              <button
                onClick={() => setCategoriesOpen(!categoriesOpen)}
                onBlur={() => setTimeout(() => setCategoriesOpen(false), 200)}
                className="p-2 bg-slate-800 rounded-lg text-amber-400 active:scale-95 transition text-xs font-bold flex items-center gap-1"
                title="Categories"
              >
                <LayoutGrid className="h-4 w-4" />
                <span>ক্যাটাগরি</span>
              </button>
            )}

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-hidden active:scale-95 transition"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Floating mobile categories list dropdown */}
      {categoriesOpen && (
        <div className="md:hidden border-t border-slate-850 bg-slate-950 px-4 py-3 shadow-2xl absolute left-0 right-0 z-50">
          <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-2">ক্যাটাগরি সমূহ</p>
          <div className="space-y-1">
            {categories.map((cat, idx) => (
              <button
                key={idx}
                onClick={() => handleCategoryClick(cat)}
                className="w-full text-left py-2 px-3 text-sm font-semibold text-slate-300 hover:bg-slate-900 rounded-lg flex items-center justify-between"
              >
                <span>{cat.name}</span>
                <span className="text-xs text-amber-500">দেখুন ➔</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-850 bg-slate-900/98 backdrop-blur-lg px-2 pt-2 pb-4 space-y-1 shadow-inner">
          {config.links.map((link, idx) => (
            <a
              key={idx}
              href={link.url}
              onClick={(e) => handleLinkClick(link.url, e)}
              className={`block px-4 py-3 rounded-xl text-base font-bold transition ${
                activeSection === link.url.substring(1)
                  ? 'bg-slate-800 text-[#00e3cd]'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              {link.text}
            </a>
          ))}
          <div className="pt-2 px-4 border-t border-slate-800">
            <a
              href="tel:01700000000"
              className="flex items-center justify-center gap-2 w-full py-3 bg-slate-800/80 text-cyan-400 rounded-xl text-sm font-bold shadow-xs"
            >
              <Phone className="h-4 w-4 animate-pulse" />
              <span>কল করুন সাহায্য পেতে</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
