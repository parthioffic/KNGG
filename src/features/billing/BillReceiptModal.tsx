import React, { useRef, useState } from 'react';
import { Bill } from '../../types/database.types';
import { BUSINESS_PROFILE } from '../../lib/constants';
import { formatDateTime } from '../../lib/formatters';
import { createWhatsAppBillUrl, formatWhatsAppBillText } from '../../lib/whatsappHelper';
import { exportElementToPdf } from '../../lib/pdfGenerator';
import { X, Printer, Share2, Copy, Check, Download, Loader2 } from 'lucide-react';

interface BillReceiptModalProps {
  bill: Bill;
  onClose: () => void;
}

export const BillReceiptModal: React.FC<BillReceiptModalProps> = ({ bill, onClose }) => {
  const [printLayout, setPrintLayout] = useState<'thermal' | 'standard'>('thermal');
  const [copied, setCopied] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);

  const totalQty =
    bill.items?.reduce((sum, item) => sum + (item.actual_quantity || item.estimated_quantity), 0) || 1;
  const effectiveRate =
    bill.items && bill.items.length === 1 ? bill.items[0].unit_price : bill.total_amount;

  const staffName = bill.billed_by_profile?.full_name || 'Viswanathan R';
  const staffPhone = bill.billed_by_profile?.phone || BUSINESS_PROFILE.primaryPhone;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    if (!receiptRef.current) return;
    try {
      setIsExportingPdf(true);
      await exportElementToPdf(
        receiptRef.current,
        `Bill_${bill.bill_number}`,
        printLayout === 'thermal'
      );
    } catch (err) {
      console.error('Failed to export PDF:', err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleWhatsApp = () => {
    const url = createWhatsAppBillUrl({
      customerPhone: bill.customer_phone,
      customerName: bill.customer_name,
      place: bill.place,
      date: formatDateTime(bill.created_at).split(' ')[0],
      totalQuantity: totalQty,
      rate: effectiveRate,
      totalAmount: bill.total_amount,
      advancePaid: bill.paid_amount,
      balanceAmount: bill.balance_amount,
      staffName,
      staffPhone,
    });
    window.open(url, '_blank');
  };

  const handleCopyText = () => {
    const text = formatWhatsAppBillText({
      customerPhone: bill.customer_phone,
      customerName: bill.customer_name,
      place: bill.place,
      date: formatDateTime(bill.created_at).split(' ')[0],
      totalQuantity: totalQty,
      rate: effectiveRate,
      totalAmount: bill.total_amount,
      advancePaid: bill.paid_amount,
      balanceAmount: bill.balance_amount,
      staffName,
      staffPhone,
    });

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Modal Controls Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50 no-print">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800 text-sm">Invoice Preview:</span>
            <span className="font-mono text-xs text-forest-800 font-bold bg-forest-50 px-2 py-0.5 rounded border border-forest-200">
              {bill.bill_number}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Layout Toggle */}
            <div className="flex bg-slate-200 p-0.5 rounded-lg text-xs">
              <button
                type="button"
                onClick={() => setPrintLayout('thermal')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  printLayout === 'thermal' ? 'bg-white text-forest-900 shadow-2xs' : 'text-slate-600'
                }`}
              >
                Thermal (80mm)
              </button>
              <button
                type="button"
                onClick={() => setPrintLayout('standard')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  printLayout === 'standard' ? 'bg-white text-forest-900 shadow-2xs' : 'text-slate-600'
                }`}
              >
                Standard (A4/A5)
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Receipt Body */}
        <div className="p-6 max-h-[70vh] overflow-y-auto bg-slate-100 flex justify-center">
          <div
            ref={receiptRef}
            className={`bg-white p-6 shadow-sm border border-slate-200 text-slate-900 font-sans transition-all ${
              printLayout === 'thermal' ? 'w-[320px] text-xs' : 'w-full max-w-md text-sm'
            }`}
          >
            {/* Header */}
            <div className="text-center pb-3 border-b-2 border-dashed border-slate-300">
              <div className="text-xl mb-1">🌱</div>
              <h2 className="font-extrabold text-base tracking-wide uppercase text-forest-900">
                {BUSINESS_PROFILE.name}
              </h2>
              <h3 className="font-bold text-sm font-tamil text-forest-800 mt-0.5">
                {BUSINESS_PROFILE.tamilName}
              </h3>
              <p className="text-[11px] text-slate-600 mt-1 leading-snug">
                📍 {BUSINESS_PROFILE.shortAddress}
              </p>
              <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                📞 {BUSINESS_PROFILE.phones.join(' / ')}
              </p>
            </div>

            {/* Bill Details */}
            <div className="py-2.5 border-b border-dashed border-slate-300 text-[11px] space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Bill No:</span>
                <span className="font-mono font-bold">{bill.bill_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Date:</span>
                <span className="font-mono">{formatDateTime(bill.created_at)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Customer:</span>
                <span className="font-semibold">{bill.customer_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Place:</span>
                <span>{bill.place}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Phone:</span>
                <span className="font-mono">{bill.customer_phone}</span>
              </div>
              {bill.bill_type === 'FUNCTION' && bill.function_date && (
                <div className="flex justify-between text-forest-800 font-medium">
                  <span>Function Date:</span>
                  <span>{formatDateTime(bill.function_date).split(' ')[0]}</span>
                </div>
              )}
            </div>

            {/* Items Table */}
            <div className="py-2.5 border-b-2 border-dashed border-slate-300">
              <p className="font-bold text-[11px] uppercase tracking-wider text-slate-500 mb-1.5">
                🌿 Order Details
              </p>
              <table className="w-full text-left text-[11px]">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="py-1">Item</th>
                    <th className="py-1 text-center">Qty</th>
                    <th className="py-1 text-right">Rate</th>
                    <th className="py-1 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {bill.items?.map((item, idx) => (
                    <tr key={item.id || idx}>
                      <td className="py-1 font-medium text-slate-800">
                        {item.plant_name}
                      </td>
                      <td className="py-1 text-center font-mono font-semibold">
                        {item.actual_quantity || item.estimated_quantity}
                      </td>
                      <td className="py-1 text-right font-mono">
                        ₹{item.unit_price.toFixed(2)}
                      </td>
                      <td className="py-1 text-right font-mono font-semibold">
                        ₹{item.total_price.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Financial Summary */}
            <div className="py-2.5 border-b-2 border-dashed border-slate-300 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-500">Subtotal:</span>
                <span className="font-mono font-medium">₹{bill.subtotal.toFixed(2)}</span>
              </div>
              {bill.discount_amount > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Discount:</span>
                  <span className="font-mono">-₹{bill.discount_amount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-xs pt-1 border-t border-slate-100">
                <span className="text-slate-900">Total Amount:</span>
                <span className="font-mono text-forest-900">₹{bill.total_amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-emerald-700 font-medium pt-1">
                <span>{bill.bill_type === 'FUNCTION' ? 'Advance Paid:' : 'Amount Paid:'}</span>
                <span className="font-mono">₹{bill.paid_amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-xs pt-0.5">
                <span className={bill.balance_amount > 0 ? 'text-red-600' : 'text-slate-700'}>
                  Balance Amount:
                </span>
                <span className={`font-mono ${bill.balance_amount > 0 ? 'text-red-600' : 'text-slate-700'}`}>
                  ₹{bill.balance_amount.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Billed By & Footer */}
            <div className="pt-3 text-center space-y-1 text-[10px] text-slate-600">
              <p className="font-medium text-slate-700">
                🧾 Billed By: <span className="font-semibold">{staffName}</span> (📞 {staffPhone})
              </p>
              <p className="font-tamil text-forest-800 font-medium pt-1">
                🙏 எங்களை தேர்ந்தெடுத்ததற்கு நன்றி! மீண்டும் வருக! 🌱
              </p>
              <p className="text-[9px] text-slate-400">Kalaiselvi Nursery Garden, Kutteripattu</p>
            </div>
          </div>
        </div>

        {/* Modal Actions Footer */}
        <div className="p-4 border-t border-slate-200 bg-white flex flex-wrap items-center justify-between gap-3 no-print">
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyText}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied Text!' : 'Copy Text'}</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <Printer className="w-4 h-4 text-forest-800" />
              <span>Print Bill</span>
            </button>
            <button
              onClick={handleDownloadPdf}
              disabled={isExportingPdf}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50"
            >
              {isExportingPdf ? (
                <Loader2 className="w-4 h-4 text-forest-800 animate-spin" />
              ) : (
                <Download className="w-4 h-4 text-forest-800" />
              )}
              <span>{isExportingPdf ? 'Exporting...' : 'PDF'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleWhatsApp}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-lg shadow-sm transition-colors"
            >
              <Share2 className="w-4 h-4" />
              <span>Share on WhatsApp</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
