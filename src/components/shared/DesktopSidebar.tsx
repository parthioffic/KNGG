import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Receipt,
  CalendarDays,
  Sprout,
  Users,
  CreditCard,
  BarChart3,
  Settings,
  PlusCircle,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { BUSINESS_PROFILE } from '../../lib/constants';

interface NavItem {
  label: string;
  tamilLabel: string;
  to: string;
  icon: React.ElementType;
}

const NAV_ITEMS: NavItem[] = [
  {
    label: 'Dashboard',
    tamilLabel: 'முகப்பு',
    to: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'Retail Billing',
    tamilLabel: 'சில்லறை விற்பனை',
    to: '/billing/retail',
    icon: Receipt,
  },
  {
    label: 'Function Orders',
    tamilLabel: 'விழா ஆர்டர்கள்',
    to: '/billing/functions',
    icon: CalendarDays,
  },
  {
    label: 'Plant Inventory',
    tamilLabel: 'செடிகள் இருப்பு',
    to: '/inventory',
    icon: Sprout,
  },
  {
    label: 'Customers',
    tamilLabel: 'வாடிக்கையாளர்கள்',
    to: '/customers',
    icon: Users,
  },
  {
    label: 'Payments',
    tamilLabel: 'பணம் வசூல்',
    to: '/payments',
    icon: CreditCard,
  },
  {
    label: 'Reports',
    tamilLabel: 'விற்பனை அறிக்கை',
    to: '/reports',
    icon: BarChart3,
  },
  {
    label: 'Settings',
    tamilLabel: 'அமைப்புகள்',
    to: '/settings',
    icon: Settings,
  },
];

export const DesktopSidebar: React.FC = () => {
  return (
    <aside className="hidden lg:flex flex-col w-64 bg-slate-900 text-white min-h-screen border-r border-slate-800 shrink-0">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-forest-600 flex items-center justify-center text-white shadow-md">
          <Sprout className="w-6 h-6" />
        </div>
        <div>
          <h2 className="font-bold text-sm text-emerald-400 tracking-wide uppercase">
            KNG Management
          </h2>
          <p className="text-xs text-slate-400 font-tamil truncate max-w-[150px]">
            {BUSINESS_PROFILE.tamilName}
          </p>
        </div>
      </div>

      {/* Quick POS Action */}
      <div className="p-4">
        <NavLink
          to="/billing/retail"
          className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm rounded-lg shadow-md transition-colors"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Retail Bill</span>
        </NavLink>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-2 space-y-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-forest-800 text-white shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                )
              }
            >
              <Icon className="w-5 h-5 shrink-0" />
              <div className="flex flex-col leading-snug">
                <span>{item.label}</span>
                <span className="text-[11px] text-slate-400 font-tamil">{item.tamilLabel}</span>
              </div>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800 text-xs text-slate-400">
        <p className="font-medium text-slate-300">Kalaiselvi Nursery</p>
        <p className="text-[11px] text-slate-500">Mailam Road, Kutteripattu</p>
        <p className="text-[10px] text-emerald-500 mt-1">● Single Business POS v1.0</p>
      </div>
    </aside>
  );
};
