import { create } from 'zustand';
import axiosInstance from '@/lib/axiosInstance';

// ── Types ────────────────────────────────────────────────────────────────
export interface Plan {
  id: number | string;
  slug?: string;
  name: string;
  description?: string;
  price: number;
  currency?: string;
  interval?: 'month' | 'year' | 'monthly' | 'yearly' | string;
  credits?: number;
  credits_per_cycle?: number;
  // Backend seed shape — posts quota per billing cycle. `-1` means unlimited.
  posts_per_month?: number;
  // Max number of social accounts the plan allows.
  max_accounts?: number;
  features?: string[];
  is_popular?: boolean;
  is_free?: boolean;
  razorpay_plan_id?: string;
  [key: string]: any;
}

export interface Subscription {
  id: number | string;
  plan: Plan | null;
  plan_name?: string;
  status: 'active' | 'cancelled' | 'canceled' | 'pending' | 'past_due' | 'expired' | 'trialing' | string;
  current_period_start?: string;
  current_period_end?: string;
  cancel_at?: string;
  credits_remaining?: number;
  credits_used?: number;
  razorpay_subscription_id?: string;
  [key: string]: any;
}

export interface Usage {
  credits_remaining: number;
  credits_used: number;
  credits_total: number;
  period_start?: string;
  period_end?: string;
  usage_by_platform?: Record<string, number>;
  [key: string]: any;
}

export interface SubscribeResponse {
  subscription_id?: string;
  order_id?: string;
  razorpay_subscription_id?: string;
  razorpay_order_id?: string;
  razorpay_key_id?: string;
  key?: string;
  key_id?: string;
  amount?: number;
  currency?: string;
  name?: string;
  description?: string;
  [key: string]: any;
}

// ── Helpers ──────────────────────────────────────────────────────────────
const extractError = (error: any, fallback: string): string => {
  const data = error?.response?.data;
  if (!data) return fallback;
  if (typeof data === 'string') return data;
  if (data.error) return String(data.error);
  if (data.detail) return String(data.detail);
  if (data.message) return String(data.message);
  try {
    return Object.values(data).flat().filter((v) => typeof v === 'string').join(' ') || fallback;
  } catch {
    return fallback;
  }
};

const normalizeArray = <T,>(data: any): T[] => (Array.isArray(data) ? data : data?.results || []);

// ── Store ────────────────────────────────────────────────────────────────
interface BillingState {
  plans: Plan[];
  subscription: Subscription | null;
  usage: Usage | null;
  isLoadingPlans: boolean;
  isLoadingSubscription: boolean;
  isLoadingUsage: boolean;
  isSubscribing: boolean;
  isCancelling: boolean;

  fetchPlans: () => Promise<Plan[]>;
  fetchSubscription: () => Promise<Subscription | null>;
  fetchUsage: () => Promise<Usage | null>;
  fetchAll: () => Promise<void>;
  subscribe: (planId: number | string) => Promise<SubscribeResponse>;
  cancelSubscription: () => Promise<void>;
}

export const useBillingStore = create<BillingState>((set, get) => ({
  plans: [],
  subscription: null,
  usage: null,
  isLoadingPlans: false,
  isLoadingSubscription: false,
  isLoadingUsage: false,
  isSubscribing: false,
  isCancelling: false,

  fetchPlans: async () => {
    set({ isLoadingPlans: true });
    try {
      const { data } = await axiosInstance.get('/plans/');
      const plans = normalizeArray<Plan>(data);
      set({ plans, isLoadingPlans: false });
      return plans;
    } catch (error: any) {
      set({ isLoadingPlans: false });
      throw extractError(error, 'Failed to load plans');
    }
  },

  fetchSubscription: async () => {
    set({ isLoadingSubscription: true });
    try {
      const { data } = await axiosInstance.get('/subscription/');
      // Backend might return null / empty object / subscription object
      const sub: Subscription | null = data && (data.id || data.plan || data.status) ? data : null;
      set({ subscription: sub, isLoadingSubscription: false });
      return sub;
    } catch (error: any) {
      set({ isLoadingSubscription: false });
      // 404 or no subscription is fine — just null
      if (error?.response?.status === 404) {
        set({ subscription: null });
        return null;
      }
      throw extractError(error, 'Failed to load subscription');
    }
  },

  fetchUsage: async () => {
    set({ isLoadingUsage: true });
    try {
      const { data } = await axiosInstance.get('/usage/');
      const remaining = Number(
        data?.credits_remaining ??
          data?.remaining ??
          data?.posts_remaining ??
          data?.posts_left ??
          0
      );
      const used = Number(
        data?.credits_used ??
          data?.used ??
          data?.posts_used ??
          data?.posts_this_month ??
          0
      );
      const totalFromBackend =
        data?.credits_total ?? data?.total ?? data?.posts_limit ?? data?.posts_per_month;
      const total =
        totalFromBackend !== undefined && totalFromBackend !== null
          ? Number(totalFromBackend)
          : remaining + used;
      const usage: Usage = {
        credits_remaining: remaining,
        credits_used: used,
        credits_total: total,
        period_start: data?.period_start,
        period_end: data?.period_end,
        usage_by_platform: data?.usage_by_platform,
        ...data,
      };
      set({ usage, isLoadingUsage: false });
      return usage;
    } catch (error: any) {
      set({ isLoadingUsage: false });
      if (error?.response?.status === 404) {
        set({ usage: null });
        return null;
      }
      throw extractError(error, 'Failed to load usage');
    }
  },

  fetchAll: async () => {
    const { fetchPlans, fetchSubscription, fetchUsage } = get();
    await Promise.allSettled([fetchPlans(), fetchSubscription(), fetchUsage()]);
  },

  subscribe: async (planId) => {
    set({ isSubscribing: true });
    try {
      const { data } = await axiosInstance.post('/subscribe/', { plan_id: planId });
      set({ isSubscribing: false });
      return data as SubscribeResponse;
    } catch (error: any) {
      set({ isSubscribing: false });
      throw extractError(error, 'Failed to create subscription');
    }
  },

  cancelSubscription: async () => {
    set({ isCancelling: true });
    try {
      await axiosInstance.post('/cancel/');
      // refresh state
      try {
        await get().fetchSubscription();
        await get().fetchUsage();
      } catch {
        /* ignore */
      }
      set({ isCancelling: false });
    } catch (error: any) {
      set({ isCancelling: false });
      throw extractError(error, 'Failed to cancel subscription');
    }
  },
}));
