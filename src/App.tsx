import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './features/auth/AuthContext';
import { AppLayout } from './layouts/AppLayout';
import { LoginScreen } from './features/auth/LoginScreen';
import { DashboardScreen } from './features/dashboard/DashboardScreen';
import { RetailBillingScreen } from './features/billing/RetailBillingScreen';
import { FunctionOrdersScreen } from './features/billing/FunctionOrdersScreen';
import { InventoryScreen } from './features/inventory/InventoryScreen';
import { CustomersScreen } from './features/customers/CustomersScreen';
import { PaymentsScreen } from './features/payments/PaymentsScreen';
import { ReportsScreen } from './features/reports/ReportsScreen';
import { SettingsScreen } from './features/settings/SettingsScreen';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginScreen />} />

            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardScreen />} />
              <Route path="billing/retail" element={<RetailBillingScreen />} />
              <Route path="billing/functions" element={<FunctionOrdersScreen />} />
              <Route path="inventory" element={<InventoryScreen />} />
              <Route path="customers" element={<CustomersScreen />} />
              <Route path="payments" element={<PaymentsScreen />} />
              <Route path="reports" element={<ReportsScreen />} />
              <Route path="settings" element={<SettingsScreen />} />
            </Route>

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
