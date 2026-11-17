import React, { useState } from 'react';
import { dataService } from '../../services/dataService';
import { Customer, Plant, Bill } from '../../types/database.types';
import { PLANT_CATEGORIES } from '../../lib/constants';
import { formatCurrency } from '../../lib/formatters';
import { BillReceiptModal } from './BillReceiptModal';
import {
  Search,
  Plus,
  Trash2,
  Receipt,
  UserPlus,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Banknote,
} from 'lucide-react';

interface CartItem {
  plant: Plant;
  quantity: number;
  unitPrice: number;
}

export const RetailBillingScreen: React.FC = () => {
  const [plants] = useState<Plant[]>(() => dataService.getPlants().filter((p) => p.is_active));
  const [customers, setCustomers] = useState<Customer[]>(() => dataService.getCustomers());

  // Search & Filters
  const [plantSearch, setPlantSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [customerSearch, setCustomerSearch] = useState('');

  // Cart State
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState<'CASH' | 'UPI'>('CASH');
  const [paidAmount, setPaidAmount] = useState<string>('');
  const [transactionRef, setTransactionRef] = useState('');
  const [notes, setNotes] = useState('');

  // Modal & Notification States
  const [isNewCustModalOpen, setIsNewCustModalOpen] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustPlace, setNewCustPlace] = useState('Kutteripattu');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [createdBill, setCreatedBill] = useState<Bill | null>(null);

  // Filtered Plants
  const filteredPlants = plants.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(plantSearch.toLowerCase()) ||
      (p.tamil_name && p.tamil_name.includes(plantSearch));
    const matchesCategory = selectedCategory === 'ALL' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Filtered Customers
  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
      c.phone.includes(customerSearch) ||
      c.place.toLowerCase().includes(customerSearch.toLowerCase())
  );

  // Cart Calculations
  const subtotal = cart.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const totalAmount = Math.max(0, subtotal - (discountAmount || 0));
  const currentPaid = paidAmount === '' ? totalAmount : parseFloat(paidAmount) || 0;
  const balanceDue = Math.max(0, totalAmount - currentPaid);

  // Add Item to Cart
  const handleAddToCart = (plant: Plant) => {
    if (plant.current_stock <= 0) return;

    setCart((prev) => {
      const existing = prev.find((item) => item.plant.id === plant.id);
      if (existing) {
        if (existing.quantity >= plant.current_stock) {
          setErrorMsg(`Cannot add more than ${plant.current_stock} pots for "${plant.name}"`);
          return prev;
        }
        return prev.map((item) =>
          item.plant.id === plant.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { plant, quantity: 1, unitPrice: plant.selling_price }];
    });
    setErrorMsg(null);
  };

  // Update Cart Quantity
  const handleUpdateQty = (plantId: string, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveItem(plantId);
      return;
    }
    const item = cart.find((i) => i.plant.id === plantId);
    if (!item) return;

    if (newQty > item.plant.current_stock) {
      setErrorMsg(`Maximum stock available for "${item.plant.name}" is ${item.plant.current_stock}`);
      return;
    }

    setCart((prev) =>
      prev.map((i) => (i.plant.id === plantId ? { ...i, quantity: newQty } : i))
    );
    setErrorMsg(null);
  };

  const handleRemoveItem = (plantId: string) => {
    setCart((prev) => prev.filter((i) => i.plant.id !== plantId));
  };

  // Quick Customer Creation
  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim() || !newCustPhone.trim()) {
      setErrorMsg('Customer name and phone number are required');
      return;
    }

    const created = dataService.createCustomer({
      name: newCustName,
      phone: newCustPhone,
      place: newCustPlace,
    });

    setCustomers(dataService.getCustomers());
    setSelectedCustomer(created);
    setIsNewCustModalOpen(false);
    setNewCustName('');
    setNewCustPhone('');
    setNewCustPlace('Kutteripattu');
    setErrorMsg(null);
  };

  // Submit Retail Bill
  const handleSubmitBill = () => {
    if (!selectedCustomer) {
      setErrorMsg('Please select a customer for this bill');
      return;
    }
    if (cart.length === 0) {
      setErrorMsg('Please add at least one plant to the bill');
      return;
    }

    const res = dataService.createRetailBill({
      customerId: selectedCustomer.id,
      items: cart.map((i) => ({
        plantId: i.plant.id,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
      })),
      discountAmount: discountAmount || 0,
      paidAmount: currentPaid,
      paymentMode,
      transactionRef: transactionRef || undefined,
      notes: notes || undefined,
    });

    if (!res.success || !res.bill) {
      setErrorMsg(res.error || 'Failed to generate retail bill');
      return;
    }

    // Success: open receipt modal and reset cart
    setCreatedBill(res.bill);
    setCart([]);
    setDiscountAmount(0);
    setPaidAmount('');
    setTransactionRef('');
    setNotes('');
    setErrorMsg(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Receipt className="w-5 h-5 text-forest-800" />
            Retail Billing Counter (சில்லறை விற்பனை)
          </h2>
          <p className="text-xs text-slate-500 font-tamil mt-0.5">
            உடனடி ரசீது, இருப்பு கழித்தல் மற்றும் வாட்ஸ்அப் பகிர்வு
          </p>
        </div>

        {/* Selected Customer Indicator or Selector */}
        <div className="flex items-center gap-2">
          {selectedCustomer ? (
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg text-xs">
              <div>
                <span className="font-bold text-emerald-950 block">{selectedCustomer.name}</span>
                <span className="text-emerald-700 font-mono">
                  📞 {selectedCustomer.phone} • {selectedCustomer.place}
                </span>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="ml-2 text-xs text-emerald-800 hover:text-red-700 underline"
              >
                Change
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search customer by phone/name..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  className="w-56 text-xs px-3 py-2 pl-8 border border-slate-300 rounded-lg focus:ring-1 focus:ring-forest-800 focus:outline-none"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                {customerSearch && (
                  <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {filteredCustomers.length === 0 ? (
                      <div className="p-2 text-xs text-slate-400 text-center">No customer found</div>
                    ) : (
                      filteredCustomers.map((c) => (
                        <div
                          key={c.id}
                          onClick={() => {
                            setSelectedCustomer(c);
                            setCustomerSearch('');
                          }}
                          className="p-2 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-0 text-xs"
                        >
                          <p className="font-semibold text-slate-800">{c.name}</p>
                          <p className="text-[11px] text-slate-500 font-mono">
                            {c.phone} • {c.place}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
              <button
                onClick={() => setIsNewCustModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-forest-800 hover:bg-forest-900 text-white rounded-lg text-xs font-semibold shadow-xs"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>+ New</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Error Alert Banner */}
      {errorMsg && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Split Grid: Plant Catalog (Left) + Bill Cart (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Plant Catalog Picker (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
            {/* Search and Category Filter */}
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search plants by English or Tamil name..."
                  value={plantSearch}
                  onChange={(e) => setPlantSearch(e.target.value)}
                  className="w-full text-sm px-3 py-2 pl-9 border border-slate-300 rounded-lg focus:ring-1 focus:ring-forest-800 focus:outline-none"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-forest-800"
              >
                <option value="ALL">All Categories</option>
                {PLANT_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Plant Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[580px] overflow-y-auto pr-1">
              {filteredPlants.map((plant) => {
                const isOutOfStock = plant.current_stock <= 0;
                return (
                  <div
                    key={plant.id}
                    onClick={() => !isOutOfStock && handleAddToCart(plant)}
                    className={`p-3 rounded-lg border text-left flex flex-col justify-between transition-all ${
                      isOutOfStock
                        ? 'bg-slate-100 border-slate-200 opacity-60 cursor-not-allowed'
                        : 'bg-white border-slate-200 hover:border-forest-600 hover:shadow-xs cursor-pointer'
                    }`}
                  >
                    <div>
                      <h4 className="font-semibold text-xs text-slate-900 line-clamp-1">
                        {plant.name}
                      </h4>
                      {plant.tamil_name && (
                        <p className="text-[11px] font-tamil text-slate-500 mt-0.5 line-clamp-1">
                          {plant.tamil_name}
                        </p>
                      )}
                      <span className="inline-block mt-1 text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                        {plant.category.split(' ')[0]}
                      </span>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-mono font-bold text-forest-900">
                          {formatCurrency(plant.selling_price)}
                        </p>
                        <p
                          className={`text-[10px] font-mono font-semibold ${
                            plant.current_stock <= plant.min_stock_alert
                              ? 'text-red-600'
                              : 'text-slate-500'
                          }`}
                        >
                          Stock: {plant.current_stock}
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={isOutOfStock}
                        className={`p-1.5 rounded-md ${
                          isOutOfStock
                            ? 'bg-slate-200 text-slate-400'
                            : 'bg-forest-800 hover:bg-forest-900 text-white shadow-2xs'
                        }`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Bill Cart & Checkout (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between min-h-[580px]">
            {/* Cart Header */}
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <span>Bill Cart</span>
                  <span className="text-xs bg-forest-100 text-forest-800 font-bold px-2 py-0.5 rounded-full">
                    {cart.length} item(s)
                  </span>
                </h3>
                {cart.length > 0 && (
                  <button
                    onClick={() => setCart([])}
                    className="text-xs text-red-600 hover:underline"
                  >
                    Clear Cart
                  </button>
                )}
              </div>

              {/* Items List */}
              {cart.length === 0 ? (
                <div className="py-16 text-center text-slate-400">
                  <Receipt className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                  <p className="text-sm font-medium">No items added to cart</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Select plants from the catalog on the left
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 max-h-[240px] overflow-y-auto my-2">
                  {cart.map((item) => (
                    <div key={item.plant.id} className="py-2.5 flex items-center justify-between">
                      <div className="min-w-0 pr-2">
                        <p className="text-xs font-semibold text-slate-800 truncate">
                          {item.plant.name}
                        </p>
                        <p className="text-[11px] text-slate-400 font-mono">
                          {formatCurrency(item.unitPrice)} each
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Qty Steppers */}
                        <div className="flex items-center border border-slate-200 rounded-lg">
                          <button
                            type="button"
                            onClick={() => handleUpdateQty(item.plant.id, item.quantity - 1)}
                            className="px-2 py-0.5 text-slate-600 hover:bg-slate-100 rounded-l"
                          >
                            -
                          </button>
                          <span className="w-8 text-center text-xs font-mono font-bold">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleUpdateQty(item.plant.id, item.quantity + 1)}
                            className="px-2 py-0.5 text-slate-600 hover:bg-slate-100 rounded-r"
                          >
                            +
                          </button>
                        </div>

                        <span className="w-16 text-right font-mono text-xs font-bold text-slate-900">
                          {formatCurrency(item.quantity * item.unitPrice)}
                        </span>

                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.plant.id)}
                          className="p-1 text-slate-400 hover:text-red-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Calculations & Payment Block */}
            <div className="pt-3 border-t border-slate-200 space-y-3">
              {/* Subtotal & Discount */}
              <div className="space-y-1 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span className="font-mono font-semibold">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-600">Discount (₹):</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={discountAmount || ''}
                    onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                    className="w-24 text-right text-xs font-mono px-2 py-1 border border-slate-300 rounded focus:ring-1 focus:ring-forest-800"
                  />
                </div>
                <div className="flex justify-between font-bold text-sm pt-1 border-t border-slate-100 text-slate-900">
                  <span>Total Payable:</span>
                  <span className="font-mono text-forest-800 text-base">
                    {formatCurrency(totalAmount)}
                  </span>
                </div>
              </div>

              {/* Payment Mode Selector */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setPaymentMode('CASH')}
                  className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold border transition-all ${
                    paymentMode === 'CASH'
                      ? 'bg-forest-800 text-white border-forest-900 shadow-2xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  <Banknote className="w-4 h-4" />
                  <span>Cash Payment</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMode('UPI')}
                  className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold border transition-all ${
                    paymentMode === 'UPI'
                      ? 'bg-forest-800 text-white border-forest-900 shadow-2xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  <span>UPI Payment</span>
                </button>
              </div>

              {/* Amount Paid / Partial Payment input */}
              <div className="flex items-center justify-between gap-4 text-xs pt-1">
                <div>
                  <span className="font-semibold text-slate-700 block">Amount Paid (₹):</span>
                  {balanceDue > 0 && (
                    <span className="text-[10px] text-amber-600 font-bold">
                      Pending Due: {formatCurrency(balanceDue)}
                    </span>
                  )}
                </div>
                <input
                  type="number"
                  placeholder={totalAmount.toString()}
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(e.target.value)}
                  className="w-28 text-right font-mono font-bold text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-forest-800"
                />
              </div>

              {/* UPI Reference (if UPI selected) */}
              {paymentMode === 'UPI' && (
                <input
                  type="text"
                  placeholder="Optional UPI UTR / Reference No."
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg focus:ring-1 focus:ring-forest-800"
                />
              )}

              {/* Submit Button */}
              <button
                type="button"
                onClick={handleSubmitBill}
                disabled={cart.length === 0}
                className="w-full py-3 bg-forest-800 hover:bg-forest-900 disabled:bg-slate-300 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Finalize Bill & Print Receipt (ரசீது)</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Add Customer Modal */}
      {isNewCustModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <form
            onSubmit={handleCreateCustomer}
            className="bg-white rounded-xl max-w-sm w-full p-5 shadow-xl border border-slate-200 space-y-4"
          >
            <h3 className="font-bold text-slate-900 text-base">Quick Add Customer</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Customer Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Murugan"
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-forest-800"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">WhatsApp Phone *</label>
                <input
                  type="tel"
                  required
                  placeholder="10-digit mobile number"
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-forest-800 font-mono"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Place / Village *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kutteripattu / Tindivanam"
                  value={newCustPlace}
                  onChange={(e) => setNewCustPlace(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-forest-800"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsNewCustModalOpen(false)}
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

      {/* Bill Receipt Modal (Shown on successful creation) */}
      {createdBill && (
        <BillReceiptModal
          bill={createdBill}
          onClose={() => setCreatedBill(null)}
        />
      )}
    </div>
  );
};
