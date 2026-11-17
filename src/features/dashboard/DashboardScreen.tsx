import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { dataService } from '../../services/dataService';
import { MetricCard } from '../../components/shared/MetricCard';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { BillReceiptModal } from '../billing/BillReceiptModal';
import { Bill, Plant } from '../../types/database.types';
import { formatCurrency, formatDate } from '../../lib/formatters';
import { createWhatsAppBillUrl } from '../../lib/whatsappHelper';
import {
  TrendingUp,
  Wallet,
  AlertCircle,
  Sprout,
  PlusCircle,
  CalendarDays,
  ArrowRight,
  Share2,
  Printer,
  PackagePlus,
} from 'lucide-react';

export const DashboardScreen: React.FC = () => {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState(() => dataService.getDashboardMetrics());
  const [selectedBillForReceipt, setSelectedBillForReceipt] = useState<Bill | null>(null);

  const refreshData = () => {
    setMetrics(dataService.getDashboardMetrics());
  };

  const handleQuickWhatsApp = (e: React.MouseEvent, bill: Bill) => {
    e.stopPropagation();
    const totalQty =
      bill.items?.reduce((sum, item) => sum + (item.actual_quantity || item.estimated_quantity), 0) || 1;
    const effectiveRate = bill.items && bill.items.length === 1 ? bill.items[0].unit_price : bill.total_amount;

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
      {/* Welcome & Quick Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Nursery Business Dashboard
          </h2>
          <p className="text-xs text-slate-500 font-tamil mt-0.5">
            இன்றைய விற்பனை மற்றும் விழா ஆர்டர்கள் கண்ணோட்டம்
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => navigate('/billing/retail')}
            className="flex items-center gap-2 px-4 py-2.5 bg-forest-800 hover:bg-forest-900 text-white font-medium text-sm rounded-lg shadow-sm transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Retail Bill</span>
          </button>
          <button
            onClick={() => navigate('/billing/functions')}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium text-sm rounded-lg transition-colors"
          >
            <CalendarDays className="w-4 h-4 text-forest-800" />
            <span>Book Function Order</span>
          </button>
          <button
            onClick={() => navigate('/inventory')}
            className="flex items-center gap-2 px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium text-sm rounded-lg transition-colors"
            title="Add Plant Stock"
          >
            <PackagePlus className="w-4 h-4 text-emerald-700" />
            <span className="hidden sm:inline">Stock IN</span>
          </button>
        </div>
      </div>

      {/* KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Today's Sales"
          tamilTitle="இன்றைய விற்பனை"
          value={formatCurrency(metrics.todaySales)}
          subValue={`${metrics.todayBillsCount} bill(s) generated today`}
          icon={TrendingUp}
          variant="success"
        />

        <MetricCard
          title="Today's Collection"
          tamilTitle="இன்றைய வசூல்"
          value={formatCurrency(metrics.todayCollection)}
          subValue={`Cash: ${formatCurrency(metrics.todayCashCollection)} | UPI: ${formatCurrency(metrics.todayUpiCollection)}`}
          icon={Wallet}
          variant="default"
        />

        <MetricCard
          title="Pending Receivables"
          tamilTitle="பாக்கி தொகை"
          value={formatCurrency(metrics.totalPendingReceivables)}
          subValue="Total customer pending balance"
          icon={AlertCircle}
          variant={metrics.totalPendingReceivables > 0 ? 'warning' : 'default'}
          onClick={() => navigate('/customers')}
        />

        <MetricCard
          title="Plant Stock"
          tamilTitle="மொத்த இருப்பு"
          value={`${metrics.totalPlantsInStock} Pots`}
          subValue={`${metrics.lowStockPlants.length} varieties low on stock`}
          icon={Sprout}
          variant={metrics.lowStockPlants.length > 0 ? 'danger' : 'default'}
          onClick={() => navigate('/inventory')}
        />
      </div>

      {/* Two Column Grid: Upcoming Function Orders & Low Stock Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Function Orders */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-emerald-100 text-emerald-800 rounded-lg">
                <CalendarDays className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Upcoming Function Orders</h3>
                <p className="text-[11px] text-slate-500 font-tamil">வரவிருக்கும் விழா ஆர்டர்கள்</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/billing/functions')}
              className="text-xs text-forest-800 font-medium hover:underline flex items-center gap-1"
            >
              View All <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {metrics.upcomingFunctions.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm">
              No upcoming function orders booked.
            </div>
          ) : (
            <div className="space-y-3">
              {metrics.upcomingFunctions.slice(0, 4).map((f) => (
                <div
                  key={f.id}
                  onClick={() => navigate('/billing/functions')}
                  className="p-3.5 rounded-lg border border-slate-100 bg-slate-50/50 hover:bg-slate-100/70 cursor-pointer transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-slate-900 text-sm">{f.customer_name}</p>
                      <p className="text-xs text-slate-500">
                        📍 {f.place} • 📞 {f.customer_phone}
                      </p>
                      <p className="text-xs text-forest-800 font-medium mt-1">
                        📅 Function Date: {formatDate(f.function_date)}
                      </p>
                      {f.function_description && (
                        <p className="text-xs text-slate-600 italic mt-0.5 line-clamp-1">
                          "{f.function_description}"
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <StatusBadge status={f.status} />
                      <p className="text-xs font-mono font-bold text-slate-800 mt-2">
                        Est: {formatCurrency(f.total_amount)}
                      </p>
                      <p className="text-[11px] text-emerald-600 font-medium">
                        Adv: {formatCurrency(f.advance_amount)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-red-100 text-red-700 rounded-lg">
                <AlertCircle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Low Stock Warnings</h3>
                <p className="text-[11px] text-slate-500 font-tamil">குறைந்த இருப்பு எச்சரிக்கை</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/inventory')}
              className="text-xs text-forest-800 font-medium hover:underline flex items-center gap-1"
            >
              Open Inventory <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {metrics.lowStockPlants.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm">
              All plant stocks are currently above minimum threshold.
            </div>
          ) : (
            <div className="space-y-3">
              {metrics.lowStockPlants.slice(0, 5).map((p: Plant) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-red-100 bg-red-50/40"
                >
                  <div>
                    <h4 className="font-semibold text-slate-900 text-sm">{p.name}</h4>
                    <p className="text-xs text-slate-500 font-tamil">
                      {p.tamil_name || p.category}
                    </p>
                  </div>
                  <div className="text-right flex items-center gap-3">
                    <div>
                      <span className="text-xs font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-full font-mono">
                        {p.current_stock} left
                      </span>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Min threshold: {p.min_stock_alert}
                      </p>
                    </div>
                    <button
                      onClick={() => navigate('/inventory')}
                      className="px-2.5 py-1 text-xs font-medium bg-forest-800 hover:bg-forest-900 text-white rounded shadow-2xs"
                    >
                      Stock IN
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Transactions Stream */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Recent Bills & Transactions</h3>
            <p className="text-xs text-slate-500">Latest retail checkout and function orders</p>
          </div>
          <button
            onClick={() => navigate('/billing/retail')}
            className="text-xs text-forest-800 font-medium hover:underline flex items-center gap-1"
          >
            Create New Bill <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-medium border-y border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Bill Number</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Customer</th>
                <th className="py-2.5 px-3">Amount</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {metrics.recentBills.map((bill) => (
                <tr key={bill.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-3 font-mono font-semibold text-slate-800 text-xs">
                    {bill.bill_number}
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-sm ${
                        bill.bill_type === 'RETAIL'
                          ? 'bg-blue-50 text-blue-700'
                          : 'bg-purple-50 text-purple-700'
                      }`}
                    >
                      {bill.bill_type}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-xs text-slate-500">{formatDate(bill.created_at)}</td>
                  <td className="py-3 px-3">
                    <p className="font-medium text-slate-900 text-xs">{bill.customer_name}</p>
                    <p className="text-[11px] text-slate-400">
                      {bill.place} • {bill.customer_phone}
                    </p>
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-slate-800 text-xs">
                    {formatCurrency(bill.total_amount)}
                    {bill.balance_amount > 0 && (
                      <span className="block text-[10px] text-red-600 font-normal">
                        Due: {formatCurrency(bill.balance_amount)}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3">
                    <StatusBadge status={bill.payment_status} />
                  </td>
                  <td className="py-3 px-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setSelectedBillForReceipt(bill)}
                        title="Print / View Receipt"
                        className="p-1.5 text-slate-600 hover:text-forest-800 hover:bg-slate-100 rounded transition-colors"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => handleQuickWhatsApp(e, bill)}
                        title="Share on WhatsApp"
                        className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded transition-colors"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bill Receipt Modal */}
      {selectedBillForReceipt && (
        <BillReceiptModal
          bill={selectedBillForReceipt}
          onClose={() => {
            setSelectedBillForReceipt(null);
            refreshData();
          }}
        />
      )}
    </div>
  );
};
