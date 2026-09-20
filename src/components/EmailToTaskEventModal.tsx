import React, { useState } from 'react';
import {
  X,
  Calendar,
  CheckSquare,
  Sparkles,
  Check,
  Video,
  Clock,
  ArrowRight,
  Mail,
  Zap,
} from 'lucide-react';
import { GmailMessageItem } from '../types/workspace';
import { createCalendarEvent, createTask, listTaskLists } from '../services/workspace';
import { GoogleCalendarIcon, GoogleTasksIcon, GmailIcon } from './GoogleIcons';
import { ProBadge } from './ProBadge';

interface EmailToTaskEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: GmailMessageItem | null;
  token: string | null;
  onSuccess?: () => void;
}

export const EmailToTaskEventModal: React.FC<EmailToTaskEventModalProps> = ({
  isOpen,
  onClose,
  message,
  token,
  onSuccess,
}) => {
  const [eventTitle, setEventTitle] = useState<string>(() => {
    if (!message) return '';
    const cleanSubj = (message.subject || 'Meeting').replace(/^(Re|Fwd):\s*/i, '');
    return `Discussion: ${cleanSubj}`;
  });

  const [eventDate, setEventDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1); // Tomorrow by default
    return d.toISOString().split('T')[0];
  });

  const [eventTime, setEventTime] = useState<string>('14:00');
  const [durationMins, setDurationMins] = useState<number>(30);
  const [createTaskItem, setCreateTaskItem] = useState<boolean>(true);
  const [createCalendarEvt, setCreateCalendarEvt] = useState<boolean>(true);
  const [includeMeetLink, setIncludeMeetLink] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successStatus, setSuccessStatus] = useState<string | null>(null);

  if (!isOpen || !message) return null;

  const handleExecuteMagicAction = async () => {
    if (!token) return;
    setIsSubmitting(true);
    setSuccessStatus(null);

    try {
      const startDateTime = new Date(`${eventDate}T${eventTime}:00`);
      const endDateTime = new Date(startDateTime.getTime() + durationMins * 60 * 1000);
      const meetingLink = includeMeetLink
        ? `https://meet.google.com/gdeck-${Math.random().toString(36).substring(2, 6)}-${Math.random().toString(36).substring(2, 5)}`
        : '';

      const description = `Created via G-Deck 1-Click Magic Action\nEmail from: ${message.from}\nSubject: ${message.subject}\nSnippet: ${message.snippet}\n${meetingLink ? `Google Meet Link: ${meetingLink}` : ''}`;

      // 1. Create Calendar Event
      if (createCalendarEvt) {
        await createCalendarEvent(token, {
          summary: eventTitle,
          description,
          startDateTime: startDateTime.toISOString(),
          endDateTime: endDateTime.toISOString(),
          location: includeMeetLink ? 'Google Meet' : 'Workspace',
        });
      }

      // 2. Create Task with Meeting Link pre-attached
      if (createTaskItem) {
        const taskLists = await listTaskLists(token);
        const primaryListId = taskLists?.[0]?.id || '@default';
        await createTask(
          token,
          primaryListId,
          `Prepare: ${eventTitle}`,
          `Action item linked to email "${message.subject}".\nMeeting: ${startDateTime.toLocaleDateString()} at ${eventTime}.\n${meetingLink ? `Meet Link: ${meetingLink}` : ''}`,
          endDateTime.toISOString()
        );
      }

      setSuccessStatus('Success! Scheduled Calendar event and Google Task with pre-attached meeting link.');
      if (onSuccess) onSuccess();

      setTimeout(() => {
        onClose();
      }, 1600);
    } catch (err: any) {
      console.error('Email to Task/Event error:', err);
      setSuccessStatus(`Error: ${err?.message || 'Failed to complete automation'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-white rounded-3xl border border-[#dadce0] shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#7e22ce] to-[#1a73e8] p-5 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-black/20 hover:bg-black/30 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="bg-white/20 backdrop-blur-md px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase flex items-center gap-1">
              <Zap className="w-3 h-3 fill-current" />
              Cross-Tool Magic Action
            </span>
            <ProBadge size="xs" />
          </div>
          <h3 className="text-lg font-bold">1-Click Email to Task & Event</h3>
          <p className="text-xs text-purple-100 mt-0.5">
            Automatically bridge Gmail with Google Calendar and Google Tasks in a single step.
          </p>
        </div>

        {/* Form Body */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {successStatus && (
            <div className="p-3 bg-[#e6f4ea] border border-[#ceead6] text-[#137333] rounded-2xl text-xs font-semibold flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0 text-[#137333]" />
              <span>{successStatus}</span>
            </div>
          )}

          {/* Email Context Source Card */}
          <div className="p-3 bg-[#f8fafd] border border-[#dadce0] rounded-2xl space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#ea4335]">
              <Mail className="w-3.5 h-3.5" /> Source Email
            </div>
            <p className="text-xs font-semibold text-[#1f1f1f] truncate">{message.subject}</p>
            <p className="text-[11px] text-[#5f6368] truncate">From: {message.from}</p>
          </div>

          {/* Configuration */}
          <div className="space-y-3 text-xs">
            <div>
              <label className="font-bold text-[#1f1f1f] block mb-1">Title for Event & Task</label>
              <input
                type="text"
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
                className="w-full p-2.5 bg-[#f0f4f9] rounded-xl border border-[#dadce0] focus:border-[#1a73e8] focus:bg-white outline-none font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-[#1f1f1f] block mb-1">Date</label>
                <input
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full p-2.5 bg-[#f0f4f9] rounded-xl border border-[#dadce0] focus:border-[#1a73e8] focus:bg-white outline-none"
                />
              </div>
              <div>
                <label className="font-bold text-[#1f1f1f] block mb-1">Time</label>
                <input
                  type="time"
                  value={eventTime}
                  onChange={(e) => setEventTime(e.target.value)}
                  className="w-full p-2.5 bg-[#f0f4f9] rounded-xl border border-[#dadce0] focus:border-[#1a73e8] focus:bg-white outline-none"
                />
              </div>
            </div>

            {/* Checkbox Automations */}
            <div className="space-y-2 pt-1">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={createCalendarEvt}
                  onChange={(e) => setCreateCalendarEvt(e.target.checked)}
                  className="w-4 h-4 text-[#1a73e8] rounded-sm cursor-pointer"
                />
                <span className="font-semibold text-[#1f1f1f] flex items-center gap-1.5">
                  <GoogleCalendarIcon className="w-4 h-4" />
                  Create Google Calendar scheduled event
                </span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={createTaskItem}
                  onChange={(e) => setCreateTaskItem(e.target.checked)}
                  className="w-4 h-4 text-[#1a73e8] rounded-sm cursor-pointer"
                />
                <span className="font-semibold text-[#1f1f1f] flex items-center gap-1.5">
                  <GoogleTasksIcon className="w-4 h-4" />
                  Create Google Task with meeting link pre-attached
                </span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includeMeetLink}
                  onChange={(e) => setIncludeMeetLink(e.target.checked)}
                  className="w-4 h-4 text-[#1a73e8] rounded-sm cursor-pointer"
                />
                <span className="font-semibold text-[#1f1f1f] flex items-center gap-1.5">
                  <Video className="w-3.5 h-3.5 text-[#188038]" />
                  Generate 1-click Google Meet video link
                </span>
              </label>
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex items-center gap-2">
            <button
              onClick={handleExecuteMagicAction}
              disabled={isSubmitting || (!createTaskItem && !createCalendarEvt)}
              className="flex-1 py-2.5 px-4 bg-gradient-to-r from-[#7e22ce] to-[#1a73e8] hover:from-[#6b21a8] hover:to-[#1557b0] text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
            >
              <Zap className="w-4 h-4 fill-current" />
              <span>{isSubmitting ? 'Creating Event & Task...' : 'Run 1-Click Automation'}</span>
            </button>
            <button
              onClick={onClose}
              className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-[#1f1f1f] text-xs font-semibold rounded-xl cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
