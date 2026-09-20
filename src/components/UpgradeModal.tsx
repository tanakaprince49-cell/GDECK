import React, { useState } from 'react';
import { X, Check, ArrowRight, RefreshCw, ShieldCheck } from 'lucide-react';
import { usePlan, PlanTier } from '../context/PlanContext';
import { CHECKOUT_STASH_KEY } from './CheckoutSuccessView';

/** Every Pro entitlement, taken from what the app actually gates. */
const PRO_BENEFITS: string[] = [
  'Unlimited G-Pilot AI across Gmail, Drive, Docs, Calendar and Tasks',
  '1-click turn any email into a task, an event and a Meet link',
  'Meeting Prep Packs: the linked Drive docs and history, before you join',
  'Smart Follow-Ups drafted after every meeting ends',
  'Deep Thread TL;DR on long email chains',
  'Tone & Polish Studio for replies',
  'Global Omni-Search (⌘K) across every app at once',
  'Multiple Google accounts, personal and work, in one tab',
  'Priority Sync with offline caching',
  'Custom dashboard layout',
];

interface PlanChoice {
  id: 'pro_monthly' | 'pro_annual' | 'pro_monthly_zwg';
  label: string;
  price: string;
  note: string;
}

const USD_PLANS: PlanChoice[] = [
  { id: 'pro_monthly', label: 'Monthly', price: '$12', note: 'per month' },
  { id: 'pro_annual', label: 'Yearly', price: '$120', note: 'per year · $10/mo, saves 17%' },
];

const ZWG_PLAN: PlanChoice[] = [
  { id: 'pro_monthly_zwg', label: 'Monthly', price: 'ZWG 320', note: 'per month · EcoCash or OneMoney' },
];

export const UpgradeModal: React.FC = () => {
  const {
    upgradeModalOpen,
    upgradeModalContext,
    closeUpgradeModal,
    upgradeToPro,
    tier,
    isPro,
    aiQueriesUsed,
    maxFreeAiQueries,
    activeAccount,
    setMockPlan,
  } = usePlan();

  const [currency, setCurrency] = useState<'usd' | 'zwg'>('usd');
  const [planId, setPlanId] = useState<PlanChoice['id']>('pro_monthly');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [upgradeSuccess, setUpgradeSuccess] = useState<string | null>(null);

  if (!upgradeModalOpen) return null;

  const plans = currency === 'zwg' ? ZWG_PLAN : USD_PLANS;
  const selected = plans.find((p) => p.id === planId) || plans[0];

  const selectCurrency = (next: 'usd' | 'zwg') => {
    setCurrency(next);
    setPlanId(next === 'zwg' ? 'pro_monthly_zwg' : 'pro_monthly');
    setCheckoutError(null);
  };

  const handlePayonifyCheckout = async () => {
    setIsProcessing(true);
    setCheckoutError(null);
    setUpgradeSuccess(null);

    try {
      const res = await fetch('/api/payonify/checkout/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: selected.id,
          currency,
          customerEmail: activeAccount.email,
          paymentMethodTypes:
            currency === 'usd' ? ['card', 'ecocash', 'onemoney'] : ['ecocash', 'onemoney'],
        }),
      });

      let data: any = {};
      const resText = await res.text();
      try {
        data = resText ? JSON.parse(resText) : {};
      } catch {
        throw new Error(res.ok ? 'Unexpected response format' : `Server responded with status ${res.status}`);
      }

      if (!res.ok) {
        throw new Error(data.error || `Checkout initiation failed (status ${res.status})`);
      }

      if (!data.url) {
        throw new Error('Payonify did not return a checkout URL.');
      }

      // Payonify cannot append the session id to success_url, so hand it to the success page
      // out-of-band; the server also keys the order off metadata.order_id.
      try {
        sessionStorage.setItem(
          CHECKOUT_STASH_KEY,
          JSON.stringify({ sessionId: data.sessionId, orderId: data.orderId, planId: selected.id })
        );
      } catch {
        /* private mode / storage disabled -- verification then relies on ?session_id= only */
      }

      window.location.href = data.url;
    } catch (err: any) {
      console.error('Payonify checkout error:', err);
      setCheckoutError(err.message || 'Unable to start checkout. Please try again.');
      setIsProcessing(false);
    }
  };

  const headline = upgradeModalContext?.isAiLimit
    ? `You’ve used all ${maxFreeAiQueries} free AI assists`
    : upgradeModalContext?.title
    ? `Unlock ${upgradeModalContext.title}`
    : 'One plan. Everything unlocked.';

  const subline = upgradeModalContext?.isAiLimit
    ? `Upgrade for ${selected.price}/${selected.id === 'pro_annual' ? 'yr' : 'mo'} to keep going without a limit.`
    : upgradeModalContext?.desc || 'Everything below is unlocked across your whole Google workspace.';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg bg-white rounded-3xl border border-[#dadce0] shadow-[0_20px_50px_rgba(0,0,0,0.25)] overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Upgrade to G-Deck Pro"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 px-5 sm:px-6 pt-5 pb-4 border-b border-[#f1f3f4]">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#7e22ce] bg-[#faf5ff] border border-[#e9d5ff] rounded-full px-2 py-0.5 mb-2">
              <ShieldCheck className="w-3 h-3" />
              <span>G-Deck Pro</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-[#1f1f1f] leading-snug">
              {headline}
            </h2>
            <p className="text-xs text-[#5f6368] mt-1 leading-relaxed">{subline}</p>
          </div>
          <button
            onClick={closeUpgradeModal}
            className="shrink-0 p-1.5 rounded-full text-[#5f6368] hover:bg-[#f1f3f4] hover:text-[#1f1f1f] transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 sm:px-6 py-4 overflow-y-auto space-y-4 flex-1">
          {isPro ? (
            <div className="p-4 rounded-2xl bg-[#e6f4ea] border border-[#ceead6] text-[#137333] space-y-1">
              <p className="text-sm font-bold">Pro is active on this account</p>
              <p className="text-xs">
                Unlimited AI and every cross-tool automation are already unlocked.
              </p>
            </div>
          ) : (
            <>
              {upgradeSuccess && (
                <div className="p-3 bg-[#e6f4ea] border border-[#ceead6] text-[#137333] rounded-2xl text-xs font-semibold flex items-center gap-2">
                  <Check className="w-4 h-4 shrink-0" />
                  <span>{upgradeSuccess}</span>
                </div>
              )}

              {checkoutError && (
                <div className="p-3 bg-[#fce8e6] border border-[#fad2cf] text-[#c5221f] rounded-2xl text-xs font-medium flex items-start justify-between gap-2">
                  <span className="leading-relaxed">{checkoutError}</span>
                  <button
                    onClick={() => setCheckoutError(null)}
                    className="shrink-0 text-xs font-bold underline cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              {/* Benefits */}
              <ul className="divide-y divide-[#f1f3f4]">
                {PRO_BENEFITS.map((benefit) => (
                  <li key={benefit} className="flex items-start gap-2.5 py-2">
                    <Check className="w-4 h-4 shrink-0 text-[#188038] mt-0.5" />
                    <span className="text-[13px] leading-snug text-[#1f1f1f]">{benefit}</span>
                  </li>
                ))}
              </ul>

              {/* Plan choice */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#5f6368]">
                    Choose a plan
                  </h3>
                  <div className="flex items-center gap-1 text-[11px] font-semibold">
                    {(['usd', 'zwg'] as const).map((c) => (
                      <button
                        key={c}
                        onClick={() => selectCurrency(c)}
                        className={`px-2 py-0.5 rounded-full cursor-pointer transition-colors ${
                          currency === c
                            ? 'bg-[#e8f0fe] text-[#1a73e8]'
                            : 'text-[#5f6368] hover:bg-[#f1f3f4]'
                        }`}
                      >
                        {c === 'usd' ? 'USD $' : 'ZWG'}
                      </button>
                    ))}
                  </div>
                </div>

                {plans.map((plan) => {
                  const active = plan.id === selected.id;
                  return (
                    <button
                      key={plan.id}
                      onClick={() => {
                        setPlanId(plan.id);
                        setCheckoutError(null);
                      }}
                      className={`w-full flex items-center justify-between gap-3 px-3.5 py-3 rounded-2xl border text-left transition-all cursor-pointer ${
                        active
                          ? 'border-[#7e22ce] bg-[#faf5ff] shadow-xs'
                          : 'border-[#dadce0] bg-white hover:bg-[#f8fafd]'
                      }`}
                    >
                      <span className="flex items-center gap-2.5 min-w-0">
                        <span
                          className={`w-3.5 h-3.5 shrink-0 rounded-full border-[1.5px] flex items-center justify-center ${
                            active ? 'border-[#7e22ce]' : 'border-[#bdc1c6]'
                          }`}
                        >
                          {active && <span className="w-1.5 h-1.5 rounded-full bg-[#7e22ce]" />}
                        </span>
                        <span className="min-w-0">
                          <span className="block text-[13px] font-bold text-[#1f1f1f]">{plan.label}</span>
                          <span className="block text-[11px] text-[#5f6368] truncate">{plan.note}</span>
                        </span>
                      </span>
                      <span className="shrink-0 text-right">
                        <span className="block text-base font-extrabold text-[#1f1f1f]">{plan.price}</span>
                        {currency === 'usd' && plan.id === 'pro_annual' && (
                          <span className="block text-[10px] font-bold text-[#137333]">Best value</span>
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>

              <p className="text-[11px] text-[#5f6368] leading-relaxed">
                Secure checkout by Payonify. Card, EcoCash or OneMoney. Cancel anytime — Pro runs to
                the end of the period you paid for.
              </p>
            </>
          )}
        </div>

        {/* Footer CTA */}
        {!isPro && (
          <div className="px-5 sm:px-6 py-4 border-t border-[#f1f3f4] bg-[#f8fafd]">
            <button
              onClick={handlePayonifyCheckout}
              disabled={isProcessing}
              className="w-full py-3 px-5 bg-gradient-to-r from-[#7e22ce] to-[#1a73e8] hover:from-[#6b21a8] hover:to-[#1557b0] text-white text-sm font-bold rounded-2xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all hover:shadow-lg disabled:opacity-60 disabled:cursor-wait"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Opening secure checkout…</span>
                </>
              ) : (
                <>
                  <span>
                    Upgrade for {selected.price}
                    {planId === 'pro_annual' ? '/year' : '/month'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
            <p className="text-[10px] text-[#5f6368] text-center mt-2">
              Billing to {activeAccount.email}
            </p>
          </div>
        )}

        {/* Dev-only plan switcher; stripped from production bundles at build time */}
        {import.meta.env.DEV && (
          <div className="bg-[#f8fafd] border-t border-[#dadce0] px-4 py-2.5 flex items-center justify-between gap-2 text-[11px] text-[#5f6368]">
            <span className="font-semibold">Dev: simulate plan</span>
            <div className="flex items-center gap-1.5">
              {(['free', 'pro'] as PlanTier[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setMockPlan(t, t === 'free' ? 3 : 45)}
                  className={`px-2 py-0.5 rounded-md border font-medium cursor-pointer transition-colors ${
                    tier === t
                      ? 'bg-blue-100 text-blue-800 border-blue-300 font-bold'
                      : 'bg-white hover:bg-slate-100 border-slate-200'
                  }`}
                >
                  {t === 'free' ? `Free (3/${maxFreeAiQueries} AI)` : 'Pro'}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
