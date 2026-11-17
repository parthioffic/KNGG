import React from 'react';
import { dataService } from '../../services/dataService';
import { formatCurrency, formatDate } from '../../lib/formatters';
import { BarChart3, Download, Sprout } from 'lucide-react';

export const ReportsScreen: React.FC = () => {

  const bills = dataService.getBills().filter((b) => b.status !== 'CANCELLED');
  const payments = dataService.getPayments();
  const plants = dataService.getPlants();

  // Summary Metrics
  const totalSales = bills.reduce((sum, b) => sum + b.total_amount, 0);
  const retailSales = bills
    .filter((b) => b.bill_type === 'RETAIL')
    .reduce((sum, b) => sum + b.total_amount, 0);
  const functionSales = bills
    .filter((b) => b.bill_type === 'FUNCTION')
    .reduce((sum, b) => sum + b.total_amount, 0);

  const totalCollected = payments.reduce((sum, p) => sum + p.amount, 0);
  const cashCollected = payments
    .filter((p) => p.payment_mode === 'CASH')
    .reduce((sum, p) => sum + p.amount, 0);
  const upiCollected = payments
    .filter((p) => p.payment_mode === 'UPI')
    .reduce((sum, p) => sum + p.amount, 0);

  // Plant-wise sales velocity calculation
  const plantSalesMap = new Map<string, { name: string; category: string; quantity: number; revenue: number }>();

  for (const bill of bills) {
    if (bill.items) {
      for (const item of bill.items) {
        const qty = item.actual_quantity || item.estimated_quantity;
        const rev = item.total_price;
        const existing = plantSalesMap.get(item.plant_id);
        if (existing) {
          existing.quantity += qty;
          existing.revenue += rev;
        } else {
          plantSalesMap.set(item.plant_id, {
            name: item.plant_name,
            category: plants.find((p) => p.id === item.plant_id)?.category || 'General',
            quantity: qty,
            revenue: rev,
          });
        }
      }
    }
  }

  const plantPerformance = Array.from(plantSalesMap.values()).sort((a, b) => b.revenue - a.revenue);

  // CSV Exporter
  const handleExportCSV = () => {
    const headers = ['Bill Number', 'Type', 'Date', 'Customer', 'Phone', 'Place', 'Total Amount', 'Paid', 'Balance', 'Status'];
    const rows = bills.map((b) => [
      b.bill_number,
      b.bill_type,
      formatDate(b.created_at),
      `"${b.customer_name}"`,
      b.customer_phone,
      `"${b.place}"`,
      b.total_amount.toFixed(2),
      b.paid_amount.toFixed(2),
      b.balance_amount.toFixed(2),
      b.payment_status,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `KNG_Sales_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-forest-800" />
            Financial & Sales Reports (விற்பனை அறிக்கைகள்)
          </h2>
          <p className="text-xs text-slate-500 font-tamil mt-0.5">
            வருவாய் பகுப்பாய்வு, சில்லறை vs விழா விற்பனை மற்றும் எக்செல் ஏற்றுமதி
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg shadow-xs transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>Export Sales CSV (Excel)</span>
        </button>
      </div>

      {/* Revenue Breakdown Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs font-medium text-slate-500">Gross Invoiced Sales</p>
          <h3 className="text-2xl font-bold font-mono text-slate-900 mt-1">
            {formatCurrency(totalSales)}
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">{bills.length} total bills issued</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs font-medium text-slate-500">Retail Sales (கவுண்டர்)</p>
          <h3 className="text-2xl font-bold font-mono text-blue-900 mt-1">
            {formatCurrency(retailSales)}
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {totalSales > 0 ? `${((retailSales / totalSales) * 100).toFixed(0)}%` : '0%'} of total
            revenue
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs font-medium text-slate-500">Function Orders (விழா)</p>
          <h3 className="text-2xl font-bold font-mono text-purple-900 mt-1">
            {formatCurrency(functionSales)}
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {totalSales > 0 ? `${((functionSales / totalSales) * 100).toFixed(0)}%` : '0%'} of total
            revenue
          </p>
        </div>

        <div className="bg-emerald-50 p-5 rounded-xl border border-emerald-200 shadow-xs">
          <p className="text-xs font-medium text-emerald-800">Actual Money Collected</p>
          <h3 className="text-2xl font-bold font-mono text-emerald-950 mt-1">
            {formatCurrency(totalCollected)}
          </h3>
          <p className="text-[11px] text-emerald-700 mt-0.5">
            Cash: {formatCurrency(cashCollected)} | UPI: {formatCurrency(upiCollected)}
          </p>
        </div>
      </div>

      {/* Two Column Layout: Daily Sales & Top Moving Plants */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Top Moving Plants (6 cols) */}
        <div className="lg:col-span-6 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Sprout className="w-4 h-4 text-forest-800" />
              <span>Plant Sales Performance (அதிகம் விற்பனையானவை)</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">By Revenue</span>
          </div>

          <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Plant Name</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3 text-center">Pots Sold</th>
                  <th className="py-2.5 px-3 text-right">Revenue Generated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {plantPerformance.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-semibold text-slate-800">{item.name}</td>
                    <td className="py-2.5 px-3 text-slate-500">{item.category}</td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-700">
                      {item.quantity}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-forest-900">
                      {formatCurrency(item.revenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sales by Type & Collection Channel (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          {/* Channel Breakdown Card */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <h3 className="font-bold text-slate-900 text-sm pb-3 border-b border-slate-100 mb-4">
              Payment Collection Channel Distribution
            </h3>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-emerald-800">Cash Collections (ரொக்கம்)</span>
                  <span className="font-mono">{formatCurrency(cashCollected)}</span>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-600 rounded-full transition-all"
                    style={{
                      width: `${totalCollected > 0 ? (cashCollected / totalCollected) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-blue-800">UPI / QR Collections (ஆன்லைன்)</span>
                  <span className="font-mono">{formatCurrency(upiCollected)}</span>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all"
                    style={{
                      width: `${totalCollected > 0 ? (upiCollected / totalCollected) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Quick Nursery Info Notice */}
          <div className="bg-emerald-50/70 p-5 rounded-xl border border-emerald-200 text-xs text-emerald-900 space-y-2">
            <h4 className="font-bold text-sm text-emerald-950">
              Kalaiselvi Nursery Garden Accounting Policy
            </h4>
            <p className="leading-relaxed">
              Bills distinguish <strong>Gross Invoiced Sales</strong> from <strong>Actual Cash/UPI Inflows</strong>.
              When an advance is paid or a partial bill is created, customer ledgers maintain individual payment rows
              and historical balances without overwriting transaction journals.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
