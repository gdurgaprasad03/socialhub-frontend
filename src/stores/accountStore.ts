import { create } from 'zustand';
import type { Platform } from './postStore';

export interface ConnectedAccount {
  platform: Platform;
  username: string;
  connected: boolean;
  avatar?: string;
}

interface AccountState {
  accounts: ConnectedAccount[];
  isConnecting: Platform | null;
  toggleConnection: (platform: Platform) => Promise<void>;
}

const initialAccounts: ConnectedAccount[] = [
  { platform: 'twitter', username: '@socialhub', connected: true },
  { platform: 'linkedin', username: 'SocialHub Inc.', connected: true },
  { platform: 'facebook', username: 'SocialHub', connected: false },
  { platform: 'instagram', username: '@socialhub.official', connected: false },
];

export const useAccountStore = create<AccountState>((set) => ({
  accounts: initialAccounts,
  isConnecting: null,
  toggleConnection: async (platform) => {
    set({ isConnecting: platform });
    await new Promise((resolve) => setTimeout(resolve, 1500));
    set((state) => ({
      accounts: state.accounts.map((a) =>
        a.platform === platform ? { ...a, connected: !a.connected } : a
      ),
      isConnecting: null,
    }));
  },
}));
