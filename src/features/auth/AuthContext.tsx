import React, { createContext, useContext, useState, useEffect } from 'react';
import { Profile } from '../../types/database.types';
import { dataService } from '../../services/dataService';

interface AuthContextType {
  user: Profile | null;
  role: 'admin' | 'staff' | null;
  isAdmin: boolean;
  login: (phone: string, profileId?: string) => { success: boolean; user?: Profile; multiple?: Profile[]; error?: string };
  logout: () => void;
  switchUser: (profileId: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Profile | null>(() => dataService.getCurrentUser());

  useEffect(() => {
    if (user) {
      dataService.setCurrentUser(user);
    }
  }, [user]);

  const login = (phone: string, profileId?: string) => {
    const res = dataService.login(phone, profileId);
    if (res.success && res.user) {
      setUser(res.user);
      return { success: true, user: res.user };
    }
    return res;
  };

  const logout = () => {
    dataService.logout();
    setUser(null);
  };

  const switchUser = (profileId: string) => {
    const profiles = dataService.getProfiles();
    const target = profiles.find((p) => p.id === profileId);
    if (target && target.is_active) {
      setUser(target);
      dataService.setCurrentUser(target);
    }
  };

  const role = user?.role || null;
  const isAdmin = role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isAdmin,
        login,
        logout,
        switchUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
