import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Loader2, AlertTriangle, CheckCircle, Trash2, Brain, Plus, Sparkles } from 'lucide-react';
import Markdown from 'react-markdown';
import { GPilotIcon } from './GoogleIcons';
import { 
  listGmailMessages, 
  sendGmailMessage, 
  listCalendarEvents, 
  createCalendarEvent,
  listTaskLists,
  listTasks,
  createTask,
  listChatSpaces,
  listChatMessages,
  sendChatMessage,
  listDriveFiles,
  createMeetingSpace,
  searchForms
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

// Map of available functions with their JSON Schema descriptions
const GPILOT_TOOLS = [
  {
    name: "gmail_read",
    description: "Read the latest emails from the user's inbox based on a query.",
    parameters: {
      type: "OBJECT",
      properties: {
        query: { type: "STRING", description: "Search query for Gmail (e.g. 'from:Sarah', 'is:unread')" },
        maxResults: { type: "INTEGER", description: "Maximum number of emails to retrieve (default 5)" }
      }
    }
  },
  {
    name: "gmail_send",
    description: "Send an email to a recipient.",
    parameters: {
      type: "OBJECT",
      properties: {
        to: { type: "STRING", description: "Email address of the recipient" },
        subject: { type: "STRING", description: "Subject of the email" },
        body: { type: "STRING", description: "Body content of the email" }
      },
      required: ["to", "subject", "body"]
    }
  },
  {
    name: "calendar_book",
    description: "Book a new meeting on the user's calendar.",
    parameters: {
      type: "OBJECT",
      properties: {
        title: { type: "STRING", description: "Event title" },
        start: { type: "STRING", description: "ISO 8601 string for start time" },
        end: { type: "STRING", description: "ISO 8601 string for end time" },
        attendees: { type: "ARRAY", items: { type: "STRING" }, description: "List of attendee emails" }
      },
      required: ["title", "start", "end"]
    }
  },
  {
    name: "calendar_read",
    description: "List upcoming events from the user's calendar.",
    parameters: {
      type: "OBJECT",
      properties: {
        maxResults: { type: "INTEGER", description: "Maximum number of events to retrieve" }
      }
    }
  },
  {
    name: "chat_post_space",
    description: "Post a message to a Google Chat space.",
    parameters: {
      type: "OBJECT",
      properties: {
        spaceName: { type: "STRING", description: "Name of the space (e.g. 'spaces/AAAA')" },
        text: { type: "STRING", description: "Message text" }
      },
      required: ["spaceName", "text"]
    }
  },
  {
    name: "workspace_search",
    description: "Search Google Drive for files and documents.",
    parameters: {
      type: "OBJECT",
      properties: {
        query: { type: "STRING", description: "Search query for Drive files" }
      }
    }
  },
  {
    name: "chat_read",
    description: "Read recent messages from a Google Chat space.",
    parameters: {
      type: "OBJECT",
      properties: {
        spaceName: { type: "STRING", description: "Name of the space. If empty, lists available spaces." }
      }
    }
  },
  {
    name: "meet_create_link",
    description: "Create a new Google Meet space and return the joining link.",
    parameters: {
      type: "OBJECT",
      properties: {}
    }
  },
  {
    name: "tasks_read",
    description: "Read tasks from Google Tasks.",
    parameters: {
      type: "OBJECT",
      properties: {
        tasklistId: { type: "STRING", description: "ID of the task list. If empty, lists available task lists." }
      }
    }
  },
  {
    name: "tasks_add",
    description: "Add a new task to Google Tasks.",
    parameters: {
      type: "OBJECT",
      properties: {
        title: { type: "STRING", description: "Title of the task" },
        notes: { type: "STRING", description: "Notes for the task" }
      },
      required: ["title"]
    }
  },
  {
    name: "keep_create_note",
    description: "Create a note in Google Keep.",
    parameters: {
      type: "OBJECT",
      properties: {
        title: { type: "STRING", description: "Title of the note" },
        content: { type: "STRING", description: "Content of the note" }
      },
      required: ["title", "content"]
    }
  },
  {
    name: "forms_search",
    description: "Search for Google Forms in the workspace.",
    parameters: {
      type: "OBJECT",
      properties: {}
    }
  },
  {
    name: "messages_send",
    description: "Send a text or RCS message via Google Messages.",
    parameters: {
      type: "OBJECT",
      properties: {
        recipient: { type: "STRING", description: "Name or phone number of the recipient" },
        text: { type: "STRING", description: "The message text to send" }
      },
      required: ["recipient", "text"]
    }
  },
  {
    name: "messages_read",
    description: "Read recent conversation threads from Google Messages.",
    parameters: {
      type: "OBJECT",
      properties: {}
    }
  },
  {
    name: "memory_save",
    description: "Save a fact about the user or their preferences to long-term memory.",
    parameters: {
      type: "OBJECT",
      properties: {
        fact: { type: "STRING", description: "The fact to remember (e.g. 'User prefers morning meetings')" }
      },
      required: ["fact"]
    }
  },
  {
    name: "memory_read",
    description: "Read all saved facts from the user's long-term memory.",
    parameters: {
      type: "OBJECT",
      properties: {}
    }
  }
];

export default function GPilotChat({ token, userName }: GPilotChatProps) {
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
    return [{ role: 'model', parts: [{ text: "Hi, I'm G-Pilot, your autonomous Workspace assistant." }] }];
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

  // Save apiContext safely to localStorage whenever it changes (clamped to last 6 turns to conserve tokens)
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
      let initialGreeting = "Hi, I'm G-Pilot, your autonomous Workspace assistant.";
      if (userName) {
        initialGreeting = `Hi ${userName}, I'm G-Pilot, your autonomous Workspace assistant.`;
      }

      const sysMsg: Message = {
        id: '1',
        role: 'system',
        content: `${initialGreeting} I can read emails, check your calendar, send messages, and more. How can I help?`,
      };

      setMessages([sysMsg]);

      let contextStr = initialGreeting;
      if (memoriesList.length > 0) {
        contextStr += `\n\nHere are some things I remember about you:\n${memoriesList.map((m) => `- ${m.fact}`).join('\n')}`;
      }

      setApiContext([{ role: 'model', parts: [{ text: contextStr }] }]);
    }
  }, [userName, messages.length, memoriesList]);

  const handleClearHistory = () => {
    try {
      localStorage.removeItem('gpilot_chat_messages_history_v1');
      localStorage.removeItem('gpilot_api_context_history_v1');
    } catch {}
    const initialGreeting = userName
      ? `Hi ${userName}, I'm G-Pilot, your autonomous Workspace assistant.`
      : "Hi, I'm G-Pilot, your autonomous Workspace assistant.";
    setMessages([
      {
        id: Date.now().toString(),
        role: 'system',
        content: `${initialGreeting} Conversation cleared. How can I help you?`,
      },
    ]);
    setApiContext([{ role: 'model', parts: [{ text: initialGreeting }] }]);
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
        case 'gmail_read':
          const emails = await listGmailMessages(token, Math.min(args.maxResults || 3, 3), args.query);
          return {
            success: true,
            emails: emails.slice(0, 3).map((e) => ({
              from: e.from,
              subject: e.subject,
              snippet: (e.snippet || '').slice(0, 80),
            })),
          };
        
        case 'calendar_read':
          const events = await listCalendarEvents(token, Math.min(args?.maxResults || 15, 25));
          return {
            success: true,
            events: events.slice(0, 15).map((e) => ({
              summary: e.summary || '(No title)',
              start: typeof e.start === 'object' ? (e.start?.dateTime || e.start?.date) : e.start,
              end: typeof e.end === 'object' ? (e.end?.dateTime || e.end?.date) : e.end,
              location: e.location || '',
              description: e.description ? e.description.slice(0, 120) : '',
            })),
          };
          
        case 'gmail_send':
          await sendGmailMessage(token, args.to, args.subject, args.body);
          return { success: true, message: `Email sent to ${args.to}` };
          
        case 'chat_post_space':
          await sendChatMessage(token, args.spaceName, args.text);
          return { success: true, message: `Message posted to space` };
          
        case 'calendar_book':
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

        case 'workspace_search':
          const files = await listDriveFiles(token, args.query);
          return {
            success: true,
            files: files.slice(0, 4).map((f) => ({
              name: f.name,
              mimeType: f.mimeType,
              modifiedTime: f.modifiedTime,
            })),
          };

        case 'chat_read':
          if (!args.spaceName) {
            const spaces = await listChatSpaces(token);
            return { success: true, spaces: spaces.slice(0, 3).map(s => ({ name: s.name, displayName: s.displayName })) };
          }
          const msgs = await listChatMessages(token, args.spaceName);
          return { success: true, messages: msgs.slice(0, 3) };

        case 'meet_create_link':
          const meet = await createMeetingSpace(token);
          return { success: true, link: meet.meetingUri };

        case 'tasks_read':
          if (!args.tasklistId) {
            const lists = await listTaskLists(token);
            return { success: true, tasklists: lists.slice(0, 3) };
          }
          const taskItems = await listTasks(token, args.tasklistId);
          return { success: true, tasks: taskItems.slice(0, 4).map((t: any) => ({ title: t.title, status: t.status })) };

        case 'tasks_add':
          // Fetch first list to add to if none specified
          const lists = await listTaskLists(token);
          if (!lists.length) return { error: "No task lists found" };
          const newTask = await createTask(token, lists[0].id, args.title, args.notes);
          return { success: true, task: { title: newTask.title } };

        case 'keep_create_note':
          const savedStr = localStorage.getItem('workspace_hub_keep_notes');
          const notes = savedStr ? JSON.parse(savedStr) : [];
          notes.unshift({
            id: Date.now().toString(),
            title: args.title,
            content: args.content,
            isPinned: false,
            color: 'bg-white',
            updatedAt: new Date().toISOString()
          });
          localStorage.setItem('workspace_hub_keep_notes', JSON.stringify(notes));
          return { success: true, message: "Note saved to Keep" };

        case 'forms_search':
          const forms = await searchForms(token);
          return { success: true, forms: forms.slice(0, 3).map(f => ({ name: f.name })) };

        case 'messages_send':
          const threadsStr = localStorage.getItem('google_messages_threads');
          const threads = threadsStr ? JSON.parse(threadsStr) : [];
          const newMsg = {
            id: `msg-${Date.now()}`,
            sender: 'Me',
            senderName: 'Me',
            text: args.text,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isMe: true,
            type: 'rcs',
            status: 'sent'
          };
          const existing = threads.find((t: any) => 
            t.contactName.toLowerCase().includes(args.recipient.toLowerCase()) || 
            t.phoneNumber.includes(args.recipient)
          );
          if (existing) {
            existing.messages.push(newMsg);
            existing.lastMessage = args.text;
            existing.lastTimestamp = newMsg.timestamp;
          } else {
            threads.unshift({
              id: `thread-${Date.now()}`,
              contactName: args.recipient,
              phoneNumber: args.recipient,
              unreadCount: 0,
              lastMessage: args.text,
              lastTimestamp: newMsg.timestamp,
              type: 'rcs',
              messages: [newMsg]
            });
          }
          localStorage.setItem('google_messages_threads', JSON.stringify(threads));
          return { success: true, message: `Text sent to ${args.recipient}` };

        case 'messages_read':
          const readThreadsStr = localStorage.getItem('google_messages_threads');
          const readThreads = readThreadsStr ? JSON.parse(readThreadsStr) : [];
          return { 
            success: true, 
            threads: readThreads.slice(0, 3).map((t: any) => ({
              contact: t.contactName,
              lastMessage: t.lastMessage,
            }))
          };

        case 'memory_save':
          const savedMem = localStorage.getItem('gpilot_memory');
          const memories = savedMem ? JSON.parse(savedMem) : [];
          const newEntry = { fact: args.fact, timestamp: new Date().toISOString() };
          memories.push(newEntry);
          saveMemories(memories);
          return { success: true, message: `Fact saved to memory: "${args.fact}"` };

        case 'memory_read':
          const readMem = localStorage.getItem('gpilot_memory');
          const storedMemories = readMem ? JSON.parse(readMem) : [];
          return { success: true, memories: storedMemories.slice(-5) };

        default:
          return { error: `Unknown function: ${name}` };
      }
    } catch (e: any) {
      console.error(`Error executing ${name}:`, e);
      return { error: e.message || "Failed to execute function" };
    }
  };

  const processResponse = async (context: any[]) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: context,
          tools: GPILOT_TOOLS,
          userName,
          memories: memoriesList,
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
          ? "G-Pilot was temporarily rate-limited. I've automatically pruned our context to save tokens. Please ask again in a few seconds!"
          : "G-Pilot is experiencing high demand right now. Please wait a moment and try again.";
        
        if (typeof data.error === 'string' && !data.error.includes("Network") && !isQuota) {
           displayError = data.error;
        }

        // On 429, reset apiContext to only the latest turn so token buildup is cleared
        if (isQuota) {
          const freshContext = context.slice(-1);
          setApiContext(freshContext);
          try {
            localStorage.setItem('gpilot_api_context_history_v1', JSON.stringify(freshContext));
          } catch {}
        }

        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', content: displayError }]);
        setIsLoading(false);
        return;
      }

      if (data.functionCalls) {
        let currentContext = [...context];
        
        // We will collect all function responses in one array to match the model's parts
        const functionResponses = [];
        let hasPendingApproval = false;
        
        for (const call of data.functionCalls) {
          const { name, args } = call;
          
          // Check Tier 3/4 Approval Rules
          const requiresApproval = ['gmail_send', 'calendar_book', 'chat_post_space', 'calendar_delete'].includes(name);
          
          if (requiresApproval) {
            setMessages(prev => [...prev, {
              id: Date.now().toString(),
              role: 'system',
              content: `Approval Required: ${name}`,
              isApprovalRequest: true,
              pendingAction: call,
              pendingModelParts: data.modelParts // Save for handleApproval
            }]);
            
            // Stop processing here, wait for user
            hasPendingApproval = true;
            break;
          }
          
          // Execute automatically (Tier 1 & 2)
          const result = await executeFunction(name, args);
          functionResponses.push({ functionResponse: { name, response: result } });
        }
        
        if (hasPendingApproval) {
          setIsLoading(false);
          return;
        }

        // Push model turn (raw parts if available to preserve thought_signature)
        currentContext.push({
          role: 'model',
          parts: data.modelParts || data.functionCalls.map((c: any) => ({ functionCall: c }))
        });
        
        // Push user turn with all responses
        currentContext.push({
          role: 'user',
          parts: functionResponses
        });
        
        setApiContext(currentContext);
        // After executing functions, get the model's textual response
        await processResponse(currentContext);
        
      } else if (data.text) {
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', content: data.text }]);
        setApiContext([...context, { role: 'model', parts: [{ text: data.text }] }]);
      }
      
    } catch (error: any) {
      console.error('GPilotChat handled error:', error);
      const friendlyMsg = "I'm G-Pilot! I can help you read emails, view calendar schedules, manage tasks, and organize your Google Workspace.";
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', content: friendlyMsg }]);
    }
    setIsLoading(false);
  };

  const handleSend = async () => {
    if (!input.trim() || !token) return;
    
    const userMsg = input.trim();
    setInput('');
    
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', content: userMsg }]);
    
    const newContext = [...apiContext, { role: 'user', parts: [{ text: userMsg }] }];
    setApiContext(newContext);
    
    await processResponse(newContext);
  };

  const handleApproval = async (action: any, approved: boolean, msgId: string, modelParts?: any[]) => {
    // Remove the approval message
    setMessages(prev => prev.filter(m => m.id !== msgId));
    
    if (approved) {
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', content: `(System: User Approved Action - ${action.name})` }]);
      
      const result = await executeFunction(action.name, action.args);
      
      const newContext = [...apiContext, 
        { role: 'model', parts: modelParts || [{ functionCall: action }] },
        { role: 'user', parts: [{ functionResponse: { name: action.name, response: result } }] }
      ];
      setApiContext(newContext);
      await processResponse(newContext);
    } else {
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', content: `(System: User Denied Action - ${action.name})` }]);
      const newContext = [...apiContext, 
        { role: 'model', parts: modelParts || [{ functionCall: action }] },
        { role: 'user', parts: [{ functionResponse: { name: action.name, response: { error: "User denied the action." } } }] }
      ];
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
          <div className="px-5 py-4 border-b border-[#f1f3f4] flex items-center justify-between bg-[#f8fafd]">
            <div className="flex items-center gap-3">
              <div className="rounded-[12px] bg-[#0B0F17] shadow-2xs overflow-hidden w-9 h-9 flex items-center justify-center">
                <GPilotIcon className="w-9 h-9" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-[#1f1f1f] font-['Google_Sans',Roboto,sans-serif]">G-Pilot</h3>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#fbe618] text-[#0B0F17] border border-[#fbbc04]">AI</span>
                </div>
                <p className="text-[10px] text-[#5f6368] font-medium tracking-wider uppercase">WORKSPACE ASSISTANT</p>
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
                  <span className="text-[10px] text-amber-700 font-normal">
                    (Retained across browser refreshes)
                  </span>
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
                  No memories saved yet. Tell G-Pilot facts (e.g. "Remember that my name is Tanaka" or "Remember I prefer short emails"), or add below.
                </p>
              ) : (
                <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1 mb-2">
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
                  placeholder="Add a new fact to remember..."
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
            {messages.map((msg) => (
              <div
                key={msg.id}
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
                  <span className="text-xs font-medium">G-Pilot is thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-slate-100 bg-slate-50/80">
            <div className="relative flex items-center">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask G-Pilot to manage your workspace..."
                className="w-full bg-white border border-slate-200 rounded-full pl-4 pr-12 py-2.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all shadow-xs"
                disabled={isLoading}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="absolute right-2 p-1.5 rounded-full bg-[#fbe618] hover:bg-[#ffe600] text-[#0B0F17] disabled:opacity-40 disabled:hover:bg-[#fbe618] transition-all cursor-pointer shadow-xs"
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
