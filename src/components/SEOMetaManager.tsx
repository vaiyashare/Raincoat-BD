import React, { useEffect, useState } from 'react';
import { getSEOConfigs } from '../lib/firebase';
import { SEOConfig } from '../types';

interface SEOMetaManagerProps {
  currentPath: string;
  currentHash: string;
}

export default function SEOMetaManager({ currentPath, currentHash }: SEOMetaManagerProps) {
  const [seoConfigs, setSeoConfigs] = useState<SEOConfig[]>([]);

  // Fetch from Cloud Firestore on mount
  useEffect(() => {
    async function loadSEO() {
      try {
        const configs = await getSEOConfigs();
        setSeoConfigs(configs);
      } catch (err) {
        console.warn('Could not load SEO configurations:', err);
      }
    }
    loadSEO();

    window.addEventListener('raincoat_seo_updated', loadSEO);
    return () => {
      window.removeEventListener('raincoat_seo_updated', loadSEO);
    };
  }, []);

  useEffect(() => {
    // 1. Determine active path identifier
    let matchedPath = '/';

    if (currentPath === '/shop' || currentHash === '#/shop' || currentHash === '#shop') {
      matchedPath = '/shop';
    } else if (currentPath === '/raincoat' || currentHash === '#/raincoat' || currentHash === '#raincoat') {
      matchedPath = '/raincoat';
    } else if (currentPath === '/bikecover' || currentHash === '#/bikecover' || currentHash === '#bikecover') {
      matchedPath = '/bikecover';
    } else if (currentPath === '/rancoatcovercombo' || currentHash === '#/rancoatcovercombo' || currentHash === '#rancoatcovercombo') {
      matchedPath = '/rancoatcovercombo';
    } else if (currentPath.toLowerCase() === '/boxer' || currentHash.toLowerCase() === '#/boxer' || currentHash.toLowerCase() === '#boxer') {
      matchedPath = '/boxer';
    } else if (currentPath === '/track-order' || currentHash === '#/track-order' || currentHash === '#track-order') {
      matchedPath = '/track-order';
    } else if (currentPath === '/order-history' || currentHash === '#/order-history' || currentHash === '#order-history') {
      matchedPath = '/order-history';
    } else if (currentPath === '/cart' || currentHash === '#/cart' || currentHash === '#cart') {
      matchedPath = '/cart';
    } else if (currentPath === '/write-review' || currentHash === '#/write-review' || currentHash === '#write-review') {
      matchedPath = '/write-review';
    } else if (currentPath.startsWith('/product/') || currentHash.startsWith('#/product/')) {
      let slug = '';
      if (currentPath.startsWith('/product/')) {
        slug = currentPath.split('/product/')[1] || '';
      } else if (currentHash.startsWith('#/product/')) {
        slug = currentHash.split('#/product/')[1] || '';
      }
      slug = slug.split('?')[0];
      matchedPath = `/product/${slug}`;
    }

    // 2. Find config in SEO configurations or fall back to high-quality defaults
    const config = seoConfigs.find(
      c => c.path === matchedPath || c.id === matchedPath || (matchedPath === '/' && c.id === 'homepage')
    );

    // Default Fallbacks
    let title = 'প্রিমিয়াম রেইনকোট এবং মোটরসাইকেল কাভার স্টোর - Raincoat Factory';
    let description = '১০০% ওয়াটারপ্রুফ এবং থার্মাল হিট সিল করা প্রিমিয়াম রেইনকোট, ডাস্টপ্রুফ বাইক কাভার এবং গ্যাজেটস অর্ডার করুন ক্যাশ অন ডেলিভারিতে।';
    let keywords = 'raincoat, motorcycle cover, waterproof, bike accessories, Bangladesh';
    let ogImage = 'https://images.unsplash.com/photo-1534349762230-e0cadf78f5da?q=80&w=600&auto=format&fit=crop';
    let ogTitle = '';
    let ogDescription = '';

    // Route-specific fallback logic
    if (matchedPath === '/shop') {
      title = 'আমাদের শপ বাজার - সমস্ত কালেকশন | Raincoat Store';
      description = 'আমাদের শপ বাজার থেকে বাছাই করুন সেরা মানের রেইনকোট, জুতো কাভার, ডাবল ও উইন্ডপ্রুফ ছাতা এবং পানিনিরোধী মোবাইল হোল্ডার।';
      keywords = 'shop online, raincoat store, umbrella bd, rider accessories';
    } else if (matchedPath === '/raincoat') {
      title = '১০০% প্রিমিয়াম লাক্সারি রেইনকোট জ্যাকেট প্যান্ট | Raincoat Factory';
      description = 'বাইকিং এবং ট্রেকিং এর জন্য বিশেষ সিল কোটিং ওয়াটারপ্রুফ জ্যাকেট ও প্যান্ট কম্বো। সম্পূর্ণ ক্যাশ অন ডেলিভারি বাংলাদেশ জুড়ে।';
    } else if (matchedPath === '/bikecover') {
      title = 'আল্ট্রা-হেভি ডিউটি ১০০% ওয়াটারপ্রুফ প্রিমিয়াম বাইক কাভার';
      description = 'আপনার শখের মোটরবাইককে রোদ, বৃষ্টি, ধুলোবালি এবং স্ক্র্যাচ থেকে সুরক্ষিত রাখতে দ্বিগুণ টেকসই প্রিমিয়াম বাইক কাভার।';
    } else if (matchedPath === '/rancoatcovercombo') {
      title = 'বর্ষার ধামাকা স্পেশাল রেইনকোট ও বাইক কাভার সুপার কম্বো ডিল';
      description = 'রেইনকোট এবং বাইক কাভার একসাথে কিনলেই পাচ্ছেন অবিশ্বাস্য ছাড় এবং ফ্রি ডেলিভারি অফার!';
    } else if (matchedPath === '/boxer') {
      title = 'হিম-শীতল আরামদায়ক কটন বক্সার কম্বো অফার | ১০০০% প্রিমিয়াম সুতি';
      description = '১০০% সফট কম্বড সুতি কটন বক্সার ব্রিফ স্লিভ শর্টস কম্বো সেট। আরামদায়ক ও নিখুঁত ফিটিং গ্যারান্টি।';
    } else if (matchedPath.startsWith('/product/')) {
      const displaySlug = matchedPath.split('/product/')[1] || '';
      title = `${displaySlug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} - Raincoat Factory`;
      description = '১০০% উচ্চমানের থার্মাল কোটিং সিলড প্রটেকটিভ রাইডার পণ্য। দেখে নিন বিস্তারিত বর্ণনা ও আকর্ষণীয় মূল্যছাড়।';
    }

    // Apply database override values if present
    if (config) {
      if (config.title) title = config.title;
      if (config.description) description = config.description;
      if (config.keywords) keywords = config.keywords;
      if (config.ogImage) ogImage = config.ogImage;
      ogTitle = config.ogTitle || title;
      ogDescription = config.ogDescription || description;
    } else {
      ogTitle = title;
      ogDescription = description;
    }

    // 3. Document Head Updates
    document.title = title;

    // Helper functions for meta tags
    const setMetaTag = (nameAttr: string, valueAttr: string, content: string, isProperty = false) => {
      const attributeName = isProperty ? 'property' : 'name';
      let meta = document.querySelector(`meta[${attributeName}="${nameAttr}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attributeName, nameAttr);
        document.head.appendChild(meta);
      }
      meta.setAttribute(valueAttr, content);
    };

    // Apply primary search head headers
    setMetaTag('description', 'content', description);
    setMetaTag('keywords', 'content', keywords);

    // Apply share tags (OpenGraph & RankMath Compatibility)
    setMetaTag('og:title', 'content', ogTitle, true);
    setMetaTag('og:description', 'content', ogDescription, true);
    setMetaTag('og:image', 'content', ogImage, true);
    setMetaTag('og:type', 'content', 'website', true);
    setMetaTag('og:url', 'content', window.location.href, true);
    setMetaTag('twitter:card', 'content', 'summary_large_image');
    setMetaTag('twitter:title', 'content', ogTitle);
    setMetaTag('twitter:description', 'content', ogDescription);
    setMetaTag('twitter:image', 'content', ogImage);

  }, [currentPath, currentHash, seoConfigs]);

  return null; // pure headless/effects provider
}
