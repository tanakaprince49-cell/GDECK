import React from 'react';
import { XCircle, ArrowRight, RotateCcw } from 'lucide-react';

interface CheckoutCancelViewProps {
  onReturnToDashboard: () => void;
  onRetry: () => void;
}

export const CheckoutCancelView: React.FC<CheckoutCancelViewProps> = ({
  onReturnToDashboard,
  onRetry,
}) => {
  return (
    <div className="min-h-screen bg-[#f8fafd] flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-3xl border border-[#dadce0] shadow-[0_10px_30px_rgba(0,0,0,0.08)] p-8 text-center space-y-6">
        <div className="w-16 h-16 bg-[#fce8e6] text-[#d93025] rounded-full flex items-center justify-center mx-auto shadow-xs">
          <XCircle className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-extrabold text-[#1f1f1f] tracking-tight">Checkout Cancelled</h1>
          <p className="text-sm text-[#444746] max-w-md mx-auto">
            You haven't been charged. If you changed your mind or would like to use a different payment method (EcoCash, OneMoney, or Card), you can retry anytime.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={onRetry}
            className="flex-1 py-3 px-5 bg-gradient-to-r from-purple-700 to-blue-600 hover:from-purple-800 hover:to-blue-700 text-white font-bold text-sm rounded-2xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Retry Checkout</span>
          </button>
          <button
            onClick={onReturnToDashboard}
            className="py-3 px-5 bg-[#f0f4f9] hover:bg-[#e8eaed] text-[#1f1f1f] font-semibold text-sm rounded-2xl border border-[#dadce0] transition-colors cursor-pointer"
          >
            <span>Return to G-Deck</span>
          </button>
        </div>
      </div>
    </div>
  );
};
