import React, { useState, useEffect } from 'react';
import { 
  CloudRain, Star, ShoppingBag, Eye, Heart, MessageSquare, ShieldCheck, Flame, Phone,
  ChevronLeft, ChevronRight, Quote, Check, Info, HelpCircle
} from 'lucide-react';
import OrderForm from './OrderForm';
import ShopView from './ShopView';
import { RaincoatOrder, Size, ProductColor, PageBlock, CustomPage, CustomerReview } from '../types';
import { getCustomReviewsFromFirestore } from '../lib/firebase';

interface PageRendererProps {
  page: CustomPage;
  onOrderSuccess: (order: RaincoatOrder) => void;
}

export default function PageRenderer({ page, onOrderSuccess }: PageRendererProps) {
  const [selectedSize, setSelectedSize] = useState<Size | null>(null);
  const [selectedColor, setSelectedColor] = useState<ProductColor | null>(null);
  const [loadedReviews, setLoadedReviews] = useState<CustomerReview[]>([]);
  const [openAccordionId, setOpenAccordionId] = useState<string | null>(null);
  const [carouselIndices, setCarouselIndices] = useState<{[blockId: string]: number}>({});
  const [reviewIndices, setReviewIndices] = useState<{[blockId: string]: number}>({});

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const list = await getCustomReviewsFromFirestore();
        setLoadedReviews(list);
      } catch (err) {
        console.error('Error fetching reviews:', err);
      }
    };
    fetchReviews();
  }, []);

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
                if (!block.content || block.content.includes('unsplash.com')) {
                  return null;
                }
                return (
                  <div key={block.id} style={bgStyle} className={`${paddingClass}`}>
                    <div className="container mx-auto max-w-4xl">
                      <div className={`flex justify-center ${
                        block.styles?.textAlign === 'center' ? 'justify-center' : block.styles?.textAlign === 'right' ? 'justify-end' : 'justify-start'
                      }`}>
                        <img 
                          src={block.content} 
                          alt="custom landing design block" 
                          className="max-h-[500px] object-cover rounded-2xl shadow-md border border-slate-200"
                          referrerPolicy="no-referrer"
                          loading="lazy"
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

              case 'carousel':
                const imgList = block.carouselImages || [];
                const currentIdx = carouselIndices[block.id] || 0;
                
                const nextSlide = () => {
                  setCarouselIndices(prev => ({
                    ...prev,
                    [block.id]: (currentIdx + 1) % (imgList.length || 1)
                  }));
                };
                
                const prevSlide = () => {
                  setCarouselIndices(prev => ({
                    ...prev,
                    [block.id]: (currentIdx - 1 + imgList.length) % (imgList.length || 1)
                  }));
                };
                
                return (
                  <div key={block.id} style={bgStyle} className={`${paddingClass}`}>
                    <div className="container mx-auto max-w-4xl space-y-4">
                      {block.content && (
                        <h3 className={`font-black text-slate-900 ${alignClass} ${block.styles?.fontSize === 'lg' ? 'text-2xl sm:text-4xl' : 'text-xl sm:text-2xl'}`} style={colorStyle}>
                          {block.content}
                        </h3>
                      )}
                      
                      {imgList.length > 0 ? (
                        <div className="relative aspect-[16/9] sm:aspect-[21/9] rounded-3xl overflow-hidden shadow-sm border border-slate-100 group">
                          {/* Main Image slide */}
                          <img 
                            src={imgList[currentIdx]} 
                            alt={`Slide ${currentIdx + 1}`} 
                            className="w-full h-full object-cover transition-all duration-500 ease-in-out"
                            referrerPolicy="no-referrer"
                          />
                          
                          {/* Overlays / Indicators */}
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent pointer-events-none" />
                          
                          {/* Controls buttons */}
                          {imgList.length > 1 && (
                            <>
                              <button 
                                onClick={prevSlide}
                                className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/85 hover:bg-white text-slate-800 shadow-md cursor-pointer transition opacity-80 hover:opacity-100"
                                aria-label="Previous Slide"
                              >
                                <ChevronLeft className="h-5 w-5" />
                              </button>
                              <button 
                                onClick={nextSlide}
                                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/85 hover:bg-white text-slate-800 shadow-md cursor-pointer transition opacity-80 hover:opacity-100"
                                aria-label="Next Slide"
                              >
                                <ChevronRight className="h-5 w-5" />
                              </button>
                              
                              {/* Bullets indicators */}
                              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10">
                                {imgList.map((_, dotIdx) => (
                                  <button
                                    key={dotIdx}
                                    onClick={() => setCarouselIndices(prev => ({ ...prev, [block.id]: dotIdx }))}
                                    className={`h-2.5 rounded-full transition-all duration-300 ${dotIdx === currentIdx ? 'w-6 bg-orange-700' : 'w-2.5 bg-white/50 hover:bg-white'}`}
                                    aria-label={`Go to slide ${dotIdx + 1}`}
                                  />
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      ) : (
                        <div className="p-8 text-center bg-slate-50 border border-dashed rounded-xl italic text-slate-400">
                          (স্লাইডারে প্রদর্শনের জন্য পেজ এডিটর প্যানেল থেকে ছবিগুলো যোগ করুন)
                        </div>
                      )}
                    </div>
                  </div>
                );

              case 'icons':
                const features = block.items || [];
                return (
                  <div key={block.id} style={bgStyle} className={`${paddingClass}`}>
                    <div className="container mx-auto max-w-5xl space-y-6">
                      {block.content && (
                        <h3 className={`font-black text-slate-900 ${alignClass} ${block.styles?.fontSize === 'lg' ? 'text-2xl sm:text-4xl' : 'text-xl sm:text-2xl'}`} style={colorStyle}>
                          {block.content}
                        </h3>
                      )}
                      
                      {features.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          {features.map((item) => (
                            <div key={item.id} className="bg-white/80 backdrop-blur-xs border border-slate-100 p-6 rounded-3xl shadow-xs hover:shadow-md transition-shadow duration-300 space-y-3 text-left">
                              <div className="h-11 w-11 rounded-2xl bg-amber-50 border border-amber-200 text-2xl flex items-center justify-center shadow-2xs font-extrabold select-none">
                                {item.icon || '🛡️'}
                              </div>
                              <h4 className="text-base font-black text-slate-900 font-sans tracking-tight">
                                {item.title}
                              </h4>
                              {item.text && (
                                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-sans mt-1">
                                  {item.text}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-8 text-center bg-slate-50 border border-dashed rounded-xl italic text-slate-400">
                          (পেজ এডিটর প্যানেল থেকে ফিচার এবং আইকন সমূহ যুক্ত করুন)
                        </div>
                      )}
                    </div>
                  </div>
                );

              case 'dropdown':
                const opts = block.dropdownOptions || [];
                return (
                  <div key={block.id} style={bgStyle} className={`${paddingClass}`}>
                    <div className="container mx-auto max-w-3xl space-y-6">
                      {block.content && (
                        <h3 className={`font-black text-slate-900 ${alignClass} ${block.styles?.fontSize === 'lg' ? 'text-2xl sm:text-4xl' : 'text-xl sm:text-2xl'}`} style={colorStyle}>
                          {block.content}
                        </h3>
                      )}
                      
                      {opts.length > 0 ? (
                        <div className="space-y-3 text-left">
                          {opts.map((opt) => {
                            const isExpanded = openAccordionId === opt.id;
                            return (
                              <div 
                                key={opt.id} 
                                className="bg-white border rounded-2xl shadow-2xs overflow-hidden transition-all duration-200"
                                style={isExpanded ? { borderColor: '#14b8a6' } : { borderColor: '#f1f5f9' }}
                              >
                                <button
                                  onClick={() => setOpenAccordionId(isExpanded ? null : opt.id)}
                                  className="w-full text-left p-4 sm:p-5 font-bold font-sans text-sm text-slate-900 flex justify-between items-center hover:bg-slate-50/50 cursor-pointer"
                                >
                                  <span className="flex items-center gap-2">
                                    <HelpCircle className="h-4.5 w-4.5 text-teal-600 shrink-0" />
                                    {opt.label}
                                  </span>
                                  <ChevronRight className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
                                </button>
                                
                                {isExpanded && (
                                  <div className="p-4 sm:p-5 pt-0 border-t border-slate-50/60 bg-slate-50/20 text-xs sm:text-sm text-slate-600 leading-relaxed font-sans whitespace-pre-wrap">
                                    {opt.value}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="p-8 text-center bg-slate-50 border border-dashed rounded-xl italic text-slate-400">
                          (প্রশ্নোত্তর ড্রপডাউন প্রস্তুত করতে পেজ এডিটর থেকে ডাটা সাজান)
                        </div>
                      )}
                    </div>
                  </div>
                );

              case 'form':
                const formTitle = block.content || "ঝুঁকিমুক্ত উপায়ে ঘরে বসেই রেইনকোটটি বুঝে নিন!";
                return (
                  <div key={block.id} style={bgStyle} className={`${paddingClass}`} id="checkout-form">
                    <div className="container mx-auto max-w-4xl grid grid-cols-1 md:grid-cols-12 gap-8 items-center bg-white border border-slate-200/60 p-6 sm:p-10 rounded-3xl shadow-sm" style={colorStyle ? { color: block.styles?.color } : undefined}>
                      <div className="md:col-span-5 space-y-4 text-left">
                        <span className="px-3 py-1 bg-amber-50 text-amber-700 text-[10px] font-black rounded-full border border-amber-200 uppercase tracking-widest leading-none">ক্যাশ অন কুরিয়ার ডেলিভারি</span>
                        <h3 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight" style={colorStyle}>
                          {formTitle}
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-500 leading-relaxed" style={colorStyle ? { color: block.styles?.color, opacity: 0.8 } : undefined}>
                          কোনো অগ্রিম এক টাকাও দিতে হবে না। কুরিয়ারের পার্সেল হাতে পেয়ে কোয়ালিটি দেখে তারপর দাম পরিশোধ করুন।
                        </p>
                      </div>
                      <div className="md:col-span-7">
                        <OrderForm
                          initialSize={selectedSize}
                          selectedColor={selectedColor}
                          onChangeSize={setSelectedSize}
                          onChangeColor={setSelectedColor}
                          onOrderSuccess={onOrderSuccess}
                          customButtonText={block.customButtonText}
                          hideMetrics={block.hideMetrics}
                        />
                      </div>
                    </div>
                  </div>
                );

              case 'reviews-slider':
                const selectedRevIds = block.reviewIds || [];
                const matchedReviews = loadedReviews.filter(rev => selectedRevIds.includes(rev.id));
                const revIdx = reviewIndices[block.id] || 0;
                
                const nextRev = () => {
                  setReviewIndices(prev => ({
                    ...prev,
                    [block.id]: (revIdx + 1) % (matchedReviews.length || 1)
                  }));
                };
                
                const prevRev = () => {
                  setReviewIndices(prev => ({
                    ...prev,
                    [block.id]: (revIdx - 1 + matchedReviews.length) % (matchedReviews.length || 1)
                  }));
                };

                return (
                  <div key={block.id} style={bgStyle} className={`${paddingClass}`}>
                    <div className="container mx-auto max-w-3xl space-y-6">
                      {block.content && (
                        <h3 className={`font-black text-slate-900 ${alignClass} ${block.styles?.fontSize === 'lg' ? 'text-2xl sm:text-4xl' : 'text-xl sm:text-2xl'}`} style={colorStyle}>
                          {block.content}
                        </h3>
                      )}
                      
                      {matchedReviews.length > 0 ? (
                        <div className="relative bg-white border border-slate-100/80 rounded-3xl p-6 sm:p-10 shadow-xs text-center font-sans space-y-6">
                          <div className="absolute top-4 right-6 text-slate-100 opacity-60">
                            <Quote className="h-16 w-16" />
                          </div>
                          
                          {/* Active Review Rating */}
                          <div className="flex justify-center gap-1">
                            {Array.from({ length: matchedReviews[revIdx].stars }).map((_, starIdx) => (
                              <Star key={starIdx} className="h-4.5 w-4.5 fill-amber-400 text-amber-400" />
                            ))}
                          </div>
                          
                          {/* Comment block */}
                          <p className="text-sm sm:text-base text-slate-700 leading-relaxed italic max-w-2xl mx-auto font-sans">
                            "{matchedReviews[revIdx].comment}"
                          </p>
                          
                          {/* Signature reviewer metadata */}
                          <div className="flex flex-col items-center select-none">
                            {matchedReviews[revIdx].imageUrl ? (
                              <img 
                                src={matchedReviews[revIdx].imageUrl} 
                                alt={matchedReviews[revIdx].name} 
                                className="h-11 w-11 rounded-full object-cover border-2 border-indigo-100 shadow-2xs mb-2"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center font-extrabold text-xs text-slate-500 mb-2 font-sans border border-slate-200">
                                {matchedReviews[revIdx].name.substring(0, 2).toUpperCase()}
                              </div>
                            )}
                            <h4 className="text-sm font-extrabold text-slate-900 tracking-tight font-sans">{matchedReviews[revIdx].name}</h4>
                            <span className="text-[10px] text-slate-400 font-bold font-sans mt-0.5">{matchedReviews[revIdx].location}</span>
                          </div>
                          
                          {/* Slider pagination arrows */}
                          {matchedReviews.length > 1 && (
                            <div className="flex justify-center items-center gap-4 pt-2 select-none">
                              <button 
                                onClick={prevRev}
                                className="p-2 rounded-full border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-800 transition shadow-2xs cursor-pointer bg-white"
                                aria-label="Previous Review"
                              >
                                <ChevronLeft className="h-4 w-4" />
                              </button>
                              <span className="text-xs font-mono font-bold text-slate-400">{revIdx + 1} / {matchedReviews.length}</span>
                              <button 
                                onClick={nextRev}
                                className="p-2 rounded-full border border-slate-250 hover:bg-slate-50 text-slate-500 hover:text-slate-800 transition shadow-2xs cursor-pointer bg-white"
                                aria-label="Next Review"
                              >
                                <ChevronRight className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="p-8 text-center bg-slate-50 border border-dashed rounded-xl italic text-slate-400">
                          (স্লাইডারে প্রদর্শনের জন্য পেজ এডিটর থেকে কাস্টমার রিভিউ টিক চিহ্ন দিয়ে নির্বাচন করুন)
                        </div>
                      )}
                    </div>
                  </div>
                );

              case 'shop':
                return (
                  <div key={block.id} style={bgStyle} className={`${paddingClass}`}>
                    {block.content && (
                      <div className="container mx-auto max-w-4xl mb-8 text-center">
                        <h2 className="text-2xl sm:text-4xl font-black text-slate-900" style={colorStyle}>
                          {block.content}
                        </h2>
                      </div>
                    )}
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
