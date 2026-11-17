import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Receipt,
  CalendarDays,
  Sprout,
  Menu,
  Users,
  CreditCard,
  BarChart3,
  Settings,
  X,
} from 'lucide-react';
import { cn } from '../../lib/utils';

export const MobileBottomNav: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const mainTabs = [
    { label: 'Home', to: '/dashboard', icon: LayoutDashboard },
    { label: 'Retail Bill', to: '/billing/retail', icon: Receipt },
    { label: 'Functions', to: '/billing/functions', icon: CalendarDays },
    { label: 'Plants', to: '/inventory', icon: Sprout },
  ];

  const secondaryTabs = [
    { label: 'Customers / வாடிக்கையாளர்கள்', to: '/customers', icon: Users },
    { label: 'Payments / பணம் வசூல்', to: '/payments', icon: CreditCard },
    { label: 'Reports / விற்பனை அறிக்கை', to: '/reports', icon: BarChart3 },
    { label: 'Settings / அமைப்புகள்', to: '/settings', icon: Settings },
  ];

  return (
    <>
      {/* Slide-over Drawer for 'More' */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden bg-black/60 backdrop-blur-xs flex flex-col justify-end">
          <div className="bg-white rounded-t-2xl p-5 shadow-2xl border-t border-slate-200 animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900">More Modules</h3>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="grid grid-cols-1 gap-2 py-3">
              {secondaryTabs.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setIsMenuOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 p-3 rounded-xl text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-forest-100 text-forest-900 font-semibold'
                          : 'text-slate-700 hover:bg-slate-50'
                      )
                    }
                  >
                    <div className="p-2 rounded-lg bg-emerald-50 text-forest-800">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Fixed Bottom Touch Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 shadow-lg px-2 py-1 flex items-center justify-around h-16">
        {mainTabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center justify-center flex-1 h-full py-1 text-[11px] font-medium transition-colors',
                  isActive ? 'text-forest-800 font-semibold' : 'text-slate-500 hover:text-slate-900'
                )
              }
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span>{tab.label}</span>
            </NavLink>
          );
        })}

        {/* More Button */}
        <button
          type="button"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className={cn(
            'flex flex-col items-center justify-center flex-1 h-full py-1 text-[11px] font-medium transition-colors',
            isMenuOpen ? 'text-forest-800 font-semibold' : 'text-slate-500 hover:text-slate-900'
          )}
        >
          <Menu className="w-5 h-5 mb-0.5" />
          <span>More</span>
        </button>
      </nav>
    </>
  );
};
