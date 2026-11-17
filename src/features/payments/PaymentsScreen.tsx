import React, { useState } from 'react';
import { dataService } from '../../services/dataService';
import { Payment, Customer, Bill } from '../../types/database.types';
import { formatCurrency, formatDateTime } from '../../lib/formatters';
import { CreditCard, Search, PlusCircle, Printer } from 'lucide-react';

export const PaymentsScreen: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>(() => dataService.getPayments());
  const [customers] = useState<Customer[]>(() => dataService.getCustomers());
  const [bills] = useState<Bill[]>(() => dataService.getBills());

  const [searchQuery, setSearchQuery] = useState('');
  const [modeFilter, setModeFilter] = useState<'ALL' | 'CASH' | 'UPI'>('ALL');

  // Balance Collection Modal
  const [isCollectModalOpen, setIsCollectModalOpen] = useState(false);
  const [selectedCustId, setSelectedCustId] = useState('');
  const [selectedBillId, setSelectedBillId] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState<'CASH' | 'UPI'>('UPI');
  const [transactionRef, setTransactionRef] = useState('');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Selected receipt for printing
  const [printPayment, setPrintPayment] = useState<Payment | null>(null);

  const reloadData = () => {
    setPayments(dataService.getPayments());
  };

  // Customers with pending balance
  const debtors = customers.filter((c) => c.outstanding_balance > 0);

  // Unpaid bills for chosen customer
  const unpaidBillsForCustomer = bills.filter(
    (b) => b.customer_id === selectedCustId && b.balance_amount > 0
  );

  const filteredPayments = payments.filter((p) => {
    const matchesSearch =
      p.payment_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.customer?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.customer?.phone.includes(searchQuery) ||
      p.bill?.bill_number.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMode = modeFilter === 'ALL' || p.payment_mode === modeFilter;
    return matchesSearch && matchesMode;
  });

  // Calculate totals
  const totalCollected = payments.reduce((sum, p) => sum + p.amount, 0);
  const cashCollected = payments
    .filter((p) => p.payment_mode === 'CASH')
    .reduce((sum, p) => sum + p.amount, 0);
  const upiCollected = payments
    .filter((p) => p.payment_mode === 'UPI')
    .reduce((sum, p) => sum + p.amount, 0);

  const handleCollectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBillId) {
      setErrorMsg('Please select a bill to settle');
      return;
    }
    if (amount <= 0) {
      setErrorMsg('Payment amount must be greater than zero');
      return;
    }

    const res = dataService.recordBalancePayment({
      billId: selectedBillId,
      amount,
      paymentMode,
      transactionRef: transactionRef || undefined,
      notes: notes || undefined,
    });

    if (!res.success || !res.payment) {
      setErrorMsg(res.error || 'Failed to record balance payment');
      return;
    }

    reloadData();
    setIsCollectModalOpen(false);
    setSelectedCustId('');
    setSelectedBillId('');
    setAmount(0);
    setTransactionRef('');
    setNotes('');
    setErrorMsg(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-forest-800" />
            Payments & Collections (பணம் வசூல் மேலாண்மை)
          </h2>
          <p className="text-xs text-slate-500 font-tamil mt-0.5">
            முன்பணம், ரொக்கம், UPI வசூல் மற்றும் பாக்கி தொகை வரவு
          </p>
        </div>

        <button
          onClick={() => {
            setIsCollectModalOpen(true);
            if (debtors.length > 0) {
              setSelectedCustId(debtors[0].id);
            }
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-forest-800 hover:bg-forest-900 text-white font-semibold text-sm rounded-lg shadow-sm transition-colors"
        >
          <PlusCircle className="w-4 h-4" />
          <span>+ Collect Balance Payment</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs text-slate-500 font-medium">Total Lifetime Collections</p>
          <h3 className="text-2xl font-bold font-mono text-slate-900 mt-1">
            {formatCurrency(totalCollected)}
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">Across {payments.length} transactions</p>
        </div>

        <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 shadow-xs">
          <p className="text-xs text-emerald-800 font-medium">Cash Collections (ரொக்கம்)</p>
          <h3 className="text-2xl font-bold font-mono text-emerald-950 mt-1">
            {formatCurrency(cashCollected)}
          </h3>
          <p className="text-[11px] text-emerald-700 mt-0.5">Physical cash in drawer</p>
        </div>

        <div className="bg-blue-50 p-4 rounded-xl border border-blue-200 shadow-xs">
          <p className="text-xs text-blue-800 font-medium">UPI Collections (ஆன்லைன்)</p>
          <h3 className="text-2xl font-bold font-mono text-blue-950 mt-1">
            {formatCurrency(upiCollected)}
          </h3>
          <p className="text-[11px] text-blue-700 mt-0.5">Direct bank QR transfers</p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search payments by receipt number, customer, phone, or bill..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs px-3 py-2 pl-9 border border-slate-300 rounded-lg focus:ring-1 focus:ring-forest-800 focus:outline-none"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-semibold">
          {(['ALL', 'CASH', 'UPI'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setModeFilter(m)}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                modeFilter === m ? 'bg-white text-forest-900 shadow-2xs font-bold' : 'text-slate-600'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Receipt Number</th>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Customer Details</th>
                <th className="py-3 px-4">Bill Reference</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Mode</th>
                <th className="py-3 px-4 text-right">Amount Paid</th>
                <th className="py-3 px-4">Received By</th>
                <th className="py-3 px-4 text-right">Print</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPayments.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900 text-xs">
                    {p.payment_number}
                  </td>
                  <td className="py-3 px-4 text-slate-500">{formatDateTime(p.created_at)}</td>
                  <td className="py-3 px-4">
                    <p className="font-semibold text-slate-800">{p.customer?.name || 'Customer'}</p>
                    <p className="text-[11px] text-slate-400 font-mono">
                      📞 {p.customer?.phone} • {p.customer?.place}
                    </p>
                  </td>
                  <td className="py-3 px-4 font-mono font-semibold text-forest-800">
                    {p.bill?.bill_number || 'Bill'}
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                      {p.payment_type}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-bold">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] ${
                        p.payment_mode === 'CASH'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {p.payment_mode}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-emerald-900 text-sm">
                    {formatCurrency(p.amount)}
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    {p.received_by_profile?.full_name?.split(' ')[0] || 'Staff'}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => setPrintPayment(p)}
                      title="Print Payment Slip"
                      className="p-1.5 text-slate-500 hover:text-forest-800 hover:bg-slate-100 rounded"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Collect Balance Modal */}
      {isCollectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <form
            onSubmit={handleCollectSubmit}
            className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4"
          >
            <h3 className="font-bold text-slate-900 text-base">Collect Balance Payment</h3>

            {errorMsg && (
              <div className="p-2.5 bg-red-50 border border-red-200 text-red-800 rounded-lg text-xs">
                {errorMsg}
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Select Customer *</label>
                <select
                  value={selectedCustId}
                  onChange={(e) => {
                    setSelectedCustId(e.target.value);
                    const matchingBills = bills.filter(
                      (b) => b.customer_id === e.target.value && b.balance_amount > 0
                    );
                    if (matchingBills.length > 0) {
                      setSelectedBillId(matchingBills[0].id);
                      setAmount(matchingBills[0].balance_amount);
                    } else {
                      setSelectedBillId('');
                      setAmount(0);
                    }
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                >
                  <option value="">-- Choose Customer --</option>
                  {debtors.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} (Due: {formatCurrency(c.outstanding_balance)})
                    </option>
                  ))}
                </select>
              </div>

              {selectedCustId && (
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Select Unpaid Bill *
                  </label>
                  {unpaidBillsForCustomer.length === 0 ? (
                    <p className="text-slate-400 italic">No unpaid bills found for this customer.</p>
                  ) : (
                    <select
                      value={selectedBillId}
                      onChange={(e) => {
                        setSelectedBillId(e.target.value);
                        const b = unpaidBillsForCustomer.find((bill) => bill.id === e.target.value);
                        if (b) setAmount(b.balance_amount);
                      }}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    >
                      <option value="">-- Choose Bill --</option>
                      {unpaidBillsForCustomer.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.bill_number} ({b.bill_type}) - Balance: {formatCurrency(b.balance_amount)}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Collection Amount (₹) *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={amount}
                  onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 font-mono font-bold text-emerald-800 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Payment Mode</label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value as 'CASH' | 'UPI')}
                    className="w-full px-2 py-1.5 border border-slate-300 rounded-lg"
                  >
                    <option value="UPI">UPI</option>
                    <option value="CASH">Cash</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">UTR / Ref (Optional)</label>
                  <input
                    type="text"
                    value={transactionRef}
                    onChange={(e) => setTransactionRef(e.target.value)}
                    className="w-full px-2 py-1.5 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Remarks</label>
                <input
                  type="text"
                  placeholder="e.g. Cleared via GPay"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsCollectModalOpen(false)}
                className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!selectedBillId || amount <= 0}
                className="px-5 py-2 text-xs font-semibold text-white bg-forest-800 hover:bg-forest-900 disabled:bg-slate-300 rounded-lg shadow-xs"
              >
                Confirm Payment
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Printable Payment Slip */}
      {printPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-2xl border border-slate-200">
            <div className="text-center pb-3 border-b-2 border-dashed border-slate-300">
              <span className="text-xl">🌱</span>
              <h3 className="font-extrabold text-sm uppercase text-forest-900">
                Kalaiselvi Nursery Garden
              </h3>
              <p className="text-[11px] font-tamil text-forest-800">பணம் செலுத்திய ரசீது (Receipt)</p>
            </div>

            <div className="py-3 text-xs space-y-1.5 border-b border-dashed border-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-500">Receipt No:</span>
                <span className="font-mono font-bold">{printPayment.payment_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Date:</span>
                <span>{formatDateTime(printPayment.created_at)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Customer:</span>
                <span className="font-semibold">{printPayment.customer?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Bill Ref:</span>
                <span className="font-mono">{printPayment.bill?.bill_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payment Type:</span>
                <span>{printPayment.payment_type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Mode:</span>
                <span className="font-bold">{printPayment.payment_mode}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-100 font-bold text-sm">
                <span>Amount Paid:</span>
                <span className="font-mono text-emerald-800">
                  {formatCurrency(printPayment.amount)}
                </span>
              </div>
            </div>

            <div className="pt-3 text-center text-[10px] text-slate-500">
              <p>Received By: {printPayment.received_by_profile?.full_name}</p>
              <p className="font-tamil mt-0.5 text-forest-800">நன்றி! மீண்டும் வருக! 🌱</p>
            </div>

            <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-slate-100 no-print">
              <button
                onClick={() => setPrintPayment(null)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-forest-800 hover:bg-forest-900 rounded-lg"
              >
                Print Slip
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
