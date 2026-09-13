import React, { useState } from 'react';
import {
  Video,
  Plus,
  Copy,
  ExternalLink,
  Check,
  Calendar,
  Users,
  CheckCircle2,
  PhoneCall,
  ArrowLeft,
} from 'lucide-react';
import { MeetSpace } from '../types/workspace';
import { createMeetingSpace } from '../services/workspace';
import { ConfirmModal } from './ConfirmModal';
import { GoogleMeetIcon } from './GoogleIcons';

interface MeetViewProps {
  token: string;
  onBackToOverview?: () => void;
}

export const MeetView: React.FC<MeetViewProps> = ({ token, onBackToOverview }) => {
  const [createdSpaces, setCreatedSpaces] = useState<MeetSpace[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Confirm modal state
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);

  const handleConfirmCreate = async () => {
    setLoading(true);
    setError(null);
    try {
      const space = await createMeetingSpace(token);
      setCreatedSpaces((prev) => [space, ...prev]);
      setShowConfirmModal(false);
    } catch (err: any) {
      setError(
        err.message ||
          'Failed to create Google Meet space. Note: Meet REST API requires Google Meet service access on the Google account.'
      );
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div id="meet-view" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/75 backdrop-blur-2xl p-5 sm:p-6 rounded-3xl border border-white/90 shadow-[0_16px_40px_rgba(0,15,40,0.05),inset_0_1.5px_2px_rgba(255,255,255,1)]">
        <div className="flex items-center gap-3">
          {onBackToOverview && (
            <button
              id="meet-back-to-overview-btn"
              onClick={onBackToOverview}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-emerald-600 bg-white/80 hover:bg-white border border-white/90 rounded-xl transition-all shadow-2xs cursor-pointer shrink-0"
              title="Return to Workspace Overview"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to Overview</span>
              <span className="sm:hidden">Back</span>
            </button>
          )}
          <div className="p-2 bg-emerald-500/10 border border-emerald-200/60 rounded-2xl shrink-0 shadow-2xs flex items-center justify-center">
            <GoogleMeetIcon className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Google Meet</h2>
            <p className="text-sm text-slate-500">Instant video conferences, meeting links, and virtual rooms</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            id="start-meet-btn"
            onClick={() => setShowConfirmModal(true)}
            className="px-4 py-2.5 bg-gradient-to-b from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 active:bg-emerald-800 text-white text-xs font-semibold rounded-xl shadow-[0_4px_14px_rgba(16,185,129,0.3),inset_0_1px_1px_rgba(255,255,255,0.4)] border border-emerald-400/40 flex items-center gap-2 transition-all cursor-pointer hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            New Meeting Space
          </button>
          <a
            href="https://meet.google.com/new"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2.5 text-slate-600 hover:text-emerald-700 bg-white/70 hover:bg-white rounded-xl border border-white/90 transition-colors shadow-2xs cursor-pointer"
            title="Launch instant Meet on web"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50/80 backdrop-blur-md border border-red-200/80 text-red-700 rounded-2xl text-sm flex items-center justify-between shadow-xs">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-xs underline font-medium">
            Dismiss
          </button>
        </div>
      )}

      {/* Hero Action Card with Glossy Glass Atmosphere */}
      <div className="relative overflow-hidden rounded-3xl p-8 sm:p-10 border border-white/30 text-white bg-gradient-to-br from-emerald-600/95 via-teal-600/90 to-cyan-700/95 shadow-[0_20px_50px_rgba(16,185,129,0.25),inset_0_2px_3px_rgba(255,255,255,0.35)] backdrop-blur-2xl">
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-white/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-teal-300/20 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 max-w-xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold text-white border border-white/30 shadow-2xs">
             Google Meet API v2 Powered
          </div>
          <h3 className="text-2xl sm:text-3xl font-bold tracking-tight">Create & Share Video Conferences</h3>
          <p className="text-emerald-50/90 text-sm sm:text-base leading-relaxed">
            Generate secure meeting spaces directly connected to your Google Workspace account with HD
            video, screen sharing, and interactive collaboration.
          </p>
          <div className="pt-2 flex flex-wrap gap-3">
            <button
              onClick={() => setShowConfirmModal(true)}
              className="px-5 py-3 bg-white text-emerald-900 hover:bg-emerald-50 font-bold text-xs sm:text-sm rounded-xl transition-all shadow-[0_8px_20px_rgba(0,0,0,0.12),inset_0_1px_1px_rgba(255,255,255,0.8)] flex items-center gap-2 cursor-pointer hover:scale-105"
            >
              <Video className="w-4 h-4 text-emerald-600" /> Create Meeting Link
            </button>
            <a
              href="https://meet.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-3 bg-white/15 hover:bg-white/25 text-white font-semibold text-xs sm:text-sm rounded-xl transition-all flex items-center gap-2 border border-white/25 backdrop-blur-md cursor-pointer"
            >
              <PhoneCall className="w-4 h-4" /> Join With a Code
            </a>
          </div>
        </div>
      </div>

      {/* Generated Spaces List */}
      <div className="bg-white/75 backdrop-blur-2xl rounded-3xl border border-white/90 shadow-[0_16px_40px_rgba(0,15,40,0.05),inset_0_1.5px_2px_rgba(255,255,255,1)] p-6 sm:p-7 space-y-4">
        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Active & Generated Meeting Spaces
        </h4>

        {createdSpaces.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <Video className="w-10 h-10 stroke-1 mx-auto mb-2 text-slate-300" />
            <p className="text-sm font-medium text-slate-600">No meetings created yet</p>
            <p className="text-xs text-slate-400 mt-0.5">
              Click "New Meeting Space" to generate an official Google Meet room link
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {createdSpaces.map((space, idx) => (
              <div
                key={space.name || idx}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-sm font-semibold text-slate-900 font-mono">
                      {space.meetingCode || space.name}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 truncate">
                    Join link:{' '}
                    <span className="text-emerald-700 font-medium">
                      {space.meetingUri || `https://meet.google.com/${space.meetingCode}`}
                    </span>
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() =>
                      copyToClipboard(
                        space.meetingUri || `https://meet.google.com/${space.meetingCode}`,
                        space.name
                      )
                    }
                    className="px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-200 rounded-lg border border-slate-200 flex items-center gap-1.5 transition-colors"
                  >
                    {copiedCode === space.name ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" /> Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" /> Copy Link
                      </>
                    )}
                  </button>

                  <a
                    href={space.meetingUri || `https://meet.google.com/${space.meetingCode}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg flex items-center gap-1.5 transition-colors shadow-2xs"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Join Meet
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirmation modal before creating meeting space */}
      <ConfirmModal
        isOpen={showConfirmModal}
        title="Create Google Meet Space"
        description="Are you sure you want to provision a new Google Meet virtual conference room with your Google account credentials?"
        confirmLabel="Create Meeting Space"
        isDestructive={false}
        isLoading={loading}
        onConfirm={handleConfirmCreate}
        onCancel={() => setShowConfirmModal(false)}
      />
    </div>
  );
};
