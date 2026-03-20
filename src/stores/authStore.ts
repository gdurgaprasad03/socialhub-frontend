import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      login: async (email: string, _password: string) => {
        set({ isLoading: true });
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const user = { id: '1', email, name: email.split('@')[0] };
        set({ user, token: 'mock-jwt-token', isAuthenticated: true, isLoading: false });
      },
      register: async (name: string, email: string, _password: string) => {
        set({ isLoading: true });
        await new Promise((resolve) => setTimeout(resolve, 1200));
        const user = { id: '1', email, name };
        set({ user, token: 'mock-jwt-token', isAuthenticated: true, isLoading: false });
      },
      logout: () => {
        set({ user: null, token: null, isAuthenticated: false });
      },
      setLoading: (loading: boolean) => set({ isLoading: loading }),
    }),
    { name: 'socialhub-auth' }
  )
);
