import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar
} from 'recharts';
import { RaincoatOrder, IncompleteOrder } from '../../types';
import { TrendingUp, Award, Calendar, AlertCircle, Sparkles, Umbrella, ShoppingCart, HelpCircle } from 'lucide-react';

interface DailyOrdersChartProps {
  orders: RaincoatOrder[];
  incompleteOrders: IncompleteOrder[];
}

export default function DailyOrdersChart({ orders, incompleteOrders }: DailyOrdersChartProps) {
  const [timeframe, setTimeframe] = useState<7 | 14 | 30>(7);
  const [chartType, setChartType] = useState<'volume' | 'revenue'>('volume');

  // Process data for the charts
  const chartData = useMemo(() => {
    const result: { date: string; displayDate: string; completed: number; incomplete: number; sales: number }[] = [];
    const dateMap: { [key: string]: { completed: number; incomplete: number; sales: number } } = {};

    // Get current date and generate last N days
    const now = new Date();
    for (let i = timeframe - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = d.toISOString().split('T')[0]; // YYYY-MM-DD
      
      const day = d.getDate();
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const displayDate = `${day} ${monthNames[d.getMonth()]}`;
      
      dateMap[dateStr] = { completed: 0, incomplete: 0, sales: 0 };
      result.push({ date: dateStr, displayDate, completed: 0, incomplete: 0, sales: 0 });
    }

    // Populate completed orders
    orders.forEach(order => {
      if (!order.createdAt) return;
      try {
        const orderDate = new Date(order.createdAt).toISOString().split('T')[0];
        if (dateMap[orderDate]) {
          dateMap[orderDate].completed += 1;
          const priceNum = typeof order.price === 'string' ? parseInt(order.price) : order.price;
          if (!isNaN(priceNum)) {
            dateMap[orderDate].sales += priceNum;
          }
        }
      } catch (e) {
        console.warn("Error parsing completed order date:", e);
      }
    });

    // Populate incomplete orders
    incompleteOrders.forEach(inc => {
      if (!inc.createdAt) return;
      try {
        const incDate = new Date(inc.createdAt).toISOString().split('T')[0];
        if (dateMap[incDate]) {
          dateMap[incDate].incomplete += 1;
        }
      } catch (e) {
        console.warn("Error parsing incomplete order date:", e);
      }
    });

    // Map back to result list
    return result.map(item => {
      const counts = dateMap[item.date] || { completed: 0, incomplete: 0, sales: 0 };
      return {
        ...item,
        completed: counts.completed,
        incomplete: counts.incomplete,
        sales: counts.sales
      };
    });
  }, [orders, incompleteOrders, timeframe]);

  // Aggregate insights for the selected timeframe
  const insights = useMemo(() => {
    let totalCompleted = 0;
    let totalIncomplete = 0;
    let totalSales = 0;
    let peakDay = { date: 'N/A', count: 0 };
    let peakSalesDay = { date: 'N/A', amount: 0 };

    chartData.forEach(day => {
      totalCompleted += day.completed;
      totalIncomplete += day.incomplete;
      totalSales += day.sales;

      const totalActiveOnDay = day.completed + day.incomplete;
      if (totalActiveOnDay > peakDay.count) {
        peakDay = { date: day.displayDate, count: totalActiveOnDay };
      }

      if (day.sales > peakSalesDay.amount) {
        peakSalesDay = { date: day.displayDate, amount: day.sales };
      }
    });

    const conversionRate = totalCompleted + totalIncomplete > 0 
      ? Math.round((totalCompleted / (totalCompleted + totalIncomplete)) * 100) 
      : 0;

    const avgOrderValue = totalCompleted > 0 ? Math.round(totalSales / totalCompleted) : 0;

    // Detect general demand trend / mock intelligence feedback
    let demandAssessment = '';
    let demandColor = 'text-slate-700 bg-slate-50 border-slate-100';
    
    // Bangladesh rainy season is May to September
    const currentMonth = new Date().getMonth(); // 0-indexed, 4 = May, 8 = September
    const isRainySeason = currentMonth >= 4 && currentMonth <= 8;

    if (totalCompleted > 15) {
      demandAssessment = 'সর্বোচ্চ চাহিদা (Seasonal Peak): এই সময়ে রেইনকোটের চাহিদা সবথেকে বেশি থাকে। আপনার ফেইসবুক/টিকটক অ্যাড বাজেট বাড়িয়ে সেলস স্কেল করার উপযুক্ত সময়!';
      demandColor = 'text-emerald-800 bg-emerald-50/50 border-emerald-100';
    } else if (isRainySeason) {
      demandAssessment = 'বর্ষাকালীন উচ্চ চাহিদা সতর্কতা: বর্তমানে আষাঢ়/শ্রাবণ মাস হওয়ায় দেশজুড়ে বৃষ্টিপাতের ব্যাপক সম্ভাবনা রয়েছে। রেইনকোট ক্যাম্পেইন বাড়িয়ে কাস্টমার ড্রাইভ করুন।';
      demandColor = 'text-blue-800 bg-blue-50/50 border-blue-100';
    } else {
      demandAssessment = 'অফ-সিজন বা রানিং ক্যাম্পেইন: অফ-সিজনে সেলস ড্রাইভ করতে "সম্পূর্ণ ফ্রি ডেলিভারি" এবং এক্সক্লুসিভ ডিসকাউন্ট টেমপ্লেট দিয়ে ফাস্ট চেকআউট অফার সক্রিয় রাখুন।';
      demandColor = 'text-amber-800 bg-amber-50/50 border-amber-100';
    }

    return {
      totalCompleted,
      totalIncomplete,
      totalSales,
      peakDay,
      peakSalesDay,
      conversionRate,
      avgOrderValue,
      demandAssessment,
      demandColor
    };
  }, [chartData]);

  return (
    <div className="bg-slate-50 border border-slate-100/95 rounded-2xl p-5 shadow-sm space-y-4">
      {/* Title & Timeframe Selector */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-200/50 pb-3">
        <div>
          <h3 className="text-sm font-black text-slate-800 flex items-center gap-1.5 font-sans">
            <TrendingUp className="h-4.5 w-4.5 text-indigo-600" />
            📊 সেলস গ্রাফ ও ক্যাম্পেইন অ্যানালিটিক্স (Sales & Campaign Analytics)
          </h3>
          <p className="text-[10px] text-slate-400 font-medium">ক্যাম্পেইন পারফরম্যান্স এবং দৈনিক রেইনকোট চাহিদার রিয়েল-টাইম লাইভ ট্র্যাকিং</p>
        </div>
        
        <div className="flex items-center gap-1.5 bg-white border border-slate-200 p-1 rounded-xl self-end sm:self-auto shadow-xs">
          <button
            type="button"
            onClick={() => setTimeframe(7)}
            className={`px-3 py-1 text-[10px] font-extrabold rounded-lg transition-all cursor-pointer ${
              timeframe === 7
                ? 'bg-indigo-650 bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            গত ৭ দিন
          </button>
          <button
            type="button"
            onClick={() => setTimeframe(14)}
            className={`px-3 py-1 text-[10px] font-extrabold rounded-lg transition-all cursor-pointer ${
              timeframe === 14
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            গত ১৪ দিন
          </button>
          <button
            type="button"
            onClick={() => setTimeframe(30)}
            className={`px-3 py-1 text-[10px] font-extrabold rounded-lg transition-all cursor-pointer ${
              timeframe === 30
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            গত ৩০ দিন
          </button>
        </div>
      </div>

      {/* Analytics Insights Sub-Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3 bg-white border border-slate-200/70 rounded-xl">
          <span className="text-[9px] text-slate-400 font-bold block">সিলেক্টেড পিরিয়ড সেলস</span>
          <span className="text-base font-black text-slate-800 font-mono block mt-0.5">{insights.totalSales.toLocaleString()} TK</span>
          <div className="text-[8px] text-emerald-600 font-bold flex items-center gap-0.5 mt-1">
            <Sparkles className="h-2 w-2" />
            গড় ভ্যালু: {insights.avgOrderValue} TK
          </div>
        </div>
        <div className="p-3 bg-white border border-slate-200/70 rounded-xl">
          <span className="text-[9px] text-slate-400 font-bold block">কনভার্সন রেট (CR)</span>
          <span className="text-base font-black text-indigo-750 text-indigo-600 font-mono block mt-0.5">{insights.conversionRate}%</span>
          <span className="text-[8px] text-slate-500 font-medium block mt-1">ড্রাফট বনাম কনফার্মড অনুপাত</span>
        </div>
        <div className="p-3 bg-white border border-slate-200/70 rounded-xl">
          <span className="text-[9px] text-slate-400 font-bold block">সর্বোচ্চ অর্ডার দিন</span>
          <span className="text-xs font-black text-slate-800 font-sans block mt-1 truncate">{insights.peakDay.date}</span>
          <span className="text-[8px] text-slate-500 font-bold block mt-0.5 font-mono">দৈনিক পিক: {insights.peakDay.count} টি</span>
        </div>
        <div className="p-3 bg-white border border-slate-200/70 rounded-xl">
          <span className="text-[9px] text-slate-400 font-bold block">বিজ্ঞাপন/অ্যাড পিক রেভিনিউ</span>
          <span className="text-xs font-black text-emerald-605 text-emerald-600 font-sans block mt-1 truncate">{insights.peakSalesDay.date}</span>
          <span className="text-[8px] text-slate-500 font-bold block mt-0.5 font-mono">শীর্ষ রেভিনিউ: {insights.peakSalesDay.amount} TK</span>
        </div>
      </div>

      {/* Demand Warning Message Banner */}
      <div className={`p-2.5 rounded-xl border flex gap-2 items-start text-xs font-semibold leading-relaxed shadow-3xs ${insights.demandColor}`}>
        <Umbrella className="h-4.5 w-4.5 shrink-0 text-indigo-500 mt-0.5" />
        <div>{insights.demandAssessment}</div>
      </div>

      {/* Chart Settings and Chart Selection */}
      <div className="space-y-3">
        <div className="flex justify-between items-center bg-white/70 p-1.5 rounded-xl border border-slate-200/80">
          <span className="text-[10px] text-slate-500 font-extrabold px-1.5">গ্রাফ মোড:</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setChartType('volume')}
              className={`px-2.5 py-1 text-[9px] font-black rounded-lg cursor-pointer ${
                chartType === 'volume'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              📊 অর্ডার ভলিউম
            </button>
            <button
              onClick={() => setChartType('revenue')}
              className={`px-2.5 py-1 text-[9px] font-black rounded-lg cursor-pointer ${
                chartType === 'revenue'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              💰 দৈনিক রেভিনিউ (টাকা)
            </button>
          </div>
        </div>

        {/* Recharts Component Container */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 h-[260px] w-full shadow-3xs flex flex-col justify-center items-center">
          {chartData.length === 0 ? (
            <div className="text-center py-10">
              <AlertCircle className="h-8 w-8 text-slate-300 mx-auto mb-2 animate-bounce" />
              <p className="text-xs text-slate-400 font-bold">পর্যাপ্ত ডেটা পাওয়া যায়নি</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'volume' ? (
                <AreaChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorIncomplete" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="displayDate" 
                    tick={{ fill: '#64748b', fontSize: 9, fontWeight: 700 }}
                    axisLine={{ stroke: '#cbd5e1' }}
                    tickLine={{ stroke: '#cbd5e1' }}
                  />
                  <YAxis 
                    allowDecimals={false}
                    tick={{ fill: '#64748b', fontSize: 9, fontWeight: 700 }}
                    axisLine={{ stroke: '#cbd5e1' }}
                    tickLine={{ stroke: '#cbd5e1' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '12px',
                      border: 'none',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      color: '#f8fafc',
                      fontSize: '11px',
                      fontWeight: 800,
                      fontFamily: 'sans-serif'
                    }}
                    labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
                  />
                  <Legend 
                    verticalAlign="top" 
                    height={36} 
                    iconType="circle"
                    formatter={(value) => {
                      if (value === 'completed') return <span className="text-[10px] text-slate-800 font-extrabold font-sans">সফল অর্ডার (Completed)</span>;
                      if (value === 'incomplete') return <span className="text-[10px] text-slate-800 font-extrabold font-sans">ইনকমপ্লিট ড্রাফটস (Drafts)</span>;
                      return value;
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="completed"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorCompleted)"
                    activeDot={{ r: 5, strokeWidth: 0, fill: '#10b981' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="incomplete"
                    stroke="#f97316"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorIncomplete)"
                    activeDot={{ r: 5, strokeWidth: 0, fill: '#f97316' }}
                  />
                </AreaChart>
              ) : (
                <BarChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="displayDate" 
                    tick={{ fill: '#64748b', fontSize: 9, fontWeight: 700 }}
                    axisLine={{ stroke: '#cbd5e1' }}
                    tickLine={{ stroke: '#cbd5e1' }}
                  />
                  <YAxis 
                    tick={{ fill: '#64748b', fontSize: 9, fontWeight: 700 }}
                    axisLine={{ stroke: '#cbd5e1' }}
                    tickLine={{ stroke: '#cbd5e1' }}
                    tickFormatter={(val) => `${val >= 1000 ? (val / 1000) + 'K' : val}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '12px',
                      border: 'none',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      color: '#f8fafc',
                      fontSize: '11px',
                      fontWeight: 800,
                      fontFamily: 'sans-serif'
                    }}
                    labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
                    formatter={(value) => [`${value} TK`, 'দৈনিক রেভিনিউ']}
                  />
                  <Legend 
                    verticalAlign="top" 
                    height={36} 
                    iconType="rect"
                    formatter={() => <span className="text-[10px] text-slate-800 font-extrabold font-sans">মোট বিক্রি মূল্য (Sales Revenue)</span>}
                  />
                  <Bar
                    dataKey="sales"
                    fill="#4f46e5"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={35}
                  />
                </BarChart>
              )}
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
