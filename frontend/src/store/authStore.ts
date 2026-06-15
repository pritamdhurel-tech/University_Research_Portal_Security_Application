import { create } from 'zustand';
import type { User } from '../types';
import { tokenStore } from '../services/api';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  // Actions
  setUser: (user: User | null) => void;
  setLoading: (v: boolean) => void;
  login: (user: User, accessToken: string, refreshToken: string) => void;
  logout: () => void;
  // Helpers
  hasRole: (roles: string | string[]) => boolean;
  isAdmin: () => boolean;
  isStaff: () => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true, // true on boot until we verify token

  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setLoading: (isLoading) => set({ isLoading }),

  login: (user, accessToken, refreshToken) => {
    tokenStore.setAccess(accessToken);
    tokenStore.setRefresh(refreshToken);
    set({ user, isAuthenticated: true, isLoading: false });
  },

  logout: () => {
    tokenStore.clear();
    set({ user: null, isAuthenticated: false, isLoading: false });
  },

  hasRole: (roles) => {
    const { user } = get();
    if (!user) return false;
    const arr = Array.isArray(roles) ? roles : [roles];
    return arr.includes(user.role);
  },

  isAdmin: () => get().hasRole('ADMIN'),
  isStaff: () => get().hasRole(['ADMIN', 'STAFF']),
}));
