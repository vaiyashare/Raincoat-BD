import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, Droplets, RefreshCw, Truck, Heart, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface FAQItem {
  id: string;
  category: 'care' | 'exchange' | 'delivery' | 'quality';
  question: string;
  answer: string;
  icon: React.ReactNode;
}

export default function FAQSection() {
  const [openId, setOpenId] = useState<string | null>('care-1');
  const [activeTab, setActiveTab] = useState<'all' | 'care' | 'exchange' | 'delivery'>('all');

  const faqData: FAQItem[] = [
    {
      id: 'care-1',
      category: 'care',
      question: 'রেইনকোটটি কীভাবে পরিষ্কার করব এবং কীভাবে যত্ন নেব?',
      answer: 'আমাদের রেইনকোটটি প্রিমিয়াম ডাবল-লেয়ার পিভিসি ফেব্রিক্স ও ওয়াটারপ্রুফ কোটিং দ্বারা তৈরি। এটি ব্যবহারের পর যত্ন নেওয়া খুবই সহজ। ১) কোনোভাবেই ওয়াশিং মেশিনে ওয়াশ করবেন না। ২) ব্যবহারের পর কাদা লাগলে সাধারণ ঠান্ডা পানি ছিটিয়ে ধুয়ে ফেলুন। ৩) চিপবেন বা মুচড়াবেন না, পানি ঝরাতে ছায়াযুক্ত বাতাসে ঝুলিয়ে দিন। ৪) সরাসরি তীব্র রোদে বা ইস্ত্রি করবেন না, কারণ এতে ভেতরের হিট সিলিং নষ্ট হতে পারে।',
      icon: <Droplets className="h-4 w-4 text-sky-500" />
    },
    {
      id: 'exchange-1',
      category: 'exchange',
      question: 'ডেলিভারি পাওয়ার পর সাইজ বড় বা ছোট হলে কি পরিবর্তন বা এক্সচেঞ্জ করা যাবে?',
      answer: 'জি, শতভাগ নিশ্চিত থাকুন! আমরা কাস্টমার সন্তুষ্টির জন্য ৭ দিনের সহজ সাইজ এক্সচেঞ্জ সুবিধা প্রদান করি। রেইনকোটটি ব্যবহার না করে যদি দেখেন সাইজ মিলছে না, তাহলে আমাদের হেল্পলাইন নাম্বারে কল করুন বা হোয়াটসঅ্যাপে মেসেজ দিন। আমরা আপনার জন্য সঠিক সাইজের আরেকটি রেইনকোট এক্সচেঞ্জ করে পাঠিয়ে দেব। (এক্ষেত্রে শুধুমাত্র এক্সচেঞ্জ কুরিয়ার চার্জ টুকু প্রযোজ্য হবে)।',
      icon: <RefreshCw className="h-4 w-4 text-emerald-500" />
    },
    {
      id: 'delivery-1',
      category: 'delivery',
      question: 'ডেলিভারি পেতে কতদিন সময় লাগবে এবং প্রক্রিয়াটি কেমন?',
      answer: 'আপনার অর্ডার করার পর ১ কার্যদিবসের মধ্যে আমাদের কুরিয়ার টিম পার্সেল হ্যান্ডওভার দেয়। সাধারণত: ১) ঢাকা সিটির ভেতরে ১ থেকে ২ দিনের মধ্যে হোম ডেলিভারি পাবেন। ২) ঢাকার বাইরে জেলা ও থানা সদরে ২ থেকে ৩ দিন সময় লাগতে পারে। আমাদের সম্পূর্ণ ক্যাশ অন ডেলিভারি (COD) সুবিধা রয়েছে, তাই অগ্রিম এক টাকাও দিতে হবে না। প্রোডাক্ট বুঝে পেয়ে চেক করে মূল্য পে করবেন।',
      icon: <Truck className="h-4 w-4 text-orange-500" />
    },
    {
      id: 'quality-1',
      category: 'quality',
      question: 'রেইনকোটটি কি পুরোপুরি ওয়াটারপ্রুফ? ভারী বৃষ্টিতে কি ভিজে যাওয়ার ভয় আছে?',
      answer: 'আমাদের রেইনকোটগুলো ১০০% ওয়াটারপ্রুফ এবং লিক-প্রুফ। সাধারণ সস্তা রেইনকোটের মত আমরা কোনো সেলাইয়ে সুতো ব্যবহার করি না, বরং সব জয়েন্ট হাই-টেম্পারেচার থার্মাল হিট সিল করা। এ ছাড়া জিপারের ওপরে ডাবল পার্ট ওভারল্যাপ বোতাম রয়েছে, যা বাতাস এবং ঝড়ো বৃষ্টিতে বুক দিয়ে পানি ঢুকতে সম্পূর্ণ বাধা দেয়। তাই আপনি যত তীব্র ভারী বৃষ্টিতেই বাইক বা সাইকেল চালান না কেন, ভেতরের জামাকাপড় একদম শুকনো ও নিরাপদ থাকবে।',
      icon: <Shield className="h-4 w-4 text-purple-500" />
    },
    {
      id: 'care-2',
      category: 'care',
      question: 'রেইনকোটে স্যাঁতসেঁত ভাব বা দুর্গন্ধ হলে করনীয় কি?',
      answer: 'বৃষ্টিতে ভেজার পর রেইনকোটটি কখনো ব্যাগে বা ড্রয়ারে ভাজ করে ভিজা অবস্থায় রেখে দিবেন না। সর্বদা প্রতিটি রাইডের পর বাতাসে মেলে দিন যেন দ্রুত শুকিয়ে যায়। এতে কোনো স্যাঁতসেঁত গন্ধ বা ফাঙ্গাস তৈরি হবে না। যদি হালকা সাবান পানি দিতে চান, তবে অত্যন্ত মৃদু লিকুইড ডিটারজেন্ট ব্যবহার করতে পারেন এবং হাত দিয়ে আলতো করে ধুয়ে ফেলবেন।',
      icon: <Heart className="h-4 w-4 text-rose-500" />
    },
    {
      id: 'exchange-2',
      category: 'exchange',
      question: 'অর্ডার ক্যানসেল বা রিটার্ন পলিসি কি?',
      answer: 'যদি পার্সেলটি খোলার পর দেখেন কোনো ম্যানুফ্যাকচারিং ত্রুটি বা সমস্যা আছে, তাহলে ডেলিভারি ম্যান থাকা অবস্থায়ই আমাদের কল করুন বা পার্সেলটি সরাসরি রিটার্ন করে দিন। আমরা বিনা খরচে আপনাকে আরেকটি নতুন ফ্রেশ পিস পাঠিয়ে দেব। কাস্টমার সার্ভিস নিশ্চিত করাই আমাদের মূল গোল।',
      icon: <RefreshCw className="h-4 w-4 text-indigo-500" />
    }
  ];

  const filteredFaqs = activeTab === 'all' 
    ? faqData 
    : faqData.filter(item => item.category === activeTab);

  const toggleOpen = (id: string) => {
    setOpenId(openId === id ? null : id);
  };

  return (
    <section className="py-16 bg-slate-50 border-t border-slate-100" id="faq">
      <div className="container mx-auto px-4 max-w-4xl">
        
        {/* Section Header */}
        <div className="text-center space-y-3 mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full border border-blue-200 uppercase tracking-widest font-sans">
            <HelpCircle className="h-3 w-3 shrink-0" />
            <span>সচরাচর জিজ্ঞাসা (FAQ)</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-sans">
            যেকোনো কনফিউশন দূর করুন সহজেই
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto leading-relaxed font-sans">
            আমাদের প্রিমিয়াম রেইনকোটের যত্ন, সাইজ পরিবর্তন ও ফ্রি ডেলিভারি সম্পর্কীয় সাধারণ প্রশ্নাবলির সহজ উত্তর নিচে পেয়ে যাবেন।
          </p>
        </div>

        {/* Categories Tab Pill Bar */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition duration-150 cursor-pointer ${
              activeTab === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:text-slate-950 border border-slate-200'
            }`}
          >
            সবগুলো প্রশ্ন
          </button>
          <button
            onClick={() => setActiveTab('care')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition duration-150 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'care'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:text-slate-950 border border-slate-200'
            }`}
          >
            <Droplets className="h-3 w-3 shrink-0" />
            রেইনকোটের যত্ন
          </button>
          <button
            onClick={() => setActiveTab('exchange')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition duration-150 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'exchange'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:text-slate-950 border border-slate-200'
            }`}
          >
            <RefreshCw className="h-3 w-3 shrink-0" />
            সাইজ এক্সচেঞ্জ পলিসি
          </button>
          <button
            onClick={() => setActiveTab('delivery')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition duration-150 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'delivery'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:text-slate-950 border border-slate-200'
            }`}
          >
            <Truck className="h-3 w-3 shrink-0" />
            ডেলিভারি ও ক্যাশ অন ডেলিভারি
          </button>
        </div>

        {/* FAQ Accordion container */}
        <div className="space-y-4">
          {filteredFaqs.map((faq) => {
            const isOpen = openId === faq.id;
            return (
              <div 
                key={faq.id} 
                className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden ${
                  isOpen 
                    ? 'border-blue-300 shadow-sm shadow-blue-500/5' 
                    : 'border-slate-200/80 hover:border-slate-350 shadow-xs'
                }`}
                id={`faq-item-${faq.id}`}
              >
                {/* Header Switcher */}
                <button
                  onClick={() => toggleOpen(faq.id)}
                  className="w-full text-left py-4 sm:py-5 px-5 sm:px-6 flex items-center justify-between gap-4 font-sans cursor-pointer group focus:outline-none"
                >
                  <div className="flex items-center gap-3">
                    <span className="p-2 bg-slate-100 rounded-xl group-hover:bg-blue-50 group-hover:scale-105 transition-all shrink-0">
                      {faq.icon}
                    </span>
                    <span className="font-extrabold text-slate-900 text-sm sm:text-base leading-snug group-hover:text-blue-900 transition-colors">
                      {faq.question}
                    </span>
                  </div>
                  <span className="text-slate-400 shrink-0 p-1 rounded-lg hover:bg-slate-100">
                    {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                  </span>
                </button>

                {/* Animated Dropdown Body using motion */}
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.22, ease: "easeInOut" }}
                    >
                      <div className="border-t border-slate-100/80 bg-slate-50/50 py-4 px-6 sm:px-8 text-xs sm:text-sm text-slate-600 leading-relaxed font-sans whitespace-pre-line">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
