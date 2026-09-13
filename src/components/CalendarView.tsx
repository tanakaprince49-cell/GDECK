import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Plus,
  Trash2,
  RefreshCw,
  Clock,
  MapPin,
  ExternalLink,
  CalendarCheck,
  X,
  CheckCircle2,
  ArrowLeft,
} from 'lucide-react';
import { CalendarEvent } from '../types/workspace';
import {
  listCalendarEvents,
  createCalendarEvent,
  deleteCalendarEvent,
} from '../services/workspace';
import { ConfirmModal } from './ConfirmModal';
import { GoogleCalendarIcon } from './GoogleIcons';

interface CalendarViewProps {
  token: string;
  onBackToOverview?: () => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ token, onBackToOverview }) => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // New Event Modal state
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [eventSummary, setEventSummary] = useState<string>('');
  const [eventDescription, setEventDescription] = useState<string>('');
  const [eventLocation, setEventLocation] = useState<string>('');
  const [startDateTime, setStartDateTime] = useState<string>('');
  const [endDateTime, setEndDateTime] = useState<string>('');
  const [showCreateConfirm, setShowCreateConfirm] = useState<boolean>(false);
  const [isCreating, setIsCreating] = useState<boolean>(false);

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<CalendarEvent | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Event details preview modal
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  const loadEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listCalendarEvents(token, 25);
      setEvents(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load calendar events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
    // Default start date = tomorrow 10:00, end date = tomorrow 11:00
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    const end = new Date(tomorrow);
    end.setHours(11, 0, 0, 0);

    const toLocalISO = (d: Date) => d.toISOString().slice(0, 16);
    setStartDateTime(toLocalISO(tomorrow));
    setEndDateTime(toLocalISO(end));
  }, [token]);

  const handleConfirmCreate = async () => {
    setIsCreating(true);
    try {
      await createCalendarEvent(token, {
        summary: eventSummary,
        description: eventDescription,
        location: eventLocation,
        startDateTime,
        endDateTime,
      });
      setSuccessMsg(`Event "${eventSummary}" scheduled successfully!`);
      setShowCreateConfirm(false);
      setShowCreateModal(false);
      setEventSummary('');
      setEventDescription('');
      setEventLocation('');
      loadEvents();
    } catch (err: any) {
      setError(err.message || 'Failed to create calendar event');
    } finally {
      setIsCreating(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteCalendarEvent(token, deleteTarget.id);
      setEvents((prev) => prev.filter((e) => e.id !== deleteTarget.id));
      setDeleteTarget(null);
      setSuccessMsg('Calendar event removed.');
    } catch (err: any) {
      setError(err.message || 'Failed to delete event');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatEventTime = (event: CalendarEvent) => {
    const start = event.start?.dateTime || event.start?.date;
    const end = event.end?.dateTime || event.end?.date;
    if (!start) return '';

    const startDate = new Date(start);
    if (!event.start?.dateTime) {
      // All-day event
      return `${startDate.toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      })} (All day)`;
    }

    const endDate = end ? new Date(end) : null;
    return `${startDate.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })} • ${startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}${
      endDate ? ` – ${endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''
    }`;
  };

  return (
    <div id="calendar-view" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/75 backdrop-blur-2xl p-5 sm:p-6 rounded-3xl border border-white/90 shadow-[0_16px_40px_rgba(0,15,40,0.05),inset_0_1.5px_2px_rgba(255,255,255,1)]">
        <div className="flex items-center gap-3">
          {onBackToOverview && (
            <button
              id="calendar-back-to-overview-btn"
              onClick={onBackToOverview}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-blue-600 bg-white/80 hover:bg-white border border-white/90 rounded-xl transition-all shadow-2xs cursor-pointer shrink-0"
              title="Return to Workspace Overview"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to Overview</span>
              <span className="sm:hidden">Back</span>
            </button>
          )}
          <div className="p-2 bg-blue-500/10 border border-blue-200/60 rounded-2xl shrink-0 shadow-2xs flex items-center justify-center">
            <GoogleCalendarIcon className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Google Calendar</h2>
            <p className="text-sm text-slate-500">Upcoming schedule, meetings, and event planning</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            id="create-event-btn"
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 bg-gradient-to-b from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 active:bg-blue-800 text-white text-xs font-semibold rounded-xl shadow-[0_4px_14px_rgba(59,130,246,0.3),inset_0_1px_1px_rgba(255,255,255,0.4)] border border-blue-400/40 flex items-center gap-2 transition-all cursor-pointer hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            Schedule Event
          </button>
          <a
            href="https://calendar.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2.5 text-slate-600 hover:text-blue-600 bg-white/70 hover:bg-white rounded-xl border border-white/90 transition-colors shadow-2xs cursor-pointer"
            title="Open Google Calendar"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
          <button
            id="calendar-refresh-btn"
            onClick={loadEvents}
            disabled={loading}
            className="p-2.5 text-slate-600 hover:text-slate-900 bg-white/70 hover:bg-white rounded-xl border border-white/90 transition-colors shadow-2xs cursor-pointer"
            title="Refresh events"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50/90 backdrop-blur-md border border-red-200/80 text-red-700 rounded-2xl text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold">Unable to load calendar events:</span>
            <span>{error === 'Failed to fetch' ? 'Connection or token expired. Please retry or re-sign in to refresh Google OAuth token.' : error}</span>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={loadEvents}
              className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-800 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              Retry
            </button>
            <button onClick={() => setError(null)} className="text-xs text-red-600 hover:text-red-900 underline font-medium cursor-pointer">
              Dismiss
            </button>
          </div>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50/80 backdrop-blur-md border border-emerald-200/80 text-emerald-700 rounded-2xl text-sm flex items-center justify-between shadow-xs">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> {successMsg}
          </span>
          <button onClick={() => setSuccessMsg(null)} className="text-xs underline font-medium">
            Dismiss
          </button>
        </div>
      )}

      {/* Events List */}
      <div className="bg-white/75 backdrop-blur-2xl rounded-3xl border border-white/90 shadow-[0_16px_40px_rgba(0,15,40,0.05),inset_0_1.5px_2px_rgba(255,255,255,1)] overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-blue-500" />
            <p className="text-sm font-medium">Loading Google Calendar events...</p>
          </div>
        ) : events.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <CalendarCheck className="w-12 h-12 stroke-1 mx-auto mb-3 text-slate-300" />
            <p className="text-sm font-medium text-slate-600">No upcoming events scheduled</p>
            <p className="text-xs text-slate-400 mt-1">Click "Schedule Event" to add a new meeting</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {events.map((event) => (
              <div
                key={event.id}
                id={`calendar-event-${event.id}`}
                onClick={() => setSelectedEvent(event)}
                className="p-4 hover:bg-slate-50/80 transition-colors flex items-start justify-between gap-4 cursor-pointer group"
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    <h4 className="text-sm font-semibold text-slate-900 truncate">
                      {event.summary || '(Untitled Event)'}
                    </h4>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 pt-0.5">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {formatEventTime(event)}
                    </span>
                    {event.location && (
                      <span className="flex items-center gap-1.5 truncate max-w-xs">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {event.location}
                      </span>
                    )}
                  </div>

                  {event.description && (
                    <p className="text-xs text-slate-500 line-clamp-2 pt-1">
                      {event.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {event.htmlLink && (
                    <a
                      href={event.htmlLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Open event in Google Calendar"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                  <button
                    onClick={() => setDeleteTarget(event)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete event"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Schedule Event Dialog */}
      {showCreateModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/40 backdrop-blur-md p-4">
          <div className="w-full max-w-lg bg-white/85 backdrop-blur-2xl rounded-3xl shadow-[0_24px_60px_rgba(0,10,35,0.18),inset_0_1.5px_2px_rgba(255,255,255,1)] border border-white/90 overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-white/80 flex items-center justify-between bg-white/40">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-blue-600" /> Schedule Calendar Event
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-white/60 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Event Title:
                </label>
                <input
                  id="event-title-input"
                  type="text"
                  placeholder="e.g. Project Review Meeting"
                  value={eventSummary}
                  onChange={(e) => setEventSummary(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-white/70 backdrop-blur-md border border-white/90 rounded-xl focus:ring-2 focus:ring-blue-500/20 shadow-2xs"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Start Time:
                  </label>
                  <input
                    id="event-start-input"
                    type="datetime-local"
                    value={startDateTime}
                    onChange={(e) => setStartDateTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-white/70 backdrop-blur-md border border-white/90 rounded-xl focus:ring-2 focus:ring-blue-500/20 shadow-2xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    End Time:
                  </label>
                  <input
                    id="event-end-input"
                    type="datetime-local"
                    value={endDateTime}
                    onChange={(e) => setEndDateTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-white/70 backdrop-blur-md border border-white/90 rounded-xl focus:ring-2 focus:ring-blue-500/20 shadow-2xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Location (optional):
                </label>
                <input
                  id="event-location-input"
                  type="text"
                  placeholder="e.g. Google Meet or Conference Room A"
                  value={eventLocation}
                  onChange={(e) => setEventLocation(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-white/70 backdrop-blur-md border border-white/90 rounded-xl focus:ring-2 focus:ring-blue-500/20 shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Description (optional):
                </label>
                <textarea
                  id="event-description-input"
                  rows={3}
                  placeholder="Agenda, notes, or details..."
                  value={eventDescription}
                  onChange={(e) => setEventDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-white/70 backdrop-blur-md border border-white/90 rounded-xl focus:ring-2 focus:ring-blue-500/20 shadow-2xs"
                />
              </div>
            </div>

            <div className="px-6 py-4 bg-white/50 backdrop-blur-xl border-t border-white/80 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-white/80 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                id="schedule-confirm-btn"
                type="button"
                disabled={!eventSummary || !startDateTime || !endDateTime}
                onClick={() => setShowCreateConfirm(true)}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-b from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 active:bg-blue-800 rounded-xl disabled:opacity-50 transition-all shadow-[0_4px_14px_rgba(59,130,246,0.3),inset_0_1px_1px_rgba(255,255,255,0.4)] border border-blue-400/40 cursor-pointer"
              >
                Schedule Event...
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Event Details Preview Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/40 backdrop-blur-md p-4">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-[0_24px_60px_rgba(0,10,35,0.18)] border border-[#dadce0] p-6 space-y-4">
            <div className="flex items-start justify-between border-b border-[#f1f3f4] pb-3">
              <div className="space-y-1">
                <h3 className="text-base font-bold text-[#1f1f1f]">{selectedEvent.summary || '(Untitled Event)'}</h3>
                <p className="text-xs text-[#1a73e8] font-medium flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> {formatEventTime(selectedEvent)}
                </p>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-[#5f6368] hover:text-[#1f1f1f] p-1 rounded-full hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs text-[#444746]">
              {selectedEvent.location && (
                <div className="flex items-start gap-2 py-1">
                  <MapPin className="w-4 h-4 text-[#ea4335] shrink-0 mt-0.5" />
                  <span className="font-medium text-[#1f1f1f]">{selectedEvent.location}</span>
                </div>
              )}
              {selectedEvent.description && (
                <div className="p-3 bg-[#f8fafd] rounded-2xl border border-[#dadce0] text-xs text-[#1f1f1f] whitespace-pre-wrap">
                  {selectedEvent.description}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[#f1f3f4]">
              <button
                onClick={() => {
                  setDeleteTarget(selectedEvent);
                  setSelectedEvent(null);
                }}
                className="px-3.5 py-1.5 text-xs font-semibold text-[#d93025] hover:bg-[#fce8e6] border border-[#f5c6cb] rounded-full"
              >
                Delete Event
              </button>
              {selectedEvent.htmlLink && (
                <a
                  href={selectedEvent.htmlLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-[#1a73e8] hover:bg-[#1557b0] text-white text-xs font-bold rounded-full flex items-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> View on Google Calendar
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Creating Event */}
      <ConfirmModal
        isOpen={showCreateConfirm}
        title="Confirm New Calendar Event"
        description={`Add "${eventSummary}" to your primary Google Calendar from ${startDateTime} to ${endDateTime}?`}
        confirmLabel="Confirm & Add Event"
        isDestructive={false}
        isLoading={isCreating}
        itemsList={[
          `Summary: ${eventSummary}`,
          `Start: ${new Date(startDateTime).toLocaleString()}`,
          `End: ${new Date(endDateTime).toLocaleString()}`,
          ...(eventLocation ? [`Location: ${eventLocation}`] : []),
        ]}
        onConfirm={handleConfirmCreate}
        onCancel={() => setShowCreateConfirm(false)}
      />

      {/* Confirmation Modal for Deleting Event */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Delete Calendar Event"
        description={`Are you sure you want to delete the event "${deleteTarget?.summary}" from your Google Calendar?`}
        confirmLabel="Yes, Delete Event"
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
