import { create } from 'zustand';
import api from '@/lib/api';
import type { Platform } from './postStore';

export interface ConnectedAccount {
  id?: number;
  platform: Platform;
  username: string;
  connected: boolean;
  avatar?: string;
}

interface AccountState {
  accounts: ConnectedAccount[];
  isConnecting: Platform | null;
  isLoading: boolean;
  fetchAccounts: () => Promise<void>;
  connectAccount: (platform: Platform) => Promise<void>;
  disconnectAccount: (id: number) => Promise<void>;
  toggleConnection: (platform: Platform) => Promise<void>;
}

export const useAccountStore = create<AccountState>((set, get) => ({
  accounts: [],
  isConnecting: null,
  isLoading: false,
  fetchAccounts: async () => {
    set({ isLoading: true });
    try {
      const { data } = await api.get('/social-accounts/');
      set({ accounts: Array.isArray(data) ? data : data.results || [], isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },
  connectAccount: async (platform) => {
    set({ isConnecting: platform });
    try {
      const { data } = await api.post('/social-accounts/', { platform });
      set((state) => ({
        accounts: [...state.accounts, data],
        isConnecting: null,
      }));
    } catch {
      set({ isConnecting: null });
    }
  },
  disconnectAccount: async (id) => {
    await api.delete(`/social-accounts/${id}/`);
    set((state) => ({
      accounts: state.accounts.filter((a) => a.id !== id),
    }));
  },
  toggleConnection: async (platform) => {
    const account = get().accounts.find((a) => a.platform === platform);
    if (account?.connected && account.id) {
      await get().disconnectAccount(account.id);
    } else {
      await get().connectAccount(platform);
    }
  },
}));
