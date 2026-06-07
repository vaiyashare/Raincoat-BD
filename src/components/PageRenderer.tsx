import React from 'react';
import { CloudRain, Star, ShoppingBag, Eye, Heart, MessageSquare, ShieldCheck, Flame, Phone } from 'lucide-react';
import OrderForm from './OrderForm';
import ShopView from './ShopView';
import { RaincoatOrder } from '../types';

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

interface PageRendererProps {
  page: CustomPage;
  onOrderSuccess: (order: RaincoatOrder) => void;
}

export default function PageRenderer({ page, onOrderSuccess }: PageRendererProps) {
  const getEmbedUrl = (rawUrl: string) => {
    try {
      if (rawUrl.includes('youtube.com') || rawUrl.includes('youtu.be')) {
        let videoId = '';
        if (rawUrl.includes('v=')) {
          videoId = rawUrl.split('v=')[1].split('&')[0];
        } else {
          videoId = rawUrl.split('youtu.be/')[1].split('?')[0];
        }
        return `https://www.youtube.com/embed/${videoId}`;
      }
      if (rawUrl.includes('facebook.com')) {
        return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(rawUrl)}&show_text=false`;
      }
      return rawUrl;
    } catch (e) {
      return rawUrl;
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Dynamic Header */}
      <div className="bg-slate-900 text-white py-8 border-b border-slate-800 text-center font-sans">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">{page.title}</h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">ল্যান্ডিং পেজ লিঙ্ক: <code className="bg-slate-800 px-1.5 py-0.5 rounded text-orange-400 font-mono text-xs">{window.location.origin}/#{page.slug}</code></p>
        </div>
      </div>

      <div className="font-sans">
        {page.blocks.length === 0 ? (
          <div className="container mx-auto px-4 py-20 text-center max-w-xl space-y-4">
            <span className="text-4xl text-slate-350">📄</span>
            <h2 className="text-lg font-black text-slate-700">এই ল্যান্ডিং পেজে এখনো কোনো সেকশন যোগ করা হয়নি!</h2>
            <p className="text-xs text-slate-500">
              দয়া করে শীর্ষ ড্যাশবোর্ড বা অ্যাডমিন প্যানেল থেকে <strong>পেইজ এডিটর</strong> এ যান এবং এলিমেন্টরের মত দৃষ্টিনন্দন হেডিংস, ইমেজ, ভিডিও বা অর্ডার ফর্ম যোগ করুন।
            </p>
          </div>
        ) : (
          page.blocks.map((block) => {
            const alignClass = block.styles?.textAlign === 'center' ? 'text-center' : block.styles?.textAlign === 'right' ? 'text-right' : 'text-left';
            const paddingClass = block.styles?.padding === 'tall' ? 'py-12 sm:py-20 px-4' : block.styles?.padding === 'compact' ? 'py-4 px-4' : 'py-8 px-4';
            const colorStyle = block.styles?.color ? { color: block.styles.color } : undefined;
            const bgStyle = block.styles?.bgColor ? { backgroundColor: block.styles.bgColor } : undefined;

            switch (block.type) {
              case 'headline':
                return (
                  <div key={block.id} style={bgStyle} className={`${paddingClass}`}>
                    <div className="container mx-auto max-w-4xl">
                      <h2 
                        className={`font-black text-slate-900 leading-tight ${alignClass} ${
                          block.styles?.fontSize === 'sm' ? 'text-lg sm:text-xl' : 
                          block.styles?.fontSize === 'lg' ? 'text-3xl sm:text-5xl' : 
                          'text-2xl sm:text-3xl'
                        }`}
                        style={colorStyle}
                      >
                        {block.content}
                      </h2>
                    </div>
                  </div>
                );

              case 'text':
                return (
                  <div key={block.id} style={bgStyle} className={`${paddingClass}`}>
                    <div className="container mx-auto max-w-3xl">
                      <div 
                        className={`text-slate-700 text-sm sm:text-base leading-relaxed whitespace-pre-wrap ${alignClass}`}
                        style={colorStyle}
                      >
                        {block.content}
                      </div>
                    </div>
                  </div>
                );

              case 'image':
                return (
                  <div key={block.id} style={bgStyle} className={`${paddingClass}`}>
                    <div className="container mx-auto max-w-4xl">
                      <div className={`flex justify-center ${
                        block.styles?.textAlign === 'center' ? 'justify-center' : block.styles?.textAlign === 'right' ? 'justify-end' : 'justify-start'
                      }`}>
                        <img 
                          src={block.content || 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=800'} 
                          alt="custom landing design block" 
                          className="max-h-[500px] object-cover rounded-2xl shadow-md border border-slate-200"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    </div>
                  </div>
                );

              case 'video':
                return (
                  <div key={block.id} style={bgStyle} className={`${paddingClass}`}>
                    <div className="container mx-auto max-w-3xl">
                      <div className="aspect-[16/9] bg-slate-950 rounded-2xl overflow-hidden shadow-lg border border-slate-200">
                        <iframe 
                          src={getEmbedUrl(block.content)} 
                          width="100%" 
                          height="100%" 
                          style={{ border: 'none' }} 
                          allowFullScreen
                          referrerPolicy="no-referrer"
                          title="Landing iframe multimedia visual video"
                        />
                      </div>
                    </div>
                  </div>
                );

              case 'button':
                return (
                  <div key={block.id} style={bgStyle} className={`${paddingClass}`}>
                    <div className="container mx-auto max-w-3xl text-center">
                      <a 
                        href={block.content || '#checkout-form'}
                        className="inline-flex py-3.5 px-8 font-black bg-orange-500 hover:bg-orange-600 active:scale-97 text-white text-sm sm:text-base rounded-2xl transition duration-150 shadow-md shadow-orange-500/15"
                        style={colorStyle ? { backgroundColor: block.styles?.color } : undefined}
                      >
                        অর্ডার বুকিং বা লিংক এ যান
                      </a>
                    </div>
                  </div>
                );

              case 'form':
                return (
                  <div key={block.id} style={bgStyle} className={`${paddingClass} bg-slate-50`}>
                    <div className="container mx-auto max-w-4xl grid grid-cols-1 md:grid-cols-12 gap-8 items-center bg-white border border-slate-200/60 p-6 sm:p-10 rounded-3xl shadow-sm">
                      <div className="md:col-span-5 space-y-4">
                        <span className="px-3 py-1 bg-amber-50 text-amber-700 text-[10px] font-black rounded-full border border-amber-200 uppercase tracking-widest leading-none">ক্যাশ অন ক্যাশ ডেলিভারি</span>
                        <h3 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">ঝুঁকিমুক্ত উপায়ে ঘরে বসেই রেইনকোটটি বুঝে নিন!</h3>
                        <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                          কোনো অগ্রিম এক টাকাও দিতে হবে না। কুরিয়ারের পার্সেল হাতে পেয়ে কোয়ালিটি দেখে তারপর দাম পরিশোধ করুন।
                        </p>
                      </div>
                      <div className="md:col-span-7">
                        <OrderForm
                          initialSize="XXL"
                          selectedColor="Navy Blue"
                          onChangeSize={() => {}}
                          onChangeColor={() => {}}
                          onOrderSuccess={onOrderSuccess}
                        />
                      </div>
                    </div>
                  </div>
                );

              case 'shop':
                return (
                  <div key={block.id} className="bg-slate-100/50 py-12">
                    <ShopView onOrderSuccess={onOrderSuccess} />
                  </div>
                );

              default:
                return null;
            }
          })
        )}
      </div>
    </div>
  );
}
