import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { useNavigate } from 'react-router-dom';
import { BUSINESS_PROFILE } from '../../lib/constants';
import { Profile } from '../../types/database.types';
import { Sprout, Phone, ArrowRight, ShieldCheck, UserCheck } from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [phone, setPhone] = useState('9488782488');
  const [multipleProfiles, setMultipleProfiles] = useState<Profile[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMultipleProfiles(null);
    const res = login(phone);
    if (res.success) {
      navigate('/dashboard');
    } else if (res.multiple && res.multiple.length > 0) {
      setMultipleProfiles(res.multiple);
    } else {
      setError(res.error || 'Login failed');
    }
  };

  const handleSelectProfile = (profileId: string) => {
    const res = login(phone, profileId);
    if (res.success) {
      navigate('/dashboard');
    } else {
      setError(res.error || 'Login failed');
    }
  };

  const handleQuickDemo = (demoPhone: string, profileId?: string) => {
    const res = login(demoPhone, profileId);
    if (res.success) {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-2xl bg-forest-800 text-white flex items-center justify-center shadow-lg">
            <Sprout className="w-10 h-10" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl font-extrabold text-slate-900 tracking-tight">
          {BUSINESS_PROFILE.name}
        </h2>
        <h3 className="text-center text-base font-bold font-tamil text-forest-800 mt-1">
          {BUSINESS_PROFILE.tamilName}
        </h3>
        <p className="mt-1 text-center text-xs text-slate-500">
          📍 {BUSINESS_PROFILE.shortAddress}
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl rounded-2xl border border-slate-200 sm:px-10">
          <form className="space-y-4" onSubmit={handleSubmit}>
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="phone" className="block text-xs font-semibold text-slate-700 mb-1">
                Registered Mobile Number
              </label>
              <div className="relative">
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  placeholder="Enter 10-digit mobile number"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    setMultipleProfiles(null);
                  }}
                  className="w-full px-3 py-2.5 pl-9 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-forest-800 focus:outline-none"
                />
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            {/* If multiple profiles share the same phone number */}
            {multipleProfiles && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
                <p className="text-xs font-semibold text-emerald-900">
                  Multiple staff members share this phone. Select your name:
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {multipleProfiles.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleSelectProfile(p.id)}
                      className="p-2 bg-white border border-emerald-300 hover:bg-emerald-100 rounded-lg text-xs font-bold text-slate-800 text-left transition-colors"
                    >
                      {p.full_name}
                      <span className="block text-[10px] text-slate-500 font-normal uppercase">
                        {p.role}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-forest-800 hover:bg-forest-900 transition-colors"
              >
                <span>Access Management System</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>

          {/* Quick Staff Logins */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-center mb-3">
              Staff & Admin Accounts (பணியாளர் நுழைவு)
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickDemo('9488782488', 'a84d128c-c212-4187-95f5-f0e285629e29')}
                className="p-2.5 rounded-lg border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-900 font-semibold text-left transition-colors flex items-center gap-2"
              >
                <ShieldCheck className="w-4 h-4 text-purple-700 shrink-0" />
                <div>
                  <span className="block text-xs font-bold">Viswanathan R</span>
                  <span className="text-[10px] text-purple-700 font-mono">Admin (9488782488)</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo('8531859560', 'cb0ec9ea-0cd7-4dfa-b239-bab84b1537e1')}
                className="p-2.5 rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-semibold text-left transition-colors flex items-center gap-2"
              >
                <UserCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                <div>
                  <span className="block text-xs font-bold">Sridhar V</span>
                  <span className="text-[10px] text-emerald-700 font-mono">Staff (8531859560)</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo('8637406716', '11c0dbfc-6c70-4eb9-94da-3e6d17423f94')}
                className="p-2.5 rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-semibold text-left transition-colors flex items-center gap-2"
              >
                <UserCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                <div>
                  <span className="block text-xs font-bold">Parthiban V</span>
                  <span className="text-[10px] text-emerald-700 font-mono">Staff (8637406716)</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo('8637406716', '410a2a7f-2d6a-4199-b442-742f2e61f63c')}
                className="p-2.5 rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-semibold text-left transition-colors flex items-center gap-2"
              >
                <UserCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                <div>
                  <span className="block text-xs font-bold">Janaki V</span>
                  <span className="text-[10px] text-emerald-700 font-mono">Staff (8637406716)</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
