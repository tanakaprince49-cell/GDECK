import React from 'react';
import { AlertTriangle, X, Check } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
  itemsList?: string[];
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  description,
  confirmLabel = 'Confirm Action',
  cancelLabel = 'Cancel',
  isDestructive = false,
  onConfirm,
  onCancel,
  isLoading = false,
  itemsList,
}) => {
  if (!isOpen) return null;

  return (
    <div
      id="confirm-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200"
    >
      <div
        id="confirm-modal-container"
        className="w-full max-w-md bg-[#0F172A]/95 backdrop-blur-2xl rounded-2xl shadow-[0_24px_60px_rgba(0,0,0,0.6)] border border-white/[0.1] overflow-hidden"
      >
        <div className="p-6 sm:p-7">
          <div className="flex items-start gap-4">
            <div
              className={`p-3 rounded-xl shrink-0 shadow-xs border ${
                isDestructive
                  ? 'bg-red-500/10 text-red-400 border-red-500/20'
                  : 'bg-[#fbe618]/10 text-[#fbe618] border-[#fbe618]/30'
              }`}
            >
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-[#F8FAFC] tracking-tight">{title}</h3>
              <p className="mt-1.5 text-sm text-[#94A3B8] leading-relaxed">{description}</p>
            </div>
            <button
              id="confirm-modal-close-btn"
              onClick={onCancel}
              className="text-[#94A3B8] hover:text-[#F8FAFC] p-1.5 rounded-xl hover:bg-white/[0.06] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {itemsList && itemsList.length > 0 && (
            <div className="mt-4 p-3 bg-white/[0.03] backdrop-blur-md rounded-xl border border-white/[0.08] text-xs text-[#CBD5E1] max-h-32 overflow-y-auto space-y-1">
              {itemsList.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#fbe618]" />
                  <span className="truncate font-medium">{item}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-6 py-4 bg-white/[0.02] backdrop-blur-xl border-t border-white/[0.08] flex items-center justify-end gap-3">
          <button
            id="confirm-modal-cancel-btn"
            type="button"
            disabled={isLoading}
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-white/[0.06] rounded-xl transition-all cursor-pointer disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            id="confirm-modal-confirm-btn"
            type="button"
            disabled={isLoading}
            onClick={onConfirm}
            className={`px-5 py-2 text-sm font-bold rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer ${
              isDestructive
                ? 'bg-red-600 hover:bg-red-500 active:bg-red-700 text-white shadow-red-500/30'
                : 'bg-[#fbe618] hover:bg-[#fff04d] text-[#0B0F17] shadow-[0_4px_16px_rgba(251,230,24,0.3)]'
            } disabled:opacity-50`}
          >
            {isLoading ? (
              <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
