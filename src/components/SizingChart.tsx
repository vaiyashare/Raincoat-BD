import React, { useState, useEffect } from 'react';
import { Ruler, Sparkles, Scale, Info } from 'lucide-react';
import { SIZE_RECOMMENDATIONS, DETAILED_SIZE_CHART } from '../data';
import { Size } from '../types';

interface SizingChartProps {
  onSelectSize: (size: Size) => void;
  selectedSize: Size | null;
}

export default function SizingChart({ onSelectSize, selectedSize }: SizingChartProps) {
  const [weight, setWeight] = useState<number>(65);
  const [heightFeet, setHeightFeet] = useState<number>(5);
  const [heightInches, setHeightInches] = useState<number>(6);
  const [recommendedSize, setRecommendedSize] = useState<Size>('XXL');

  // React dynamic calculation of size based on weight and height
  useEffect(() => {
    let size: Size = 'XL';
    if (weight <= 60) {
      size = 'XL';
    } else if (weight <= 80) {
      size = 'XXL';
    } else if (weight <= 95) {
      size = '3XL';
    } else {
      size = '4XL';
    }
    setRecommendedSize(size);
    onSelectSize(size);
  }, [weight, heightFeet, heightInches]);

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-blue-50 overflow-hidden" id="sizing-tool">
      <div className="bg-blue-900 text-white p-4 sm:p-6 border-b border-blue-950">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="p-1.5 sm:p-2 bg-white/10 rounded-lg">
            <Ruler className="h-5 w-5 sm:h-6 sm:w-6 text-orange-200" />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-bold font-sans">সঠিক সাইজ ক্যালকুলেটর</h3>
            <p className="text-[10px] sm:text-xs text-blue-100 mt-0.5 sm:mt-1">আপনার ওজন ও উচ্চতা দিয়ে সেরা ফিটিং রেইনকোটটি খুঁজে নিন</p>
          </div>
        </div>
      </div>

      <div className="p-3 sm:p-6">
        {/* Input sliders */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-5 sm:mb-8">
          {/* Weight selector */}
          <div className="bg-slate-50 p-3 sm:p-4 rounded-xl border border-slate-100">
            <div className="flex justify-between items-center mb-1.5 sm:mb-2">
              <span className="text-xs sm:text-sm font-semibold text-slate-700 flex items-center gap-1 font-sans">
                <Scale className="h-4 w-4 text-blue-600" /> আপনার ওজন (Weight)
              </span>
              <span className="text-sm sm:text-lg font-bold text-blue-800 font-mono">{weight} কেজি (kg)</span>
            </div>
            <input
              type="range"
              min="45"
              max="115"
              value={weight}
              onChange={(e) => setWeight(parseInt(e.target.value))}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              id="weight-input"
            />
            <div className="flex justify-between text-[9px] sm:text-[10px] text-slate-450 mt-1 font-mono">
              <span>৪৫ কেজি</span>
              <span>৬০ কেজি</span>
              <span>৮ো কেজি</span>
              <span>১০০ কেজি</span>
              <span>১১৫ কেজি</span>
            </div>
          </div>

          {/* Height selector */}
          <div className="bg-slate-50 p-3 sm:p-4 rounded-xl border border-slate-100">
            <div className="flex justify-between items-center mb-1.5 sm:mb-2">
              <span className="text-xs sm:text-sm font-semibold text-slate-700 flex items-center gap-1 font-sans">
                <Ruler className="h-4 w-4 text-blue-600" /> আপনার উচ্চতা (Height)
              </span>
              <span className="text-sm sm:text-lg font-bold text-blue-800 font-mono">
                {heightFeet}’ {heightInches}”
              </span>
            </div>
            
            <div className="flex gap-2 sm:gap-4">
              <div className="flex-1">
                <select
                  value={heightFeet}
                  onChange={(e) => setHeightFeet(parseInt(e.target.value))}
                  className="w-full px-2 py-1.5 sm:px-3 sm:py-2 bg-white rounded-lg border border-slate-200 shadow-sm text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                  id="height-feet-select"
                >
                  {[5, 6].map((ft) => (
                    <option key={ft} value={ft}>{ft} ফুট</option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <select
                  value={heightInches}
                  onChange={(e) => setHeightInches(parseInt(e.target.value))}
                  className="w-full px-2 py-1.5 sm:px-3 sm:py-2 bg-white rounded-lg border border-slate-200 shadow-sm text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                  id="height-inches-select"
                >
                  {Array.from({ length: 12 }).map((_, inch) => (
                    <option key={inch} value={inch}>{inch} ইঞ্চি</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic recommendation card */}
        <div className="bg-orange-50/70 border border-orange-200 rounded-xl p-4 sm:p-5 mb-5 sm:mb-8 flex flex-col sm:flex-row items-center gap-3 sm:gap-4 justify-between">
          <div className="flex items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
            <div className="bg-orange-500 text-white rounded-full p-1.5 sm:p-2 animate-bounce shrink-0">
              <Sparkles className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
            </div>
            <div>
              <p className="text-[10px] sm:text-xs text-orange-850 font-bold font-sans">আপনার জন্য উপযুক্ত রেইনকোট সাইজ:</p>
              <h4 className="text-2xl sm:text-3xl font-extrabold text-blue-900 mt-0.5 sm:mt-1 font-mono flex items-baseline gap-1.5">
                {recommendedSize}
                <span className="text-xs sm:text-sm font-sans text-orange-700 font-bold">
                  ({SIZE_RECOMMENDATIONS.find((sr) => sr.size === recommendedSize)?.price} TK মাত্র)
                </span>
              </h4>
            </div>
          </div>
          <button
            onClick={() => onSelectSize(recommendedSize)}
            className="w-full sm:w-auto px-4 py-2 sm:px-5 sm:py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs sm:text-sm rounded-lg transition-all duration-300 shadow-sm flex items-center justify-center gap-1 bg-gradient-to-r from-blue-900 to-indigo-950 hover:from-blue-800 hover:to-indigo-900 focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer"
            id="apply-recommended-size"
          >
            অর্ডার ফর্মের জন্য সেভ করুন
          </button>
        </div>

        {/* Sizing Table */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-3">
            <h4 className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-1.5 font-sans">
              <Info className="h-4 w-4 text-indigo-500 shrink-0" /> বিস্তারিত সাইজ ও প্রাইস চার্ট (Size & price details)
            </h4>
            <span className="text-[9px] font-bold text-blue-600 bg-blue-50/80 border border-blue-100 px-2 py-0.5 rounded w-fit sm:hidden select-none animate-pulse">
              ← ডানে-বামে স্ক্রল করুন →
            </span>
          </div>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-xs sm:text-sm text-left text-slate-500 min-w-[280px]">
              <thead className="text-[10px] sm:text-[11px] uppercase bg-slate-100 text-slate-700 font-mono tracking-wider">
                <tr>
                  <th scope="col" className="px-1.5 sm:px-3 py-2 sm:py-3 font-sans text-left">পার্ট / সাইজ</th>
                  <th scope="col" className={`px-1 sm:px-2 py-2 sm:py-3 text-center ${recommendedSize === 'XL' ? 'bg-gradient-to-b from-blue-100 to-indigo-100 text-blue-900 font-extrabold border-x-2 border-indigo-200' : ''}`}>XL</th>
                  <th scope="col" className={`px-1 sm:px-2 py-2 sm:py-3 text-center ${recommendedSize === 'XXL' ? 'bg-gradient-to-b from-blue-100 to-indigo-100 text-blue-900 font-extrabold border-x-2 border-indigo-200' : ''}`}>XXL</th>
                  <th scope="col" className={`px-1 sm:px-2 py-2 sm:py-3 text-center ${recommendedSize === '3XL' ? 'bg-gradient-to-b from-blue-100 to-indigo-100 text-blue-900 font-extrabold border-x-2 border-indigo-200' : ''}`}>3XL</th>
                  <th scope="col" className={`px-1 sm:px-2 py-2 sm:py-3 text-center ${recommendedSize === '4XL' ? 'bg-gradient-to-b from-blue-100 to-indigo-100 text-blue-900 font-extrabold border-x-2 border-indigo-200' : ''}`}>4XL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {DETAILED_SIZE_CHART.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="px-1.5 sm:px-3 py-2 sm:py-2.5 font-semibold sm:font-medium text-slate-800 text-[11px] sm:text-xs font-sans whitespace-nowrap">{row.parameter}</td>
                    <td className={`px-1 sm:px-2 py-2 sm:py-2.5 text-center text-[11px] sm:text-xs text-slate-700 font-mono ${recommendedSize === 'XL' ? 'bg-indigo-50/50 text-blue-800 font-bold border-x border-indigo-200' : ''}`}>{row.xl}</td>
                    <td className={`px-1 sm:px-2 py-2 sm:py-2.5 text-center text-[11px] sm:text-xs text-slate-700 font-mono ${recommendedSize === 'XXL' ? 'bg-indigo-50/50 text-blue-800 font-bold border-x border-indigo-200' : ''}`}>{row.xxl}</td>
                    <td className={`px-1 sm:px-2 py-2 sm:py-2.5 text-center text-[11px] sm:text-xs text-slate-700 font-mono ${recommendedSize === '3XL' ? 'bg-indigo-50/50 text-blue-800 font-bold border-x border-indigo-200' : ''}`}>{row['3xl']}</td>
                    <td className={`px-1 sm:px-2 py-2 sm:py-2.5 text-center text-[11px] sm:text-xs text-slate-700 font-mono ${recommendedSize === '4XL' ? 'bg-indigo-50/50 text-blue-800 font-bold border-x border-indigo-200' : ''}`}>{row['4xl']}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[9px] sm:text-[10px] text-slate-400 mt-2 italic text-right font-sans">
            ** সমস্ত মাপ ইঞ্চিতে দেওয়া রয়েছে। ওজনের উপর ভিত্তি করে সাইজ নির্বাচন করা সবথেকে নির্ভরযোগ্য।
          </p>
        </div>
      </div>
    </div>
  );
}
