import React from 'react';
import { CheckCircle, Truck, PackageCheck, ClipboardCheck, ArrowRight, ShoppingBag, PhoneCall, Sparkles, Printer, FileDown, MessageSquare } from 'lucide-react';
import { RaincoatOrder } from '../types';
import { jsPDF } from 'jspdf';
import JsBarcode from 'jsbarcode';
import Barcode from './Barcode';

interface ReceiptProps {
  order: RaincoatOrder;
  onClose: () => void;
}

export default function Receipt({ order, onClose }: ReceiptProps) {
  // Format creation date
  const orderDateStr = new Date(order.createdAt).toLocaleDateString('bn-BD', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const handleDownloadPDF = () => {
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Colors
      const blueColor = [15, 23, 42]; // deep navy

      // Invoice Header Border & Box
      doc.setFillColor(15, 23, 42); // Navy Blue
      doc.rect(0, 0, 210, 38, 'F');

      // Title
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.text('PREMIUM RAINCOAT INVOICE', 14, 16);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(200, 255, 200);
      doc.text('HIGH QUALITY FULL-BODY COVER RAIN PROTECTION SET - ORDER CONFIRMED', 14, 23);
      doc.text('Customer Support: +8801624933949', 14, 29);

      // Invoice Stamp indicator on top right
      doc.setFillColor(249, 115, 22);
      doc.rect(155, 10, 41, 18, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text('COD SECURED', 158, 16);
      doc.setFontSize(7.5);
      doc.text('CASH ON DELIVERY', 158, 22);

      // Reset text styling
      doc.setTextColor(15, 23, 42);

      // Section 1: Order Meta Data
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('ORDER & CUSTOMER INFORMATION', 14, 50);
      
      // Line separator
      doc.setDrawColor(226, 232, 240);
      doc.line(14, 53, 196, 53);

      // Render barcode using canvas in-memory and add to jsPDF
      try {
        const canvas = document.createElement('canvas');
        // Clean to only customer phone digits as requested
        const cleanPhone = (order.phone || '').replace(/[^0-9]/g, '');
        if (cleanPhone) {
          // UCC/EAN-128 barcode format compatible standard CODE128
          JsBarcode(canvas, cleanPhone, {
            format: "CODE128",
            width: 3.5, // high crisp resolution
            height: 60,
            displayValue: true,
            text: order.phone, // Human-readable phone format underneath
            fontSize: 12,
            margin: 6
          });
          const barcodeImg = canvas.toDataURL('image/png');
          doc.addImage(barcodeImg, 'PNG', 145, 58, 48, 18);
        }
      } catch (err) {
        console.error('Failed to generate offline EAN-128 barcode for PDF invoice:', err);
      }

      let currentY = 60;
      const drawRow = (label: string, value: string) => {
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
        doc.setFontSize(9.5);
        doc.text(label, 14, currentY);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(51, 65, 85);
        // Split text to fit columns
        const splitVal = doc.splitTextToSize(value || '', 120);
        doc.text(splitVal, 70, currentY);
        currentY += (splitVal.length * 5) + 2;
      };

      drawRow('Order Reference:', `#${order.id.replace('ord-', '')}`);
      drawRow('Booking Date:', orderDateStr);
      drawRow('Customer Name:', order.name || '');
      drawRow('Mobile Phone:', order.phone || '');
      
      const fullAddress = [order.village, order.policeStation, order.district].filter(Boolean).join(', ');
      drawRow('Delivery Address:', fullAddress || '');

      // Product Specs Info
      currentY += 4;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text('PRODUCT SPECIFICATIONS', 14, currentY);
      doc.line(14, currentY + 3, 196, currentY + 3);
      currentY += 9;

      // Table Header Row background
      doc.setFillColor(241, 245, 249);
      doc.rect(14, currentY, 182, 8, 'F');
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);
      doc.setFont('helvetica', 'bold');
      doc.text('Product Item Description', 18, currentY + 5.5);
      doc.text('Color Theme', 95, currentY + 5.5);
      doc.text('Sizing', 135, currentY + 5.5);
      doc.text('Total Price', 165, currentY + 5.5);
      currentY += 13;

      // Product details Row values
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(51, 65, 85);
      doc.text('Premium Raincoat Set (Jacket + Pants with Hood)', 18, currentY);
      doc.text(order.color === 'Black' ? 'Premium Cosmic Black' : 'Classic Navy Blue', 95, currentY);
      doc.text(order.size, 135, currentY);
      
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(249, 115, 22); // Orange price
      doc.text(`${order.price} TK`, 165, currentY);

      // Border line for total calculations
      currentY += 6;
      doc.setDrawColor(226, 232, 240);
      doc.line(14, currentY, 196, currentY);
      currentY += 8;

      // Total info right aligned box
      doc.setFillColor(248, 250, 252);
      doc.rect(110, currentY, 86, 24, 'F');
      doc.setDrawColor(203, 213, 225);
      doc.rect(110, currentY, 86, 24, 'D');

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.setFontSize(8.5);
      doc.text('Price Subtotal:', 116, currentY + 6);
      doc.text(`${order.price} TK`, 165, currentY + 6);
      doc.text('Courier Shipping Fee:', 116, currentY + 11);
      doc.text('0 TK (FREE Delivery)', 155, currentY + 11);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(9.5);
      doc.text('Total Payable Cash:', 116, currentY + 18);
      doc.setTextColor(249, 115, 22);
      doc.text(`${order.price} TK`, 165, currentY + 18);

      // Support info and guidelines
      currentY += 34;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(15, 23, 42);
      doc.text('Next Steps & Direct Delivery Terms:', 14, currentY);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.2);
      doc.setTextColor(100, 116, 139);
      doc.text('1. Our support manager will call you within 12 hours from +8801624933949 to confirm details.', 14, currentY + 6);
      doc.text('2. Please keep your phone reachable. The delivery representative will call before handoff.', 14, currentY + 11);
      doc.text('3. You can inspect the materials at the delivery spot and check sizing before pay.', 14, currentY + 16);

      // Footer
      doc.setDrawColor(241, 245, 249);
      doc.line(14, 275, 196, 275);
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.text('Generated automatically on customer browser. Secure pre-sale document of Premium Raincoat Shop BD.', 14, 280);
      doc.text('Thank you for choosing us!', 158, 280);

      // Save PDF via user download prompt
      doc.save(`Invoice_Raincoat_${order.id.replace('ord-', '')}.pdf`);
    } catch (e) {
      console.error('Error generating PDF with jsPDF:', e);
      alert('PDF ডাউনলোড করতে কোনো সমস্যা হয়েছে! দয়া করে ইনভয়েস প্রিন্ট করুন অপশন থেকে PDF হিসেবে সেভ করুন।');
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-2xl border-4 border-blue-950 overflow-hidden max-w-lg mx-auto" id="order-receipt">
      {/* Decorative banner */}
      <div className="bg-gradient-to-br from-blue-900 to-indigo-950 text-white text-center p-8 relative">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-orange-400 to-orange-600"></div>
        <div className="mx-auto w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg border-2 border-emerald-400 mb-4 text-emerald-600 animate-bounce">
          <CheckCircle className="h-10 w-10 fill-current text-emerald-500" />
        </div>
        <span className="px-3 py-1 bg-white/20 text-white text-[11px] font-bold rounded-full uppercase tracking-wider font-sans">
          সফলভাবে অর্ডার সম্পূর্ণ হয়েছে!
        </span>
        <h2 className="text-2xl sm:text-3xl font-black font-sans mt-3 text-white">
          ধন্যবাদ, অর্ডার বুকড!
        </h2>
        <p className="text-blue-100 text-xs sm:text-sm mt-1.5 font-sans leading-relaxed">
          আপনার অর্ডারটি আমাদের সিস্টেমে সফলভাবে সংরক্ষিত করা হয়েছে। অত্যন্ত দ্রুত গতিতে আমাদের প্যাকেজিং টিম পণ্যটি কুরিয়ারে হস্তান্তর করবে।
        </p>
      </div>

      <div className="p-6 space-y-6">
        {/* Order detail grid */}
        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-slate-700 text-xs sm:text-sm space-y-2.5">
          <div className="flex justify-between items-center text-slate-400 text-[10px] sm:text-xs">
            <span className="uppercase font-mono font-bold">অর্ডার আইডি: {order.id}</span>
            <span className="font-sans">{orderDateStr}</span>
          </div>
          <div className="h-px bg-slate-200/60 my-1" />
          <div className="flex justify-between font-sans">
            <span className="text-slate-500 font-semibold">গ্রাহকের নাম:</span>
            <span className="font-bold text-slate-800">{order.name}</span>
          </div>
          <div className="flex justify-between font-sans">
            <span className="text-slate-500 font-semibold">মোবাইল নাম্বার:</span>
            <span className="font-mono text-slate-800 font-bold">{order.phone}</span>
          </div>
          <div className="flex justify-between font-sans">
            <span className="text-slate-500 font-semibold">ডেলিভারি ঠিকানা:</span>
            <span className="text-slate-800 text-right font-medium max-w-[60%]">
              {[order.village, order.policeStation, order.district].filter(Boolean).join(', ')}
            </span>
          </div>
          <div className="flex justify-between font-sans">
            <span className="text-slate-500 font-semibold">নির্বাচিত সাইজ ও কালার:</span>
            <span className="text-slate-800 font-bold flex items-center gap-1.5">
              <span className="bg-slate-200 px-1.5 py-0.5 rounded font-mono text-xs">{order.size}</span>
              <span className="text-xs">({order.color === 'Black' ? 'কালো' : 'নেভি ব্লু'})</span>
            </span>
          </div>
          <div className="flex justify-between font-sans">
            <span className="text-slate-500 font-semibold">ওজন ও উচ্চতা:</span>
            <span className="text-slate-800 font-medium">
              {order.weight} কেজি, {order.heightFeet}’{order.heightInches}”
            </span>
          </div>
          <div className="h-px bg-slate-200/60 my-1" />
          <div className="flex justify-between font-sans items-center text-blue-950">
            <span className="text-xs font-bold text-slate-700">পরিশোধযোগ্য সর্বমোট মূল্য:</span>
            <span className="text-xl font-mono font-extrabold text-blue-800">{order.price} TK (ক্যাশ অন ডেলিভারি)</span>
          </div>
          
          <div className="h-px bg-slate-200/60 my-1" />
          <div className="flex flex-col items-center justify-center p-3 bg-white border border-slate-200/90 rounded-2xl mt-4 space-y-1.5 shadow-2xs">
            <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">গ্রাহক বারকোড (ACTIVE EAN-128)</span>
            <Barcode value={order.phone} height={35} width={1.4} fontSize={10} />
          </div>
        </div>

        {/* Live shipment simulation banner */}
        <div>
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1 font-sans">
            <Sparkles className="h-3.5 w-3.5 text-blue-600" /> লাইভ শিপমেন্ট ট্র্যাকিং সিমুলেটর
          </h4>
          <div className="grid grid-cols-4 gap-2 relative">
            {/* Base line */}
            <div className="absolute top-5 left-8 right-8 h-1 bg-slate-100 -z-10"></div>
            {/* Active filled line */}
            <div className="absolute top-5 left-8 right-1/2 h-1 bg-gradient-to-r from-blue-600 to-orange-500 -z-10 transition-all duration-700"></div>

            {[
              { label: 'অর্ডার গৃহীত', icon: ClipboardCheck, color: 'text-blue-600 bg-blue-50 border-blue-300' },
              { label: 'প্যাকিং চলতেছে', icon: PackageCheck, color: 'text-orange-500 bg-orange-50 border-orange-300' },
              { label: 'কুরিয়ারে পথে', icon: Truck, color: 'text-slate-400 bg-slate-50 border-slate-200 animate-pulse' },
              { label: 'হাতে পেয়ে পেমেন্ট', icon: ShoppingBag, color: 'text-slate-300 bg-slate-50 border-slate-100' }
            ].map((step, idx) => {
              const Icon = step.icon;
              return (
                <div key={idx} className="flex flex-col items-center text-center">
                  <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center p-2 shadow-sm ${step.color} bg-white relative z-10`}>
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  <span className="text-[9px] font-sans font-bold text-slate-600 mt-2.5 leading-tight">{step.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* What next instructions */}
        <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 text-[11px] sm:text-xs leading-relaxed text-slate-700 font-sans space-y-1.5">
          <p className="font-bold text-blue-900">পরবর্তী ধাপসমূহ (What Next?):</p>
          <ul className="list-decimal pl-4 space-y-1 text-slate-600">
            <li>পরবর্তী ১২ ঘণ্টার মধ্যে আমাদের কাস্টমার সার্ভিসের একজন রিপ্রেজেন্টেটিভ আপনার মোবাইল নাম্বারে কল করে ঠিকানা কনফার্ম করবেন।</li>
            <li>কনফার্মেশনের মাত্র ৩ দিনের মধ্যে ডেলিভারি ম্যান আপনার বাড়িতে রেইনকোটটি পৌঁছে দেবে।</li>
            <li>পণ্যটি ট্রাই করে সম্পূর্ণ সন্তুষ্ট হলে তবেই টাকা পরিশোধ করুন।</li>
          </ul>
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-3 no-print">
          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href={`https://wa.me/8801624933949?text=${encodeURIComponent(`হ্যালো! আমি রেইনকোট অর্ডার করেছি। অর্ডার আইডি: ${order.id}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-3 px-3 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs sm:text-xs md:text-sm rounded-xl transition duration-300 shadow-md text-center hover:shadow-emerald-500/10 hover:shadow-lg font-sans flex items-center justify-center gap-1.5 cursor-pointer"
              id="order-more-button"
            >
              <MessageSquare className="h-4 w-4 shrink-0" /> কনফারমেশন স্ক্রিনশট whatsapp করুন
            </a>
            
            <a
              href="tel:+8801624933949"
              className="flex-1 py-3 px-4 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-bold text-sm rounded-xl transition duration-300 text-center font-sans flex items-center justify-center gap-1.5"
            >
              <PhoneCall className="h-4 w-4" /> সরাসরি কল করুন
            </a>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
            <button
              onClick={() => window.print()}
              className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 font-bold text-xs rounded-xl transition duration-300 text-center font-sans flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              id="print-invoice-button"
            >
              <Printer className="h-4 w-4 text-slate-600" /> ইনভয়েস প্রিন্ট করুন
            </button>
            <button
              onClick={handleDownloadPDF}
              className="py-2.5 px-4 bg-slate-900 hover:bg-slate-950 text-white font-black text-xs rounded-xl transition duration-300 text-center font-sans flex items-center justify-center gap-2 cursor-pointer shadow-md hover:shadow-lg"
              id="download-invoice-pdf-button"
            >
              <FileDown className="h-4 w-4 text-orange-400" /> PDF ডাউনলোড করুন
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
