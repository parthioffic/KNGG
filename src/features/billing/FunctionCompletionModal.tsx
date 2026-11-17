import React, { useState } from 'react';
import { dataService } from '../../services/dataService';
import { Bill } from '../../types/database.types';
import { formatCurrency } from '../../lib/formatters';
import { CheckCircle, X, ShieldCheck } from 'lucide-react';

interface FunctionCompletionModalProps {
  bill: Bill;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (completedBill: Bill) => void;
}

interface ActualItemState {
  plantId: string;
  plantName: string;
  estimatedQuantity: number;
  actualQuantity: number;
  unitPrice: number;
}

export const FunctionCompletionModal: React.FC<FunctionCompletionModalProps> = ({
  bill,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [actualItems, setActualItems] = useState<ActualItemState[]>(() => {
    return (
      bill.items?.map((item) => ({
        plantId: item.plant_id,
        plantName: item.plant_name,
        estimatedQuantity: item.estimated_quantity,
        actualQuantity: item.actual_quantity > 0 ? item.actual_quantity : item.estimated_quantity,
        unitPrice: item.unit_price,
      })) || []
    );
  });

  const [finalDiscount, setFinalDiscount] = useState<number>(bill.discount_amount || 0);
  const [settlementAmount, setSettlementAmount] = useState<string>('');
  const [paymentMode, setPaymentMode] = useState<'CASH' | 'UPI'>('UPI');
  const [transactionRef, setTransactionRef] = useState('');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleUpdateActualQty = (idx: number, qty: number) => {
    setActualItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, actualQuantity: Math.max(0, qty) } : item))
    );
  };

  const handleUpdateRate = (idx: number, rate: number) => {
    setActualItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, unitPrice: Math.max(0, rate) } : item))
    );
  };

  // Final Calculations
  const finalSubtotal = actualItems.reduce(
    (sum, item) => sum + item.actualQuantity * item.unitPrice,
    0
  );
  const finalTotal = Math.max(0, finalSubtotal - (finalDiscount || 0));
  const advancePaid = bill.advance_amount;
  const netDueBeforeSettlement = Math.max(0, finalTotal - advancePaid);
  const currentSettlementPayment =
    settlementAmount === '' ? netDueBeforeSettlement : parseFloat(settlementAmount) || 0;
  const finalRemainingBalance = Math.max(0, netDueBeforeSettlement - currentSettlementPayment);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const res = dataService.completeFunctionOrder({
      billId: bill.id,
      actualItems: actualItems.map((i) => ({
        plantId: i.plantId,
        actualQuantity: i.actualQuantity,
        unitPrice: i.unitPrice,
      })),
      finalDiscount: finalDiscount || 0,
      settlementPaymentAmount: currentSettlementPayment,
      paymentMode,
      transactionRef: transactionRef || undefined,
      notes: notes || undefined,
    });

    if (!res.success || !res.bill) {
      setErrorMsg(res.error || 'Failed to complete function order');
      return;
    }

    onSuccess(res.bill);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 my-8">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div>
            <h3 className="font-bold text-slate-900 text-base">
              Finalize Function Order: {bill.bill_number}
            </h3>
            <p className="text-xs text-slate-500">
              Customer: <span className="font-semibold text-slate-800">{bill.customer_name}</span> (
              {bill.place})
            </p>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Warning banner regarding stock decrement */}
        <div className="my-3 p-3 bg-emerald-50 border border-emerald-200 text-emerald-950 rounded-lg text-xs flex items-start gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
          <p>
            <strong>Stock Deduction Confirmation:</strong> Submitting this post-event settlement will
            deduct the verified <strong>actual quantities</strong> from nursery plant inventory{' '}
            <strong>exactly once</strong> and transition the order to <code>COMPLETED</code>.
          </p>
        </div>

        {errorMsg && (
          <div className="mb-3 p-2.5 bg-red-50 border border-red-200 text-red-800 rounded-lg text-xs">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Items Comparison Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-2.5">Plant Name</th>
                  <th className="p-2.5 text-center">Estimated</th>
                  <th className="p-2.5 text-center">Actual Used</th>
                  <th className="p-2.5 text-right">Final Rate</th>
                  <th className="p-2.5 text-right">Line Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {actualItems.map((item, idx) => {
                  const variance = item.actualQuantity - item.estimatedQuantity;
                  return (
                    <tr key={item.plantId}>
                      <td className="p-2.5 font-medium text-slate-800">{item.plantName}</td>
                      <td className="p-2.5 text-center font-mono text-slate-500">
                        {item.estimatedQuantity}
                      </td>
                      <td className="p-2.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <input
                            type="number"
                            min="0"
                            required
                            value={item.actualQuantity}
                            onChange={(e) =>
                              handleUpdateActualQty(idx, parseFloat(e.target.value) || 0)
                            }
                            className="w-16 px-1.5 py-1 text-center font-mono font-bold border border-slate-300 rounded text-xs focus:ring-1 focus:ring-forest-800"
                          />
                          {variance !== 0 && (
                            <span
                              className={`text-[10px] font-mono font-semibold ${
                                variance > 0 ? 'text-emerald-700' : 'text-red-600'
                              }`}
                            >
                              ({variance > 0 ? `+${variance}` : variance})
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-2.5 text-right">
                        <input
                          type="number"
                          min="0"
                          required
                          value={item.unitPrice}
                          onChange={(e) =>
                            handleUpdateRate(idx, parseFloat(e.target.value) || 0)
                          }
                          className="w-20 px-1.5 py-1 text-right font-mono border border-slate-300 rounded text-xs focus:ring-1 focus:ring-forest-800"
                        />
                      </td>
                      <td className="p-2.5 text-right font-mono font-bold text-slate-800">
                        {formatCurrency(item.actualQuantity * item.unitPrice)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Financial Reconciliation Box */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
              <div className="flex justify-between text-slate-600">
                <span>Revised Subtotal:</span>
                <span className="font-mono font-semibold">{formatCurrency(finalSubtotal)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Final Discount (₹):</span>
                <input
                  type="number"
                  min="0"
                  value={finalDiscount}
                  onChange={(e) => setFinalDiscount(parseFloat(e.target.value) || 0)}
                  className="w-24 text-right text-xs font-mono px-2 py-1 border border-slate-300 rounded"
                />
              </div>
              <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-slate-200">
                <span>Final Bill Total:</span>
                <span className="font-mono text-forest-800 text-sm">
                  {formatCurrency(finalTotal)}
                </span>
              </div>
              <div className="flex justify-between text-emerald-700 font-medium">
                <span>Less: Advance Paid Earlier:</span>
                <span className="font-mono font-bold">-{formatCurrency(advancePaid)}</span>
              </div>
              <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-slate-200">
                <span>Remaining Net Due:</span>
                <span className="font-mono text-red-600 text-sm">
                  {formatCurrency(netDueBeforeSettlement)}
                </span>
              </div>
            </div>

            {/* Settlement Collection Input */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-3">
              <h4 className="font-bold text-slate-800">Collect Settlement Payment</h4>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Settlement Amount Received Now (₹)
                </label>
                <input
                  type="number"
                  placeholder={netDueBeforeSettlement.toString()}
                  value={settlementAmount}
                  onChange={(e) => setSettlementAmount(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-mono font-bold border border-slate-300 rounded-lg focus:ring-1 focus:ring-forest-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Mode</label>
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
                <label className="font-semibold text-slate-700 block mb-1">Completion Notes</label>
                <input
                  type="text"
                  placeholder="Optional remarks"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              {finalRemainingBalance > 0 && (
                <p className="text-[11px] text-amber-700 bg-amber-50 p-2 rounded border border-amber-200">
                  Uncollected balance of <strong>{formatCurrency(finalRemainingBalance)}</strong> will
                  remain pending in customer's credit ledger.
                </p>
              )}
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
              className="flex items-center gap-1.5 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg shadow-sm"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Settle Order & Deduct Stock</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
