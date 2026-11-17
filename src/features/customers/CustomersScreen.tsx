import React, { useState } from 'react';
import { dataService } from '../../services/dataService';
import { Customer, Bill } from '../../types/database.types';
import { formatCurrency, formatDate } from '../../lib/formatters';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { Users, Search, Plus, Phone, MapPin, X } from 'lucide-react';

export const CustomersScreen: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>(() => dataService.getCustomers());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // New Customer Modal
  const [isAddCustOpen, setIsAddCustOpen] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [place, setPlace] = useState('Kutteripattu');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');

  // Collect Balance Modal for a specific customer
  const [collectingBill, setCollectingBill] = useState<Bill | null>(null);
  const [collectAmount, setCollectAmount] = useState<number>(0);
  const [collectMode, setCollectMode] = useState<'CASH' | 'UPI'>('UPI');
  const [collectRef, setCollectRef] = useState('');

  const reloadData = () => {
    setCustomers(dataService.getCustomers());
    if (selectedCustomer) {
      const updated = dataService.getCustomerById(selectedCustomer.id);
      if (updated) setSelectedCustomer(updated);
    }
  };

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery) ||
      c.place.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    dataService.createCustomer({
      name: name.trim(),
      phone: phone.trim(),
      place: place.trim(),
      address: address.trim() || undefined,
      notes: notes.trim() || undefined,
    });

    reloadData();
    setIsAddCustOpen(false);
    setName('');
    setPhone('');
    setPlace('Kutteripattu');
    setAddress('');
    setNotes('');
  };

  // Balance Payment
  const handleBalancePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!collectingBill || collectAmount <= 0) return;

    const res = dataService.recordBalancePayment({
      billId: collectingBill.id,
      amount: collectAmount,
      paymentMode: collectMode,
      transactionRef: collectRef || undefined,
    });

    if (res.success) {
      reloadData();
      setCollectingBill(null);
      setCollectAmount(0);
      setCollectRef('');
    }
  };

  // Get orders and payments for selected customer
  const customerBills = selectedCustomer
    ? dataService.getBills().filter((b) => b.customer_id === selectedCustomer.id)
    : [];

  const customerPayments = selectedCustomer
    ? dataService.getPayments().filter((p) => p.customer_id === selectedCustomer.id)
    : [];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-forest-800" />
            Customer Directory & Ledgers (வாடிக்கையாளர்கள்)
          </h2>
          <p className="text-xs text-slate-500 font-tamil mt-0.5">
            வாடிக்கையாளர் விபரம், வாங்கிய பட்டியல் மற்றும் பாக்கி தொகை கணக்கு
          </p>
        </div>

        <button
          onClick={() => setIsAddCustOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-forest-800 hover:bg-forest-900 text-white font-semibold text-sm rounded-lg shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add Customer</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative">
          <input
            type="text"
            placeholder="Search by customer phone number, name, or place..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs px-3 py-2.5 pl-9 border border-slate-300 rounded-lg focus:ring-1 focus:ring-forest-800 focus:outline-none"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Customer Details</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Total Purchases</th>
                <th className="py-3 px-4">Total Paid</th>
                <th className="py-3 px-4">Outstanding Balance</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCustomers.map((cust) => {
                const hasDue = cust.outstanding_balance > 0;
                return (
                  <tr key={cust.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900 text-sm">{cust.name}</p>
                      <p className="text-slate-500 font-mono text-xs flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3 text-slate-400" />
                        {cust.phone}
                      </p>
                    </td>
                    <td className="py-3 px-4">
                      <span className="flex items-center gap-1 text-slate-700 font-medium">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        {cust.place}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-slate-800">
                      {formatCurrency(cust.total_purchases)}
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-emerald-700">
                      {formatCurrency(cust.total_paid)}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-sm">
                      {hasDue ? (
                        <span className="text-red-600 bg-red-50 px-2.5 py-1 rounded-full border border-red-200">
                          {formatCurrency(cust.outstanding_balance)}
                        </span>
                      ) : (
                        <span className="text-slate-400">₹0.00</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedCustomer(cust)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-forest-800 hover:text-white text-slate-700 font-semibold text-xs rounded-lg transition-colors"
                      >
                        View Ledger & Orders
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Ledger Drawer / Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div>
                <h3 className="font-bold text-slate-900 text-base">{selectedCustomer.name}</h3>
                <p className="text-xs text-slate-500">
                  📍 {selectedCustomer.place} • 📞 {selectedCustomer.phone}
                </p>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Lifetime Financial Summary */}
            <div className="grid grid-cols-3 gap-3 my-4">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-[11px] text-slate-500 uppercase block">Total Purchases</span>
                <span className="text-base font-bold font-mono text-slate-900">
                  {formatCurrency(selectedCustomer.total_purchases)}
                </span>
              </div>
              <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200">
                <span className="text-[11px] text-emerald-800 uppercase block">Total Paid</span>
                <span className="text-base font-bold font-mono text-emerald-900">
                  {formatCurrency(selectedCustomer.total_paid)}
                </span>
              </div>
              <div className="bg-red-50 p-3 rounded-xl border border-red-200">
                <span className="text-[11px] text-red-800 uppercase block">Pending Due</span>
                <span className="text-base font-bold font-mono text-red-900">
                  {formatCurrency(selectedCustomer.outstanding_balance)}
                </span>
              </div>
            </div>

            {/* Customer Orders */}
            <div className="space-y-4 text-xs">
              <div>
                <h4 className="font-bold text-slate-800 mb-2">Order History ({customerBills.length})</h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="p-2">Bill No</th>
                        <th className="p-2">Type</th>
                        <th className="p-2">Date</th>
                        <th className="p-2 text-right">Total</th>
                        <th className="p-2 text-right">Balance</th>
                        <th className="p-2">Status</th>
                        <th className="p-2 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {customerBills.map((b) => (
                        <tr key={b.id} className="hover:bg-slate-50">
                          <td className="p-2 font-bold text-slate-800">{b.bill_number}</td>
                          <td className="p-2 font-sans text-[11px]">{b.bill_type}</td>
                          <td className="p-2 font-sans text-slate-500">{formatDate(b.created_at)}</td>
                          <td className="p-2 text-right font-bold text-slate-900">
                            {formatCurrency(b.total_amount)}
                          </td>
                          <td className="p-2 text-right font-bold text-red-600">
                            {formatCurrency(b.balance_amount)}
                          </td>
                          <td className="p-2 font-sans">
                            <StatusBadge status={b.payment_status} />
                          </td>
                          <td className="p-2 text-right font-sans">
                            {b.balance_amount > 0 && (
                              <button
                                onClick={() => {
                                  setCollectingBill(b);
                                  setCollectAmount(b.balance_amount);
                                }}
                                className="px-2 py-0.5 bg-emerald-600 text-white rounded font-medium text-[10px]"
                              >
                                Settle
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Payments Ledger */}
              <div>
                <h4 className="font-bold text-slate-800 mb-2">
                  Payment History ({customerPayments.length})
                </h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden max-h-40 overflow-y-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="p-2">Receipt No</th>
                        <th className="p-2">Date</th>
                        <th className="p-2">Type</th>
                        <th className="p-2">Mode</th>
                        <th className="p-2 text-right">Amount</th>
                        <th className="p-2">Collected By</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {customerPayments.map((p) => (
                        <tr key={p.id}>
                          <td className="p-2 font-bold text-slate-800">{p.payment_number}</td>
                          <td className="p-2 font-sans text-slate-500">{formatDate(p.created_at)}</td>
                          <td className="p-2 font-sans text-[11px]">{p.payment_type}</td>
                          <td className="p-2 font-sans font-semibold text-slate-700">{p.payment_mode}</td>
                          <td className="p-2 text-right font-bold text-emerald-800">
                            {formatCurrency(p.amount)}
                          </td>
                          <td className="p-2 font-sans text-slate-500">
                            {p.received_by_profile?.full_name?.split(' ')[0] || 'Staff'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedCustomer(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Close Ledger
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Collect Balance Modal */}
      {collectingBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <form
            onSubmit={handleBalancePayment}
            className="bg-white rounded-xl max-w-sm w-full p-5 shadow-xl border border-slate-200 space-y-4"
          >
            <h3 className="font-bold text-slate-900 text-base">
              Collect Balance: {collectingBill.bill_number}
            </h3>
            <p className="text-xs text-slate-500">
              Outstanding Due: <strong>{formatCurrency(collectingBill.balance_amount)}</strong>
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Amount Received (₹) *
                </label>
                <input
                  type="number"
                  min="1"
                  max={collectingBill.balance_amount}
                  required
                  value={collectAmount}
                  onChange={(e) => setCollectAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 font-mono font-bold text-emerald-800 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Payment Mode</label>
                  <select
                    value={collectMode}
                    onChange={(e) => setCollectMode(e.target.value as 'CASH' | 'UPI')}
                    className="w-full px-2 py-1.5 border border-slate-300 rounded-lg"
                  >
                    <option value="UPI">UPI</option>
                    <option value="CASH">Cash</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">UPI Ref / UTR</label>
                  <input
                    type="text"
                    value={collectRef}
                    onChange={(e) => setCollectRef(e.target.value)}
                    className="w-full px-2 py-1.5 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCollectingBill(null)}
                className="px-3 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs"
              >
                Record Payment
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add Customer Modal */}
      {isAddCustOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <form
            onSubmit={handleCreateCustomer}
            className="bg-white rounded-xl max-w-sm w-full p-5 shadow-xl border border-slate-200 space-y-4"
          >
            <h3 className="font-bold text-slate-900 text-base">Add New Customer</h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Murugan"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  WhatsApp Mobile Number *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="10-digit number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Town / Place *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kutteripattu / Mailam / Tindivanam"
                  value={place}
                  onChange={(e) => setPlace(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Address / Landmark</label>
                <input
                  type="text"
                  placeholder="Optional street address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Internal Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Likes flowering trees"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsAddCustOpen(false)}
                className="px-3 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-white bg-forest-800 hover:bg-forest-900 rounded-lg shadow-xs"
              >
                Save Customer
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
