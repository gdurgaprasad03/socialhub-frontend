import { useEffect, useMemo, useState } from 'react';
import { useBillingStore, type Plan } from '@/stores/billingStore';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { openRazorpay } from '@/lib/razorpay';
import {
  Sparkles,
  Check,
  Crown,
  Zap,
  Gauge,
  Loader2,
  CreditCard,
  Infinity as InfinityIcon,
  Shield,
  XCircle,
  Calendar,
  TrendingUp,
  Users2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const formatCurrency = (amount: number, currency: string = 'INR') => {
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency || 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency || '₹'} ${amount}`;
  }
};

// Render "monthly" / "month" / "year" cleanly.
const normalizeInterval = (raw: string): string => {
  if (!raw) return 'month';
  if (raw === 'monthly') return 'month';
  if (raw === 'yearly' || raw === 'annually') return 'year';
  return raw;
};

// Normalize a plan's fields from the backend seed shape into a consistent
// render-ready object.
const normalizePlan = (p: Plan) => {
  const slug = (p.slug || '').toString().toLowerCase();
  const postsPerMonth =
    p.posts_per_month !== undefined && p.posts_per_month !== null
      ? Number(p.posts_per_month)
      : Number(p.credits ?? p.credits_per_cycle ?? 0);
  const maxAccounts =
    p.max_accounts !== undefined && p.max_accounts !== null ? Number(p.max_accounts) : null;
  const unlimitedPosts = postsPerMonth < 0;
  const unlimitedAccounts = typeof maxAccounts === 'number' && maxAccounts < 0;

  // Build the feature list: auto-derived capabilities + any extra features
  // returned by the backend.
  const autoFeatures: string[] = [];
  autoFeatures.push(
    unlimitedPosts
      ? 'Unlimited posts per month'
      : `${postsPerMonth.toLocaleString()} posts per month`
  );
  if (typeof maxAccounts === 'number') {
    autoFeatures.push(
      unlimitedAccounts
        ? 'Unlimited connected accounts'
        : `${maxAccounts} connected account${maxAccounts === 1 ? '' : 's'}`
    );
  }
  // Slug-driven value props so each tier feels distinct.
  const extras: Record<string, string[]> = {
    free: ['Core composer & calendar', 'Community support'],
    starter: ['Schedule & queue', 'Per-network previews', 'Email support'],
    pro: ['Analytics & reports', 'Team collaboration', 'Priority support'],
    agency: ['White-label exports', 'Dedicated success manager', 'SLA-backed uptime'],
  };
  const slugExtras = extras[slug] ?? [];
  const backendFeatures = Array.isArray(p.features) ? p.features : [];

  return {
    id: p.id,
    slug,
    name: p.name || 'Plan',
    description: p.description || '',
    price: Number(p.price ?? 0),
    currency: p.currency || 'INR',
    interval: normalizeInterval(p.interval || 'month'),
    postsPerMonth,
    maxAccounts,
    unlimitedPosts,
    unlimitedAccounts,
    features: [...autoFeatures, ...slugExtras, ...backendFeatures],
    isFree: Boolean(p.is_free) || slug === 'free' || Number(p.price ?? 0) === 0,
    // Auto-mark Pro as the popular plan when backend doesn't specify.
    isPopular: Boolean(p.is_popular) || slug === 'pro',
  };
};

type TierStyle = { icon: React.ElementType; accent: string; pill: string };

const TIER_STYLES: Record<string, TierStyle> = {
  free: {
    icon: Zap,
    accent: 'from-slate-500 to-slate-700',
    pill: 'bg-slate-100 text-slate-600 border border-slate-200',
  },
  starter: {
    icon: Sparkles,
    accent: 'from-blue-600 to-blue-400',
    pill: 'bg-blue-50 text-blue-700 border border-blue-100',
  },
  pro: {
    icon: Crown,
    accent: 'from-amber-500 via-orange-500 to-rose-500',
    pill: 'bg-amber-50 text-amber-700 border border-amber-100',
  },
  agency: {
    icon: Shield,
    accent: 'from-emerald-500 via-teal-500 to-cyan-500',
    pill: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
  },
};

const DEFAULT_TIER: TierStyle = {
  icon: Sparkles,
  accent: 'from-blue-600 to-blue-400',
  pill: 'bg-blue-50 text-blue-700 border border-blue-100',
};

const Billing = () => {
  const { user } = useAuthStore();
  const {
    plans,
    subscription,
    usage,
    isLoadingPlans,
    isLoadingSubscription,
    isLoadingUsage,
    isSubscribing,
    isCancelling,
    fetchAll,
    fetchSubscription,
    fetchUsage,
    subscribe,
    cancelSubscription,
  } = useBillingStore();

  const [processingPlanId, setProcessingPlanId] = useState<number | string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const sortedPlans = useMemo(
    () =>
      plans
        .slice()
        .sort((a, b) => Number(a.price ?? 0) - Number(b.price ?? 0))
        .map(normalizePlan),
    [plans]
  );

  const currentPlanId = subscription?.plan?.id ?? (subscription as any)?.plan_id ?? null;
  const isActive =
    subscription?.status === 'active' ||
    subscription?.status === 'trialing' ||
    subscription?.status === 'pending';

  const creditsRemaining = Number(usage?.credits_remaining ?? subscription?.credits_remaining ?? 0);
  const creditsUsed = Number(usage?.credits_used ?? subscription?.credits_used ?? 0);
  const creditsTotal = Number(usage?.credits_total ?? creditsRemaining + creditsUsed);
  const usagePct = creditsTotal > 0 ? Math.min(100, Math.round((creditsUsed / creditsTotal) * 100)) : 0;

  const handleSubscribe = async (plan: ReturnType<typeof normalizePlan>) => {
    if (plan.isFree) {
      // Free plan — call subscribe directly, no Razorpay
      setProcessingPlanId(plan.id);
      try {
        await subscribe(plan.id);
        toast.success(`You're on the ${plan.name} plan!`);
        await fetchSubscription();
        await fetchUsage();
      } catch (error: any) {
        toast.error(error.toString?.() ?? 'Could not subscribe');
      } finally {
        setProcessingPlanId(null);
      }
      return;
    }

    setProcessingPlanId(plan.id);
    try {
      const res = await subscribe(plan.id);

      const key = res.razorpay_key_id || res.key_id || res.key;
      const subscriptionId = res.razorpay_subscription_id || res.subscription_id;
      const orderId = res.razorpay_order_id || res.order_id;

      if (!key || (!subscriptionId && !orderId)) {
        toast.error('Payment setup incomplete — please try again.');
        setProcessingPlanId(null);
        return;
      }

      await openRazorpay({
        key,
        name: res.name || 'Social Media Hub',
        description:
          res.description ||
          `${plan.name} · ${plan.unlimitedPosts ? 'Unlimited' : plan.postsPerMonth} posts / ${plan.interval}`,
        subscription_id: subscriptionId,
        order_id: orderId,
        amount: res.amount,
        currency: res.currency || plan.currency,
        prefill: {
          name: user?.name,
          email: user?.email,
        },
        theme: { color: '#2563eb' },
        handler: async () => {
          toast.success('Payment received — activating your plan…');
          // Give backend a moment to process the webhook, then refresh
          setTimeout(() => {
            fetchSubscription().catch(() => {});
            fetchUsage().catch(() => {});
          }, 1500);
        },
        modal: {
          ondismiss: () => {
            setProcessingPlanId(null);
          },
        },
      });
    } catch (error: any) {
      toast.error(error.toString?.() ?? 'Payment failed');
    } finally {
      setProcessingPlanId(null);
    }
  };

  const handleCancel = async () => {
    try {
      await cancelSubscription();
      toast.success('Subscription cancelled');
      setConfirmCancel(false);
    } catch (error: any) {
      toast.error(error.toString?.() ?? 'Could not cancel');
    }
  };

  const loading = isLoadingPlans || isLoadingSubscription || isLoadingUsage;

  return (
    <div className="max-w-6xl mx-auto animate-slide-up space-y-4">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/70 bg-gradient-to-br from-blue-600 to-blue-400 p-5 sm:p-6 text-white shadow-xl shadow-blue-500/30">
        <div className="absolute -top-20 -left-10 w-60 h-60 bg-white/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -right-10 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
        <div className="relative grid md:grid-cols-[1fr_auto] items-start gap-5 md:gap-8">
          <div className="max-w-xl min-w-0">
            <div className="inline-flex items-center gap-1.5 text-[11px] font-medium text-white/90 bg-white/15 backdrop-blur px-2 py-0.5 rounded-full border border-white/20">
              <CreditCard className="w-3 h-3" />
              Billing & Plans
            </div>
            <h2 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight leading-tight">
              A plan for every scale.
            </h2>
            <p className="mt-1 text-white/80 text-sm">
              Posts refresh every billing cycle. Upgrade anytime.
            </p>
          </div>

          {/* Posts meter */}
          <div className="w-full md:w-auto md:min-w-[260px] bg-white/10 backdrop-blur border border-white/20 rounded-xl p-3.5">
            <div className="flex items-center gap-2 mb-1.5">
              <Gauge className="w-3.5 h-3.5" />
              <p className="text-[10px] font-semibold uppercase tracking-widest text-white/80">Posts this cycle</p>
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold tabular-nums leading-tight">{creditsRemaining}</p>
              {creditsTotal > 0 && <p className="text-sm text-white/70">of {creditsTotal}</p>}
            </div>
            <div className="mt-2 h-1.5 rounded-full bg-white/15 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-white via-blue-100 to-blue-100"
                style={{ width: `${Math.max(0, 100 - usagePct)}%` }}
              />
            </div>
            <p className="mt-1.5 text-[10px] text-white/70">{creditsUsed} used · {usagePct}%</p>
          </div>
        </div>
      </div>

      {/* Current subscription */}
      {isActive && subscription && (
        <div className="relative overflow-hidden bg-white rounded-2xl border border-slate-200/70 shadow-sm">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/40 via-white to-sky-50/30" />
          <div className="relative px-4 sm:px-5 py-3.5 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center shadow-md shadow-blue-500/30">
                <Crown className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">
                  Active plan
                </p>
                <p className="text-lg font-bold tracking-tight text-slate-900">
                  {subscription.plan?.name || subscription.plan_name || 'Subscribed'}
                </p>
                {subscription.current_period_end && (
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                    <Calendar className="w-3 h-3" />
                    Renews {new Date(subscription.current_period_end).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                <Check className="w-3 h-3" />
                {subscription.status === 'trialing' ? 'Trial' : 'Active'}
              </span>
              <Button
                variant="outline"
                onClick={() => setConfirmCancel(true)}
                disabled={isCancelling}
                className="rounded-full border-slate-300 text-slate-600 hover:text-destructive hover:border-destructive/30"
              >
                {isCancelling ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                Cancel
              </Button>
            </div>
          </div>

          {/* Cancel confirm */}
          {confirmCancel && (
            <div className="relative mx-5 sm:mx-6 mb-5 sm:mb-6 p-4 bg-rose-50/80 border border-rose-200 rounded-xl flex items-center justify-between gap-3 flex-wrap">
              <p className="text-sm text-rose-900">
                Cancel your subscription? You'll keep access until the end of this period.
              </p>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  onClick={() => setConfirmCancel(false)}
                  className="text-slate-600 hover:bg-white rounded-full"
                >
                  Keep plan
                </Button>
                <Button
                  onClick={handleCancel}
                  disabled={isCancelling}
                  className="bg-rose-600 hover:bg-rose-700 text-white rounded-full"
                >
                  {isCancelling ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm cancel'}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Usage breakdown */}
      {usage && creditsTotal > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-semibold text-slate-900 tracking-tight">Usage this cycle</h3>
            </div>
            {usage.period_end && (
              <p className="text-xs text-slate-500">
                Resets {new Date(usage.period_end).toLocaleDateString()}
              </p>
            )}
          </div>
          <div className="flex items-end justify-between mb-2">
            <p className="text-3xl font-bold tracking-tight tabular-nums text-slate-900">
              {creditsUsed} <span className="text-slate-400 text-base font-normal">/ {creditsTotal} posts</span>
            </p>
            <p className="text-sm text-slate-500 tabular-nums">{usagePct}% used</p>
          </div>
          <div className="h-3 rounded-full bg-slate-100 overflow-hidden ring-1 ring-inset ring-slate-200/60">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-500',
                usagePct < 80
                  ? 'bg-gradient-to-r from-blue-600 to-blue-400'
                  : 'bg-gradient-to-r from-orange-500 to-rose-500'
              )}
              style={{ width: `${usagePct}%` }}
            />
          </div>
          {usagePct >= 80 && (
            <p className="mt-3 text-xs text-orange-700 bg-orange-50 border border-orange-200 rounded-lg px-3 py-2">
              You've used {usagePct}% of your monthly posts. Upgrade to keep shipping content.
            </p>
          )}
        </div>
      )}

      {/* Plans */}
      <div>
        <div className="flex items-end justify-between mb-3 flex-wrap gap-2">
          <div>
            <p className="text-[11px] font-semibold tracking-widest text-blue-600 uppercase">Plans</p>
            <h2 className="mt-0.5 text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Choose what fits your workflow
            </h2>
          </div>
        </div>

        {loading && sortedPlans.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : sortedPlans.length === 0 ? (
          <div className="relative overflow-hidden bg-white rounded-2xl border border-slate-200/70 p-10 text-center shadow-sm">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/60 via-white to-sky-50/50" />
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/30">
                <CreditCard className="w-6 h-6 text-white" />
              </div>
              <p className="font-semibold text-slate-900 mb-1">No plans available</p>
              <p className="text-sm text-slate-500">Please check back soon.</p>
            </div>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {sortedPlans.map((plan) => {
              const tier = TIER_STYLES[plan.slug] ?? DEFAULT_TIER;
              const TierIcon = tier.icon;
              const isCurrent = String(currentPlanId) === String(plan.id) && isActive;
              const isProcessing = processingPlanId === plan.id || (isSubscribing && processingPlanId === plan.id);
              const highlight = plan.isPopular && !isCurrent;

              return (
                <div
                  key={plan.id}
                  className={cn(
                    'relative overflow-hidden bg-white rounded-2xl border shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-blue-500/15',
                    highlight ? 'border-transparent ring-2 ring-inset ring-blue-500/50' : 'border-slate-200/70',
                    isCurrent && 'ring-2 ring-inset ring-emerald-500/60 border-transparent'
                  )}
                >
                  {/* Top accent bar */}
                  <div className={cn('h-1 w-full bg-gradient-to-r', tier.accent)} />

                  {highlight && (
                    <div className="absolute top-2.5 right-2.5">
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest text-white bg-gradient-to-r from-blue-600 to-blue-500 px-2 py-0.5 rounded-full shadow-md shadow-blue-500/30">
                        <Sparkles className="w-3 h-3" />
                        Popular
                      </span>
                    </div>
                  )}
                  {isCurrent && (
                    <div className="absolute top-2.5 right-2.5">
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest text-white bg-gradient-to-r from-emerald-500 to-teal-500 px-2 py-0.5 rounded-full shadow-md">
                        <Check className="w-3 h-3" />
                        Current plan
                      </span>
                    </div>
                  )}

                  <div className="p-4 sm:p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br', tier.accent, 'shadow-sm shrink-0')}>
                        <TierIcon className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold tracking-tight text-slate-900 truncate">{plan.name}</h3>
                        {plan.description && (
                          <p className="text-xs text-slate-500 truncate">{plan.description}</p>
                        )}
                      </div>
                    </div>

                    <div className="py-2.5 border-y border-slate-100">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold tracking-tight text-slate-900 tabular-nums">
                          {plan.isFree ? 'Free' : formatCurrency(plan.price, plan.currency)}
                        </span>
                        {!plan.isFree && (
                          <span className="text-sm text-slate-500">/ {plan.interval}</span>
                        )}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-700 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-full">
                          {plan.unlimitedPosts ? (
                            <InfinityIcon className="w-3 h-3 text-blue-500" />
                          ) : (
                            <Zap className="w-3 h-3 text-blue-500" />
                          )}
                          {plan.unlimitedPosts
                            ? 'Unlimited posts'
                            : `${plan.postsPerMonth.toLocaleString()} posts / ${plan.interval}`}
                        </span>
                        {typeof plan.maxAccounts === 'number' && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-700 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-full">
                            <Users2 className="w-3 h-3 text-blue-500" />
                            {plan.unlimitedAccounts
                              ? 'Unlimited accounts'
                              : `${plan.maxAccounts} accounts`}
                          </span>
                        )}
                      </div>
                    </div>

                    {plan.features.length > 0 && (
                      <ul className="mt-3 space-y-1.5">
                        {plan.features.map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                            <span className="mt-0.5 w-4 h-4 rounded-full bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center flex-shrink-0 shadow-sm">
                              <Check className="w-2.5 h-2.5 text-white" />
                            </span>
                            <span className="leading-snug">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    <div className="mt-4">
                      {isCurrent ? (
                        <Button
                          disabled
                          className="w-full h-10 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-50 shadow-none"
                        >
                          <Check className="w-4 h-4" />
                          Your current plan
                        </Button>
                      ) : (
                        <Button
                          onClick={() => handleSubscribe(plan)}
                          disabled={isProcessing}
                          className={cn(
                            'w-full h-10 rounded-full shadow-md transition-all',
                            highlight
                              ? 'bg-gradient-to-r from-blue-600 to-blue-400 hover:opacity-95 text-white shadow-blue-500/30'
                              : 'bg-slate-900 hover:bg-slate-800 text-white'
                          )}
                        >
                          {isProcessing ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Processing…
                            </>
                          ) : plan.isFree ? (
                            'Start for free'
                          ) : isActive ? (
                            'Switch to this'
                          ) : (
                            'Choose plan'
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Reassurance row */}
      <div className="grid sm:grid-cols-3 gap-2.5">
        {[
          { icon: Shield, label: 'Secure payment', text: 'Processed via Razorpay.' },
          { icon: Zap, label: 'Instant activation', text: 'Credits arrive on subscribe.' },
          { icon: CreditCard, label: 'Cancel anytime', text: 'No long-term commitments.' },
        ].map((item) => {
          const I = item.icon;
          return (
            <div key={item.label} className="bg-white rounded-xl border border-slate-200/70 p-3 flex items-center gap-3 shadow-sm">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center shadow-sm shrink-0">
                <I className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">{item.label}</p>
                <p className="text-xs text-slate-500 truncate">{item.text}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Billing;
