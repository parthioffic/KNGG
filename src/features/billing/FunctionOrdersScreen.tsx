import React, { useState } from 'react';
import { dataService } from '../../services/dataService';
import { Bill } from '../../types/database.types';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { FunctionBookingModal } from './FunctionBookingModal';
import { FunctionCompletionModal } from './FunctionCompletionModal';
import { BillReceiptModal } from './BillReceiptModal';
import { formatCurrency, formatDate } from '../../lib/formatters';
import { createWhatsAppBillUrl } from '../../lib/whatsappHelper';
import {
  CalendarDays,
  PlusCircle,
  Search,
  CheckCircle,
  Printer,
  Share2,
  Clock,
} from 'lucide-react';

export const FunctionOrdersScreen: React.FC = () => {
  const [bills, setBills] = useState<Bill[]>(() =>
    dataService.getBills().filter((b) => b.bill_type === 'FUNCTION')
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modals
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [completingBill, setCompletingBill] = useState<Bill | null>(null);
  const [receiptBill, setReceiptBill] = useState<Bill | null>(null);

  const reloadBills = () => {
    setBills(dataService.getBills().filter((b) => b.bill_type === 'FUNCTION'));
  };

  const filteredBills = bills.filter((b) => {
    const matchesSearch =
      b.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.customer_phone.includes(searchQuery) ||
      b.place.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.bill_number.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleWhatsApp = (bill: Bill) => {
    const totalQty =
      bill.items?.reduce((sum, item) => sum + (item.actual_quantity || item.estimated_quantity), 0) || 1;
    const effectiveRate =
      bill.items && bill.items.length === 1 ? bill.items[0].unit_price : bill.total_amount;

    const url = createWhatsAppBillUrl({
      customerPhone: bill.customer_phone,
      customerName: bill.customer_name,
      place: bill.place,
      date: formatDate(bill.created_at),
      totalQuantity: totalQty,
      rate: effectiveRate,
      totalAmount: bill.total_amount,
      advancePaid: bill.paid_amount,
      balanceAmount: bill.balance_amount,
      staffName: bill.billed_by_profile?.full_name || 'Staff',
      staffPhone: bill.billed_by_profile?.phone || '9488782488',
    });

    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-purple-700" />
            Function & Event Orders (விழா ஆர்டர்கள்)
          </h2>
          <p className="text-xs text-slate-500 font-tamil mt-0.5">
            முன்பதிவு, உத்தேச விபரம், மற்றும் நிகழ்வுக்குப் பின் இறுதி சரிபார்ப்பு
          </p>
        </div>

        <button
          onClick={() => setIsBookingModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-forest-800 hover:bg-forest-900 text-white font-semibold text-sm rounded-lg shadow-sm transition-colors"
        >
          <PlusCircle className="w-4 h-4" />
          <span>+ Book New Function Order</span>
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search by customer name, phone, place, or bill number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs px-3 py-2 pl-9 border border-slate-300 rounded-lg focus:ring-1 focus:ring-forest-800 focus:outline-none"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        <div className="flex items-center gap-2">
          {['ALL', 'CONFIRMED', 'COMPLETED', 'CANCELLED'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                statusFilter === status
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Function Orders Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredBills.map((bill) => {
          const isPendingCompletion = bill.status === 'CONFIRMED';
          return (
            <div
              key={bill.id}
              className={`bg-white rounded-xl border p-5 shadow-xs flex flex-col justify-between transition-all ${
                isPendingCompletion ? 'border-purple-200 hover:border-purple-400' : 'border-slate-200'
              }`}
            >
              <div>
                <div className="flex items-start justify-between">
                  <span className="font-mono text-xs font-bold text-forest-800 bg-forest-50 px-2 py-0.5 rounded border border-forest-200">
                    {bill.bill_number}
                  </span>
                  <StatusBadge status={bill.status} />
                </div>

                <div className="mt-3">
                  <h3 className="font-bold text-slate-900 text-sm">{bill.customer_name}</h3>
                  <p className="text-xs text-slate-500 font-mono">
                    📍 {bill.place} • 📞 {bill.customer_phone}
                  </p>

                  <div className="mt-2.5 p-2 bg-slate-50 rounded-lg text-xs space-y-1">
                    <div className="flex items-center gap-1.5 text-purple-900 font-semibold">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Event Date: {formatDate(bill.function_date)}</span>
                    </div>
                    {bill.function_description && (
                      <p className="text-slate-600 italic line-clamp-2">
                        "{bill.function_description}"
                      </p>
                    )}
                  </div>

                  {/* Items Summary */}
                  <div className="mt-2.5 text-xs text-slate-600">
                    <p className="font-semibold text-slate-700">Estimated Items:</p>
                    <ul className="list-disc list-inside text-[11px] text-slate-500 mt-0.5 space-y-0.5">
                      {bill.items?.slice(0, 3).map((item, idx) => (
                        <li key={idx}>
                          {item.plant_name} — {item.actual_quantity || item.estimated_quantity} pots @ ₹
                          {item.unit_price}
                        </li>
                      ))}
                      {(bill.items?.length || 0) > 3 && (
                        <li className="italic">+ {bill.items!.length - 3} more plant varieties</li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Bottom Financials & Action Buttons */}
              <div className="mt-4 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between text-xs mb-3">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">
                      {bill.status === 'COMPLETED' ? 'Final Total' : 'Estimated Total'}
                    </span>
                    <span className="font-mono font-bold text-slate-900 text-sm">
                      {formatCurrency(bill.total_amount)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 block text-[10px] uppercase">
                      Advance / Paid
                    </span>
                    <span className="font-mono font-semibold text-emerald-700">
                      {formatCurrency(bill.paid_amount)}
                    </span>
                  </div>
                  {bill.balance_amount > 0 && (
                    <div className="text-right">
                      <span className="text-slate-400 block text-[10px] uppercase">Balance</span>
                      <span className="font-mono font-bold text-red-600">
                        {formatCurrency(bill.balance_amount)}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {isPendingCompletion ? (
                    <button
                      onClick={() => setCompletingBill(bill)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs rounded-lg shadow-2xs transition-colors"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Complete & Deduct Stock</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => setReceiptBill(bill)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-lg transition-colors"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>View Receipt</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleWhatsApp(bill)}
                    title="Send WhatsApp Bill"
                    className="p-2 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Booking Modal */}
      {isBookingModalOpen && (
        <FunctionBookingModal
          isOpen={isBookingModalOpen}
          onClose={() => setIsBookingModalOpen(false)}
          onSuccess={(newBill) => {
            setIsBookingModalOpen(false);
            reloadBills();
            setReceiptBill(newBill);
          }}
        />
      )}

      {/* Completion Modal */}
      {completingBill && (
        <FunctionCompletionModal
          bill={completingBill}
          isOpen={Boolean(completingBill)}
          onClose={() => setCompletingBill(null)}
          onSuccess={(completedBill) => {
            setCompletingBill(null);
            reloadBills();
            setReceiptBill(completedBill);
          }}
        />
      )}

      {/* Receipt Modal */}
      {receiptBill && (
        <BillReceiptModal bill={receiptBill} onClose={() => setReceiptBill(null)} />
      )}
    </div>
  );
};
