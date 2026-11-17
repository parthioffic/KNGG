import React, { useState } from 'react';
import { dataService } from '../../services/dataService';
import { useAuth } from '../auth/AuthContext';
import { BusinessSettings, Profile } from '../../types/database.types';
import { Settings, Shield, UserPlus, Save, CheckCircle2, Building, Hash } from 'lucide-react';

export const SettingsScreen: React.FC = () => {
  const { isAdmin } = useAuth();
  const [settings, setSettings] = useState<BusinessSettings>(() => dataService.getSettings());
  const [profiles, setProfiles] = useState<Profile[]>(() => dataService.getProfiles());

  // Form Fields
  const [businessName, setBusinessName] = useState(settings.business_name);
  const [tamilName, setTamilName] = useState(settings.business_name_tamil);
  const [address, setAddress] = useState(settings.address);
  const [phone1, setPhone1] = useState(settings.phones[0] || '9488782488');
  const [phone2, setPhone2] = useState(settings.phones[1] || '8531859560');
  const [phone3, setPhone3] = useState(settings.phones[2] || '8637406716');
  const [retailPrefix, setRetailPrefix] = useState(settings.retail_bill_prefix);
  const [functionPrefix, setFunctionPrefix] = useState(settings.function_bill_prefix);
  const [billFooterTamil, setBillFooterTamil] = useState(settings.bill_footer_tamil);

  // New Staff Modal
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffPhone, setNewStaffPhone] = useState('');
  const [newStaffRole, setNewStaffRole] = useState<'admin' | 'staff'>('staff');

  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const reloadProfiles = () => {
    setProfiles(dataService.getProfiles());
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = dataService.updateSettings({
      business_name: businessName,
      business_name_tamil: tamilName,
      address,
      phones: [phone1, phone2, phone3].filter(Boolean),
      retail_bill_prefix: retailPrefix,
      function_bill_prefix: functionPrefix,
      bill_footer_tamil: billFooterTamil,
    });
    setSettings(updated);
    showToast('Business settings saved successfully!');
  };

  const handleCreateStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName.trim() || !newStaffPhone.trim()) return;

    dataService.saveProfile({
      full_name: newStaffName.trim(),
      phone: newStaffPhone.trim(),
      role: newStaffRole,
      is_active: true,
    });

    reloadProfiles();
    setIsAddStaffOpen(false);
    setNewStaffName('');
    setNewStaffPhone('');
    showToast('Staff profile registered successfully!');
  };

  const handleToggleStaffStatus = (id: string) => {
    dataService.toggleProfileStatus(id);
    reloadProfiles();
    showToast('Staff status updated');
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-700 text-white px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 text-sm animate-in fade-in">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Settings className="w-5 h-5 text-forest-800" />
          Business Configuration & Staff (அமைப்புகள்)
        </h2>
        <p className="text-xs text-slate-500 font-tamil mt-0.5">
          நர்சரி முகவரி, ரசீது முன்னொட்டு எண்கள் மற்றும் பணியாளர் கணக்குகள்
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Business Profile Form (7 cols) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2 pb-2 border-b border-slate-100">
            <Building className="w-4 h-4 text-forest-800" />
            <span>Nursery Profile & Billing Parameters</span>
          </h3>

          <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Business Name (English) *</label>
                <input
                  type="text"
                  required
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  disabled={!isAdmin}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg disabled:bg-slate-100"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Business Name (Tamil) *</label>
                <input
                  type="text"
                  required
                  value={tamilName}
                  onChange={(e) => setTamilName(e.target.value)}
                  disabled={!isAdmin}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-tamil disabled:bg-slate-100"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Official Address *</label>
              <textarea
                rows={2}
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                disabled={!isAdmin}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg disabled:bg-slate-100"
              />
            </div>

            {/* Official Phones */}
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Contact Phone Numbers *</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="tel"
                  required
                  placeholder="Primary Phone"
                  value={phone1}
                  onChange={(e) => setPhone1(e.target.value)}
                  disabled={!isAdmin}
                  className="px-3 py-2 border border-slate-300 rounded-lg font-mono disabled:bg-slate-100"
                />
                <input
                  type="tel"
                  placeholder="Secondary Phone"
                  value={phone2}
                  onChange={(e) => setPhone2(e.target.value)}
                  disabled={!isAdmin}
                  className="px-3 py-2 border border-slate-300 rounded-lg font-mono disabled:bg-slate-100"
                />
                <input
                  type="tel"
                  placeholder="Alternate Phone"
                  value={phone3}
                  onChange={(e) => setPhone3(e.target.value)}
                  disabled={!isAdmin}
                  className="px-3 py-2 border border-slate-300 rounded-lg font-mono disabled:bg-slate-100"
                />
              </div>
            </div>

            {/* Bill Sequences */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-forest-800" />
                <span>Bill Numbering Sequence Configuration</span>
              </span>
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-slate-600 block mb-1">Retail Bill Prefix</label>
                  <input
                    type="text"
                    value={retailPrefix}
                    onChange={(e) => setRetailPrefix(e.target.value)}
                    disabled={!isAdmin}
                    className="w-full px-3 py-1.5 font-mono border border-slate-300 rounded-lg disabled:bg-slate-100"
                  />
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    Next: {retailPrefix}-2026-{String(settings.next_retail_seq).padStart(5, '0')}
                  </span>
                </div>

                <div>
                  <label className="text-slate-600 block mb-1">Function Order Prefix</label>
                  <input
                    type="text"
                    value={functionPrefix}
                    onChange={(e) => setFunctionPrefix(e.target.value)}
                    disabled={!isAdmin}
                    className="w-full px-3 py-1.5 font-mono border border-slate-300 rounded-lg disabled:bg-slate-100"
                  />
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    Next: {functionPrefix}-2026-{String(settings.next_function_seq).padStart(5, '0')}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Tamil Bill Footer Greeting</label>
              <input
                type="text"
                value={billFooterTamil}
                onChange={(e) => setBillFooterTamil(e.target.value)}
                disabled={!isAdmin}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-tamil disabled:bg-slate-100"
              />
            </div>

            {isAdmin && (
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-5 py-2.5 bg-forest-800 hover:bg-forest-900 text-white font-bold rounded-lg shadow-sm"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Business Profile</span>
                </button>
              </div>
            )}
          </form>
        </div>

        {/* Right: Staff Management (5 cols) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Shield className="w-4 h-4 text-forest-800" />
              <span>Staff Accounts & Roles</span>
            </h3>

            {isAdmin && (
              <button
                onClick={() => setIsAddStaffOpen(true)}
                className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg shadow-2xs"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>+ Add Staff</span>
              </button>
            )}
          </div>

          <div className="space-y-3">
            {profiles.map((p) => (
              <div
                key={p.id}
                className={`p-3.5 rounded-xl border flex items-center justify-between ${
                  p.is_active ? 'bg-slate-50 border-slate-200' : 'bg-red-50/50 border-red-200 opacity-60'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-xs">{p.full_name}</span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                        p.role === 'admin'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {p.role}
                    </span>
                  </div>
                  <p className="text-slate-500 font-mono text-[11px] mt-0.5">📞 {p.phone}</p>
                </div>

                {isAdmin && (
                  <button
                    onClick={() => handleToggleStaffStatus(p.id)}
                    className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors ${
                      p.is_active
                        ? 'bg-red-100 text-red-700 hover:bg-red-200'
                        : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                    }`}
                  >
                    {p.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="p-3 bg-slate-50 rounded-lg text-slate-500 text-[11px] space-y-1 border border-slate-200">
            <p>
              <strong>Admin Role:</strong> Can adjust stock, change settings, manage staff, and view
              financial margins.
            </p>
            <p>
              <strong>Staff Role:</strong> Restricted to counter billing, function bookings, and customer balance collections.
            </p>
          </div>
        </div>
      </div>

      {/* Add Staff Modal */}
      {isAddStaffOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <form
            onSubmit={handleCreateStaff}
            className="bg-white rounded-xl max-w-sm w-full p-5 shadow-xl border border-slate-200 space-y-4"
          >
            <h3 className="font-bold text-slate-900 text-base">Add Nursery Staff Account</h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh"
                  value={newStaffName}
                  onChange={(e) => setNewStaffName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Mobile Number (for Login) *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="10-digit number"
                  value={newStaffPhone}
                  onChange={(e) => setNewStaffPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Role *</label>
                <select
                  value={newStaffRole}
                  onChange={(e) => setNewStaffRole(e.target.value as 'admin' | 'staff')}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                >
                  <option value="staff">Staff (Billing & Stock)</option>
                  <option value="admin">Admin (Full Control)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsAddStaffOpen(false)}
                className="px-3 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-white bg-forest-800 hover:bg-forest-900 rounded-lg shadow-xs"
              >
                Create Staff Account
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
