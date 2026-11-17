import React from 'react';
import { useAuth } from '../../features/auth/AuthContext';
import { dataService } from '../../services/dataService';
import { BUSINESS_PROFILE } from '../../lib/constants';
import { Sprout, User, Shield, LogOut } from 'lucide-react';
import { formatDateTime } from '../../lib/formatters';

export const AppHeader: React.FC = () => {
  const { user, switchUser, logout, isAdmin } = useAuth();
  const profiles = dataService.getProfiles();
  const [currentTime, setCurrentTime] = React.useState(new Date());

  React.useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 px-4 lg:px-8 py-2.5 flex items-center justify-between shadow-xs">
      {/* Brand Title for Mobile */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-forest-800 text-white rounded-lg flex items-center justify-center">
          <Sprout className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base lg:text-lg font-bold text-forest-950 leading-tight">
              {BUSINESS_PROFILE.name}
            </h1>
            <span className="hidden sm:inline-block px-2 py-0.5 text-xs font-semibold bg-emerald-100 text-emerald-800 rounded">
              Kutteripattu
            </span>
          </div>
          <p className="text-xs text-slate-500 font-tamil hidden sm:block">
            {BUSINESS_PROFILE.tamilName} • {BUSINESS_PROFILE.primaryPhone}
          </p>
        </div>
      </div>

      {/* User Status, Role Switcher, & Time */}
      <div className="flex items-center gap-3">
        <div className="hidden md:block text-right pr-3 border-r border-slate-200">
          <p className="text-xs text-slate-400">Current Session</p>
          <p className="text-xs font-semibold text-slate-700">{formatDateTime(currentTime)}</p>
        </div>

        {/* Staff Switcher */}
        {user && (
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
            <div className="p-1 rounded-full bg-forest-100 text-forest-800">
              {isAdmin ? <Shield className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
            </div>
            <div className="text-left text-xs">
              <span className="font-semibold text-slate-800 block leading-tight">{user.full_name}</span>
              <span className="text-slate-500 uppercase font-mono text-[10px]">
                {user.role} • {user.phone}
              </span>
            </div>

            {/* Quick Profile Switcher for testing/demo */}
            <select
              value={user.id}
              onChange={(e) => switchUser(e.target.value)}
              className="ml-2 text-xs bg-white border border-slate-300 rounded px-1.5 py-0.5 text-slate-600 focus:outline-none focus:ring-1 focus:ring-forest-800"
              title="Switch Staff Account"
            >
              {profiles
                .filter((p) => p.is_active)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    Switch to: {p.full_name} ({p.role})
                  </option>
                ))}
            </select>

            <button
              onClick={logout}
              title="Logout"
              className="ml-1 p-1 text-slate-400 hover:text-red-600 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
