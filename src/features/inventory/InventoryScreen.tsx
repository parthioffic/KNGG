import React, { useState } from 'react';
import { dataService } from '../../services/dataService';
import { useAuth } from '../auth/AuthContext';
import { Plant, StockMovement } from '../../types/database.types';
import { PLANT_CATEGORIES, PlantCategory } from '../../lib/constants';
import { formatCurrency, formatDateTime } from '../../lib/formatters';
import {
  Sprout,
  Plus,
  History,
  AlertCircle,
  Search,
  CheckCircle2,
  X,
} from 'lucide-react';

export const InventoryScreen: React.FC = () => {
  const { isAdmin } = useAuth();
  const [plants, setPlants] = useState<Plant[]>(() => dataService.getPlants());
  const [movements, setMovements] = useState<StockMovement[]>(() =>
    dataService.getStockMovements()
  );

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [activeTab, setActiveTab] = useState<'catalog' | 'history'>('catalog');

  // Modals
  const [isAddPlantOpen, setIsAddPlantOpen] = useState(false);
  const [stockInPlant, setStockInPlant] = useState<Plant | null>(null);
  const [adjustmentPlant, setAdjustmentPlant] = useState<Plant | null>(null);

  // Form States
  const [stockInQty, setStockInQty] = useState<number>(50);
  const [stockInNotes, setStockInNotes] = useState('');

  const [physicalCount, setPhysicalCount] = useState<number>(0);
  const [adjustmentReason, setAdjustmentReason] = useState('Damaged / Died');

  const [newPlantName, setNewPlantName] = useState('');
  const [newPlantTamil, setNewPlantTamil] = useState('');
  const [newPlantCat, setNewPlantCat] = useState<PlantCategory>('Flowering Plants');
  const [newPlantRate, setNewPlantRate] = useState<number>(50);
  const [newPlantStock, setNewPlantStock] = useState<number>(25);
  const [newPlantMinAlert, setNewPlantMinAlert] = useState<number>(10);

  const [successToast, setSuccessToast] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const reloadData = () => {
    setPlants(dataService.getPlants());
    setMovements(dataService.getStockMovements());
  };

  const filteredPlants = plants.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.tamil_name && p.tamil_name.includes(searchQuery));
    const matchesCat = selectedCategory === 'ALL' || p.category === selectedCategory;
    const matchesLowStock = !showLowStockOnly || p.current_stock <= p.min_stock_alert;
    return matchesSearch && matchesCat && matchesLowStock;
  });

  // Handle Add Plant
  const handleCreatePlant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlantName.trim()) return;

    dataService.createPlant({
      name: newPlantName.trim(),
      tamil_name: newPlantTamil.trim() || null,
      category: newPlantCat,
      selling_price: newPlantRate,
      current_stock: newPlantStock,
      min_stock_alert: newPlantMinAlert,
      is_active: true,
    });

    reloadData();
    setIsAddPlantOpen(false);
    setNewPlantName('');
    setNewPlantTamil('');
    setNewPlantRate(50);
    setNewPlantStock(25);
    showNotification('Plant added to catalog successfully!');
  };

  // Handle Stock IN
  const handleStockInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockInPlant) return;

    const res = dataService.performStockIn(stockInPlant.id, stockInQty, stockInNotes);
    if (res.success) {
      reloadData();
      setStockInPlant(null);
      setStockInQty(50);
      setStockInNotes('');
      showNotification(`Added ${stockInQty} pots to "${stockInPlant.name}"`);
    }
  };

  // Handle Stock Adjustment (Admin only)
  const handleAdjustmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustmentPlant) return;

    const res = dataService.performStockAdjustment(
      adjustmentPlant.id,
      physicalCount,
      adjustmentReason
    );
    if (res.success) {
      reloadData();
      setAdjustmentPlant(null);
      showNotification(`Stock adjusted for "${adjustmentPlant.name}" to ${physicalCount}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-700 text-white px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 text-sm animate-in fade-in">
          <CheckCircle2 className="w-4 h-4" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Screen Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Sprout className="w-5 h-5 text-forest-800" />
            Plant Inventory (செடிகள் இருப்பு மேலாண்மை)
          </h2>
          <p className="text-xs text-slate-500 font-tamil mt-0.5">
            செடிகள் பட்டியல், விற்பனை விலை, இருப்பு வரவு மற்றும் தணிக்கை வரலாறு
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Tab Selector */}
          <div className="flex bg-slate-100 p-0.5 rounded-lg text-xs font-semibold">
            <button
              onClick={() => setActiveTab('catalog')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                activeTab === 'catalog'
                  ? 'bg-white text-forest-900 shadow-2xs font-bold'
                  : 'text-slate-600'
              }`}
            >
              Plant Catalog
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                activeTab === 'history'
                  ? 'bg-white text-forest-900 shadow-2xs font-bold'
                  : 'text-slate-600'
              }`}
            >
              Movement History
            </button>
          </div>

          <button
            onClick={() => setIsAddPlantOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-forest-800 hover:bg-forest-900 text-white text-xs font-semibold rounded-lg shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Plant</span>
          </button>
        </div>
      </div>

      {activeTab === 'catalog' ? (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="relative flex-1 w-full">
              <input
                type="text"
                placeholder="Search plants by English or Tamil name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs px-3 py-2 pl-9 border border-slate-300 rounded-lg focus:ring-1 focus:ring-forest-800 focus:outline-none"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 focus:outline-none"
              >
                <option value="ALL">All Categories</option>
                {PLANT_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => setShowLowStockOnly(!showLowStockOnly)}
                className={`flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold border transition-colors shrink-0 ${
                  showLowStockOnly
                    ? 'bg-red-50 text-red-700 border-red-300'
                    : 'bg-slate-50 text-slate-600 border-slate-200'
                }`}
              >
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Low Stock Only</span>
              </button>
            </div>
          </div>

          {/* Plants Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Plant Variety</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Selling Rate</th>
                    <th className="py-3 px-4">Current Stock</th>
                    <th className="py-3 px-4">Stock Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPlants.map((plant) => {
                    const isLow = plant.current_stock <= plant.min_stock_alert;
                    return (
                      <tr key={plant.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <p className="font-bold text-slate-900 text-sm">{plant.name}</p>
                          {plant.tamil_name && (
                            <p className="text-slate-500 font-tamil text-xs">{plant.tamil_name}</p>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                            {plant.category}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-forest-900 text-sm">
                          {formatCurrency(plant.selling_price)}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-900 text-sm">
                          {plant.current_stock} Pots
                        </td>
                        <td className="py-3 px-4">
                          {isLow ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-full">
                              <AlertCircle className="w-3 h-3" />
                              Low Stock (&lt;{plant.min_stock_alert})
                            </span>
                          ) : (
                            <span className="text-[11px] font-medium text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                              In Stock
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setStockInPlant(plant);
                                setStockInQty(50);
                              }}
                              className="px-2.5 py-1 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-md shadow-2xs"
                            >
                              Stock IN
                            </button>
                            {isAdmin && (
                              <button
                                onClick={() => {
                                  setAdjustmentPlant(plant);
                                  setPhysicalCount(plant.current_stock);
                                }}
                                className="px-2.5 py-1 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md"
                              >
                                Adjust
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Stock Movement Audit History */
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <History className="w-4 h-4 text-forest-800" />
              <span>Immutable Inventory Audit Ledger</span>
            </h3>
            <span className="text-xs text-slate-400">Total Entries: {movements.length}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Date & Time</th>
                  <th className="py-2.5 px-3">Plant Name</th>
                  <th className="py-2.5 px-3">Movement Type</th>
                  <th className="py-2.5 px-3 text-center">Change</th>
                  <th className="py-2.5 px-3">Previous</th>
                  <th className="py-2.5 px-3">New Stock</th>
                  <th className="py-2.5 px-3">Remarks / Order</th>
                  <th className="py-2.5 px-3">Logged By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {movements.map((m) => {
                  const isPositive = m.quantity > 0;
                  return (
                    <tr key={m.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 text-slate-500">{formatDateTime(m.created_at)}</td>
                      <td className="py-2.5 px-3 font-sans font-semibold text-slate-900">
                        {m.plant?.name || 'Plant'}
                      </td>
                      <td className="py-2.5 px-3 font-sans">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                          {m.movement_type}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold">
                        <span className={isPositive ? 'text-emerald-700' : 'text-red-600'}>
                          {isPositive ? `+${m.quantity}` : m.quantity}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-500">{m.previous_stock}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">{m.new_stock}</td>
                      <td className="py-2.5 px-3 font-sans text-slate-600 text-[11px]">
                        {m.notes || '—'}
                      </td>
                      <td className="py-2.5 px-3 font-sans text-slate-500">
                        {m.created_by_profile?.full_name?.split(' ')[0] || 'Staff'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Stock IN Modal */}
      {stockInPlant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <form
            onSubmit={handleStockInSubmit}
            className="bg-white rounded-xl max-w-sm w-full p-5 shadow-xl border border-slate-200 space-y-4"
          >
            <h3 className="font-bold text-slate-900 text-base">
              Stock IN: {stockInPlant.name}
            </h3>
            <p className="text-xs text-slate-500">Current Stock: {stockInPlant.current_stock} pots</p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Quantity to Add *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={stockInQty}
                  onChange={(e) => setStockInQty(parseFloat(e.target.value) || 1)}
                  className="w-full px-3 py-2 font-mono font-bold text-emerald-800 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Source / Batch Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Bangalore Lorry Batch / Garden Propagation"
                  value={stockInNotes}
                  onChange={(e) => setStockInNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setStockInPlant(null)}
                className="px-3 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs"
              >
                Confirm Stock IN
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Stock Adjustment Modal (Admin Only) */}
      {adjustmentPlant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <form
            onSubmit={handleAdjustmentSubmit}
            className="bg-white rounded-xl max-w-sm w-full p-5 shadow-xl border border-slate-200 space-y-4"
          >
            <h3 className="font-bold text-slate-900 text-base">
              Stock Adjustment: {adjustmentPlant.name}
            </h3>
            <p className="text-xs text-slate-500">
              Current System Stock: <strong>{adjustmentPlant.current_stock}</strong>
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Actual Physical Verified Count *
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={physicalCount}
                  onChange={(e) => setPhysicalCount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 font-mono font-bold text-slate-900 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Reason for Discrepancy *
                </label>
                <select
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                >
                  <option value="Damaged / Died">Damaged / Plant Died (உலர்ந்தவை)</option>
                  <option value="Physical Count Correction">Count Error (எண்ணிக்கை திருத்தம்)</option>
                  <option value="Customer Return">Customer Return (திரும்பப் பெறப்பட்டது)</option>
                  <option value="Nursery Internal Use">Internal Use (தோட்ட பயன்பாடு)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setAdjustmentPlant(null)}
                className="px-3 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-xs"
              >
                Save Adjustment
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add Plant Modal */}
      {isAddPlantOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <form
            onSubmit={handleCreatePlant}
            className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Add Plant Variety to Catalog</h3>
              <button onClick={() => setIsAddPlantOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Plant Name (English) *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Jasmine / Malli"
                    value={newPlantName}
                    onChange={(e) => setNewPlantName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Tamil Name</label>
                  <input
                    type="text"
                    placeholder="e.g. மல்லிகை"
                    value={newPlantTamil}
                    onChange={(e) => setNewPlantTamil(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-tamil"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Category *</label>
                <select
                  value={newPlantCat}
                  onChange={(e) => setNewPlantCat(e.target.value as PlantCategory)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                >
                  {PLANT_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Selling Rate (₹) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={newPlantRate}
                    onChange={(e) => setNewPlantRate(parseFloat(e.target.value) || 0)}
                    className="w-full px-2 py-1.5 font-mono border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Initial Stock *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={newPlantStock}
                    onChange={(e) => setNewPlantStock(parseFloat(e.target.value) || 0)}
                    className="w-full px-2 py-1.5 font-mono border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Low Stock Alert *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newPlantMinAlert}
                    onChange={(e) => setNewPlantMinAlert(parseFloat(e.target.value) || 1)}
                    className="w-full px-2 py-1.5 font-mono border border-slate-300 rounded-lg"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsAddPlantOpen(false)}
                className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-semibold text-white bg-forest-800 hover:bg-forest-900 rounded-lg shadow-xs"
              >
                Save Plant
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
