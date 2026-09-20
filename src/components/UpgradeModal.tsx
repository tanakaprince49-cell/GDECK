import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Check,
  Zap,
  Lock,
  ArrowRight,
  ShieldCheck,
  Search,
  Sliders,
  RefreshCw,
  CreditCard,
  Smartphone,
  ExternalLink,
} from 'lucide-react';
import { usePlan, PlanTier } from '../context/PlanContext';
import { CHECKOUT_STASH_KEY } from './CheckoutSuccessView';

export const UpgradeModal: React.FC = () => {
  const {
    upgradeModalOpen,
    upgradeModalContext,
    closeUpgradeModal,
    upgradeToPro,
    startProTrial,
    tier,
    isPro,
    aiQueriesUsed,
    maxFreeAiQueries,
    setMockPlan,
  } = usePlan();

  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [currency, setCurrency] = useState<'usd' | 'zwg'>('usd');
  const [paymentMode, setPaymentMode] = useState<'hosted' | 'mobile_direct'>('hosted');
  const [mobileNumber, setMobileNumber] = useState<string>('771111111'); // Default to EcoCash test success number
  const [mobileNetwork, setMobileNetwork] = useState<'ecocash' | 'onemoney'>('ecocash');

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [upgradeSuccess, setUpgradeSuccess] = useState<string | null>(null);

  if (!upgradeModalOpen) return null;

  const isAiLimit = upgradeModalContext?.isAiLimit;
  const contextFeatureTitle = upgradeModalContext?.title;
  const contextFeatureDesc = upgradeModalContext?.desc;

  // Plan identification
  const getSelectedPlanId = () => {
    if (currency === 'zwg') return 'pro_monthly_zwg';
    return billingCycle === 'annual' ? 'pro_annual' : 'pro_monthly';
  };

  // 1. Direct Payonify Checkout Session Trigger
  const handlePayonifyCheckout = async () => {
    setIsProcessing(true);
    setCheckoutError(null);

    const planId = getSelectedPlanId();

    try {
      const res = await fetch('/api/payonify/checkout/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId,
          currency,
          customerEmail: 'tanakaprince49@gmail.com',
          paymentMethodTypes: currency === 'usd' ? ['card', 'ecocash', 'onemoney'] : ['ecocash', 'onemoney'],
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

      if (data.url) {
        // Payonify cannot append the session id to success_url, so hand it to the success
        // page out-of-band; the server also keys the order off metadata.order_id.
        try {
          sessionStorage.setItem(
            CHECKOUT_STASH_KEY,
            JSON.stringify({ sessionId: data.sessionId, orderId: data.orderId, planId })
          );
        } catch {
          /* private mode / storage disabled -- verification then relies on ?session_id= only */
        }
        // Redirect customer to Payonify hosted checkout
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned from Payonify');
      }
    } catch (err: any) {
      console.error('Payonify checkout error:', err);
      setCheckoutError(err.message || 'Unable to connect to Payonify checkout.');
      setIsProcessing(false);
    }
  };

  // 2. Direct Mobile Money Charge (EcoCash / OneMoney prompt sent to user's phone)
  const handleDirectMobileCharge = async () => {
    setIsProcessing(true);
    setCheckoutError(null);

    try {
      const res = await fetch('/api/payonify/charges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mobileNumber,
          network: mobileNetwork,
          planId: getSelectedPlanId(),
          currency,
          customerEmail: 'tanakaprince49@gmail.com',
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
        throw new Error(data.error || `Direct charge request failed (status ${res.status})`);
      }

      setUpgradeSuccess(
        `USSD prompt sent to ${mobileNumber} on ${mobileNetwork.toUpperCase()}! Approve the prompt on your phone.`
      );

      // In test mode with success number 771111111 or 713111111, activate after brief delay
      if (['771111111', '713111111'].includes(mobileNumber.trim())) {
        setTimeout(() => {
          upgradeToPro();
          setIsProcessing(false);
          setUpgradeSuccess('Payment verified! Welcome to G-Deck Pro.');
          setTimeout(() => {
            closeUpgradeModal();
          }, 1800);
        }, 3000);
      } else {
        setIsProcessing(false);
      }
    } catch (err: any) {
      setCheckoutError(err.message || 'Direct charge failed.');
      setIsProcessing(false);
    }
  };

  const handleTrialActivation = () => {
    setIsProcessing(true);
    setTimeout(() => {
      startProTrial();
      setUpgradeSuccess('Your 14-Day Free Pro Trial is now active! All automations unlocked.');
      setIsProcessing(false);
      setTimeout(() => {
        setUpgradeSuccess(null);
        closeUpgradeModal();
      }, 1500);
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl bg-white rounded-3xl border border-[#dadce0] shadow-[0_20px_50px_rgba(0,0,0,0.25)] overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-[#6b21a8] via-[#7e22ce] to-[#1a73e8] p-5 sm:p-6 text-white relative">
          <button
            onClick={closeUpgradeModal}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-black/20 hover:bg-black/30 text-white/90 hover:text-white transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-2.5">
            <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-white">
              <Sparkles className="w-3.5 h-3.5 fill-current" />
              <span>G-DECK PRO TIER</span>
            </div>
            <div className="inline-flex items-center gap-1 bg-emerald-500/30 backdrop-blur-md px-2.5 py-1 rounded-full text-[11px] font-semibold text-emerald-100 border border-emerald-400/30">
              <ShieldCheck className="w-3 h-3" />
              <span>Payonify Checkout</span>
            </div>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            {isAiLimit
              ? 'You’ve unlocked 10/10 free AI assists this month'
              : contextFeatureTitle
              ? `Unlock ${contextFeatureTitle}`
              : 'Unlock G-Deck Pro for $12/month'}
          </h2>

          <p className="text-xs sm:text-sm text-purple-100 mt-1 max-w-xl">
            {isAiLimit
              ? 'Upgrade to G-Deck Pro for unlimited AI workspace analysis, cross-tool automations, and omni-search.'
              : contextFeatureDesc ||
                'The executive command center that saves you 1–2 hours every day with cross-tool automations.'}
          </p>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Success Flash Toast inside modal */}
          {upgradeSuccess && (
            <div className="p-3.5 bg-[#e6f4ea] border border-[#ceead6] text-[#137333] rounded-2xl text-xs font-semibold flex items-center gap-2 animate-in zoom-in-95">
              <Check className="w-4 h-4 shrink-0 text-[#137333]" />
              <span>{upgradeSuccess}</span>
            </div>
          )}

          {/* Checkout Error Toast */}
          {checkoutError && (
            <div className="p-3.5 bg-[#fce8e6] border border-[#fad2cf] text-[#c5221f] rounded-2xl text-xs font-medium flex items-center justify-between gap-2">
              <span>{checkoutError}</span>
              <button onClick={() => setCheckoutError(null)} className="text-xs font-bold underline cursor-pointer">
                Dismiss
              </button>
            </div>
          )}

          {/* Pricing & Currency Selector */}
          <div className="bg-[#f8fafd] border border-[#dadce0] p-4 rounded-2xl space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-[#1f1f1f]">
                    {currency === 'zwg'
                      ? 'ZWG 320'
                      : billingCycle === 'monthly'
                      ? '$12'
                      : '$10'}
                  </span>
                  <span className="text-xs text-[#5f6368] font-medium">/ month</span>
                  {currency === 'usd' && billingCycle === 'annual' && (
                    <span className="text-[10px] font-bold text-[#137333] bg-[#e6f4ea] px-2 py-0.5 rounded-full border border-[#ceead6]">
                      Billed annually ($120/yr, save 17%)
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#5f6368] mt-0.5">
                  Powered by Payonify • Card (Visa/Mastercard), EcoCash, or OneMoney
                </p>
              </div>

              {/* Currency & Interval Controls */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center bg-[#e8eaed] p-1 rounded-full text-xs font-semibold">
                  <button
                    onClick={() => {
                      setCurrency('usd');
                      setBillingCycle('monthly');
                    }}
                    className={`px-2.5 py-1 rounded-full transition-all cursor-pointer ${
                      currency === 'usd'
                        ? 'bg-white text-[#1f1f1f] shadow-xs'
                        : 'text-[#5f6368] hover:text-[#1f1f1f]'
                    }`}
                  >
                    USD ($)
                  </button>
                  <button
                    onClick={() => {
                      setCurrency('zwg');
                      setBillingCycle('monthly');
                    }}
                    className={`px-2.5 py-1 rounded-full transition-all cursor-pointer ${
                      currency === 'zwg'
                        ? 'bg-white text-[#1f1f1f] shadow-xs'
                        : 'text-[#5f6368] hover:text-[#1f1f1f]'
                    }`}
                  >
                    ZWG
                  </button>
                </div>

                {currency === 'usd' && (
                  <div className="flex items-center bg-[#e8eaed] p-1 rounded-full text-xs font-semibold">
                    <button
                      onClick={() => setBillingCycle('monthly')}
                      className={`px-2.5 py-1 rounded-full transition-all cursor-pointer ${
                        billingCycle === 'monthly'
                          ? 'bg-white text-[#1f1f1f] shadow-xs'
                          : 'text-[#5f6368] hover:text-[#1f1f1f]'
                      }`}
                    >
                      Monthly
                    </button>
                    <button
                      onClick={() => setBillingCycle('annual')}
                      className={`px-2.5 py-1 rounded-full transition-all cursor-pointer ${
                        billingCycle === 'annual'
                          ? 'bg-white text-[#1f1f1f] shadow-xs'
                          : 'text-[#5f6368] hover:text-[#1f1f1f]'
                      }`}
                    >
                      Annual (-17%)
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Payment Method Flow Toggle: Hosted Checkout vs Direct Mobile Money */}
            <div className="pt-2 border-t border-[#e8eaed] flex items-center gap-3">
              <span className="text-[11px] font-bold text-[#5f6368] uppercase tracking-wider">Method:</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMode('hosted')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    paymentMode === 'hosted'
                      ? 'bg-purple-100 text-purple-900 border border-purple-300 shadow-xs'
                      : 'bg-white text-[#5f6368] border border-[#dadce0] hover:bg-slate-50'
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5 text-purple-600" />
                  <span>Hosted Checkout (Card / Mobile)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMode('mobile_direct')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    paymentMode === 'mobile_direct'
                      ? 'bg-purple-100 text-purple-900 border border-purple-300 shadow-xs'
                      : 'bg-white text-[#5f6368] border border-[#dadce0] hover:bg-slate-50'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5 text-purple-600" />
                  <span>Direct Mobile Money Prompt</span>
                </button>
              </div>
            </div>

            {/* Direct Mobile Money Form Details */}
            {paymentMode === 'mobile_direct' && (
              <div className="p-3 bg-white rounded-xl border border-purple-200 space-y-2 animate-in fade-in">
                <div className="flex items-center justify-between text-xs text-[#5f6368]">
                  <span>Instant push notification to customer phone via Payonify Charge API</span>
                  <span className="text-[11px] text-purple-700 font-medium">Test numbers: 771111111 / 713111111</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <select
                    value={mobileNetwork}
                    onChange={(e) => setMobileNetwork(e.target.value as any)}
                    className="px-3 py-2 text-xs border border-[#dadce0] rounded-lg bg-[#f8fafd] text-[#1f1f1f] font-semibold outline-none focus:border-purple-600"
                  >
                    <option value="ecocash">EcoCash</option>
                    <option value="onemoney">OneMoney</option>
                  </select>
                  <div className="sm:col-span-2 relative">
                    <input
                      type="text"
                      placeholder="e.g. 771111111"
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-[#dadce0] rounded-lg text-[#1f1f1f] font-mono outline-none focus:border-purple-600"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Feature Value Props (The 4 Pillars) */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#5f6368]">
              What You Unlock with G-Deck Pro:
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-2xl bg-[#faf5ff] border border-[#e9d5ff] space-y-1">
                <div className="flex items-center gap-1.5 text-[#7e22ce] font-bold text-xs">
                  <Zap className="w-3.5 h-3.5 fill-current" />
                  <span>Cross-Tool Magic Actions</span>
                </div>
                <p className="text-[11px] text-[#444746] leading-relaxed">
                  • 1-Click Email to Task/Event with Google Meet
                  <br />
                  • Meeting Prep Packs with Drive docs & history
                  <br />
                  • Smart Follow-Up Generator for meetings
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-[#f0f4f9] border border-[#dadce0] space-y-1">
                <div className="flex items-center gap-1.5 text-[#1a73e8] font-bold text-xs">
                  <Sparkles className="w-3.5 h-3.5 fill-current" />
                  <span>Unlimited Workspace AI</span>
                </div>
                <p className="text-[11px] text-[#444746] leading-relaxed">
                  • Unlimited AI queries (removes 10/month limit)
                  <br />
                  • Deep Thread TL;DR Summarization
                  <br />
                  • Tone & Polish Studio for emails
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-[#f8fafd] border border-[#dadce0] space-y-1">
                <div className="flex items-center gap-1.5 text-[#188038] font-bold text-xs">
                  <Search className="w-3.5 h-3.5" />
                  <span>Unified Omni-Search (⌘K)</span>
                </div>
                <p className="text-[11px] text-[#444746] leading-relaxed">
                  Simultaneously searches Gmail messages, Calendar descriptions, Drive files, and Google Tasks.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-[#f8fafd] border border-[#dadce0] space-y-1">
                <div className="flex items-center gap-1.5 text-[#d93025] font-bold text-xs">
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Multi-Account & Priority Sync</span>
                </div>
                <p className="text-[11px] text-[#444746] leading-relaxed">
                  Multi-account Google switching (work + personal) and ultra-low latency priority sync.
                </p>
              </div>
            </div>
          </div>

          {/* Primary Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <button
              onClick={handleTrialActivation}
              disabled={isProcessing}
              className="w-full sm:w-auto py-3 px-4 bg-white hover:bg-slate-50 text-purple-700 text-xs font-bold rounded-2xl border border-purple-200 shadow-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5 fill-current" />
              <span>Start 14-Day Free Trial (No Card)</span>
            </button>

            {paymentMode === 'hosted' ? (
              <button
                onClick={handlePayonifyCheckout}
                disabled={isProcessing}
                className="w-full sm:flex-1 py-3 px-5 bg-gradient-to-r from-[#7e22ce] to-[#1a73e8] hover:from-[#6b21a8] hover:to-[#1557b0] text-white text-xs sm:text-sm font-bold rounded-2xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all hover:shadow-lg disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Redirecting to Payonify...</span>
                  </>
                ) : (
                  <>
                    <span>Pay with Payonify ({currency === 'zwg' ? 'ZWG 320' : billingCycle === 'annual' ? '$120/yr' : '$12/mo'})</span>
                    <ExternalLink className="w-4 h-4" />
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleDirectMobileCharge}
                disabled={isProcessing || !mobileNumber}
                className="w-full sm:flex-1 py-3 px-5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs sm:text-sm font-bold rounded-2xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all hover:shadow-lg disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Sending USSD Prompt...</span>
                  </>
                ) : (
                  <>
                    <Smartphone className="w-4 h-4" />
                    <span>Send {mobileNetwork.toUpperCase()} Prompt</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Developer / Tester Sandbox Switcher at the bottom */}
        <div className="bg-[#f8fafd] border-t border-[#dadce0] px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#5f6368]">
          <span className="font-semibold flex items-center gap-1">
            <Sliders className="w-3 h-3 text-[#1a73e8]" />
            Payonify Test Mode Active:
          </span>
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setMockPlan('free', 3)}
              className={`px-2 py-0.5 rounded-md border font-medium cursor-pointer transition-colors ${
                tier === 'free' && aiQueriesUsed < maxFreeAiQueries
                  ? 'bg-blue-100 text-blue-800 border-blue-300 font-bold'
                  : 'bg-white hover:bg-slate-100 border-slate-200'
              }`}
            >
              Free (3/10 AI)
            </button>
            <button
              onClick={() => setMockPlan('free', 10)}
              className={`px-2 py-0.5 rounded-md border font-medium cursor-pointer transition-colors ${
                tier === 'free' && aiQueriesUsed >= maxFreeAiQueries
                  ? 'bg-amber-100 text-amber-800 border-amber-300 font-bold'
                  : 'bg-white hover:bg-slate-100 border-slate-200'
              }`}
            >
              Free (Limit Hit)
            </button>
            <button
              onClick={() => setMockPlan('trial', 12)}
              className={`px-2 py-0.5 rounded-md border font-medium cursor-pointer transition-colors ${
                tier === 'trial'
                  ? 'bg-purple-100 text-purple-800 border-purple-300 font-bold'
                  : 'bg-white hover:bg-slate-100 border-slate-200'
              }`}
            >
              14-Day Trial
            </button>
            <button
              onClick={() => setMockPlan('pro', 45)}
              className={`px-2 py-0.5 rounded-md border font-medium cursor-pointer transition-colors ${
                tier === 'pro'
                  ? 'bg-green-100 text-green-800 border-green-300 font-bold'
                  : 'bg-white hover:bg-slate-100 border-slate-200'
              }`}
            >
              Pro Active
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
