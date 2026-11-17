import React, { useState } from 'react';
import { dataService } from '../../services/dataService';
import { Customer, Plant, Bill } from '../../types/database.types';
import { formatCurrency } from '../../lib/formatters';
import { CalendarDays, AlertTriangle, Plus, Trash2, X, CheckCircle2 } from 'lucide-react';

interface FunctionBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (bill: Bill) => void;
}

interface EstItem {
  plantId: string;
  plantName: string;
  estimatedQuantity: number;
  unitPrice: number;
}

export const FunctionBookingModal: React.FC<FunctionBookingModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [customers] = useState<Customer[]>(() => dataService.getCustomers());
  const [plants] = useState<Plant[]>(() => dataService.getPlants().filter((p) => p.is_active));

  // Customer Selection or Quick Entry
  const [customerId, setCustomerId] = useState(customers[0]?.id || '');
  const [functionDate, setFunctionDate] = useState(() => {
    const d = new Date(Date.now() + 7 * 86400000); // 7 days in future by default
    return d.toISOString().slice(0, 16);
  });
  const [functionDescription, setFunctionDescription] = useState('');

  // Estimated Items
  const [items, setItems] = useState<EstItem[]>([
    {
      plantId: plants[0]?.id || '',
      plantName: plants[0]?.name || '',
      estimatedQuantity: 50,
      unitPrice: plants[0]?.selling_price || 40,
    },
  ]);

  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [advanceAmount, setAdvanceAmount] = useState<number>(1000);
  const [paymentMode, setPaymentMode] = useState<'CASH' | 'UPI'>('UPI');
  const [transactionRef, setTransactionRef] = useState('');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  // Add line item
  const handleAddItem = () => {
    const firstPlant = plants[0];
    if (!firstPlant) return;
    setItems((prev) => [
      ...prev,
      {
        plantId: firstPlant.id,
        plantName: firstPlant.name,
        estimatedQuantity: 20,
        unitPrice: firstPlant.selling_price,
      },
    ]);
  };

  const handleUpdateItemPlant = (idx: number, plantId: string) => {
    const targetPlant = plants.find((p) => p.id === plantId);
    if (!targetPlant) return;

    setItems((prev) =>
      prev.map((item, i) =>
        i === idx
          ? {
              ...item,
              plantId: targetPlant.id,
              plantName: targetPlant.name,
              unitPrice: targetPlant.selling_price,
            }
          : item
      )
    );
  };

  const handleUpdateItemQty = (idx: number, qty: number) => {
    setItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, estimatedQuantity: Math.max(1, qty) } : item))
    );
  };

  const handleUpdateItemRate = (idx: number, rate: number) => {
    setItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, unitPrice: Math.max(0, rate) } : item))
    );
  };

  const handleRemoveItem = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  // Calculations
  const subtotal = items.reduce((sum, item) => sum + item.estimatedQuantity * item.unitPrice, 0);
  const totalAmount = Math.max(0, subtotal - (discountAmount || 0));
  const remainingBalance = Math.max(0, totalAmount - (advanceAmount || 0));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId) {
      setErrorMsg('Please select a customer');
      return;
    }
    if (items.length === 0) {
      setErrorMsg('Please add at least one estimated plant');
      return;
    }

    const res = dataService.createFunctionOrder({
      customerId,
      functionDate,
      functionDescription,
      items: items.map((i) => ({
        plantId: i.plantId,
        estimatedQuantity: i.estimatedQuantity,
        unitPrice: i.unitPrice,
      })),
      discountAmount: discountAmount || 0,
      advanceAmount: advanceAmount || 0,
      paymentMode,
      transactionRef: transactionRef || undefined,
      notes: notes || undefined,
    });

    if (!res.success || !res.bill) {
      setErrorMsg(res.error || 'Failed to book function order');
      return;
    }

    onSuccess(res.bill);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 my-8">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-purple-100 text-purple-800 rounded-lg">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Book Function Order</h3>
              <p className="text-xs text-slate-500 font-tamil">விழா ஆர்டர் முன்பதிவு (இருப்பு குறையாது)</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Inventory Notice Banner */}
        <div className="my-3 p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-lg text-xs flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <p>
            <strong>Inventory Rule Notice:</strong> Booking an order records estimated quantities for
            event reservation. <strong>Plant inventory is NOT deducted now.</strong> Stock will be
            deducted exactly once after the event when actual counts are verified.
          </p>
        </div>

        {errorMsg && (
          <div className="mb-3 p-2.5 bg-red-50 border border-red-200 text-red-800 rounded-lg text-xs">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Customer & Event Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Customer *</label>
              <select
                required
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-forest-800"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.phone} - {c.place})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Function Date & Time *</label>
              <input
                type="datetime-local"
                required
                value={functionDate}
                onChange={(e) => setFunctionDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-forest-800 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Function Description / Place</label>
            <input
              type="text"
              placeholder="e.g. Wedding Reception at Tindivanam Marriage Hall"
              value={functionDescription}
              onChange={(e) => setFunctionDescription(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-forest-800"
            />
          </div>

          {/* Line Items */}
          <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 space-y-2">
            <div className="flex items-center justify-between pb-1 border-b border-slate-200">
              <span className="font-bold text-slate-800">Estimated Plants Required</span>
              <button
                type="button"
                onClick={handleAddItem}
                className="flex items-center gap-1 text-[11px] font-semibold text-forest-800 hover:underline"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item</span>
              </button>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-200">
                  <select
                    value={item.plantId}
                    onChange={(e) => handleUpdateItemPlant(idx, e.target.value)}
                    className="flex-1 px-2 py-1 border border-slate-200 rounded text-xs"
                  >
                    {plants.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (Stock: {p.current_stock})
                      </option>
                    ))}
                  </select>

                  <div className="w-20">
                    <input
                      type="number"
                      min="1"
                      placeholder="Qty"
                      value={item.estimatedQuantity}
                      onChange={(e) => handleUpdateItemQty(idx, parseFloat(e.target.value) || 1)}
                      className="w-full px-2 py-1 text-center font-mono border border-slate-200 rounded text-xs"
                    />
                  </div>

                  <div className="w-20">
                    <input
                      type="number"
                      min="0"
                      placeholder="Rate"
                      value={item.unitPrice}
                      onChange={(e) => handleUpdateItemRate(idx, parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1 text-right font-mono border border-slate-200 rounded text-xs"
                    />
                  </div>

                  <span className="w-20 text-right font-mono font-bold text-slate-800">
                    {formatCurrency(item.estimatedQuantity * item.unitPrice)}
                  </span>

                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      className="p-1 text-slate-400 hover:text-red-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Totals & Advance Payment */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-200">
            <div className="space-y-2">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Advance Amount Paid (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={advanceAmount}
                  onChange={(e) => setAdvanceAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 font-mono font-bold text-emerald-800 border border-slate-300 rounded-lg focus:ring-1 focus:ring-forest-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Payment Mode</label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value as 'CASH' | 'UPI')}
                    className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs"
                  >
                    <option value="UPI">UPI</option>
                    <option value="CASH">Cash</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Discount (₹)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={discountAmount || ''}
                    onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                    className="w-full px-2 py-1.5 font-mono border border-slate-300 rounded-lg text-xs text-right"
                  />
                </div>
              </div>

              {paymentMode === 'UPI' && (
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">UPI Ref / UTR</label>
                  <input
                    type="text"
                    placeholder="Optional UPI UTR reference"
                    value={transactionRef}
                    onChange={(e) => setTransactionRef(e.target.value)}
                    className="w-full px-2 py-1 font-mono border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              )}

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Booking Notes / Remarks</label>
                <input
                  type="text"
                  placeholder="Optional remarks"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-2 py-1 border border-slate-300 rounded-lg text-xs"
                />
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-col justify-between">
              <div className="space-y-1">
                <div className="flex justify-between text-slate-500">
                  <span>Estimated Total:</span>
                  <span className="font-mono font-semibold">{formatCurrency(totalAmount)}</span>
                </div>
                <div className="flex justify-between text-emerald-700">
                  <span>Advance Received:</span>
                  <span className="font-mono font-bold">{formatCurrency(advanceAmount)}</span>
                </div>
                <div className="flex justify-between font-bold text-sm pt-1 border-t border-slate-200 text-slate-900">
                  <span>Estimated Balance Due:</span>
                  <span className="font-mono text-red-600">{formatCurrency(remainingBalance)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2.5 bg-forest-800 hover:bg-forest-900 text-white font-bold rounded-lg shadow-sm"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirm & Book Order</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
