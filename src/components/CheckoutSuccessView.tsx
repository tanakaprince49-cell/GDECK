import React, { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, ArrowRight, ShieldCheck, RefreshCw } from 'lucide-react';
import { usePlan } from '../context/PlanContext';

/** Set by UpgradeModal just before redirecting to Payonify's hosted checkout. */
export const CHECKOUT_STASH_KEY = 'gdeck_checkout_stash';

/** Mirrors server-side isCheckoutSessionPaid: Payonify must report the money state. */
const isPaidSession = (session: any): boolean =>
  !!session && (session.payment_status === 'paid' || session.status === 'complete');

interface CheckoutSuccessViewProps {
  onReturnToDashboard: () => void;
}

export const CheckoutSuccessView: React.FC<CheckoutSuccessViewProps> = ({ onReturnToDashboard }) => {
  const { activatePro, proExpiresLabel, proDaysRemaining } = usePlan();
  const [loading, setLoading] = useState<boolean>(true);
  const [sessionDetails, setSessionDetails] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [activatedPlanId, setActivatedPlanId] = useState<string | null>(null);

  const queryParams = new URLSearchParams(window.location.search);
  const sessionId = queryParams.get('session_id');
  const orderId = queryParams.get('order_id');

  useEffect(() => {
    let isMounted = true;

    const verifySession = async () => {
      // Payonify cannot echo the session id back into success_url (no {CHECKOUT_SESSION_ID}
      // substitution), so UpgradeModal stashes it at checkout start. A ?session_id= param is
      // still honoured for links that carry one.
      let resolvedSessionId = sessionId;
      if (!resolvedSessionId) {
        try {
          const stashed = sessionStorage.getItem(CHECKOUT_STASH_KEY);
          if (stashed) {
            const parsed = JSON.parse(stashed);
            if (!orderId || !parsed?.orderId || parsed.orderId === orderId) {
              resolvedSessionId = parsed?.sessionId || null;
            }
          }
        } catch {
          /* malformed stash -- treat as absent */
        }
      }

      if (!resolvedSessionId) {
        // Previously this branch called upgradeToPro(), which handed out Pro to anyone who
        // opened /checkout/success with no query string at all.
        if (isMounted) {
          setError('We could not find a Payonify checkout session for this visit. Pro unlocks only once a payment is confirmed.');
          setLoading(false);
        }
        return;
      }

      try {
        const res = await fetch(`/api/payonify/checkout/session/${resolvedSessionId}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Failed to verify session');
        }

        setSessionDetails(data);

        // Grant access on Payonify's own paid signal, never on "the fetch worked".
        // Period length comes from the plan that was actually billed.
        if (isPaidSession(data?.session)) {
          if (isMounted) {
            let stashedPlanId: string | undefined;
            let stashedOrderId: string | undefined;
            try {
              const stashed = sessionStorage.getItem(CHECKOUT_STASH_KEY);
              if (stashed) {
                const parsed = JSON.parse(stashed);
                stashedPlanId = parsed?.planId;
                stashedOrderId = parsed?.orderId;
              }
            } catch { /* ignore */ }

            const planId =
              data?.order?.planId ||
              data?.session?.metadata?.plan_id ||
              stashedPlanId ||
              'pro_monthly';
            const resolvedOrderId = data?.order?.id || orderId || stashedOrderId;
            const serverPeriodEnd =
              data?.subscription?.currentPeriodEnd ||
              data?.order?.metadata?.period_end ||
              undefined;

            activatePro({
              planId,
              orderId: resolvedOrderId || undefined,
              expiresAt: serverPeriodEnd,
              paidAt: data?.order?.paidAt || new Date().toISOString(),
            });
            setActivatedPlanId(planId);
            try { sessionStorage.removeItem(CHECKOUT_STASH_KEY); } catch { /* ignore */ }
            setLoading(false);
          }
          return;
        }

        if (isMounted) {
          setError('Payonify has not marked this session as paid yet. If you finished the transfer or card payment, retry in a few seconds.');
          setLoading(false);
        }
      } catch (err: any) {
        if (isMounted) {
          console.warn('Payonify session verification failed:', err);
          setError(err?.message || 'We could not reach Payonify to confirm your payment. No charge was recorded as verified yet.');
          setLoading(false);
        }
      }
    };

    verifySession();

    return () => {
      isMounted = false;
    };
  }, [sessionId, orderId, activatePro]);

  return (
    <div className="min-h-screen bg-[#f8fafd] flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-3xl border border-[#dadce0] shadow-[0_10px_30px_rgba(0,0,0,0.08)] p-8 text-center space-y-6">
        {loading ? (
          <div className="py-12 space-y-4">
            <RefreshCw className="w-10 h-10 text-purple-600 animate-spin mx-auto" />
            <h2 className="text-lg font-bold text-[#1f1f1f]">Confirming your payment with Payonify...</h2>
            <p className="text-xs text-[#5f6368]">Finalizing your G-Deck Pro subscription. Please do not close this window.</p>
          </div>
        ) : error ? (
          <>
            <div className="w-16 h-16 bg-[#fce8e6] text-[#c5221f] rounded-full flex items-center justify-center mx-auto shadow-xs">
              <XCircle className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-extrabold text-[#1f1f1f] tracking-tight">Payment not confirmed yet</h1>
              <p className="text-sm text-[#444746] max-w-md mx-auto">{error}</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setError(null); setLoading(true); window.location.reload(); }}
                className="flex-1 py-3.5 px-6 bg-white border border-[#dadce0] hover:bg-[#f0f4f9] text-[#1f1f1f] font-bold text-sm rounded-2xl cursor-pointer transition-all"
              >
                <span className="inline-flex items-center gap-2">
                  <RefreshCw className="w-4 h-4" />
                  <span>Retry verification</span>
                </span>
              </button>
              <button
                onClick={onReturnToDashboard}
                className="flex-1 py-3.5 px-6 bg-gradient-to-r from-purple-700 to-blue-600 hover:from-purple-800 hover:to-blue-700 text-white font-bold text-sm rounded-2xl cursor-pointer transition-all"
              >
                Back to G-Deck
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="w-16 h-16 bg-[#e6f4ea] text-[#137333] rounded-full flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <span className="inline-flex items-center gap-1 text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
                PAYONIFY VERIFIED
              </span>
              <h1 className="text-2xl font-extrabold text-[#1f1f1f] tracking-tight">Welcome to G-Deck Pro!</h1>
              <p className="text-sm text-[#444746] max-w-md mx-auto">
                Your payment was processed successfully. Unlimited AI and every Pro feature are unlocked until the end of this billing period — then you&apos;ll need to pay again to renew.
              </p>
            </div>

            <div className="bg-[#f0f4f9] rounded-2xl p-4 text-xs space-y-2 text-left border border-[#dadce0]">
              <div className="flex justify-between gap-3">
                <span className="text-[#5f6368]">Plan:</span>
                <span className="font-semibold text-[#1f1f1f] text-right">
                  {activatedPlanId === 'pro_annual'
                    ? 'G-Deck Pro · Annual ($120/yr)'
                    : activatedPlanId === 'pro_monthly_zwg'
                    ? 'G-Deck Pro · Monthly (ZWG 320)'
                    : 'G-Deck Pro · Monthly ($12/mo)'}
                </span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-[#5f6368]">Valid until:</span>
                <span className="font-semibold text-[#1f1f1f] text-right">
                  {proExpiresLabel || '—'}
                  {proDaysRemaining > 0 ? ` · ${proDaysRemaining} day${proDaysRemaining === 1 ? '' : 's'} left` : ''}
                </span>
              </div>
              {orderId && (
                <div className="flex justify-between">
                  <span className="text-[#5f6368]">Order Reference:</span>
                  <span className="font-mono text-[#1f1f1f]">{orderId}</span>
                </div>
              )}
              {sessionId && (
                <div className="flex justify-between">
                  <span className="text-[#5f6368]">Payonify Session:</span>
                  <span className="font-mono text-[#1f1f1f] truncate max-w-[200px]">{sessionId}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-[#5f6368]">Status:</span>
                <span className="text-[#137333] font-bold">Active & Paid · renews by checkout</span>
              </div>
            </div>

            <button
              onClick={onReturnToDashboard}
              className="w-full py-3.5 px-6 bg-gradient-to-r from-purple-700 to-blue-600 hover:from-purple-800 hover:to-blue-700 text-white font-bold text-sm rounded-2xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all hover:shadow-lg"
            >
              <span>Go to G-Deck Command Center</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
    </div>
  );
};
