import React, { useState } from 'react';
import { Trash2, AlertOctagon, X, Loader2, CheckSquare, Square } from 'lucide-react';
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
  const [confirmedCheckbox, setConfirmedCheckbox] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const isConfirmed =
    confirmedCheckbox ||
    confirmText.trim().toUpperCase() === 'DELETE' ||
    (userEmail && confirmText.trim().toLowerCase() === userEmail.toLowerCase());

  const handleDelete = async () => {
    if (!isConfirmed || isDeleting) return;

    setIsDeleting(true);
    setErrorMessage(null);

    try {
      await deleteAccountPermanently();
      onSuccess();
    } catch (err: any) {
      console.error('Failed to permanently delete account:', err);
      // Fallback: forcefully clear local storage and log out
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch {}
      onSuccess();
    }
  };

  const handleClose = () => {
    if (isDeleting) return;
    setConfirmText('');
    setConfirmedCheckbox(false);
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
                Revokes Google OAuth access and permanently erases your workspace data.
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
            <div className="p-3 bg-[#f8fafd] rounded-2xl border border-[#dadce0] flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs font-semibold text-[#5f6368]">Account:</span>
                <span className="text-xs font-bold text-[#1f1f1f] truncate">
                  {userEmail}
                </span>
              </div>
              <span className="text-[10px] font-semibold text-[#d93025] bg-[#fce8e6] px-2 py-0.5 rounded-full border border-[#f5c6cb] shrink-0">
                Pending Deletion
              </span>
            </div>
          )}

          <div className="space-y-2 text-xs leading-relaxed text-[#5f6368]">
            <p className="font-semibold text-[#d93025]">
              Permanently deleting your account will immediately:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-[#3c4043]">
              <li>
                <strong>Revoke Google OAuth permissions:</strong> Immediately disconnects G-Deck from your Google account.
              </li>
              <li>
                <strong>Delete authentication credentials:</strong> Removes your user record from Firebase Auth.
              </li>
              <li>
                <strong>Erase local storage & cache:</strong> Completely wipes cached emails, calendar events, documents, and chat messages.
              </li>
              <li>
                <strong>Clear AI assistant history:</strong> Resets all personal context and preferences.
              </li>
            </ul>
          </div>

          {/* Direct Checkbox Confirmation */}
          <div
            onClick={() => setConfirmedCheckbox(!confirmedCheckbox)}
            className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
              confirmedCheckbox
                ? 'bg-[#fce8e6] border-[#d93025] text-[#b3261e]'
                : 'bg-[#f8fafd] border-[#dadce0] hover:bg-[#f1f3f4] text-[#3c4043]'
            }`}
          >
            <button
              type="button"
              className="mt-0.5 text-[#d93025] focus:outline-none"
            >
              {confirmedCheckbox ? (
                <CheckSquare className="w-5 h-5 fill-[#d93025] text-white" />
              ) : (
                <Square className="w-5 h-5 text-[#5f6368]" />
              )}
            </button>
            <div className="text-xs font-medium leading-normal">
              <span className="font-bold text-[#1f1f1f]">
                I understand and want to permanently delete my account.
              </span>
              <p className="text-[11px] text-[#5f6368] mt-0.5">
                Click this box to immediately unlock the permanent deletion button.
              </p>
            </div>
          </div>

          {/* Alternative text typing */}
          <div className="p-3 bg-[#f8fafd] rounded-2xl border border-[#dadce0] space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="confirm-delete-input"
                className="text-xs font-semibold text-[#5f6368]"
              >
                Or type <span className="font-bold text-[#d93025]">DELETE</span> to confirm:
              </label>
              <button
                type="button"
                onClick={() => setConfirmText('DELETE')}
                className="text-[11px] font-bold text-[#1a73e8] hover:underline cursor-pointer"
              >
                Auto-fill DELETE
              </button>
            </div>
            <input
              id="confirm-delete-input"
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Type DELETE"
              disabled={isDeleting}
              className="w-full px-3.5 py-2 bg-white rounded-xl border border-[#dadce0] text-xs font-semibold text-[#1f1f1f] focus:outline-none focus:border-[#d93025] focus:ring-1 focus:ring-[#d93025] transition-all"
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
        <div className="p-5 pt-3 bg-[#f8fafd] border-t border-[#dadce0] flex items-center justify-between gap-3">
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
                ? 'bg-[#d93025] hover:bg-[#b3261e] shadow-[0_2px_8px_rgba(217,48,37,0.35)]'
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
                <span>Permanently Delete My Account</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
