import React, { useState } from 'react';
import { Trash2, AlertOctagon, X, Loader2, ShieldCheck } from 'lucide-react';
import { deleteAccountPermanently } from '../services/auth';

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userEmail?: string | null;
}

export const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  userEmail,
}) => {
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const isConfirmed = confirmText.trim().toUpperCase() === 'DELETE';

  const handleDelete = async () => {
    if (!isConfirmed || isDeleting) return;

    setIsDeleting(true);
    setErrorMessage(null);

    try {
      await deleteAccountPermanently();
      onSuccess();
    } catch (err: any) {
      console.error('Failed to permanently delete account:', err);
      setErrorMessage(
        err?.message || 'Failed to complete account deletion. Please try again.'
      );
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    if (isDeleting) return;
    setConfirmText('');
    setErrorMessage(null);
    onClose();
  };

  return (
    <div
      id="delete-account-modal-backdrop"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
    >
      <div
        id="delete-account-modal-container"
        className="w-full max-w-lg bg-white rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.3)] border border-[#dadce0] overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 pb-4 border-b border-[#f1f3f4] flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#fce8e6] text-[#d93025] border border-[#f5c6cb] shrink-0">
              <AlertOctagon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#1f1f1f]">
                Delete Account Permanently
              </h3>
              <p className="text-xs text-[#5f6368]">
                This action is irreversible and cannot be undone.
              </p>
            </div>
          </div>
          <button
            id="delete-account-modal-close-btn"
            onClick={handleClose}
            disabled={isDeleting}
            className="p-1.5 text-[#5f6368] hover:bg-[#f1f3f4] rounded-full transition-colors cursor-pointer disabled:opacity-50"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-sm text-[#3c4043]">
          {userEmail && (
            <div className="p-3 bg-[#f8fafd] rounded-2xl border border-[#dadce0] flex items-center gap-2">
              <span className="text-xs font-semibold text-[#5f6368]">Account:</span>
              <span className="text-xs font-bold text-[#1f1f1f] truncate">
                {userEmail}
              </span>
            </div>
          )}

          <div className="space-y-2 text-xs leading-relaxed text-[#5f6368]">
            <p className="font-semibold text-[#d93025]">
              Permanently deleting your account will immediately:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-[#3c4043]">
              <li>
                <strong>Revoke all Google OAuth permissions:</strong> Disconnects
                G-Deck from your Google Workspace account immediately.
              </li>
              <li>
                <strong>Delete your authentication identity:</strong> Removes your
                credentials and user record from Firebase Authentication.
              </li>
              <li>
                <strong>Erase all local workspace data:</strong> Wipes all local
                cache, personal Keep notes, Messages conversation threads, and
                tasks.
              </li>
              <li>
                <strong>Clear G-Pilot AI memories:</strong> Permanently erases all
                saved facts and conversation history with the AI assistant.
              </li>
            </ul>
          </div>

          <div className="p-3.5 bg-[#fce8e6]/60 rounded-2xl border border-[#f5c6cb] space-y-2">
            <label
              htmlFor="confirm-delete-input"
              className="block text-xs font-bold text-[#d93025]"
            >
              To confirm, type <span className="underline uppercase tracking-wider">DELETE</span> below:
            </label>
            <input
              id="confirm-delete-input"
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Type DELETE to confirm"
              disabled={isDeleting}
              className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-[#d93025]/40 text-sm font-semibold text-[#1f1f1f] focus:outline-none focus:ring-2 focus:ring-[#d93025] transition-all disabled:opacity-50"
              autoComplete="off"
            />
          </div>

          {errorMessage && (
            <div className="p-3 bg-[#fce8e6] text-[#d93025] rounded-xl text-xs font-medium border border-[#f5c6cb]">
              {errorMessage}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-5 pt-3 bg-[#f8fafd] border-t border-[#dadce0] flex items-center justify-end gap-3">
          <button
            id="cancel-delete-account-btn"
            onClick={handleClose}
            disabled={isDeleting}
            className="px-4 py-2 text-xs font-semibold text-[#3c4043] hover:bg-[#e8eaed] rounded-full transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            id="confirm-delete-account-btn"
            onClick={handleDelete}
            disabled={!isConfirmed || isDeleting}
            className={`px-5 py-2.5 text-xs font-bold text-white rounded-full flex items-center gap-2 shadow-xs transition-all cursor-pointer ${
              isConfirmed && !isDeleting
                ? 'bg-[#d93025] hover:bg-[#b3261e] shadow-[0_1px_3px_rgba(217,48,37,0.3)]'
                : 'bg-[#dadce0] text-[#70757a] cursor-not-allowed opacity-60'
            }`}
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Deleting Account...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>Permanently Delete Account</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
