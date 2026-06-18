import React, { useState, useMemo } from 'react';
import { 
  Truck, 
  Search, 
  ArrowUpDown, 
  Copy, 
  Check, 
  ArrowUpRight, 
  Filter, 
  FileSpreadsheet, 
  Layers, 
  Smartphone, 
  MapPin, 
  User, 
  Calendar, 
  Activity, 
  CheckCircle,
  Clock,
  XCircle,
  TruckIcon
} from 'lucide-react';
import { RaincoatOrder } from '../../types';

interface CourierMonitorAdminProps {
  orders: RaincoatOrder[];
}

type SortField = 'id' | 'createdAt' | 'name' | 'courierName' | 'trackingId' | 'status' | 'price';
type SortOrder = 'asc' | 'desc';

export default function CourierMonitorAdmin({ orders = [] }: CourierMonitorAdminProps) {
  // Sort states
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Search & Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all-active'); // 'all', 'all-active', 'Pending', 'Shipped', 'Delivered', 'Cancelled'
  const [courierFilter, setCourierFilter] = useState<string>('all'); // 'all', 'steadfast', 'pathao', 'redx', 'none'
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  // Filter orders
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      // 1. Status Filter
      if (statusFilter === 'all-active') {
        const isCancelled = order.status === 'Cancelled' || order.status === 'Canceled' || order.status === 'Canceled Fake Order';
        if (isCancelled) return false;
      } else if (statusFilter !== 'all') {
        if (order.status !== statusFilter) return false;
      }

      // 2. Courier Filter
      if (courierFilter !== 'all') {
        const courierLower = (order.courierName || '').toLowerCase();
        if (courierFilter === 'none') {
          if (order.courierName && order.courierName.trim().length > 0) return false;
        } else {
          if (!courierLower.includes(courierFilter)) return false;
        }
      }

      // 3. Search Term (Name, Phone, ID, tracking ID, district)
      if (searchTerm.trim() !== '') {
        const queryStr = searchTerm.toLowerCase();
        const nameMatch = (order.name || '').toLowerCase().includes(queryStr);
        const phoneMatch = (order.phone || '').includes(queryStr);
        const idMatch = (order.id || '').toLowerCase().includes(queryStr);
        const trackingMatch = (order.trackingId || '').toLowerCase().includes(queryStr);
        const districtMatch = (order.district || '').toLowerCase().includes(queryStr);

        if (!nameMatch && !phoneMatch && !idMatch && !trackingMatch && !districtMatch) {
          return false;
        }
      }

      return true;
    });
  }, [orders, statusFilter, courierFilter, searchTerm]);

  // Sort orders
  const sortedAndFilteredOrders = useMemo(() => {
    return [...filteredOrders].sort((a, b) => {
      let valA: any = a[sortField] || '';
      let valB: any = b[sortField] || '';

      if (sortField === 'createdAt') {
        valA = new Date(valA).getTime();
        valB = new Date(valB).getTime();
      } else if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = valB.toLowerCase();
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredOrders, sortField, sortOrder]);

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['Order ID', 'Date & Time', 'Customer Name', 'Phone Number', 'District', 'Courier Service', 'Consignment ID', 'Status', 'Price'];
    const rows = sortedAndFilteredOrders.map(order => [
      order.id,
      order.createdAt,
      order.name,
      order.phone,
      order.district || 'Not specified',
      order.courierName || 'Not selected',
      order.trackingId || 'N/A',
      order.status,
      `${order.price} TK`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val.replace(/"/g, '""')}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `courier_consignment_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadgeClass = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes('fail') || s.includes('cancel') || s.includes('fake')) {
      return 'bg-rose-50 text-rose-700 border border-rose-200/60';
    }
    if (s.includes('deliver')) {
      return 'bg-emerald-50 text-emerald-700 border border-emerald-200/60';
    }
    if (s.includes('ship') || s.includes('sent')) {
      return 'bg-blue-50 text-blue-700 border border-blue-200/60';
    }
    return 'bg-amber-50 text-amber-700 border border-amber-200/60';
  };

  const getCourierClass = (courierName?: string) => {
    if (!courierName) return 'text-slate-400 bg-slate-100 border border-slate-250';
    const name = courierName.toLowerCase();
    if (name.includes('steadfast')) return 'bg-orange-50 text-orange-700 border border-orange-200';
    if (name.includes('pathao')) return 'bg-lime-50 text-lime-800 border border-lime-200';
    if (name.includes('redx')) return 'bg-red-50 text-red-700 border border-red-200';
    return 'bg-indigo-50 text-indigo-700 border border-indigo-200';
  };

  const getStats = useMemo(() => {
    const total = orders.length;
    const withCourier = orders.filter(o => o.courierName && o.courierName.trim().length > 0).length;
    const withTracking = orders.filter(o => o.trackingId && o.trackingId.trim().length > 0).length;
    const activeAndAssigned = orders.filter(o => {
      const isCancelled = o.status === 'Cancelled' || o.status === 'Canceled' || o.status === 'Canceled Fake Order';
      return !isCancelled && o.trackingId;
    }).length;

    return { total, withCourier, withTracking, activeAndAssigned };
  }, [orders]);

  return (
    <div className="space-y-6 font-sans">
      {/* Header and Live Pulse */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-500/10 rounded-xl border border-indigo-400/20">
              <Truck className="h-6 w-6 text-indigo-400" />
            </span>
            <div>
              <h2 className="text-lg font-black tracking-tight text-white font-sans flex items-center gap-2">
                রিয়েল-টাইম কুরিয়ার ও ট্র্যাক মনিটর
              </h2>
              <p className="text-xs text-slate-400 font-sans mt-0.5">
                সকল একটিভ অর্ডারের ডেলিভারি পার্টনার, ট্র্যাকিং আইডি ও শিপমেন্ট স্টেটাস ট্র্যাকিং প্যানেল।
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-1.5 font-mono text-xs font-bold text-indigo-300 flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            REAL-TIME FEED: ACTIVE
          </div>
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-xs text-white font-bold rounded-xl flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
          >
            <FileSpreadsheet className="h-4 w-4" />
            CSV রিপোর্ট ডাউনলোড
          </button>
        </div>
      </div>

      {/* Mini Info Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="p-4 bg-slate-50 border border-slate-200/70 rounded-2xl flex flex-col justify-between">
          <span className="text-[10px] text-slate-500 font-extrabold uppercase block font-sans">মোট অর্ডার ডাটাবেস</span>
          <span className="text-2xl font-black text-slate-800 mt-2 font-mono flex items-baseline gap-1">
            {getStats.total} <span className="text-xs font-bold text-slate-400 font-sans">টি</span>
          </span>
          <span className="text-[10px] text-slate-400 font-bold block mt-1">সবোর্চ্চ রিয়েল-টাইম সিঙ্ক নিশ্চিত</span>
        </div>

        {/* Card 2 */}
        <div className="p-4 bg-orange-50 border border-orange-100 rounded-2xl flex flex-col justify-between">
          <span className="text-[10px] text-orange-600 font-extrabold uppercase block font-sans">কুরিয়ারে পাঠানো হয়েছে</span>
          <span className="text-2xl font-black text-orange-850 mt-2 font-mono flex items-baseline gap-1">
            {getStats.withCourier} <span className="text-xs font-bold text-orange-500 font-sans">টি</span>
          </span>
          <span className="text-[10px] text-orange-400 font-bold block mt-1">Steadfast/Pathao/RedX পার্টনার</span>
        </div>

        {/* Card 3 */}
        <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex flex-col justify-between">
          <span className="text-[10px] text-emerald-600 font-extrabold uppercase block font-sans">কনসাইনমেন্ট প্রাপ্ত (Consignment Key)</span>
          <span className="text-2xl font-black text-emerald-850 mt-2 font-mono flex items-baseline gap-1">
            {getStats.withTracking} <span className="text-xs font-bold text-emerald-500 font-sans">টি</span>
          </span>
          <span className="text-[10px] text-emerald-400 font-bold block mt-1 font-sans">ট্র্যাকিং নম্বর সম্বলিত</span>
        </div>

        {/* Card 4 */}
        <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl flex flex-col justify-between">
          <span className="text-[10px] text-indigo-600 font-extrabold uppercase block font-sans">এক্টিভ ট্র্যাকিং সিঙ্ক</span>
          <span className="text-2xl font-black text-indigo-850 mt-2 font-mono flex items-baseline gap-1">
            {getStats.activeAndAssigned} <span className="text-xs font-bold text-indigo-500 font-sans">টি</span>
          </span>
          <span className="text-[10px] text-indigo-400 font-bold block mt-1">বাতিল বহির্ভূত একটিভ পার্সেল</span>
        </div>
      </div>

      {/* Control filters & search */}
      <div className="p-4 bg-white border border-slate-200/80 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="নাম, ফোন, অর্ডার বা ট্র্যাকিং নম্বর খুঁজুন..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-sans text-slate-800 placeholder-slate-400"
          />
        </div>

        {/* Filter controls */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setStatusFilter('all-active')}
              className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                statusFilter === 'all-active' 
                  ? 'bg-white text-slate-800 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              এক্টিভ অর্ডার্স
            </button>
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                statusFilter === 'all' 
                  ? 'bg-white text-slate-800 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              সব (All)
            </button>
            <button
              onClick={() => setStatusFilter('Pending')}
              className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                statusFilter === 'Pending' 
                  ? 'bg-white text-slate-800 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              পেন্ডিং
            </button>
            <button
              onClick={() => setStatusFilter('Shipped')}
              className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                statusFilter === 'Shipped' 
                  ? 'bg-white text-slate-800 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              শিপড
            </button>
          </div>

          {/* Courier Filter */}
          <div className="relative">
            <select
              value={courierFilter}
              onChange={(e) => setCourierFilter(e.target.value)}
              className="appearance-none pl-3 pr-8 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="all">সব কুরিয়ার পার্টনার</option>
              <option value="steadfast">Steadfast কুরিয়ার</option>
              <option value="pathao">Pathao কুরিয়ার</option>
              <option value="redx">RedX কুরিয়ার</option>
              <option value="none">কুরিয়ার সিলেক্ট করা হয়নি</option>
            </select>
            <span className="absolute right-2 top-2.5 pointer-events-none text-slate-500">
              <Filter className="h-3 w-3" />
            </span>
          </div>
        </div>
      </div>

      {/* Main Sortable Table View */}
      <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-black uppercase text-slate-500 tracking-wider">
                <th 
                  onClick={() => handleSort('id')}
                  className="py-3 px-4 select-none cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <span className="flex items-center gap-1">
                    অর্ডার আইডি
                    <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
                  </span>
                </th>
                <th 
                  onClick={() => handleSort('createdAt')}
                  className="py-3 px-4 select-none cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <span className="flex items-center gap-1">
                    তারিখ ও সময়
                    <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
                  </span>
                </th>
                <th 
                  onClick={() => handleSort('name')}
                  className="py-3 px-4 select-none cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <span className="flex items-center gap-1">
                    গ্রাহকের বিবরণ
                    <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
                  </span>
                </th>
                <th 
                  onClick={() => handleSort('courierName')}
                  className="py-3 px-4 select-none cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <span className="flex items-center gap-1">
                    কুরিয়ার সার্ভিস
                    <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
                  </span>
                </th>
                <th 
                  onClick={() => handleSort('trackingId')}
                  className="py-3 px-4 select-none cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <span className="flex items-center gap-1">
                    কনসাইনমেন্ট / ট্র্যাকিং আইডি
                    <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
                  </span>
                </th>
                <th 
                  onClick={() => handleSort('status')}
                  className="py-3 px-4 select-none cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <span className="flex items-center gap-1">
                    ডেলিভারি স্থিতি
                    <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
                  </span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {sortedAndFilteredOrders.length > 0 ? (
                sortedAndFilteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/70 transition-colors group">
                    {/* ID Column */}
                    <td className="py-3.5 px-4 font-mono text-xs font-bold text-slate-900">
                      <div className="flex items-center gap-1.5">
                        <span>{order.id}</span>
                        <button
                          onClick={() => handleCopy(order.id, `id-${order.id}`)}
                          className="p-1 hover:bg-slate-200/80 rounded-lg text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                          title="Copy ID"
                        >
                          {copiedId === `id-${order.id}` ? (
                            <Check className="h-3 w-3 text-emerald-600" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </button>
                      </div>
                    </td>

                    {/* Date Column */}
                    <td className="py-3.5 px-4 text-xs font-medium text-slate-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-slate-400 inline shrink-0" />
                        <span>
                          {new Date(order.createdAt).toLocaleString('bn-BD', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </td>

                    {/* Customer Info */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs font-bold text-slate-800">{order.name}</span>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                          <span className="flex items-center gap-0.5">
                            <Smartphone className="h-3 w-3 text-slate-400" />
                            {order.phone}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-0.5 shrink-0 max-w-[120px] truncate">
                            <MapPin className="h-3 w-3 text-slate-400" />
                            {order.district || order.village || 'N/A'}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Courier Service Name */}
                    <td className="py-3.5 px-4 font-sans text-xs">
                      {order.courierName ? (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider bg-slate-105 border border-slate-200 max-w-full">
                          <span className={`w-1.5 h-1.5 rounded-full ${order.courierName.toLowerCase().includes('steadfast') ? 'bg-orange-500' : 'bg-indigo-600'}`}></span>
                          {order.courierName}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">সিলেক্ট করা হয়নি</span>
                      )}
                    </td>

                    {/* Consignment tracking ID */}
                    <td className="py-3.5 px-4">
                      {(order.consignmentId || order.trackingId) ? (
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-black text-slate-800 bg-slate-50 border border-slate-100 rounded-lg px-2 py-0.5">
                            {order.consignmentId || order.trackingId}
                          </span>
                          <button
                            onClick={() => handleCopy(order.consignmentId || order.trackingId || '', `track-${order.id}`)}
                            className="p-1 hover:bg-slate-200/80 rounded-lg text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                            title="Copy Consignment ID"
                          >
                            {copiedId === `track-${order.id}` ? (
                              <Check className="h-3 w-3 text-emerald-600" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </button>
                          {order.courierName?.toLowerCase().includes('steadfast') && (
                            <a
                              href={`https://steadfast.com.bd/tracking?id=${order.trackingId}`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-slate-200/85 rounded-lg transition-colors cursor-pointer inline-block"
                              title="Track Live"
                            >
                              <ArrowUpRight className="h-3.5 w-3.5" />
                            </a>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">জেনারেট করা হয়নি</span>
                      )}
                    </td>

                    {/* Order Status Badge */}
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex px-2 px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase rounded-full select-none ${getStatusBadgeClass(order.status)}`}>
                        {order.status === 'Pending' && '⏳ পেন্ডিং'}
                        {order.status === 'Shipped' && '🚚 শিপড'}
                        {order.status === 'Delivered' && '✅ ডেলিভারড'}
                        {(order.status === 'Cancelled' || order.status === 'Canceled') && '❌ বাতিল'}
                        {order.status === 'Canceled Fake Order' && '🛑 ফেক অর্ডার'}
                        {!['Pending', 'Shipped', 'Delivered', 'Cancelled', 'Canceled', 'Canceled Fake Order'].includes(order.status) && order.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 text-xs italic">
                    কোনো অর্ডার পাওয়া যায়নি। ফিল্টার পরিবর্তন করে পুনরায় চেষ্টা করুন।
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Dynamic Summary Stats Footer inside Table Card */}
        <div className="bg-slate-50 border-t border-slate-200/80 px-4 py-3.5 flex flex-col sm:flex-row justify-between items-center gap-3">
          <span className="text-[11px] font-medium text-slate-500 font-sans">
            ফিল্টার করা মোট প্রাপ্ত অর্ডার সংখ্যা: <strong className="text-slate-800 font-semibold">{sortedAndFilteredOrders.length} টি</strong>
          </span>
          <div className="flex items-center gap-1.5 text-[10px] font-black text-indigo-600/80 uppercase tracking-widest font-sans">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block"></span>
            সর্বশেষ আপডেট: জাস্ট নাউ
          </div>
        </div>
      </div>
    </div>
  );
}
