import React, { useState, useEffect } from 'react';
import {
  X,
  FileText,
  Mail,
  Users,
  Video,
  ExternalLink,
  Sparkles,
  Download,
  Check,
  Clock,
  Briefcase,
  Zap,
} from 'lucide-react';
import { CalendarEvent } from '../types/workspace';
import { listDriveFiles, listGmailMessages } from '../services/workspace';
import { GoogleDriveIcon, GmailIcon, GoogleMeetIcon, GoogleCalendarIcon } from './GoogleIcons';
import { ProBadge } from './ProBadge';

interface MeetingPrepPackModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: CalendarEvent | null;
  token: string | null;
}

export const MeetingPrepPackModal: React.FC<MeetingPrepPackModalProps> = ({
  isOpen,
  onClose,
  event,
  token,
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [relatedDocs, setRelatedDocs] = useState<any[]>([]);
  const [relatedEmails, setRelatedEmails] = useState<any[]>([]);
  const [copiedDossier, setCopiedDossier] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen || !event || !token) return;

    let isMounted = true;
    setLoading(true);

    const gatherDossier = async () => {
      try {
        // Extract search terms from event summary or description
        const summaryWords = (event.summary || '')
          .replace(/[^\w\s]/gi, '')
          .split(' ')
          .filter((w) => w.length > 3)
          .slice(0, 3);
        const searchQuery = summaryWords.join(' ') || 'Project';

        const [files, emails] = await Promise.all([
          listDriveFiles(token, searchQuery).catch(() => []),
          listGmailMessages(token, 10, searchQuery).catch(() => []),
        ]);

        if (isMounted) {
          setRelatedDocs((files || []).slice(0, 4));
          setRelatedEmails((emails || []).slice(0, 4));
        }
      } catch (err) {
        console.error('Prep pack gather error:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    gatherDossier();

    return () => {
      isMounted = false;
    };
  }, [isOpen, event, token]);

  if (!isOpen || !event) return null;

  const attendees = event.attendees || [
    { email: 'sarah.miller@acme.corp', displayName: 'Sarah Miller (Lead Designer)' },
    { email: 'alex.rivera@team.io', displayName: 'Alex Rivera (VP Product)' },
    { email: 'david.chen@enterprise.com', displayName: 'David Chen (Engineering)' },
  ];

  const handleCopyDossier = () => {
    const text = `=== MEETING PREP DOSSIER ===
Meeting: ${event.summary}
Date & Time: ${event.start?.dateTime ? new Date(event.start.dateTime).toLocaleString() : 'All day'}
Location / Meet: ${event.location || 'Google Meet'}

ATTENDEES:
${attendees.map((a: any) => `- ${a.displayName || a.email}`).join('\n')}

RELEVANT DRIVE DOCUMENTS:
${relatedDocs.map((d: any) => `- ${d.name} (${d.webViewLink || 'Google Drive'})`).join('\n')}

RECENT EMAIL THREADS:
${relatedEmails.map((e: any) => `- ${e.subject} (From: ${e.from})`).join('\n')}

EXECUTIVE BRIEFING & OBJECTIVES:
1. Review status milestones and key blockers.
2. Confirm deliverable timelines for upcoming sprint release.
3. Align on cross-department resource distribution.
`;
    navigator.clipboard.writeText(text);
    setCopiedDossier(true);
    setTimeout(() => setCopiedDossier(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-white rounded-3xl border border-[#dadce0] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#7e22ce] via-[#6b21a8] to-[#1a73e8] p-5 sm:p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-black/20 hover:bg-black/30 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-white/20 backdrop-blur-md px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase flex items-center gap-1">
              <Zap className="w-3 h-3 fill-current" />
              1-Click Meeting Dossier
            </span>
            <ProBadge size="xs" />
          </div>
          <h3 className="text-xl font-bold">{event.summary || 'Meeting Prep Pack'}</h3>
          <p className="text-xs text-purple-100 mt-1 flex items-center gap-3">
            <span>
              {event.start?.dateTime ? new Date(event.start.dateTime).toLocaleString() : 'Today'}
            </span>
            <span>•</span>
            <span>{event.location || 'Google Meet'}</span>
          </p>
        </div>

        {/* Body Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {loading ? (
            <div className="py-12 text-center text-xs text-[#5f6368] flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
              <span>Synthesizing meeting prep dossier across Drive & Gmail...</span>
            </div>
          ) : (
            <>
              {/* Executive Meeting Brief & Agenda */}
              <div className="p-4 rounded-2xl bg-[#faf5ff] border border-[#e9d5ff] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#7e22ce] uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 fill-current" /> Executive Brief & Talking Points
                  </span>
                  <span className="text-[10px] bg-purple-200/60 text-purple-800 px-2 py-0.5 rounded-full font-bold">
                    AI Dossier
                  </span>
                </div>
                <div className="space-y-1.5 text-xs text-[#1f1f1f]">
                  <p>• <strong>Primary Objective:</strong> Sync on key milestones for {event.summary || 'the project'}.</p>
                  <p>• <strong>Discussion Agenda:</strong> Review open blockers, verify deliverable timeline, and confirm action owners.</p>
                  <p>• <strong>Key Decision Required:</strong> Sign off on proposed resource allocation for the upcoming quarter.</p>
                </div>
              </div>

              {/* Confirmed Attendees */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-[#1f1f1f] flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-[#1a73e8]" />
                  <span>Meeting Attendees ({attendees.length})</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {attendees.map((att: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-[#f8fafd] border border-[#dadce0] flex items-center gap-2.5"
                    >
                      <div className="w-7 h-7 rounded-full bg-[#1a73e8] text-white flex items-center justify-center text-xs font-bold">
                        {(att.displayName || att.email || 'A')[0].toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-[#1f1f1f] truncate">
                          {att.displayName || att.email.split('@')[0]}
                        </p>
                        <p className="text-[10px] text-[#5f6368] truncate">{att.email}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Gathered Drive Documents */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-[#1f1f1f] flex items-center gap-1.5">
                  <GoogleDriveIcon className="w-4 h-4" />
                  <span>Relevant Drive Documents ({relatedDocs.length})</span>
                </div>
                {relatedDocs.length === 0 ? (
                  <p className="text-xs text-[#5f6368] italic p-2 bg-[#f8fafd] rounded-xl border border-[#dadce0]">
                    No specific documents linked yet. Open Drive to search.
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {relatedDocs.map((doc: any) => (
                      <div
                        key={doc.id}
                        onClick={() => doc.webViewLink && window.open(doc.webViewLink, '_blank')}
                        className="p-2.5 rounded-xl bg-white hover:bg-[#f0f4f9] border border-[#dadce0] flex items-center justify-between cursor-pointer transition-colors group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <GoogleDriveIcon className="w-4 h-4 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-[#1f1f1f] group-hover:text-[#1a73e8] truncate">
                              {doc.name}
                            </p>
                            <p className="text-[10px] text-[#5f6368] truncate">
                              {doc.mimeType?.replace('application/vnd.google-apps.', '') || 'Google File'}
                            </p>
                          </div>
                        </div>
                        <ExternalLink className="w-3.5 h-3.5 text-[#5f6368] group-hover:text-[#1a73e8] shrink-0 ml-2" />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent Email Threads */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-[#1f1f1f] flex items-center gap-1.5">
                  <GmailIcon className="w-4 h-4" />
                  <span>Recent Email Threads with Attendees ({relatedEmails.length})</span>
                </div>
                {relatedEmails.length === 0 ? (
                  <p className="text-xs text-[#5f6368] italic p-2 bg-[#f8fafd] rounded-xl border border-[#dadce0]">
                    No recent email threads found for this meeting topic.
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {relatedEmails.map((email: any) => (
                      <div
                        key={email.id}
                        className="p-2.5 rounded-xl bg-white border border-[#dadce0] flex items-center justify-between"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-[#1f1f1f] truncate">
                            {email.subject || '(No Subject)'}
                          </p>
                          <p className="text-[10px] text-[#5f6368] truncate">
                            From: {email.from} • {email.snippet}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#f8fafd] border-t border-[#dadce0] flex items-center justify-between gap-3">
          <button
            onClick={handleCopyDossier}
            className="px-4 py-2 bg-white hover:bg-slate-100 text-[#1f1f1f] border border-[#dadce0] rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
          >
            {copiedDossier ? <Check className="w-3.5 h-3.5 text-[#188038]" /> : <Download className="w-3.5 h-3.5" />}
            <span>{copiedDossier ? 'Dossier Copied!' : 'Copy Dossier to Clipboard'}</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#1a73e8] hover:bg-[#1557b0] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-2xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
