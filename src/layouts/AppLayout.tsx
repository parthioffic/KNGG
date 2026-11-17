import React from 'react';
import { Outlet } from 'react-router-dom';
import { DesktopSidebar } from '../components/shared/DesktopSidebar';
import { AppHeader } from '../components/shared/AppHeader';
import { MobileBottomNav } from '../components/shared/MobileBottomNav';

export const AppLayout: React.FC = () => {
  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Desktop Fixed Sidebar */}
      <DesktopSidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <AppHeader />
        <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto pb-24 lg:pb-8">
          <Outlet />
        </main>
        {/* Mobile Fixed Bottom Navigation */}
        <MobileBottomNav />
      </div>
    </div>
  );
};
