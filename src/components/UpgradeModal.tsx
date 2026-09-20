import React, { useState } from 'react';
import { X, Check, ArrowRight, RefreshCw, ShieldCheck, Coffee, CreditCard, Smartphone } from 'lucide-react';
import { usePlan, PlanTier } from '../context/PlanContext';
import { CHECKOUT_STASH_KEY } from './CheckoutSuccessView';
import { SUPPORT_CAMPAIGN_URL } from '../constants/support';

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
    tier,
    isPro,
    proPlanId,
    proExpiresLabel,
    proDaysRemaining,
    needsRenewal,
    aiQueriesUsed,
    aiQueriesRemaining,
    maxFreeAiQueries,
    activeAccount,
    setMockPlan,
  } = usePlan();

  const freeRemaining = isPro
    ? null
    : Math.max(
        0,
        Number.isFinite(aiQueriesRemaining)
          ? aiQueriesRemaining
          : maxFreeAiQueries - aiQueriesUsed
      );

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

  const freeLeftLabel =
    freeRemaining === null
      ? null
      : freeRemaining === 0
      ? '0 remaining'
      : `${freeRemaining} of ${maxFreeAiQueries} remaining`;

  const isRenewal = !!(upgradeModalContext?.isRenewal || needsRenewal);

  const headline = isPro
    ? 'Your G-Deck Pro is active'
    : upgradeModalContext?.isAiLimit
    ? freeRemaining === 0
      ? `You've used all ${maxFreeAiQueries} free AI messages`
      : `Free AI messages running low`
    : isRenewal
    ? 'Renew G-Deck Pro to keep access'
    : upgradeModalContext?.title
    ? `Unlock ${upgradeModalContext.title}`
    : 'One plan. Everything unlocked.';

  const subline = isPro
    ? `Unlimited AI is unlocked until ${proExpiresLabel || 'the end of your paid period'}${
        proDaysRemaining > 0 ? ` · ${proDaysRemaining} day${proDaysRemaining === 1 ? '' : 's'} left` : ''
      }. Pay again before then to extend without interruption.`
    : upgradeModalContext?.isAiLimit
    ? freeRemaining === 0
      ? `0 of ${maxFreeAiQueries} free G-Pilot messages left this month. Upgrade for ${selected.price}/${selected.id === 'pro_annual' ? 'yr' : 'mo'} for unlimited AI.`
      : `${freeLeftLabel} this month on the free plan. Upgrade for ${selected.price}/${selected.id === 'pro_annual' ? 'yr' : 'mo'} for unlimited AI.`
    : isRenewal
    ? `Your last Pro period ended. Checkout again (${selected.price}/${selected.id === 'pro_annual' ? 'yr' : 'mo'}) to unlock unlimited AI and every Pro feature for another billing period.`
    : upgradeModalContext?.desc || 'Everything below is unlocked across your whole Google workspace.';

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl border border-[#dadce0] shadow-[0_20px_50px_rgba(0,0,0,0.25)] overflow-hidden flex flex-col max-h-[92dvh] sm:max-h-[92vh] h-auto"
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
            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-[#e6f4ea] border border-[#ceead6] text-[#137333] space-y-1">
                <p className="text-sm font-bold">Pro is active on this account</p>
                <p className="text-xs">
                  Unlimited AI and every cross-tool automation are unlocked until{' '}
                  <span className="font-bold">{proExpiresLabel || 'the end of this period'}</span>
                  {proDaysRemaining > 0
                    ? ` (${proDaysRemaining} day${proDaysRemaining === 1 ? '' : 's'} left)`
                    : ''}
                  .
                </p>
                <p className="text-[11px] text-[#137333]/90 pt-1">
                  G-Deck does not auto-charge. When this period ends you&apos;ll drop back to Free
                  (10 AI messages/month) until you pay again.
                </p>
              </div>
              <p className="text-[11px] text-[#5f6368] leading-relaxed">
                Want to extend early? Pay for another {selected.id === 'pro_annual' ? 'year' : 'month'} below —
                the new period stacks on top of your current end date.
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {(['usd', 'zwg'] as const).map((c) => (
                  <button
                    key={c}
                    onClick={() => selectCurrency(c)}
                    className={`px-2 py-0.5 rounded-full text-[11px] font-semibold cursor-pointer ${
                      currency === c ? 'bg-[#e8f0fe] text-[#1a73e8]' : 'text-[#5f6368] hover:bg-[#f1f3f4]'
                    }`}
                  >
                    {c === 'usd' ? 'USD $' : 'ZWG'}
                  </button>
                ))}
              </div>
              <div className="space-y-2">
                {plans.map((plan) => {
                  const active = plan.id === selected.id;
                  return (
                    <button
                      key={plan.id}
                      onClick={() => {
                        setPlanId(plan.id);
                        setCheckoutError(null);
                      }}
                      className={`w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-2xl border text-left cursor-pointer ${
                        active ? 'border-[#7e22ce] bg-[#faf5ff]' : 'border-[#dadce0] bg-white hover:bg-[#f8fafd]'
                      }`}
                    >
                      <span className="text-[13px] font-bold text-[#1f1f1f]">{plan.label}</span>
                      <span className="text-sm font-extrabold text-[#1f1f1f]">{plan.price}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <>
              {/* Free-plan AI quota readout */}
              <div
                id="upgrade-ai-remaining"
                className={`flex items-center justify-between gap-3 px-3.5 py-3 rounded-2xl border ${
                  freeRemaining === 0
                    ? 'bg-red-50 border-red-200 text-red-900'
                    : (freeRemaining ?? 99) <= 3
                    ? 'bg-amber-50 border-amber-200 text-amber-950'
                    : 'bg-[#f8fafd] border-[#dadce0] text-[#1f1f1f]'
                }`}
              >
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-wider opacity-80">
                    Free plan · AI this month
                  </p>
                  <p className="text-sm font-bold mt-0.5 leading-snug">
                    {freeRemaining === 0
                      ? `All ${maxFreeAiQueries} free messages used`
                      : `${freeRemaining} message${freeRemaining === 1 ? '' : 's'} remaining`}
                  </p>
                  <p className="text-[11px] mt-0.5 opacity-80">
                    {aiQueriesUsed} of {maxFreeAiQueries} used · resets next calendar month
                  </p>
                </div>
                <div
                  className={`shrink-0 w-14 h-14 rounded-full border-4 flex items-center justify-center ${
                    freeRemaining === 0
                      ? 'border-red-300 bg-white'
                      : (freeRemaining ?? 99) <= 3
                      ? 'border-amber-300 bg-white'
                      : 'border-purple-300 bg-white'
                  }`}
                  aria-label={`${freeRemaining} of ${maxFreeAiQueries} free AI messages remaining`}
                >
                  <span className="text-sm font-extrabold tabular-nums">
                    {freeRemaining}/{maxFreeAiQueries}
                  </span>
                </div>
              </div>

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

              {/* Payment methods — cards from anywhere, mobile money in Zimbabwe */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-[#dadce0] bg-white text-[10px] font-semibold text-[#444746]">
                  <CreditCard className="w-3 h-3 text-[#1a73e8]" />
                  Cards · anywhere in the world
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-[#dadce0] bg-white text-[10px] font-semibold text-[#444746]">
                  <Smartphone className="w-3 h-3 text-[#188033]" />
                  EcoCash · Zimbabwe
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-[#dadce0] bg-white text-[10px] font-semibold text-[#444746]">
                  <Smartphone className="w-3 h-3 text-[#188033]" />
                  OneMoney · Zimbabwe
                </span>
              </div>
              <p className="text-[11px] text-[#5f6368] leading-relaxed">
                Secure checkout by Payonify. Pay by card from anywhere in the world, or with EcoCash
                or OneMoney in Zimbabwe. No auto-charge. Pro runs to the end of the period you paid for, then you renew by checkout.
              </p>
            </>
          )}
        </div>

        {/* Footer CTA — free users upgrade; Pro users can renew/extend early */}
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
                    {isPro
                      ? `Extend Pro · ${selected.price}${planId === 'pro_annual' ? '/year' : '/month'}`
                      : isRenewal
                      ? `Renew Pro · ${selected.price}${planId === 'pro_annual' ? '/year' : '/month'}`
                      : `Upgrade for ${selected.price}${planId === 'pro_annual' ? '/year' : '/month'}`}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
            <p className="text-[10px] text-[#5f6368] text-center mt-2">
              Billing to {activeAccount.email}
            </p>
            <a
              href={SUPPORT_CAMPAIGN_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 text-[10px] font-medium text-[#5f6368] hover:text-[#1a73e8] hover:underline mt-1.5 cursor-pointer"
              title="Support G-Deck development"
            >
              <Coffee className="w-3 h-3" />
              <span>Prefer a one-off? Buy me a coffee</span>
            </a>
            <p className="text-[10px] text-[#5f6368] text-center mt-2 leading-relaxed">
              No auto-renewal — when the paid period ends, Pro turns off until you check out again.
            </p>
          </div>

        {/* Dev-only plan switcher; stripped from production bundles at build time */}
        {import.meta.env.DEV && (
          <div className="bg-[#f8fafd] border-t border-[#dadce0] px-4 py-2.5 flex items-center justify-between gap-2 text-[11px] text-[#5f6368]">
            <span className="font-semibold">Dev: simulate plan</span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setMockPlan('free', 0)}
                className="px-2 py-0.5 rounded-md border font-medium cursor-pointer bg-white hover:bg-slate-100 border-slate-200"
                title="Simulate free plan with full allowance"
              >
                Free 10 left
              </button>
              <button
                onClick={() => setMockPlan('free', maxFreeAiQueries - 3)}
                className={`px-2 py-0.5 rounded-md border font-medium cursor-pointer transition-colors ${
                  tier === 'free' && aiQueriesUsed === maxFreeAiQueries - 3
                    ? 'bg-blue-100 text-blue-800 border-blue-300 font-bold'
                    : 'bg-white hover:bg-slate-100 border-slate-200'
                }`}
                title="Simulate free plan with 3 remaining"
              >
                Free 3 left
              </button>
              <button
                onClick={() => setMockPlan('free', maxFreeAiQueries)}
                className={`px-2 py-0.5 rounded-md border font-medium cursor-pointer transition-colors ${
                  tier === 'free' && aiQueriesUsed >= maxFreeAiQueries
                    ? 'bg-red-100 text-red-800 border-red-300 font-bold'
                    : 'bg-white hover:bg-slate-100 border-slate-200'
                }`}
                title="Simulate free plan at monthly limit (0 remaining)"
              >
                Free 0 left
              </button>
              <button
                onClick={() => setMockPlan('pro', 45, { planId: 'pro_monthly', expiresInMs: 60 * 1000 })}
                className="px-2 py-0.5 rounded-md border font-medium cursor-pointer bg-white hover:bg-slate-100 border-slate-200"
                title="Pro that expires in 60s (test auto-downgrade)"
              >
                Pro 60s
              </button>
              <button
                onClick={() => {
                  try { localStorage.removeItem('gdeck_pro_renewal_notified_day'); } catch {}
                  setMockPlan('pro', 45, {
                    planId: 'pro_monthly',
                    expiresInMs: 2.5 * 24 * 60 * 60 * 1000,
                  });
                }}
                className="px-2 py-0.5 rounded-md border font-medium cursor-pointer bg-white hover:bg-slate-100 border-slate-200"
                title="Pro with ~2.5 days left — fires daily renewal reminder"
              >
                Pro 2d left
              </button>
              <button
                onClick={() => setMockPlan('pro', 45, { planId: 'pro_monthly' })}
                className={`px-2 py-0.5 rounded-md border font-medium cursor-pointer transition-colors ${
                  tier === 'pro'
                    ? 'bg-blue-100 text-blue-800 border-blue-300 font-bold'
                    : 'bg-white hover:bg-slate-100 border-slate-200'
                }`}
              >
                Pro 1mo
              </button>
              <button
                onClick={() => setMockPlan('pro', 45, { planId: 'pro_annual' })}
                className="px-2 py-0.5 rounded-md border font-medium cursor-pointer bg-white hover:bg-slate-100 border-slate-200"
              >
                Pro 1yr
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
