import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  MapPin,
  AlignLeft,
  Video,
  X,
  Trash2,
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  ArrowLeft,
  ExternalLink,
  Edit2,
  Download,
  Upload,
  Check,
  AlertCircle,
  CalendarDays,
  ListFilter,
} from 'lucide-react';
import { CalendarEvent } from '../types/workspace';
import {
  listCalendarEvents,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  exportCalendarIcs,
  exportSingleEventIcs,
  importCalendarIcs,
} from '../services/workspace';
import { ConfirmModal } from './ConfirmModal';
import { GoogleCalendarIcon } from './GoogleIcons';
import { FormattedDescription, isValidUrl, normalizeUrl } from '../utils/textFormatter';
import { usePlan } from '../context/PlanContext';
import { ProBadge } from './ProBadge';
import { WorkspaceFocusTarget } from '../types/focus';
import { MeetingPrepPackModal } from './MeetingPrepPackModal';
import { SmartFollowUpModal } from './SmartFollowUpModal';


interface CalendarViewProps {
  token: string;
  onBackToOverview?: () => void;
  /** Event to open straight away (from Omni-Search). */
  focusTarget?: WorkspaceFocusTarget | null;
  onFocusHandled?: () => void;
}

type CalendarViewMode = 'month' | 'week' | 'day' | 'schedule';
type ScheduleFilterMode = 'all' | 'upcoming' | 'past';

const GOOGLE_COLORS = [
  { id: '1', name: 'Lavender', bg: 'bg-[#7986cb]', text: 'text-white', hex: '#7986cb' },
  { id: '2', name: 'Sage', bg: 'bg-[#33b679]', text: 'text-white', hex: '#33b679' },
  { id: '3', name: 'Grape', bg: 'bg-[#8e24aa]', text: 'text-white', hex: '#8e24aa' },
  { id: '4', name: 'Flamingo', bg: 'bg-[#e67c73]', text: 'text-white', hex: '#e67c73' },
  { id: '5', name: 'Banana', bg: 'bg-[#f6bf26]', text: 'text-[#1f1f1f]', hex: '#f6bf26' },
  { id: '6', name: 'Tangerine', bg: 'bg-[#f4511e]', text: 'text-white', hex: '#f4511e' },
  { id: '7', name: 'Peacock', bg: 'bg-[#039be5]', text: 'text-white', hex: '#039be5' },
  { id: '8', name: 'Graphite', bg: 'bg-[#616161]', text: 'text-white', hex: '#616161' },
  { id: '9', name: 'Blueberry', bg: 'bg-[#3f51b5]', text: 'text-white', hex: '#3f51b5' },
  { id: '10', name: 'Basil', bg: 'bg-[#0b8043]', text: 'text-white', hex: '#0b8043' },
  { id: '11', name: 'Tomato', bg: 'bg-[#d50000]', text: 'text-white', hex: '#d50000' },
];

export const CalendarView: React.FC<CalendarViewProps> = ({ token, onBackToOverview, focusTarget, onFocusHandled }) => {
  const { isPro, requirePro } = usePlan();
  const [prepModalEvent, setPrepModalEvent] = useState<CalendarEvent | null>(null);
  const [followUpModalEvent, setFollowUpModalEvent] = useState<CalendarEvent | null>(null);

  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // View mode & dates
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isDayDrawerOpen, setIsDayDrawerOpen] = useState<boolean>(false);
  const [scheduleFilter, setScheduleFilter] = useState<ScheduleFilterMode>('all');

  // Drag & drop highlight
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Create / Edit Event modal state
  const [showEventModal, setShowEventModal] = useState<boolean>(false);
  const [eventType, setEventType] = useState<'event' | 'task' | 'reminder'>('event');
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [eventSummary, setEventSummary] = useState<string>('');
  const [eventDescription, setEventDescription] = useState<string>('');
  const [eventLocation, setEventLocation] = useState<string>('');
  const [startDateStr, setStartDateStr] = useState<string>('');
  const [startTimeStr, setStartTimeStr] = useState<string>('10:00');
  const [endTimeStr, setEndTimeStr] = useState<string>('11:00');
  const [isAllDay, setIsAllDay] = useState<boolean>(false);
  const [includeMeet, setIncludeMeet] = useState<boolean>(true);
  const [selectedColorId, setSelectedColorId] = useState<string>('7');
  const [isSubmittingEvent, setIsSubmittingEvent] = useState<boolean>(false);

  // Selected event preview popup
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [eventToDelete, setEventToDelete] = useState<CalendarEvent | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const loadEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch past & future events (2 years back to 2 years ahead) up to 250
      const data = await listCalendarEvents(token, { maxResults: 250 });
      setEvents(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, [token]);

  // Open Create modal prefilled
  const handleOpenCreateModal = (prefillDate?: Date) => {
    const base = prefillDate || selectedDate || new Date();
    const yr = base.getFullYear();
    const mo = String(base.getMonth() + 1).padStart(2, '0');
    const da = String(base.getDate()).padStart(2, '0');
    const dateFormatted = `${yr}-${mo}-${da}`;

    setEditingEventId(null);
    setEventType('event');
    setEventSummary('');
    setEventDescription('');
    setEventLocation('');
    setStartDateStr(dateFormatted);
    setStartTimeStr('10:00');
    setEndTimeStr('11:00');
    setIsAllDay(false);
    setIncludeMeet(true);
    setSelectedColorId('7');
    setShowEventModal(true);
  };

  // Open Edit modal
  const handleOpenEditModal = (evt: CalendarEvent) => {
    setEditingEventId(evt.id);
    setEventType('event');
    setEventSummary(evt.summary || '');
    setEventDescription(evt.description || '');
    setEventLocation(evt.location || '');

    const startVal = evt.start?.dateTime || evt.start?.date;
    const endVal = evt.end?.dateTime || evt.end?.date;
    const isAllDayEvt = !evt.start?.dateTime && !!evt.start?.date;
    setIsAllDay(isAllDayEvt);

    if (startVal) {
      const d = new Date(startVal);
      const yr = d.getFullYear();
      const mo = String(d.getMonth() + 1).padStart(2, '0');
      const da = String(d.getDate()).padStart(2, '0');
      setStartDateStr(`${yr}-${mo}-${da}`);
      setStartTimeStr(
        `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
      );
    }

    if (endVal) {
      const d = new Date(endVal);
      setEndTimeStr(
        `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
      );
    }

    setSelectedColorId(evt.colorId || '7');
    setIncludeMeet(!!(evt.hangoutLink || evt.location?.includes('meet.google.com')));
    setSelectedEvent(null);
    setShowEventModal(true);
  };

  // Submit Create or Edit Event
  const handleSubmitEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventSummary || !startDateStr) return;
    setIsSubmittingEvent(true);
    setError(null);

    let startIso: string;
    let endIso: string;

    if (isAllDay) {
      startIso = new Date(`${startDateStr}T00:00:00`).toISOString();
      endIso = new Date(`${startDateStr}T23:59:59`).toISOString();
    } else {
      startIso = new Date(`${startDateStr}T${startTimeStr || '10:00'}:00`).toISOString();
      endIso = new Date(`${startDateStr}T${endTimeStr || '11:00'}:00`).toISOString();
    }

    try {
      if (editingEventId) {
        await updateCalendarEvent(token, editingEventId, {
          summary: eventSummary,
          description: eventDescription,
          location: eventLocation,
          startDateTime: startIso,
          endDateTime: endIso,
          colorId: selectedColorId,
        });
        setSuccessMsg('Event updated successfully');
      } else {
        await createCalendarEvent(token, {
          summary: eventSummary,
          description: eventDescription,
          location: eventLocation,
          startDateTime: startIso,
          endDateTime: endIso,
          conferenceData: includeMeet,
          colorId: selectedColorId,
        });
        setSuccessMsg('Event added to Google Calendar!');
      }

      setShowEventModal(false);
      setTimeout(() => setSuccessMsg(null), 3000);
      await loadEvents();
    } catch (err: any) {
      setError(err.message || 'Failed to save event');
    } finally {
      setIsSubmittingEvent(false);
    }
  };

  // Delete event
  const handleDelete = async () => {
    if (!eventToDelete) return;
    setIsDeleting(true);
    try {
      await deleteCalendarEvent(token, eventToDelete.id);
      setEventToDelete(null);
      setSelectedEvent(null);
      setSuccessMsg('Event deleted from Google Calendar');
      setTimeout(() => setSuccessMsg(null), 3000);
      await loadEvents();
    } catch (err: any) {
      setError(err.message || 'Failed to delete event');
    } finally {
      setIsDeleting(false);
    }
  };

  // Export full calendar as .ics
  const handleExportAllIcs = () => {
    try {
      const res = exportCalendarIcs(events, 'My_Google_Calendar');
      setSuccessMsg(`Exported calendar to ${res.filename}`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to export calendar');
    }
  };

  // Export single event as .ics
  const handleExportEventIcs = (evt: CalendarEvent) => {
    try {
      const res = exportSingleEventIcs(evt);
      setSuccessMsg(`Exported event to ${res.filename}`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to export event');
    }
  };

  // Import .ics file from disk
  const handleFileImport = async (file: File) => {
    if (!file) return;
    setIsImporting(true);
    setError(null);
    try {
      const text = await file.text();
      const res = await importCalendarIcs(token, text);
      setSuccessMsg(`Imported ${res.count} event(s) from "${file.name}"!`);
      setTimeout(() => setSuccessMsg(null), 4000);
      await loadEvents();
    } catch (err: any) {
      setError(err.message || 'Failed to import calendar .ics file');
    } finally {
      setIsImporting(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileImport(e.dataTransfer.files[0]);
    }
  };

  // Date formatting helpers
  const formatEventTime = (event: CalendarEvent) => {
    const start = event.start?.dateTime || event.start?.date;
    const end = event.end?.dateTime || event.end?.date;
    if (!start) return '';

    const startDate = new Date(start);
    if (!event.start?.dateTime) {
      return `${startDate.toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      })} (All day)`;
    }

    const endDate = end ? new Date(end) : null;
    return `${startDate.toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
    })}${endDate ? ` – ${endDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}` : ''}`;
  };

  // Handle date selection anywhere (Month grid, Mini calendar, Week headers)
  const handleSelectDate = (date: Date, openDrawer = true) => {
    setSelectedDate(date);
    setCurrentDate(date);
    if (openDrawer) {
      setIsDayDrawerOpen(true);
    }
  };

  // Search hit -> open that event's details and move the calendar to its date.
  useEffect(() => {
    if (!focusTarget || focusTarget.source !== 'calendar') return;
    const evt: CalendarEvent | null =
      focusTarget.item || events.find((e) => e.id === focusTarget.id) || null;
    if (!evt) {
      setError('That event is no longer in this calendar.');
      onFocusHandled?.();
      return;
    }
    setSelectedEvent(evt);
    const when = evt.start?.dateTime || evt.start?.date;
    if (when) handleSelectDate(new Date(when), false);
    onFocusHandled?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusTarget, events]);

  // Navigation handlers
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const handlePrev = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(year, month - 1, 1));
    } else if (viewMode === 'week') {
      const d = new Date(currentDate);
      d.setDate(d.getDate() - 7);
      setCurrentDate(d);
    } else if (viewMode === 'day') {
      const d = new Date(selectedDate);
      d.setDate(d.getDate() - 1);
      setSelectedDate(d);
      setCurrentDate(d);
    } else {
      const d = new Date(currentDate);
      d.setMonth(d.getMonth() - 1);
      setCurrentDate(d);
    }
  };

  const handleNext = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(year, month + 1, 1));
    } else if (viewMode === 'week') {
      const d = new Date(currentDate);
      d.setDate(d.getDate() + 7);
      setCurrentDate(d);
    } else if (viewMode === 'day') {
      const d = new Date(selectedDate);
      d.setDate(d.getDate() + 1);
      setSelectedDate(d);
      setCurrentDate(d);
    } else {
      const d = new Date(currentDate);
      d.setMonth(d.getMonth() + 1);
      setCurrentDate(d);
    }
  };

  // Week days (Sunday to Saturday) around currentDate
  const getWeekDates = () => {
    const curr = new Date(currentDate);
    const day = curr.getDay();
    const first = curr.getDate() - day;
    return Array.from({ length: 7 }).map((_, idx) => {
      const d = new Date(curr);
      d.setDate(first + idx);
      return d;
    });
  };

  // Filter events for the currently selected date
  const selectedDateEvents = events.filter((evt) => {
    const startStr = evt.start?.dateTime || evt.start?.date;
    if (!startStr) return false;
    const d = new Date(startStr);
    return (
      d.getDate() === selectedDate.getDate() &&
      d.getMonth() === selectedDate.getMonth() &&
      d.getFullYear() === selectedDate.getFullYear()
    );
  });

  // Filter events for Schedule view (All, Upcoming, Past)
  const now = new Date();
  const pastEvents = events.filter((evt) => {
    const startStr = evt.start?.dateTime || evt.start?.date;
    if (!startStr) return false;
    return new Date(startStr) < now;
  }).reverse(); // Most recent past event first

  const upcomingEvents = events.filter((evt) => {
    const startStr = evt.start?.dateTime || evt.start?.date;
    if (!startStr) return false;
    return new Date(startStr) >= now;
  });

  const displayedScheduleEvents =
    scheduleFilter === 'upcoming'
      ? upcomingEvents
      : scheduleFilter === 'past'
      ? pastEvents
      : events;

  // Header Title based on view mode
  const getHeaderTitle = () => {
    if (viewMode === 'day') {
      return selectedDate.toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    }
    return monthName;
  };

  return (
    <div
      id="calendar-view"
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
      className={`flex flex-col h-full min-h-0 overflow-y-auto bg-white relative select-none ${
        isDragOver ? 'ring-4 ring-[#1a73e8] ring-inset' : ''
      }`}
    >
      {/* Hidden file input for .ics import */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFileImport(e.target.files[0]);
          }
        }}
        accept=".ics,text/calendar"
        className="hidden"
      />

      {/* 1. TOP HEADER TOOLBAR */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-2 sm:px-6 py-2 sm:py-3 border-b border-[#dadce0] bg-white gap-1.5 sm:gap-4 shrink-0 gdeck-dense-toolbar min-w-0">
        <div className="flex items-center justify-between sm:justify-start gap-2 sm:gap-4 w-full sm:w-auto">
          <div className="flex items-center gap-1.5 sm:gap-3">
            {onBackToOverview && (
              <button
                onClick={onBackToOverview}
                className="inline-flex p-1.5 sm:p-2 text-[#5f6368] hover:text-[#1f1f1f] hover:bg-[#f0f4f9] rounded-full transition-colors cursor-pointer"
                title="Back to Home"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}

            <div className="flex items-center gap-2">
              <GoogleCalendarIcon className="w-6 h-6 sm:w-8 sm:h-8" />
              <h1 className="text-lg sm:text-xl font-medium text-[#1f1f1f] hidden md:block">Calendar</h1>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => {
                const today = new Date();
                setCurrentDate(today);
                setSelectedDate(today);
              }}
              className="px-3 sm:px-4 py-1 sm:py-1.5 border border-[#dadce0] hover:bg-[#f0f4f9] rounded-full text-xs font-semibold text-[#1f1f1f] transition-colors cursor-pointer"
            >
              Today
            </button>

            <div className="flex items-center">
              <button
                onClick={handlePrev}
                className="p-1 sm:p-1.5 text-[#5f6368] hover:bg-[#f0f4f9] rounded-full transition-colors cursor-pointer"
                title="Previous"
              >
                <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <button
                onClick={handleNext}
                className="p-1 sm:p-1.5 text-[#5f6368] hover:bg-[#f0f4f9] rounded-full transition-colors cursor-pointer"
                title="Next"
              >
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>

            <span className="text-sm sm:text-lg font-medium text-[#1f1f1f] ml-1 sm:ml-2 truncate max-w-[140px] xs:max-w-[180px] sm:max-w-none">
              {getHeaderTitle()}
            </span>
          </div>
        </div>

        {/* Action Controls: Import, Export, View Mode, Google Link */}
        <div className="flex items-center justify-between sm:justify-end gap-1.5 sm:gap-2 w-full sm:w-auto overflow-x-auto scrollbar-none pb-0.5 sm:pb-0">
          {/* View mode switcher */}
          <div className="flex items-center bg-[#f0f4f9] p-0.5 rounded-full border border-[#dadce0] text-xs font-semibold text-[#444746] shrink-0">
            <button
              onClick={() => setViewMode('month')}
              className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full transition-colors cursor-pointer ${
                viewMode === 'month'
                  ? 'bg-white text-[#1a73e8] shadow-2xs font-bold'
                  : 'hover:text-[#1f1f1f]'
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full transition-colors cursor-pointer ${
                viewMode === 'week'
                  ? 'bg-white text-[#1a73e8] shadow-2xs font-bold'
                  : 'hover:text-[#1f1f1f]'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setViewMode('day')}
              className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full transition-colors cursor-pointer ${
                viewMode === 'day'
                  ? 'bg-white text-[#1a73e8] shadow-2xs font-bold'
                  : 'hover:text-[#1f1f1f]'
              }`}
            >
              Day
            </button>
            <button
              onClick={() => setViewMode('schedule')}
              className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full transition-colors cursor-pointer ${
                viewMode === 'schedule'
                  ? 'bg-white text-[#1a73e8] shadow-2xs font-bold'
                  : 'hover:text-[#1f1f1f]'
              }`}
            >
              Schedule
            </button>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 shrink-0 ml-auto sm:ml-0">
            {/* Upload / Import .ics button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting}
              className="p-1.5 sm:px-3.5 sm:py-1.5 border border-[#dadce0] hover:bg-[#f0f4f9] rounded-full text-xs font-semibold text-[#444746] flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
              title="Import .ics or iCalendar file"
            >
              <Upload className={`w-3.5 h-3.5 text-[#1a73e8] ${isImporting ? 'animate-bounce' : ''}`} />
              <span className="hidden md:inline">{isImporting ? 'Importing...' : 'Import'}</span>
            </button>

            {/* Download / Export full calendar */}
            <button
              onClick={handleExportAllIcs}
              className="p-1.5 sm:px-3.5 sm:py-1.5 border border-[#dadce0] hover:bg-[#f0f4f9] rounded-full text-xs font-semibold text-[#444746] flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
              title="Export calendar to .ics file"
            >
              <Download className="w-3.5 h-3.5 text-[#1a73e8]" />
              <span className="hidden md:inline">Export</span>
            </button>

            <a
              href="https://calendar.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 sm:p-2 text-[#5f6368] hover:text-[#1a73e8] hover:bg-[#f0f4f9] rounded-full transition-colors cursor-pointer hidden lg:block"
              title="Open in Google Calendar web"
            >
              <ExternalLink className="w-4 h-4 sm:w-5 sm:h-5" />
            </a>
          </div>
        </div>
      </header>

      {/* NOTIFICATIONS */}
      {error && (
        <div className="px-6 py-2 bg-[#fce8e6] border-b border-[#f5c2c7] text-[#c5221f] text-xs font-medium flex items-center justify-between">
          <span className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> {error}
          </span>
          <button onClick={() => setError(null)} className="underline cursor-pointer">
            Dismiss
          </button>
        </div>
      )}
      {successMsg && (
        <div className="px-6 py-2 bg-[#e6f4ea] border-b border-[#b7e1cd] text-[#137333] text-xs font-medium flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> {successMsg}
          </span>
          <button onClick={() => setSuccessMsg(null)} className="underline cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* 2. BODY DOCK: LEFT DRAWER + MAIN CALENDAR DISPLAY */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Drawer */}
        <aside className="w-64 hidden lg:flex flex-col shrink-0 p-4 border-r border-[#dadce0] bg-[#f8fafd] overflow-y-auto justify-between">
          <div className="space-y-6">
            {/* Big Google Calendar "+ Create" button */}
            <button
              id="calendar-create-btn"
              onClick={() => handleOpenCreateModal()}
              className="flex items-center gap-3 px-6 py-3 bg-white hover:bg-[#f8fafd] border border-[#dadce0] rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer select-none"
            >
              <svg width="28" height="28" viewBox="0 0 36 36" className="shrink-0">
                <path fill="#EA4335" d="M16 16v14h4V20z"></path>
                <path fill="#4285F4" d="M30 16H20l-4 4h14z"></path>
                <path fill="#FBBC05" d="M6 16h10v4H6z"></path>
                <path fill="#34A853" d="M20 16V6h-4v14z"></path>
              </svg>
              <span className="text-sm font-semibold text-[#1f1f1f]">Create</span>
            </button>

            {/* Interactive Mini-Calendar Datepicker */}
            <div className="px-1">
              <div className="flex items-center justify-between mb-3 text-xs font-bold text-[#1f1f1f]">
                <span>{monthName}</span>
                <div className="flex gap-1 text-[#5f6368]">
                  <ChevronLeft
                    className="w-4 h-4 cursor-pointer hover:text-black"
                    onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
                  />
                  <ChevronRight
                    className="w-4 h-4 cursor-pointer hover:text-black"
                    onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-[#747775] mb-2">
                <span>S</span>
                <span>M</span>
                <span>T</span>
                <span>W</span>
                <span>T</span>
                <span>F</span>
                <span>S</span>
              </div>

              <div className="grid grid-cols-7 gap-1 text-center text-xs">
                {Array.from({ length: firstDay }).map((_, i) => (
                  <div key={`empty-${i}`} className="p-1.5 text-[#dadce0]" />
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const dayNum = i + 1;
                  const targetDate = new Date(year, month, dayNum);
                  const isSelected =
                    selectedDate.getDate() === dayNum &&
                    selectedDate.getMonth() === month &&
                    selectedDate.getFullYear() === year;
                  const isToday =
                    dayNum === new Date().getDate() &&
                    month === new Date().getMonth() &&
                    year === new Date().getFullYear();

                  return (
                    <button
                      key={dayNum}
                      type="button"
                      onClick={() => handleSelectDate(targetDate, true)}
                      className={`p-1.5 rounded-full text-xs font-medium cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-[#1a73e8] text-white font-bold shadow-xs'
                          : isToday
                          ? 'bg-[#e8f0fe] text-[#1a73e8] font-bold'
                          : 'text-[#1f1f1f] hover:bg-[#e8f0fe]'
                      }`}
                      title={`Select ${targetDate.toLocaleDateString()}`}
                    >
                      {dayNum}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected Date Summary Card in Sidebar */}
            <div className="p-3 bg-white rounded-2xl border border-[#dadce0] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#444746] uppercase tracking-wider">
                  Selected Date
                </span>
                <span className="text-[11px] font-semibold text-[#1a73e8] bg-[#e8f0fe] px-2 py-0.5 rounded-full">
                  {selectedDateEvents.length} event{selectedDateEvents.length !== 1 ? 's' : ''}
                </span>
              </div>
              <p className="text-xs font-semibold text-[#1f1f1f]">
                {selectedDate.toLocaleDateString(undefined, {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
              <div className="flex gap-1.5 pt-1">
                <button
                  onClick={() => {
                    setViewMode('day');
                    setIsDayDrawerOpen(true);
                  }}
                  className="flex-1 py-1 px-2 text-[11px] font-semibold text-[#1a73e8] bg-[#e8f0fe] hover:bg-[#d2e3fc] rounded-lg transition-colors cursor-pointer"
                >
                  View Day
                </button>
                <button
                  onClick={() => handleOpenCreateModal(selectedDate)}
                  className="py-1 px-2 text-[11px] font-semibold text-[#444746] hover:bg-[#f0f4f9] border border-[#dadce0] rounded-lg transition-colors cursor-pointer"
                >
                  + Add
                </button>
              </div>
            </div>

            {/* Import & Export Card in Sidebar */}
            <div className="p-3 bg-white rounded-2xl border border-[#dadce0] space-y-2">
              <span className="text-[11px] font-bold text-[#444746] uppercase tracking-wider block">
                Calendar Sync
              </span>
              <div className="space-y-1">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full text-left px-3 py-1.5 text-xs font-medium text-[#1f1f1f] hover:bg-[#f0f4f9] rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5 text-[#1a73e8]" />
                  <span>Upload .ics file</span>
                </button>
                <button
                  onClick={handleExportAllIcs}
                  className="w-full text-left px-3 py-1.5 text-xs font-medium text-[#1f1f1f] hover:bg-[#f0f4f9] rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-[#1a73e8]" />
                  <span>Export full calendar</span>
                </button>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-[#747775] p-2 flex items-center justify-between border-t border-[#dadce0]/60">
            <span>{events.length} events loaded</span>
            <button
              onClick={loadEvents}
              disabled={loading}
              className="text-[#1a73e8] hover:underline font-medium cursor-pointer"
            >
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </aside>

        {/* MAIN CALENDAR DISPLAY */}
        <main className="flex-1 overflow-y-auto bg-white flex flex-col relative">
          {viewMode === 'month' ? (
            /* MONTH GRID VIEW */
            <div className="flex-1 flex flex-col h-full border-t border-l border-[#dadce0]">
              {/* Day of Week Headers */}
              <div className="grid grid-cols-7 border-b border-[#dadce0] bg-[#f8fafd] text-[11px] font-bold text-[#747775] text-center py-2 shrink-0">
                <span>SUN</span>
                <span>MON</span>
                <span>TUE</span>
                <span>WED</span>
                <span>THU</span>
                <span>FRI</span>
                <span>SAT</span>
              </div>

              {/* Grid Cells */}
              <div className="flex-1 grid grid-cols-7 grid-rows-5 divide-x divide-y divide-[#dadce0] overflow-y-auto">
                {Array.from({ length: 35 }).map((_, idx) => {
                  const dayNum = idx - firstDay + 1;
                  const isCurrentMonth = dayNum > 0 && dayNum <= daysInMonth;
                  const cellDate = new Date(year, month, dayNum);
                  const isToday =
                    isCurrentMonth &&
                    dayNum === new Date().getDate() &&
                    month === new Date().getMonth() &&
                    year === new Date().getFullYear();
                  const isSelected =
                    isCurrentMonth &&
                    selectedDate.getDate() === dayNum &&
                    selectedDate.getMonth() === month &&
                    selectedDate.getFullYear() === year;

                  // Filter events falling on this day (both past and future)
                  const dayEvents = isCurrentMonth
                    ? events.filter((evt) => {
                        const startStr = evt.start?.dateTime || evt.start?.date;
                        if (!startStr) return false;
                        const d = new Date(startStr);
                        return (
                          d.getDate() === dayNum &&
                          d.getMonth() === month &&
                          d.getFullYear() === year
                        );
                      })
                    : [];

                  return (
                    <div
                      key={idx}
                      onClick={() => {
                        if (isCurrentMonth) {
                          handleSelectDate(cellDate, true);
                        }
                      }}
                      className={`min-h-[100px] p-1.5 flex flex-col justify-between transition-all cursor-pointer relative group ${
                        isSelected
                          ? 'bg-[#e8f0fe]/60 ring-2 ring-[#1a73e8] ring-inset z-10'
                          : isCurrentMonth
                          ? 'bg-white hover:bg-[#f8fafd]'
                          : 'bg-[#fafbfc] text-[#dadce0]'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <span
                          className={`text-xs font-semibold inline-flex items-center justify-center w-6 h-6 rounded-full transition-colors ${
                            isToday
                              ? 'bg-[#1a73e8] text-white font-bold'
                              : isSelected
                              ? 'bg-[#1a73e8] text-white'
                              : isCurrentMonth
                              ? 'text-[#1f1f1f] group-hover:bg-[#dadce0]/40'
                              : 'text-[#9aa0a6]'
                          }`}
                        >
                          {isCurrentMonth ? dayNum : ''}
                        </span>

                        {isCurrentMonth && (
                          <div className="flex items-center gap-1">
                            {dayEvents.length > 0 && (
                              <span className="text-[10px] text-[#5f6368] font-bold bg-[#f1f3f4] px-1.5 py-0.5 rounded-full">
                                {dayEvents.length}
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenCreateModal(cellDate);
                              }}
                              className="opacity-0 group-hover:opacity-100 p-1 text-[#5f6368] hover:text-[#1a73e8] hover:bg-[#e8f0fe] rounded-full transition-opacity cursor-pointer"
                              title="Add event on this date"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Event Chips on this day */}
                      <div className="space-y-1 mt-1 overflow-hidden">
                        {dayEvents.slice(0, 3).map((evt) => {
                          const colorObj =
                            GOOGLE_COLORS.find((c) => c.id === evt.colorId) || GOOGLE_COLORS[6];
                          return (
                            <div
                              key={evt.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedEvent(evt);
                              }}
                              className={`px-2 py-0.5 ${colorObj.bg} ${colorObj.text} rounded text-[11px] font-medium truncate shadow-2xs hover:opacity-90 transition-opacity flex items-center gap-1 cursor-pointer`}
                              title={evt.summary || 'Event'}
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />
                              <span className="truncate">{evt.summary || '(Untitled)'}</span>
                            </div>
                          );
                        })}
                        {dayEvents.length > 3 && (
                          <div className="text-[10px] text-[#1a73e8] font-bold pl-1">
                            +{dayEvents.length - 3} more
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : viewMode === 'week' ? (
            /* 7-DAY WEEK VIEW */
            <div className="flex-1 flex flex-col h-full border-t border-l border-[#dadce0] overflow-y-auto">
              {/* Header with week days */}
              <div className="grid grid-cols-7 border-b border-[#dadce0] bg-[#f8fafd] text-center py-3 shrink-0">
                {getWeekDates().map((d, i) => {
                  const isToday = d.toDateString() === new Date().toDateString();
                  const isSelected = d.toDateString() === selectedDate.toDateString();
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleSelectDate(d, true)}
                      className={`flex flex-col items-center p-1 rounded-xl transition-colors cursor-pointer ${
                        isSelected ? 'bg-blue-50/70' : 'hover:bg-slate-100'
                      }`}
                    >
                      <span className="text-[11px] font-bold text-[#747775] uppercase">
                        {d.toLocaleDateString([], { weekday: 'short' })}
                      </span>
                      <span
                        className={`text-sm font-semibold inline-flex items-center justify-center w-7 h-7 rounded-full mt-0.5 ${
                          isToday
                            ? 'bg-[#1a73e8] text-white font-bold'
                            : isSelected
                            ? 'bg-[#1a73e8] text-white'
                            : 'text-[#1f1f1f]'
                        }`}
                      >
                        {d.getDate()}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Week Column Cells */}
              <div className="flex-1 grid grid-cols-7 divide-x divide-[#dadce0] min-h-[500px] p-2 bg-white">
                {getWeekDates().map((d, i) => {
                  const dayEvents = events.filter((evt) => {
                    const startStr = evt.start?.dateTime || evt.start?.date;
                    if (!startStr) return false;
                    const evtDate = new Date(startStr);
                    return evtDate.toDateString() === d.toDateString();
                  });

                  return (
                    <div
                      key={i}
                      onClick={() => handleSelectDate(d, true)}
                      className="p-1 space-y-1.5 hover:bg-[#f8fafd] transition-colors cursor-pointer"
                    >
                      {dayEvents.map((evt) => {
                        const colorObj =
                          GOOGLE_COLORS.find((c) => c.id === evt.colorId) || GOOGLE_COLORS[6];
                        return (
                          <div
                            key={evt.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedEvent(evt);
                            }}
                            className={`p-2 rounded-xl ${colorObj.bg} ${colorObj.text} shadow-xs space-y-1 transition-opacity hover:opacity-90`}
                          >
                            <p className="text-xs font-bold truncate">{evt.summary || '(Untitled)'}</p>
                            <p className="text-[10px] opacity-90">{formatEventTime(evt)}</p>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : viewMode === 'day' ? (
            /* DAY VIEW: FOCUSED AGENDA & TIMELINE */
            <div className="flex-1 p-6 max-w-4xl mx-auto w-full space-y-6 overflow-y-auto">
              {/* Day Header Card */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-[#f8fafd] border border-[#dadce0] rounded-2xl gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#1a73e8] text-white flex flex-col items-center justify-center font-bold shadow-xs">
                    <span className="text-[10px] uppercase leading-none">
                      {selectedDate.toLocaleDateString(undefined, { weekday: 'short' })}
                    </span>
                    <span className="text-lg leading-none mt-0.5">{selectedDate.getDate()}</span>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#1f1f1f]">
                      {selectedDate.toLocaleDateString(undefined, {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </h3>
                    <p className="text-xs text-[#5f6368]">
                      {selectedDateEvents.length} event{selectedDateEvents.length !== 1 ? 's' : ''} on
                      this day
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenCreateModal(selectedDate)}
                    className="px-4 py-2 bg-[#1a73e8] text-white rounded-full text-xs font-bold hover:bg-[#1557b0] transition-colors cursor-pointer shadow-xs flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Event</span>
                  </button>
                </div>
              </div>

              {/* Day's Events List */}
              {selectedDateEvents.length === 0 ? (
                <div className="text-center py-16 bg-[#f8fafd]/50 rounded-2xl border border-dashed border-[#dadce0] p-8 space-y-3">
                  <CalendarDays className="w-12 h-12 text-[#dadce0] mx-auto" />
                  <h4 className="text-sm font-bold text-[#1f1f1f]">
                    No events scheduled for this day
                  </h4>
                  <p className="text-xs text-[#5f6368] max-w-sm mx-auto">
                    Enjoy your open schedule or schedule a meeting, task, or reminder.
                  </p>
                  <button
                    onClick={() => handleOpenCreateModal(selectedDate)}
                    className="mt-2 px-5 py-2.5 bg-[#1a73e8] text-white rounded-full text-xs font-bold hover:bg-[#1557b0] transition-colors cursor-pointer shadow-xs"
                  >
                    Create Event on this Day
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedDateEvents.map((evt) => {
                    const colorObj =
                      GOOGLE_COLORS.find((c) => c.id === evt.colorId) || GOOGLE_COLORS[6];
                    const hasMeet =
                      !!evt.hangoutLink || evt.location?.includes('meet.google.com');

                    return (
                      <div
                        key={evt.id}
                        onClick={() => setSelectedEvent(evt)}
                        className="p-4 rounded-2xl border border-[#dadce0] hover:border-[#1a73e8] hover:shadow-sm cursor-pointer transition-all bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                      >
                        <div className="flex items-start gap-3.5 min-w-0">
                          <div className={`w-3.5 h-3.5 rounded-full ${colorObj.bg} mt-1 shrink-0`} />
                          <div className="min-w-0 space-y-1">
                            <h4 className="text-sm font-bold text-[#1f1f1f] truncate">
                              {evt.summary || '(Untitled Event)'}
                            </h4>
                            <p className="text-xs text-[#5f6368] flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 shrink-0" />
                              <span>{formatEventTime(evt)}</span>
                            </p>
                            {evt.location && (
                              <p className="text-xs text-[#5f6368] flex items-center gap-1.5 truncate max-w-md">
                                <MapPin className="w-3.5 h-3.5 shrink-0" />
                                {isValidUrl(evt.location) ? (
                                  <a
                                    href={normalizeUrl(evt.location)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[#1a73e8] hover:underline inline-flex items-center gap-1"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <span>{evt.location}</span>
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                ) : (
                                  <span>{evt.location}</span>
                                )}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center">
                          {hasMeet && (
                            <a
                              href={evt.hangoutLink || 'https://meet.google.com'}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="px-3 py-1.5 bg-[#e8f0fe] hover:bg-[#d2e3fc] text-[#1a73e8] rounded-full text-xs font-semibold flex items-center gap-1.5 transition-colors"
                            >
                              <Video className="w-3.5 h-3.5" />
                              <span>Join Meet</span>
                            </a>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEditModal(evt);
                            }}
                            className="p-2 text-[#5f6368] hover:text-[#1a73e8] hover:bg-[#f0f4f9] rounded-full transition-colors cursor-pointer"
                            title="Edit event"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* SCHEDULE / AGENDA VIEW WITH PAST & UPCOMING TABS */
            <div className="p-6 max-w-3xl mx-auto w-full space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-[#1f1f1f]">Schedule & Agenda</h3>
                  <p className="text-xs text-[#5f6368]">
                    Showing {displayedScheduleEvents.length} of {events.length} total events
                  </p>
                </div>

                {/* Filter Pills: All, Upcoming, Past Events */}
                <div className="flex items-center bg-[#f0f4f9] p-0.5 rounded-full border border-[#dadce0] text-xs font-semibold text-[#444746] self-start sm:self-auto">
                  <button
                    onClick={() => setScheduleFilter('all')}
                    className={`px-3 py-1.5 rounded-full transition-colors cursor-pointer ${
                      scheduleFilter === 'all'
                        ? 'bg-white text-[#1a73e8] shadow-2xs font-bold'
                        : 'hover:text-[#1f1f1f]'
                    }`}
                  >
                    All ({events.length})
                  </button>
                  <button
                    onClick={() => setScheduleFilter('upcoming')}
                    className={`px-3 py-1.5 rounded-full transition-colors cursor-pointer ${
                      scheduleFilter === 'upcoming'
                        ? 'bg-white text-[#1a73e8] shadow-2xs font-bold'
                        : 'hover:text-[#1f1f1f]'
                    }`}
                  >
                    Upcoming ({upcomingEvents.length})
                  </button>
                  <button
                    onClick={() => setScheduleFilter('past')}
                    className={`px-3 py-1.5 rounded-full transition-colors cursor-pointer ${
                      scheduleFilter === 'past'
                        ? 'bg-white text-[#1a73e8] shadow-2xs font-bold'
                        : 'hover:text-[#1f1f1f]'
                    }`}
                  >
                    Past ({pastEvents.length})
                  </button>
                </div>
              </div>

              {displayedScheduleEvents.length === 0 ? (
                <div className="text-center py-16 text-[#5f6368] space-y-3 bg-[#f8fafd] rounded-2xl border border-dashed border-[#dadce0] p-8">
                  <CalendarIcon className="w-12 h-12 text-[#dadce0] mx-auto" />
                  <p className="text-sm font-semibold text-[#1f1f1f]">
                    {scheduleFilter === 'past'
                      ? 'No past events found'
                      : scheduleFilter === 'upcoming'
                      ? 'No upcoming events scheduled'
                      : 'No events found in this calendar'}
                  </p>
                  <button
                    onClick={() => handleOpenCreateModal()}
                    className="px-5 py-2.5 bg-[#1a73e8] text-white rounded-full text-xs font-bold hover:bg-[#1557b0] transition-colors cursor-pointer shadow-xs"
                  >
                    Schedule an event
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {displayedScheduleEvents.map((evt) => {
                    const colorObj =
                      GOOGLE_COLORS.find((c) => c.id === evt.colorId) || GOOGLE_COLORS[6];
                    const startStr = evt.start?.dateTime || evt.start?.date;
                    const isPast = startStr ? new Date(startStr) < now : false;

                    return (
                      <div
                        key={evt.id}
                        onClick={() => setSelectedEvent(evt)}
                        className={`p-4 rounded-2xl border border-[#dadce0] hover:border-[#1a73e8] hover:shadow-sm cursor-pointer transition-all flex items-center justify-between gap-4 group ${
                          isPast ? 'bg-[#fafbfc]' : 'bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className={`w-3.5 h-3.5 rounded-full ${colorObj.bg} shrink-0`} />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h4
                                className={`text-sm font-semibold truncate ${
                                  isPast ? 'text-[#5f6368]' : 'text-[#1f1f1f]'
                                }`}
                              >
                                {evt.summary || '(No title)'}
                              </h4>
                              {isPast && (
                                <span className="text-[10px] font-bold text-[#747775] bg-[#f1f3f4] px-1.5 py-0.2 rounded">
                                  Past
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-[#5f6368] mt-0.5 flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 shrink-0" />
                              <span>{formatEventTime(evt)}</span>
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {evt.location && (
                            <span className="text-xs text-[#5f6368] truncate hidden sm:inline max-w-[160px]">
                              {evt.location}
                            </span>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleExportEventIcs(evt);
                            }}
                            className="p-2 text-[#5f6368] hover:text-[#1a73e8] hover:bg-[#e8f0fe] rounded-full transition-colors cursor-pointer"
                            title="Download .ics"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* DAY AGENDA DRAWER (When a date is tapped in Month view) */}
          {isDayDrawerOpen && viewMode === 'month' && (
            <div className="border-t border-[#dadce0] bg-[#f8fafd] p-4 sm:p-5 shrink-0 flex flex-col gap-3 shadow-md animate-in slide-in-from-bottom duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#1a73e8] text-white flex flex-col items-center justify-center font-bold">
                    <span className="text-[9px] uppercase leading-none">
                      {selectedDate.toLocaleDateString(undefined, { weekday: 'short' })}
                    </span>
                    <span className="text-sm leading-none mt-0.5">{selectedDate.getDate()}</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#1f1f1f]">
                      {selectedDate.toLocaleDateString(undefined, {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </h4>
                    <span className="text-xs text-[#5f6368]">
                      {selectedDateEvents.length} event{selectedDateEvents.length !== 1 ? 's' : ''}{' '}
                      scheduled
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenCreateModal(selectedDate)}
                    className="px-3.5 py-1.5 bg-[#1a73e8] text-white rounded-full text-xs font-semibold hover:bg-[#1557b0] transition-colors cursor-pointer shadow-2xs flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Event</span>
                  </button>
                  <button
                    onClick={() => setViewMode('day')}
                    className="px-3 py-1.5 text-xs font-semibold text-[#1a73e8] hover:bg-[#e8f0fe] rounded-full transition-colors cursor-pointer hidden sm:block"
                  >
                    Expand Day View
                  </button>
                  <button
                    onClick={() => setIsDayDrawerOpen(false)}
                    className="p-1.5 text-[#5f6368] hover:bg-[#dadce0]/50 rounded-full cursor-pointer"
                    title="Close"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Day Events Horizontal/Vertical Scroll */}
              {selectedDateEvents.length === 0 ? (
                <p className="text-xs text-[#5f6368] italic py-2">
                  No events on this day. Tap "+ Add Event" to schedule.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-48 overflow-y-auto pt-1">
                  {selectedDateEvents.map((evt) => {
                    const colorObj =
                      GOOGLE_COLORS.find((c) => c.id === evt.colorId) || GOOGLE_COLORS[6];
                    return (
                      <div
                        key={evt.id}
                        onClick={() => setSelectedEvent(evt)}
                        className="p-3 bg-white rounded-xl border border-[#dadce0] hover:border-[#1a73e8] hover:shadow-xs cursor-pointer transition-all flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`w-3 h-3 rounded-full ${colorObj.bg} shrink-0`} />
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-[#1f1f1f] truncate">
                              {evt.summary || '(Untitled)'}
                            </p>
                            <p className="text-[11px] text-[#5f6368] truncate">
                              {formatEventTime(evt)}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEvent(evt);
                          }}
                          className="text-[11px] text-[#1a73e8] font-semibold hover:underline shrink-0"
                        >
                          View
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
          {/* Mobile Create Floating Action Button (FAB) */}
          <div className="fixed bottom-6 right-6 lg:hidden z-30 pointer-events-auto">
            <button
              onClick={() => handleOpenCreateModal()}
              className="flex items-center gap-2.5 px-5 py-3.5 bg-white hover:bg-[#f8fafd] border border-[#dadce0] rounded-full shadow-lg hover:shadow-xl transition-all cursor-pointer active:scale-95"
            >
              <svg width="24" height="24" viewBox="0 0 36 36" className="shrink-0">
                <path fill="#EA4335" d="M16 16v14h4V20z"></path>
                <path fill="#4285F4" d="M30 16H20l-4 4h14z"></path>
                <path fill="#FBBC05" d="M6 16h10v4H6z"></path>
                <path fill="#34A853" d="M20 16V6h-4v14z"></path>
              </svg>
              <span className="text-sm font-bold text-[#1f1f1f]">Create</span>
            </button>
          </div>
        </main>
      </div>

      {/* 3. AUTHENTIC GOOGLE CALENDAR QUICK CREATE / EDIT MODAL */}
      {showEventModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-2xs p-4 animate-in fade-in duration-150">
          <form
            onSubmit={handleSubmitEvent}
            className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-[#dadce0] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
          >
            {/* Modal Header Bar */}
            <div className="flex items-center justify-between px-6 pt-5 pb-2">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setEventType('event')}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                    eventType === 'event'
                      ? 'bg-[#e8f0fe] text-[#1a73e8]'
                      : 'text-[#5f6368] hover:bg-[#f1f3f4]'
                  }`}
                >
                  Event
                </button>
                <button
                  type="button"
                  onClick={() => setEventType('task')}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                    eventType === 'task'
                      ? 'bg-[#e8f0fe] text-[#1a73e8]'
                      : 'text-[#5f6368] hover:bg-[#f1f3f4]'
                  }`}
                >
                  Task
                </button>
                <button
                  type="button"
                  onClick={() => setEventType('reminder')}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                    eventType === 'reminder'
                      ? 'bg-[#e8f0fe] text-[#1a73e8]'
                      : 'text-[#5f6368] hover:bg-[#f1f3f4]'
                  }`}
                >
                  Reminder
                </button>
              </div>

              <button
                type="button"
                onClick={() => setShowEventModal(false)}
                className="p-1.5 rounded-full hover:bg-[#f0f4f9] text-[#5f6368] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Title Input */}
            <div className="px-6 py-2">
              <input
                type="text"
                placeholder="Add title"
                value={eventSummary}
                onChange={(e) => setEventSummary(e.target.value)}
                autoFocus
                required
                className="text-xl sm:text-2xl font-normal text-[#1f1f1f] placeholder:text-[#5f6368] border-b border-[#dadce0] focus:border-[#1a73e8] outline-none w-full pb-2 transition-colors"
              />
            </div>

            {/* Modal Body Fields */}
            <div className="px-6 py-4 space-y-4 max-h-[60vh] overflow-y-auto">
              {/* Date & Time Row */}
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-[#5f6368] mt-2 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="date"
                      value={startDateStr}
                      onChange={(e) => setStartDateStr(e.target.value)}
                      required
                      className="px-3 py-1.5 border border-[#dadce0] rounded-xl text-xs font-semibold text-[#1f1f1f] outline-none focus:border-[#1a73e8] bg-white cursor-pointer"
                    />

                    {!isAllDay && (
                      <div className="flex items-center gap-1.5 text-xs font-medium text-[#1f1f1f]">
                        <input
                          type="time"
                          value={startTimeStr}
                          onChange={(e) => setStartTimeStr(e.target.value)}
                          className="px-2 py-1.5 border border-[#dadce0] rounded-xl outline-none focus:border-[#1a73e8] bg-white cursor-pointer"
                        />
                        <span className="text-[#5f6368]">–</span>
                        <input
                          type="time"
                          value={endTimeStr}
                          onChange={(e) => setEndTimeStr(e.target.value)}
                          className="px-2 py-1.5 border border-[#dadce0] rounded-xl outline-none focus:border-[#1a73e8] bg-white cursor-pointer"
                        />
                      </div>
                    )}

                    <label className="flex items-center gap-1.5 text-xs font-medium text-[#444746] cursor-pointer ml-auto">
                      <input
                        type="checkbox"
                        checked={isAllDay}
                        onChange={(e) => setIsAllDay(e.target.checked)}
                        className="w-3.5 h-3.5 accent-[#1a73e8] rounded"
                      />
                      <span>All day</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Google Meet Conferencing */}
              <div className="flex items-center gap-3">
                <Video className="w-5 h-5 text-[#1a73e8] shrink-0" />
                {includeMeet ? (
                  <div className="flex-1 flex items-center justify-between px-3.5 py-2 bg-[#e8f0fe] border border-[#d2e3fc] rounded-xl text-xs">
                    <span className="font-semibold text-[#1a73e8]">
                      Google Meet video conferencing added
                    </span>
                    <button
                      type="button"
                      onClick={() => setIncludeMeet(false)}
                      className="p-1 text-[#5f6368] hover:text-[#d93025] cursor-pointer"
                      title="Remove Meet"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIncludeMeet(true)}
                    className="px-4 py-2 bg-[#f0f4f9] hover:bg-[#e8f0fe] text-[#1a73e8] border border-[#dadce0] hover:border-[#1a73e8] rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                  >
                    + Add Google Meet video conferencing
                  </button>
                )}
              </div>

              {/* Location */}
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-[#5f6368] shrink-0" />
                <input
                  type="text"
                  placeholder="Add location or conference room"
                  value={eventLocation}
                  onChange={(e) => setEventLocation(e.target.value)}
                  className="w-full px-3 py-2 border border-[#dadce0] rounded-xl text-xs font-medium text-[#1f1f1f] outline-none focus:border-[#1a73e8] placeholder:text-[#5f6368]"
                />
              </div>

              {/* Description */}
              <div className="flex items-start gap-3">
                <AlignLeft className="w-5 h-5 text-[#5f6368] mt-2 shrink-0" />
                <textarea
                  placeholder="Add description or notes"
                  value={eventDescription}
                  onChange={(e) => setEventDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-[#dadce0] rounded-xl text-xs font-medium text-[#1f1f1f] outline-none focus:border-[#1a73e8] placeholder:text-[#5f6368] resize-none leading-relaxed"
                />
              </div>

              {/* Event Color Palette */}
              <div className="flex items-center gap-3 pt-1">
                <div
                  className={`w-5 h-5 rounded-full ${
                    GOOGLE_COLORS.find((c) => c.id === selectedColorId)?.bg || 'bg-[#039be5]'
                  } shrink-0 ring-2 ring-white shadow-xs`}
                />
                <div className="flex items-center gap-2 overflow-x-auto py-1">
                  {GOOGLE_COLORS.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setSelectedColorId(c.id)}
                      className={`w-6 h-6 rounded-full ${c.bg} flex items-center justify-center transition-transform cursor-pointer ${
                        selectedColorId === c.id
                          ? 'ring-2 ring-offset-2 ring-[#1a73e8] scale-110'
                          : 'hover:scale-105'
                      }`}
                      title={c.name}
                    >
                      {selectedColorId === c.id && <Check className="w-3 h-3 text-white" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-2.5 px-6 py-4 bg-[#f8fafd] border-t border-[#dadce0]">
              <button
                type="button"
                onClick={() => setShowEventModal(false)}
                className="px-4 py-2 text-xs font-semibold text-[#444746] hover:bg-[#dadce0]/40 rounded-full cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingEvent}
                className="px-6 py-2 bg-[#1a73e8] hover:bg-[#1557b0] text-white rounded-full text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isSubmittingEvent ? 'Saving...' : editingEventId ? 'Update' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 4. EVENT DETAILS PREVIEW POPUP (Polished Layout with Full Link Recognition) */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-2xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-[#dadce0] overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
            {/* Header with Color & Action Buttons */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#f1f3f4] bg-white">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-4 h-4 rounded-full shrink-0 ${
                    GOOGLE_COLORS.find((c) => c.id === selectedEvent.colorId)?.bg || 'bg-[#039be5]'
                  }`}
                />
                <h3 className="text-lg font-bold text-[#1f1f1f] truncate">
                  {selectedEvent.summary || '(Untitled Event)'}
                </h3>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => handleExportEventIcs(selectedEvent)}
                  className="p-2 text-[#5f6368] hover:text-[#1a73e8] hover:bg-[#e8f0fe] rounded-full transition-colors cursor-pointer"
                  title="Download .ics file"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleOpenEditModal(selectedEvent)}
                  className="p-2 text-[#5f6368] hover:text-[#1a73e8] hover:bg-[#e8f0fe] rounded-full transition-colors cursor-pointer"
                  title="Edit event"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setEventToDelete(selectedEvent)}
                  className="p-2 text-[#5f6368] hover:text-[#d93025] hover:bg-[#fce8e6] rounded-full transition-colors cursor-pointer"
                  title="Delete event"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="p-2 text-[#5f6368] hover:bg-[#f0f4f9] rounded-full cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Scrollable Event Content */}
            <div className="p-6 overflow-y-auto space-y-4">
              {/* Date & Time */}
              <div className="flex items-center gap-3 text-xs text-[#1f1f1f]">
                <Clock className="w-4 h-4 text-[#5f6368] shrink-0" />
                <span className="font-semibold">{formatEventTime(selectedEvent)}</span>
              </div>

              {/* Location (with URL recognition) */}
              {selectedEvent.location && (
                <div className="flex items-start gap-3 text-xs text-[#1f1f1f]">
                  <MapPin className="w-4 h-4 text-[#5f6368] shrink-0 mt-0.5" />
                  <div className="flex-1">
                    {isValidUrl(selectedEvent.location) ? (
                      <a
                        href={normalizeUrl(selectedEvent.location)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#1a73e8] hover:text-[#1557b0] hover:underline font-semibold inline-flex items-center gap-1 break-all"
                      >
                        <span>{selectedEvent.location}</span>
                        <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                      </a>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span>{selectedEvent.location}</span>
                        <a
                          href={`https://maps.google.com/?q=${encodeURIComponent(
                            selectedEvent.location
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#1a73e8] hover:underline inline-flex items-center gap-0.5 text-[11px]"
                        >
                          <span>Map</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Description (Formatted with clickable links) */}
              {selectedEvent.description && (
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#444746]">
                    <AlignLeft className="w-4 h-4 text-[#5f6368]" />
                    <span>Description</span>
                  </div>
                  <div className="p-4 bg-[#f8fafd] rounded-2xl border border-[#dadce0] max-h-72 overflow-y-auto shadow-inner">
                    <FormattedDescription text={selectedEvent.description} />
                  </div>
                </div>
              )}
            </div>

            {/* Footer with Video Call action */}
            <div className="flex items-center justify-between px-6 py-4 bg-[#f8fafd] border-t border-[#dadce0] flex-wrap gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                {(selectedEvent.hangoutLink ||
                  selectedEvent.location?.includes('meet.google.com') ||
                  selectedEvent.location?.includes('zoom.us') ||
                  selectedEvent.location?.includes('luma.com')) && (
                  <a
                    href={
                      selectedEvent.hangoutLink ||
                      (isValidUrl(selectedEvent.location || '')
                        ? normalizeUrl(selectedEvent.location || '')
                        : 'https://meet.google.com/new')
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-[#1a73e8] hover:bg-[#1557b0] text-white rounded-full text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>Join Meeting</span>
                  </a>
                )}

                <button
                  type="button"
                  onClick={() => {
                    if (
                      !requirePro(
                        'Meeting Prep Packs',
                        'One-click briefing doc with relevant emails, Drive files, and attendee details.'
                      )
                    ) {
                      return;
                    }
                    setPrepModalEvent(selectedEvent);
                  }}
                  className="px-3.5 py-2 bg-purple-50 hover:bg-purple-100 text-purple-800 rounded-full text-xs font-semibold flex items-center gap-1.5 border border-purple-200 transition-colors cursor-pointer"
                  title="Generate Meeting Prep Pack (Pro)"
                >
                  <span>Prep Pack</span>
                  <ProBadge size="xs" featureTitle="Meeting Prep Packs" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (
                      !requirePro(
                        'Smart Follow-Up Generator',
                        'Generate follow-up email drafts with action items assigned to attendees.'
                      )
                    ) {
                      return;
                    }
                    setFollowUpModalEvent(selectedEvent);
                  }}
                  className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-800 rounded-full text-xs font-semibold flex items-center gap-1.5 border border-slate-200 transition-colors cursor-pointer"
                  title="Generate Meeting Follow-Up Email (Pro)"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-slate-600" />
                  <span>Follow-Up</span>
                  <ProBadge size="xs" featureTitle="Smart Follow-Up Generator" />
                </button>
              </div>

              <button
                onClick={() => setSelectedEvent(null)}
                className="px-5 py-2 text-xs font-semibold text-[#444746] hover:bg-[#dadce0]/40 rounded-full cursor-pointer transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pro Modals */}
      <MeetingPrepPackModal
        isOpen={!!prepModalEvent}
        onClose={() => setPrepModalEvent(null)}
        event={prepModalEvent}
        token={token}
      />

      <SmartFollowUpModal
        isOpen={!!followUpModalEvent}
        onClose={() => setFollowUpModalEvent(null)}
        event={followUpModalEvent}
        token={token}
      />

      {/* 5. CONFIRM DELETE MODAL */}
      <ConfirmModal
        isOpen={!!eventToDelete}
        title="Delete event"
        description={`Are you sure you want to remove "${
          eventToDelete?.summary || 'this event'
        }" from your Google Calendar?`}
        confirmLabel="Delete"
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setEventToDelete(null)}
      />
    </div>
  );
};
