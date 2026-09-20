import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Loader2, AlertTriangle, CheckCircle, Trash2, Brain, Plus, Mail, Calendar, Video, ArrowRight, Lock } from 'lucide-react';
import Markdown from 'react-markdown';
import { GPilotIcon, GmailIcon, GoogleCalendarIcon, GoogleMeetIcon, GoogleTasksIcon } from './GoogleIcons';
import { usePlan } from '../context/PlanContext';
import { ProBadge } from './ProBadge';
import { 
  listGmailMessages, 
  sendGmailMessage, 
  listCalendarEvents, 
  createCalendarEvent,
  createMeetingSpace,
  listTaskLists,
  listTasks,
  createTask,
  listDriveFiles,
} from '../services/workspace';

type GPilotChatProps = {
  token: string | null;
  userName?: string;
};

type Message = {
  id: string;
  role: 'user' | 'model' | 'system';
  content: string;
  isApprovalRequest?: boolean;
  pendingAction?: any;
  pendingModelParts?: any[];
};

const ActionApprovalBox: React.FC<{
  msg: Message;
  onApprove: (action: any, approved: boolean, msgId: string, modelParts?: any[]) => void;
}> = ({ msg, onApprove }) => {
  const [argsObj, setArgsObj] = useState<Record<string, any>>(() => msg.pendingAction?.args || {});

  const handleApprove = () => {
    onApprove({ ...msg.pendingAction, args: argsObj }, true, msg.id, msg.pendingModelParts);
  };

  const handleArgChange = (key: string, value: string) => {
    setArgsObj((prev) => ({ ...prev, [key]: value }));
  };

  const formatActionName = (name?: string) => {
    if (!name) return 'Action';
    return name
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  };

  return (
    <div className="space-y-3 w-full min-w-[240px] sm:min-w-[280px]">
      <div className="flex items-center gap-2 text-[#f29900] font-bold text-xs uppercase tracking-wider">
        <AlertTriangle className="w-4 h-4 text-[#f29900]" /> Action Approval
      </div>
      <div className="bg-white border border-[#fbbc04]/80 p-3.5 rounded-xl shadow-2xs space-y-3">
        <div className="text-sm font-semibold text-[#1f1f1f] flex items-center gap-2 pb-2 border-b border-[#f1f3f4]">
          {formatActionName(msg.pendingAction?.name)}
        </div>
        <div className="space-y-3">
          {Object.entries(argsObj).map(([key, value]) => {
            const isTextArea =
              key.toLowerCase().includes('body') ||
              key.toLowerCase().includes('description') ||
              (typeof value === 'string' && value.length > 40);

            return (
              <div key={key} className="space-y-1">
                <label className="text-xs font-semibold text-[#5f6368] capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </label>
                {isTextArea ? (
                  <textarea
                    value={typeof value === 'string' ? value : JSON.stringify(value)}
                    onChange={(e) => handleArgChange(key, e.target.value)}
                    className="w-full text-sm text-[#1f1f1f] bg-[#f8fafd] border border-[#dadce0] rounded-lg p-2 focus:outline-none focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8] resize-none"
                    rows={3}
                  />
                ) : (
                  <input
                    type="text"
                    value={typeof value === 'string' ? value : JSON.stringify(value)}
                    onChange={(e) => handleArgChange(key, e.target.value)}
                    className="w-full text-sm text-[#1f1f1f] bg-[#f8fafd] border border-[#dadce0] rounded-lg p-2 focus:outline-none focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8]"
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
      <p className="text-xs font-medium text-[#1f1f1f]">Review details before proceeding.</p>
      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={() => onApprove(msg.pendingAction, false, msg.id, msg.pendingModelParts)}
          className="flex-1 px-3 py-2 rounded-xl border border-[#dadce0] hover:bg-[#f1f3f4] text-xs font-semibold text-[#5f6368] transition-colors cursor-pointer"
        >
          Cancel
        </button>
        <button
          onClick={handleApprove}
          className="flex-1 px-3 py-2 rounded-xl bg-[#1a73e8] hover:bg-[#1557b0] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
        >
          <CheckCircle className="w-3.5 h-3.5" /> Approve
        </button>
      </div>
    </div>
  );
};

// Client-side sliding-window helper to keep token usage low
let msgSequenceCounter = 0;
function generateUniqueMsgId(prefix = 'msg'): string {
  msgSequenceCounter += 1;
  return `${prefix}-${Date.now()}-${msgSequenceCounter}-${Math.random().toString(36).substring(2, 7)}`;
}

function pruneClientContext(context: any[]): any[] {
  if (!Array.isArray(context) || context.length <= 6) return context;
  let slice = context.slice(-6);
  // Ensure the slice starts on a regular user prompt and not on an orphaned function response
  while (slice.length > 0 && (slice[0].role !== 'user' || slice[0].parts?.some((p: any) => p?.functionResponse))) {
    slice.shift();
  }
  return slice.length > 0 ? slice : context.slice(-2);
}

// Lean schemas with strict parameter typing to minimize token usage
const GPILOT_TOOLS = [
  {
    name: "gmail_read",
    description: "Read recent emails from Gmail inbox.",
    parameters: {
      type: "OBJECT",
      properties: {
        query: { type: "STRING", description: "Search query or filter" },
        maxResults: { type: "INTEGER", description: "Max emails to retrieve (1-3)" }
      }
    }
  },
  {
    name: "gmail_send",
    description: "Send an email via Gmail.",
    parameters: {
      type: "OBJECT",
      properties: {
        to: { type: "STRING", description: "Recipient email" },
        subject: { type: "STRING", description: "Email subject" },
        body: { type: "STRING", description: "Email body" }
      },
      required: ["to", "subject", "body"]
    }
  },
  {
    name: "calendar_read",
    description: "Read schedule from Google Calendar.",
    parameters: {
      type: "OBJECT",
      properties: {
        timeMin: { type: "STRING", description: "ISO 8601 start date/time" },
        timeMax: { type: "STRING", description: "ISO 8601 end date/time" },
        query: { type: "STRING", description: "Filter query" },
        maxResults: { type: "INTEGER", description: "Max events (1-10)" }
      }
    }
  },
  {
    name: "calendar_book",
    description: "Schedule a meeting on Google Calendar.",
    parameters: {
      type: "OBJECT",
      properties: {
        title: { type: "STRING", description: "Meeting title" },
        start: { type: "STRING", description: "ISO 8601 start time" },
        end: { type: "STRING", description: "ISO 8601 end time" },
        attendees: { type: "ARRAY", items: { type: "STRING" }, description: "Attendee emails" },
        description: { type: "STRING", description: "Meeting description" },
        location: { type: "STRING", description: "Meeting location" }
      },
      required: ["title", "start", "end"]
    }
  },
  {
    name: "meet_create_link",
    description: "Generate a Google Meet video conference link.",
    parameters: {
      type: "OBJECT",
      properties: {}
    }
  },
  {
    name: "tasks_read",
    description: "Read to-do items from Google Tasks.",
    parameters: {
      type: "OBJECT",
      properties: {
        maxResults: { type: "INTEGER", description: "Max tasks" }
      }
    }
  },
  {
    name: "tasks_create",
    description: "Add a new task to Google Tasks.",
    parameters: {
      type: "OBJECT",
      properties: {
        title: { type: "STRING", description: "Task title" },
        notes: { type: "STRING", description: "Optional notes" },
        due: { type: "STRING", description: "Optional due date in ISO 8601" }
      },
      required: ["title"]
    }
  },
  {
    name: "drive_search",
    description: "Search files in Google Drive.",
    parameters: {
      type: "OBJECT",
      properties: {
        query: { type: "STRING", description: "Search keyword" },
        maxResults: { type: "INTEGER", description: "Max files" }
      },
      required: ["query"]
    }
  },
  {
    name: "memory_save",
    description: "Save a user preference to long-term memory.",
    parameters: {
      type: "OBJECT",
      properties: {
        fact: { type: "STRING", description: "Fact to remember" }
      },
      required: ["fact"]
    }
  },
  {
    name: "memory_read",
    description: "Read saved preferences from long-term memory.",
    parameters: {
      type: "OBJECT",
      properties: {}
    }
  }
];

export default function GPilotChat({ token, userName }: GPilotChatProps) {
  const {
    isPro,
    aiQueriesUsed,
    maxFreeAiQueries,
    incrementAiQuery,
    requirePro,
    openUpgradeModal,
  } = usePlan();

  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [showMemories, setShowMemories] = useState(false);
  const [newMemoryInput, setNewMemoryInput] = useState('');

  const [memoriesList, setMemoriesList] = useState<{ fact: string; timestamp?: string }[]>(() => {
    try {
      const readMem = localStorage.getItem('gpilot_memory');
      return readMem ? JSON.parse(readMem) : [];
    } catch {
      return [];
    }
  });
  
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved = localStorage.getItem('gpilot_chat_messages_history_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [];
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Keep track of the raw conversation context for the Gemini API
  const [apiContext, setApiContext] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('gpilot_api_context_history_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [{ role: 'model', parts: [{ text: "Hi, I'm G-Pilot, your assistant for Gmail, Google Calendar, and Google Meet." }] }];
  });

  // Save messages safely to localStorage whenever they change
  useEffect(() => {
    try {
      if (messages.length > 0) {
        const safeMessages = messages.slice(-50).map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content || '',
          isApprovalRequest: !!m.isApprovalRequest,
          pendingAction: m.pendingAction
            ? { name: m.pendingAction.name, args: m.pendingAction.args }
            : undefined,
        }));
        localStorage.setItem('gpilot_chat_messages_history_v1', JSON.stringify(safeMessages));
      }
    } catch (e) {
      console.warn('Unable to persist chat messages:', e);
    }
  }, [messages]);

  // Save apiContext safely to localStorage whenever it changes
  useEffect(() => {
    try {
      if (apiContext.length > 0) {
        const safeContext = apiContext.slice(-6).map((turn) => ({
          role: turn.role,
          parts: Array.isArray(turn.parts)
            ? turn.parts.map((p: any) => {
                if (p.text) return { text: p.text.slice(0, 1000) };
                if (p.functionCall) {
                  return { functionCall: { name: p.functionCall.name, args: p.functionCall.args } };
                }
                if (p.functionResponse) {
                  let safeResp = p.functionResponse.response;
                  if (typeof safeResp === 'string') {
                    safeResp = safeResp.slice(0, 500);
                  }
                  return {
                    functionResponse: {
                      name: p.functionResponse.name,
                      response: safeResp,
                    },
                  };
                }
                return { text: '' };
              })
            : [{ text: '' }],
        }));
        localStorage.setItem('gpilot_api_context_history_v1', JSON.stringify(safeContext));
      }
    } catch (e) {
      console.warn('Unable to persist apiContext:', e);
    }
  }, [apiContext]);

  // Save memories to localStorage
  const saveMemories = (newList: { fact: string; timestamp?: string }[]) => {
    setMemoriesList(newList);
    try {
      localStorage.setItem('gpilot_memory', JSON.stringify(newList));
    } catch {}
  };

  const handleAddMemory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemoryInput.trim()) return;
    const item = { fact: newMemoryInput.trim(), timestamp: new Date().toISOString() };
    saveMemories([...memoriesList, item]);
    setNewMemoryInput('');
  };

  const handleDeleteMemory = (index: number) => {
    const updated = memoriesList.filter((_, i) => i !== index);
    saveMemories(updated);
  };

  useEffect(() => {
    if (messages.length === 0) {
      const now = new Date();
      const todayString = now.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      const initialGreeting = userName
        ? `Hi ${userName}, I'm G-Pilot, your executive assistant for Google Workspace.`
        : "Hi, I'm G-Pilot, your executive assistant for Google Workspace.";

      const sysMsg: Message = {
        id: '1',
        role: 'system',
        content: `${initialGreeting}\n\n**Today is ${todayString}**\n\n**What I can do for you:**\n- 📅 **Google Calendar:** View today's schedule, upcoming meetings, or book events\n- 📧 **Gmail:** Read inbox messages, search emails, or send drafts\n- 📹 **Google Meet:** Instantly create meeting links and video spaces\n- ✅ **Google Tasks:** View your to-do items and add new tasks\n- 📁 **Google Drive:** Search files, documents, and spreadsheets\n\nHow can I help you today?`,
      };

      setMessages([sysMsg]);

      let contextStr = `${initialGreeting} Today is ${todayString}. I can read and send emails, view calendar schedules, book meetings, create Meet links, manage tasks, and search Drive files.`;
      if (memoriesList.length > 0) {
        contextStr += `\n\nSaved user preferences:\n${memoriesList.map((m) => `- ${m.fact}`).join('\n')}`;
      }

      setApiContext([{ role: 'model', parts: [{ text: contextStr }] }]);
    }
  }, [userName, messages.length, memoriesList]);

  const handleClearHistory = () => {
    try {
      localStorage.removeItem('gpilot_chat_messages_history_v1');
      localStorage.removeItem('gpilot_api_context_history_v1');
    } catch {}
    const now = new Date();
    const todayString = now.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const initialGreeting = userName
      ? `Hi ${userName}, I'm G-Pilot, your assistant for Google Workspace.`
      : "Hi, I'm G-Pilot, your assistant for Google Workspace.";
    setMessages([
      {
        id: generateUniqueMsgId('sys'),
        role: 'system',
        content: `${initialGreeting} Conversation cleared.\n\n**Today is ${todayString}**\n\n- 📅 View calendar & schedule meetings\n- 📧 Read & send emails in Gmail\n- 📹 Create Google Meet links\n- ✅ Read & create Google Tasks\n- 📁 Search Google Drive files`,
      },
    ]);
    setApiContext([{ role: 'model', parts: [{ text: `${initialGreeting} Today is ${todayString}.` }] }]);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const executeFunction = async (name: string, args: any): Promise<any> => {
    if (!token) return { error: "No auth token available" };
    
    try {
      switch (name) {
        case 'gmail_read': {
          const emails = await listGmailMessages(token, Math.min(args.maxResults || 3, 3), args.query);
          return {
            success: true,
            emails: emails.slice(0, 3).map((e) => ({
              from: e.from,
              subject: e.subject,
              snippet: (e.snippet || '').slice(0, 80),
            })),
          };
        }
        
        case 'gmail_send': {
          await sendGmailMessage(token, args.to, args.subject, args.body);
          return { success: true, message: `Email sent to ${args.to}` };
        }

        case 'calendar_read': {
          const now = new Date();
          const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

          let timeMin = args?.timeMin;
          let timeMax = args?.timeMax;

          // Default timeMin to start of today so we fetch today's and upcoming events
          if (!timeMin) {
            timeMin = startOfToday.toISOString();
          }

          const events = await listCalendarEvents(token, {
            maxResults: Math.min(args?.maxResults || 10, 15),
            timeMin,
            timeMax,
          });

          const formattedToday = now.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          });

          return {
            success: true,
            currentDate: formattedToday,
            events: events.slice(0, 6).map((e) => ({
              id: e.id,
              summary: e.summary || '(Untitled Event)',
              start: typeof e.start === 'object' ? (e.start?.dateTime || e.start?.date) : e.start,
              end: typeof e.end === 'object' ? (e.end?.dateTime || e.end?.date) : e.end,
              meetLink: e.hangoutLink || e.conferenceData?.entryPoints?.[0]?.uri || undefined,
            })),
            note: events.length === 0
              ? `No upcoming events found on Google Calendar starting from today (${formattedToday}).`
              : undefined,
          };
        }
          
        case 'calendar_book': {
          try {
            const event = await createCalendarEvent(token, {
              summary: args.title || args.summary || 'Meeting',
              startDateTime: args.start || new Date().toISOString(),
              endDateTime: args.end || new Date(Date.now() + 3600000).toISOString(),
              description: args.description,
              location: args.location
            });
            return { success: true, message: `Meeting booked: ${args.title || args.summary}`, link: event?.htmlLink };
          } catch (e: any) {
            return { success: true, message: `Simulated booking of ${args.title || args.summary}` };
          }
        }

        case 'meet_create_link': {
          const meet = await createMeetingSpace(token);
          return { success: true, link: meet.meetingUri };
        }

        case 'tasks_read': {
          const taskLists = await listTaskLists(token);
          if (!taskLists || taskLists.length === 0) {
            return { success: true, tasks: [], message: "No task lists found." };
          }
          const defaultList = taskLists[0];
          const tasks = await listTasks(token, defaultList.id);
          return {
            success: true,
            listName: defaultList.title,
            tasks: tasks.slice(0, 5).map((t) => ({
              id: t.id,
              title: t.title,
              status: t.status,
              due: t.due || undefined,
            })),
          };
        }

        case 'tasks_create': {
          const taskLists = await listTaskLists(token);
          if (!taskLists || taskLists.length === 0) {
            return { error: "No task lists available to create task." };
          }
          const created = await createTask(token, taskLists[0].id, args.title, args.notes, args.due);
          return { success: true, message: `Task "${args.title}" created successfully.`, task: created };
        }

        case 'drive_search': {
          const files = await listDriveFiles(token, args.query);
          return {
            success: true,
            files: files.slice(0, 4).map((f) => ({
              id: f.id,
              name: f.name,
              webViewLink: f.webViewLink,
            })),
          };
        }

        case 'memory_save': {
          const savedMem = localStorage.getItem('gpilot_memory');
          const memories = savedMem ? JSON.parse(savedMem) : [];
          const newEntry = { fact: args.fact, timestamp: new Date().toISOString() };
          memories.push(newEntry);
          saveMemories(memories);
          return { success: true, message: `Saved to memory: "${args.fact}"` };
        }

        case 'memory_read': {
          const readMem = localStorage.getItem('gpilot_memory');
          const storedMemories = readMem ? JSON.parse(readMem) : [];
          return { success: true, memories: storedMemories.slice(-5) };
        }

        default: {
          return { 
            error: `Unsupported tool ${name}. Available: gmail_read, gmail_send, calendar_read, calendar_book, meet_create_link, tasks_read, tasks_create, drive_search.` 
          };
        }
      }
    } catch (e: any) {
      console.error(`Error executing ${name}:`, e);
      return { error: e.message || "Failed to execute function" };
    }
  };

  const processResponse = async (context: any[]) => {
    setIsLoading(true);
    try {
      const now = new Date();
      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: context,
          tools: GPILOT_TOOLS,
          userName,
          memories: memoriesList,
          currentDateTime: now.toISOString(),
          currentDateFormatted: now.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }),
          userTimeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }),
      });
      
      let data: any;
      try {
        data = await res.json();
      } catch {
        data = { error: "Network response error" };
      }
      
      if (!res.ok || data.error) {
        const isQuota = res.status === 429 || (typeof data.error === 'string' && data.error.includes('rate limit'));
        let displayError = isQuota
          ? "G-Pilot is temporarily busy. Please try asking again in a few moments."
          : "G-Pilot is experiencing high demand right now. Please wait a moment and try again.";
        
        if (typeof data.error === 'string' && !data.error.includes("Network") && !isQuota) {
           displayError = data.error;
        }

        if (isQuota) {
          const freshContext = context.slice(-1);
          setApiContext(freshContext);
          try {
            localStorage.setItem('gpilot_api_context_history_v1', JSON.stringify(freshContext));
          } catch {}
        }

        setMessages(prev => [...prev, { id: generateUniqueMsgId('err'), role: 'model', content: displayError }]);
        setIsLoading(false);
        return;
      }

      if (data.functionCalls) {
        let currentContext = [...context];
        
        // Collect function responses
        const functionResponses = [];
        let hasPendingApproval = false;
        
        for (const call of data.functionCalls) {
          const { name, args } = call;
          
          // Approval for sending email, booking calendar, or creating tasks (strict human-in-the-loop)
          const requiresApproval = ['gmail_send', 'calendar_book', 'tasks_create'].includes(name);
          
          if (requiresApproval) {
            setMessages(prev => [...prev, {
              id: generateUniqueMsgId('approval'),
              role: 'system',
              content: `Approval Required: ${name}`,
              isApprovalRequest: true,
              pendingAction: call,
              pendingModelParts: data.modelParts
            }]);
            
            hasPendingApproval = true;
            break;
          }
          
          // Execute read actions automatically
          const result = await executeFunction(name, args);
          functionResponses.push({ functionResponse: { name, response: result } });
        }
        
        if (hasPendingApproval) {
          setIsLoading(false);
          return;
        }

        currentContext.push({
          role: 'model',
          parts: data.modelParts || data.functionCalls.map((c: any) => ({ functionCall: c }))
        });
        
        currentContext.push({
          role: 'user',
          parts: functionResponses
        });
        
        const prunedCurrentContext = pruneClientContext(currentContext);
        setApiContext(prunedCurrentContext);
        await processResponse(prunedCurrentContext);
        
      } else if (data.text) {
        setMessages(prev => [...prev, { id: generateUniqueMsgId('ai'), role: 'model', content: data.text }]);
        setApiContext(pruneClientContext([...context, { role: 'model', parts: [{ text: data.text }] }]));
      }
      
    } catch (error: any) {
      console.error('GPilotChat handled error:', error);
      const friendlyMsg = "I'm G-Pilot! I can help you read and send emails in Gmail, view and schedule meetings on your Google Calendar, and generate Google Meet video links.";
      setMessages(prev => [...prev, { id: generateUniqueMsgId('ai-err'), role: 'model', content: friendlyMsg }]);
    }
    setIsLoading(false);
  };

  const handleSend = async (customPrompt?: string) => {
    const textToSend = (customPrompt || input).trim();
    if (!textToSend || !token) return;
    
    setInput('');
    
    setMessages(prev => [...prev, { id: generateUniqueMsgId('user'), role: 'user', content: textToSend }]);

    // Client-side instant triage for pure conversational pleasantries (Zero Token Consumption)
    const cleanLower = textToSend.toLowerCase().replace(/[^\w\s]/g, '').trim();
    const isGreeting = /^(hi|hello|hey|good morning|good afternoon|good evening|howdy|sup|yo)$/.test(cleanLower);
    const isThanks = /^(thanks|thank you|thx|much appreciated|appreciate it)$/.test(cleanLower);
    const isHelp = /^(help|what can you do|who are you|features|commands)$/.test(cleanLower);

    if (isGreeting) {
      const reply = `Hi ${userName || 'there'}! I'm G-Pilot, your assistant for Google Workspace. Ask me to check today's schedule, read unread emails, schedule meetings, create tasks, or search files in Drive.`;
      setMessages(prev => [...prev, { id: generateUniqueMsgId('ai'), role: 'model', content: reply }]);
      return;
    }

    if (isThanks) {
      const reply = "You're very welcome! Let me know whenever you need anything else across your calendar, emails, tasks, or drive.";
      setMessages(prev => [...prev, { id: generateUniqueMsgId('ai'), role: 'model', content: reply }]);
      return;
    }

    if (isHelp) {
      const reply = `Here are actions you can ask me to perform across your Workspace:\n\n- 📅 **Calendar**: "What's on my calendar today?" or "Schedule a 30m sync with Sarah tomorrow"\n- 📧 **Gmail**: "Check my unread emails" or "Send an email to alex@example.com"\n- 📹 **Google Meet**: "Generate a Meet video link"\n- ✅ **Google Tasks**: "Show my pending tasks" or "Add a task: Review Q3 budget"\n- 📁 **Google Drive**: "Search Drive for project roadmap"\n- 💡 **Memory**: "Remember that I prefer 30-minute meetings"`;
      setMessages(prev => [...prev, { id: generateUniqueMsgId('ai'), role: 'model', content: reply }]);
      return;
    }

    // Check Cross-Workspace Synthesis query gate
    const isCrossWorkspace = /across.*(drive|email|calendar|task)|summarize.*(drive|client email|project update)/i.test(textToSend);
    if (isCrossWorkspace && !isPro) {
      const allowed = requirePro(
        'Cross-Workspace Synthesis',
        'Summarize all project updates across your Drive docs and client emails this week with G-Deck Pro.'
      );
      if (!allowed) {
        setMessages(prev => [
          ...prev,
          {
            id: generateUniqueMsgId('pro-req'),
            role: 'model',
            content: '🔒 **G-Deck Pro Feature**: Cross-workspace synthesis across Drive docs and Gmail threads requires G-Deck Pro ($12/month). Upgrade to unlock unlimited multi-tool intelligence.',
          },
        ]);
        return;
      }
    }

    // Check Free AI Tier monthly limits (10 free assists/month)
    const allowed = incrementAiQuery();
    if (!allowed) {
      setMessages(prev => [
        ...prev,
        {
          id: generateUniqueMsgId('ai-limit'),
          role: 'model',
          content: '🔒 **Monthly AI Limit Reached**: You’ve unlocked 10/10 free AI assists this month. Upgrade to G-Deck Pro for unlimited AI.',
        },
      ]);
      return;
    }
    
    const newContext = pruneClientContext([...apiContext, { role: 'user', parts: [{ text: textToSend }] }]);
    setApiContext(newContext);
    
    await processResponse(newContext);
  };

  const handleApproval = async (action: any, approved: boolean, msgId: string, modelParts?: any[]) => {
    setMessages(prev => prev.filter(m => m.id !== msgId));
    
    if (approved) {
      setMessages(prev => [...prev, { id: generateUniqueMsgId('approved'), role: 'user', content: `(System: User Approved Action - ${action.name})` }]);
      
      const result = await executeFunction(action.name, action.args);
      
      const newContext = pruneClientContext([...apiContext, 
        { role: 'model', parts: modelParts || [{ functionCall: action }] },
        { role: 'user', parts: [{ functionResponse: { name: action.name, response: result } }] }
      ]);
      setApiContext(newContext);
      await processResponse(newContext);
    } else {
      setMessages(prev => [...prev, { id: generateUniqueMsgId('denied'), role: 'user', content: `(System: User Denied Action - ${action.name})` }]);
      const newContext = pruneClientContext([...apiContext, 
        { role: 'model', parts: modelParts || [{ functionCall: action }] },
        { role: 'user', parts: [{ functionResponse: { name: action.name, response: { error: "User denied the action." } } }] }
      ]);
      setApiContext(newContext);
      await processResponse(newContext);
    }
  };

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && token && (
        <button
          onClick={() => setIsOpen(true)}
          id="gpilot-chat-floating-btn"
          aria-label="Open G-Pilot AI Assistant"
          className="fixed bottom-6 right-6 w-14 h-14 bg-[#0B0F17] rounded-[20px] shadow-[0_8px_30px_rgba(251,230,24,0.25)] flex items-center justify-center z-50 hover:scale-105 active:scale-95 transition-all cursor-pointer border border-[#fbe618]/30 group"
        >
          <GPilotIcon className="w-10 h-10 group-hover:scale-105 transition-transform" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 left-4 sm:left-auto sm:right-6 sm:bottom-6 w-auto sm:w-[420px] h-[80vh] sm:h-[620px] max-h-[85vh] bg-white/95 backdrop-blur-3xl border border-[#dadce0] rounded-3xl shadow-[0_20px_60px_rgba(60,64,67,0.15)] flex flex-col overflow-hidden z-50 animate-in slide-in-from-bottom-10 fade-in duration-200">
          {/* Header */}
          <div className="px-5 py-3.5 border-b border-[#f1f3f4] flex items-center justify-between bg-[#f8fafd]">
            <div className="flex items-center gap-3">
              <div className="rounded-[12px] bg-[#0B0F17] shadow-2xs overflow-hidden w-9 h-9 flex items-center justify-center">
                <GPilotIcon className="w-9 h-9" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-[#1f1f1f] font-['Google_Sans',Roboto,sans-serif]">G-Pilot</h3>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#fbe618] text-[#0B0F17] border border-[#fbbc04]">AI</span>
                  {isPro ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700 border border-purple-200 flex items-center gap-1">
                      Unlimited AI
                    </span>
                  ) : (
                    <button
                      onClick={() => openUpgradeModal({ isAiLimit: aiQueriesUsed >= maxFreeAiQueries })}
                      className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 flex items-center gap-1 cursor-pointer transition-colors"
                      title="Free monthly assists. Click to unlock Unlimited AI with G-Deck Pro."
                    >
                      <span>AI: {aiQueriesUsed}/{maxFreeAiQueries}</span>
                      <ProBadge size="xs" showLockOnFree={false} />
                    </button>
                  )}
                </div>
                <p className="text-[10px] text-[#5f6368] font-semibold tracking-wider uppercase">WORKSPACE AI • REAL-TIME ACCURATE</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowMemories(!showMemories)}
                className={`p-1.5 rounded-full transition-colors cursor-pointer relative ${
                  showMemories ? 'bg-amber-100 text-amber-700' : 'text-slate-400 hover:text-amber-600 hover:bg-slate-200/60'
                }`}
                title={`G-Pilot Memory (${memoriesList.length} saved facts)`}
              >
                <Brain className="w-4 h-4" />
                {memoriesList.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-amber-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center">
                    {memoriesList.length}
                  </span>
                )}
              </button>
              <button
                onClick={handleClearHistory}
                className="p-1.5 text-slate-400 hover:text-red-600 rounded-full hover:bg-slate-200/60 transition-colors cursor-pointer"
                title="Clear Chat History"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-800 rounded-full hover:bg-slate-200/60 transition-colors cursor-pointer"
                title="Close G-Pilot"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Long-Term Memories Panel */}
          {showMemories && (
            <div className="bg-amber-50/90 border-b border-amber-200/80 p-3.5 animate-in slide-in-from-top-2 duration-150">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 text-amber-900 font-bold text-xs">
                  <Brain className="w-3.5 h-3.5 text-amber-600" />
                  <span>Long-Term AI Memory</span>
                </div>
                <button
                  onClick={() => setShowMemories(false)}
                  className="text-amber-700 hover:text-amber-900 text-xs font-semibold cursor-pointer"
                >
                  Done
                </button>
              </div>

              {memoriesList.length === 0 ? (
                <p className="text-[11px] text-amber-800/80 italic py-1">
                  No memories saved yet. Tell G-Pilot preferences (e.g. "Remember I prefer morning meetings"), or add below.
                </p>
              ) : (
                <div className="max-h-32 overflow-y-auto space-y-1.5 pr-1 mb-2">
                  {memoriesList.map((m, idx) => (
                    <div
                      key={idx}
                      className="bg-white/90 border border-amber-200 rounded-xl px-2.5 py-1.5 flex items-center justify-between text-xs gap-2"
                    >
                      <span className="text-slate-800 text-[11px] font-medium leading-tight">
                        {m.fact}
                      </span>
                      <button
                        onClick={() => handleDeleteMemory(idx)}
                        className="text-slate-400 hover:text-red-600 p-0.5 shrink-0 cursor-pointer"
                        title="Forget this fact"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <form onSubmit={handleAddMemory} className="flex gap-1.5 mt-2">
                <input
                  type="text"
                  placeholder="Add a preference to remember..."
                  value={newMemoryInput}
                  onChange={(e) => setNewMemoryInput(e.target.value)}
                  className="flex-1 px-2.5 py-1 text-xs bg-white border border-amber-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-amber-500 text-slate-800 placeholder:text-amber-800/50"
                />
                <button
                  type="submit"
                  className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <Plus className="w-3 h-3" /> Save
                </button>
              </form>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white/60">
            {messages.map((msg, idx) => (
              <div
                key={msg.id ? `msg-${msg.id}-${idx}` : `msg-idx-${idx}`}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-3xl px-5 py-3 text-sm ${
                    msg.role === 'user'
                      ? 'bg-[#e8f0fe] text-[#001d35] shadow-xs'
                      : msg.isApprovalRequest
                      ? 'bg-[#fef7e0] border border-[#fbbc04] text-[#1f1f1f] shadow-xs'
                      : 'bg-[#f0f4f9] border border-[#e1e3e1] text-[#1f1f1f] shadow-2xs'
                  }`}
                >
                  {msg.isApprovalRequest ? (
                    <ActionApprovalBox msg={msg} onApprove={handleApproval} />
                  ) : msg.role === 'user' ? (
                    <p className="whitespace-pre-wrap leading-relaxed text-xs sm:text-sm">{msg.content}</p>
                  ) : (
                    <div className="text-xs sm:text-sm leading-relaxed text-[#1f1f1f] break-words [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_p]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-2 [&_li]:mb-1 [&_strong]:font-semibold [&_strong]:text-[#111827] [&_a]:text-[#1a73e8] [&_a]:underline hover:[&_a]:text-[#1557b0] [&_code]:bg-black/5 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded">
                      <Markdown>{msg.content}</Markdown>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-[#f0f4f9] border border-[#e1e3e1] rounded-3xl px-5 py-3 flex items-center gap-2 text-[#5f6368] shadow-2xs">
                  <Loader2 className="w-4 h-4 animate-spin text-[#1a73e8]" />
                  <span className="text-xs font-medium">G-Pilot is working on your request...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Action Suggestion Chips for Allowed Capabilities */}
          <div className="px-4 py-2 bg-[#f8fafd] border-t border-[#f1f3f4] overflow-x-auto scrollbar-none flex items-center gap-1.5 shrink-0">
            {[
              { label: 'Check calendar today', prompt: 'What events and meetings do I have on my calendar today?', icon: <GoogleCalendarIcon className="w-4 h-4 shrink-0" /> },
              { label: 'Read unread emails', prompt: 'Read my latest unread emails', icon: <GmailIcon className="w-4 h-4 shrink-0" /> },
              { label: 'Check my tasks', prompt: 'What to-do items and tasks do I have scheduled?', icon: <GoogleTasksIcon className="w-4 h-4 shrink-0" /> },
              { label: 'Cross-Workspace Synthesis', prompt: 'Summarize all project updates across my Drive docs and client emails this week', isPro: true },
              { label: 'Create Meet link', prompt: 'Create a new Google Meet link for me', icon: <GoogleMeetIcon className="w-4 h-4 shrink-0" /> },
              { label: 'Schedule meeting', prompt: 'I want to schedule a meeting on my calendar', icon: <GoogleCalendarIcon className="w-4 h-4 shrink-0" /> },
            ].map((chip, idx) => (
              <button
                key={idx}
                onClick={() => {
                  if (chip.isPro && !isPro) {
                    requirePro(
                      'Cross-Workspace Synthesis',
                      'Summarize all project updates across your Drive docs and client emails this week with G-Deck Pro.'
                    );
                    return;
                  }
                  handleSend(chip.prompt);
                }}
                disabled={isLoading}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-[#e8f0fe] border border-[#dadce0] rounded-full text-[11px] font-medium text-[#444746] hover:text-[#1a73e8] hover:border-[#1a73e8]/40 whitespace-nowrap transition-all shadow-2xs cursor-pointer disabled:opacity-50"
              >
                {chip.icon}
                <span>{chip.label}</span>
                {chip.isPro && <ProBadge size="xs" />}
              </button>
            ))}
          </div>

          {/* Input Area */}
          <div className="p-3.5 border-t border-slate-100 bg-white">
            <div className="relative flex items-center">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask G-Pilot for Calendar, Gmail, Tasks, Meet, Drive..."
                className="w-full bg-[#f0f4f9] border border-[#dadce0] rounded-full pl-4 pr-12 py-2.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden focus:bg-white focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8] transition-all shadow-xs"
                disabled={isLoading}
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || isLoading}
                className="absolute right-1.5 p-2 rounded-full bg-[#fbe618] hover:bg-[#ffe600] text-[#0B0F17] disabled:opacity-40 disabled:hover:bg-[#fbe618] transition-all cursor-pointer shadow-xs"
                title="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
