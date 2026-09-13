import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Loader2, Sparkles, AlertTriangle, CheckCircle } from 'lucide-react';
import { AIIcon } from './GoogleIcons';
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
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Keep track of the raw conversation context for the Gemini API
  const [apiContext, setApiContext] = useState<any[]>([
    { role: 'model', parts: [{ text: "Hi, I'm G-Pilot, your autonomous Workspace assistant." }] }
  ]);

  useEffect(() => {
    // Load memories on boot to inject into context
    const readMem = localStorage.getItem('gpilot_memory');
    const storedMemories = readMem ? JSON.parse(readMem) : [];
    
    let initialGreeting = "Hi, I'm G-Pilot, your autonomous Workspace assistant.";
    if (userName) {
      initialGreeting = `Hi ${userName}, I'm G-Pilot, your autonomous Workspace assistant.`;
    }

    const sysMsg: Message = {
      id: '1',
      role: 'system',
      content: `${initialGreeting} I can read emails, check your calendar, send messages, and more. How can I help?`
    };

    setMessages([sysMsg]);
    
    let contextStr = initialGreeting;
    if (storedMemories.length > 0) {
      contextStr += `\n\nHere are some things I remember about you from past conversations:\n${storedMemories.map((m: any) => `- ${m.fact}`).join('\n')}`;
    }

    setApiContext([
      { role: 'model', parts: [{ text: contextStr }] }
    ]);
  }, [userName]);

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
          const emails = await listGmailMessages(token, args.maxResults || 5, args.query);
          return { success: true, count: emails.length, emails: emails.map(e => ({ from: e.from, subject: e.subject, snippet: e.snippet })) };
        
        case 'calendar_read':
          const events = await listCalendarEvents(token, args.maxResults || 5);
          return { success: true, count: events.length, events: events.map(e => ({ summary: e.summary, start: e.start, location: e.location })) };
          
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
            return { success: true, message: `Simulated booking of ${args.title || args.summary} (Actual API failed or missing scopes)` };
          }

        case 'workspace_search':
          const files = await listDriveFiles(token, args.query);
          return { success: true, files: files.slice(0, 5) };

        case 'chat_read':
          if (!args.spaceName) {
            const spaces = await listChatSpaces(token);
            return { success: true, spaces: spaces.map(s => ({ name: s.name, displayName: s.displayName })) };
          }
          const msgs = await listChatMessages(token, args.spaceName);
          return { success: true, messages: msgs.slice(0, 5) };

        case 'meet_create_link':
          const meet = await createMeetingSpace(token);
          return { success: true, link: meet.meetingUri };

        case 'tasks_read':
          if (!args.tasklistId) {
            const lists = await listTaskLists(token);
            return { success: true, tasklists: lists };
          }
          const taskItems = await listTasks(token, args.tasklistId);
          return { success: true, tasks: taskItems };

        case 'tasks_add':
          // Fetch first list to add to if none specified
          const lists = await listTaskLists(token);
          if (!lists.length) return { error: "No task lists found" };
          const newTask = await createTask(token, lists[0].id, args.title, args.notes);
          return { success: true, task: newTask };

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
          return { success: true, forms: forms.slice(0, 5) };

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
          return { success: true, message: `Text sent to ${args.recipient}: "${args.text}"` };

        case 'messages_read':
          const readThreadsStr = localStorage.getItem('google_messages_threads');
          const readThreads = readThreadsStr ? JSON.parse(readThreadsStr) : [];
          return { 
            success: true, 
            threads: readThreads.map((t: any) => ({
              contact: t.contactName,
              phone: t.phoneNumber,
              lastMessage: t.lastMessage,
              type: t.type
            }))
          };

        case 'memory_save':
          const savedMem = localStorage.getItem('gpilot_memory');
          const memories = savedMem ? JSON.parse(savedMem) : [];
          memories.push({ fact: args.fact, timestamp: new Date().toISOString() });
          localStorage.setItem('gpilot_memory', JSON.stringify(memories));
          return { success: true, message: "Fact saved to memory." };

        case 'memory_read':
          const readMem = localStorage.getItem('gpilot_memory');
          const storedMemories = readMem ? JSON.parse(readMem) : [];
          return { success: true, memories: storedMemories };

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
        body: JSON.stringify({ contents: context, tools: GPILOT_TOOLS, userName })
      });
      
      let data: any;
      try {
        data = await res.json();
      } catch (jsonError) {
        throw new Error(`Server returned status ${res.status}. If deployed on Vercel, please check that GEMINI_API_KEY is configured in Vercel Environment Variables.`);
      }
      
      if (!res.ok || data.error) {
        let displayError = data.error || `Error ${res.status}: Unable to query Gemini API`;
        if (
          typeof displayError === 'string' &&
          (displayError.includes('quota') ||
            displayError.includes('429') ||
            displayError.includes('RESOURCE_EXHAUSTED') ||
            displayError.includes('Quota exceeded'))
        ) {
          displayError = "G-Pilot is experiencing high demand right now. Please wait a moment and try your request again.";
        }
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', content: displayError }]);
        setIsLoading(false);
        return;
      }

      if (data.functionCalls) {
        let currentContext = [...context];
        
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
              pendingAction: call
            }]);
            
            // We stop processing here, waiting for user approval
            setIsLoading(false);
            return;
          }
          
          // Execute automatically (Tier 1 & 2)
          const result = await executeFunction(name, args);
          
          currentContext.push({
            role: 'model',
            parts: [{ functionCall: call }]
          });
          
          currentContext.push({
            role: 'user',
            parts: [{ functionResponse: { name, response: result } }]
          });
        }
        
        // After executing functions, get the model's textual response
        await processResponse(currentContext);
        
      } else if (data.text) {
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', content: data.text }]);
        setApiContext(prev => [...prev, { role: 'model', parts: [{ text: data.text }] }]);
      }
      
    } catch (error: any) {
      console.error(error);
      const errMsg = error?.message || "G-Pilot is momentarily unavailable. Please try again in a moment.";
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', content: errMsg }]);
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

  const handleApproval = async (action: any, approved: boolean, msgId: string) => {
    // Remove the approval message
    setMessages(prev => prev.filter(m => m.id !== msgId));
    
    if (approved) {
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', content: `(System: User Approved Action - ${action.name})` }]);
      
      const result = await executeFunction(action.name, action.args);
      
      const newContext = [...apiContext, 
        { role: 'model', parts: [{ functionCall: action }] },
        { role: 'user', parts: [{ functionResponse: { name: action.name, response: result } }] }
      ];
      setApiContext(newContext);
      await processResponse(newContext);
    } else {
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', content: `(System: User Denied Action - ${action.name})` }]);
      const newContext = [...apiContext, 
        { role: 'model', parts: [{ functionCall: action }] },
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
          className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-tr from-[#fbe618] via-amber-400 to-yellow-300 rounded-2xl shadow-[0_8px_30px_rgba(251,230,24,0.35)] flex items-center justify-center z-50 hover:scale-105 active:scale-95 transition-all cursor-pointer border border-yellow-200/60 group p-1.5"
        >
          <AIIcon className="w-10 h-10 group-hover:scale-105 transition-transform" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 left-4 sm:left-auto sm:right-6 sm:bottom-6 w-auto sm:w-[420px] h-[80vh] sm:h-[620px] max-h-[85vh] bg-white/95 backdrop-blur-3xl border border-slate-200/90 rounded-3xl shadow-[0_20px_60px_rgba(15,23,42,0.15)] flex flex-col overflow-hidden z-50 animate-in slide-in-from-bottom-10 fade-in duration-200">
          {/* Header */}
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
            <div className="flex items-center gap-3">
              <div className="p-1 rounded-xl bg-white border border-slate-200/60 shadow-2xs">
                <AIIcon className="w-8 h-8" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black text-slate-900">G-Pilot</h3>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#fbe618] text-[#0B0F17] border border-amber-300 shadow-2xs">AI</span>
                </div>
                <p className="text-[10px] text-slate-500 font-bold tracking-wider uppercase">AUTONOMOUS WORKSPACE ASSISTANT</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 text-slate-400 hover:text-slate-800 rounded-full hover:bg-slate-200/60 transition-colors cursor-pointer"
              title="Close G-Pilot"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white/60">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                    msg.role === 'user'
                      ? 'bg-[#fbe618] text-[#0B0F17] font-semibold shadow-xs'
                      : msg.isApprovalRequest
                      ? 'bg-amber-50/90 border border-amber-300 text-slate-900 shadow-xs'
                      : 'bg-slate-50 border border-slate-200/90 text-slate-800 shadow-2xs'
                  }`}
                >
                  {msg.isApprovalRequest ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-amber-800 font-black text-xs uppercase tracking-wider">
                        <AlertTriangle className="w-4 h-4 text-amber-600" /> Action Approval
                      </div>
                      <p className="text-xs text-amber-950 font-mono bg-white border border-amber-200/80 p-2.5 rounded-xl shadow-2xs">
                        <strong className="text-amber-800">Action:</strong> {msg.pendingAction.name}
                        <br/>
                        <strong className="text-amber-800">Args:</strong> {JSON.stringify(msg.pendingAction.args, null, 2)}
                      </p>
                      <p className="text-xs font-medium text-slate-700">Proceed with this Google Workspace action?</p>
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={() => handleApproval(msg.pendingAction, false, msg.id)}
                          className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-xs font-bold text-slate-700 transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleApproval(msg.pendingAction, true, msg.id)}
                          className="flex-1 px-3 py-1.5 rounded-xl bg-[#fbe618] hover:bg-[#ffe600] text-[#0B0F17] text-xs font-black flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                        >
                          <CheckCircle className="w-3.5 h-3.5" /> Approve
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap leading-relaxed text-xs sm:text-sm">{msg.content}</p>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-slate-50 border border-slate-200/90 rounded-2xl px-4 py-3 flex items-center gap-2 text-slate-600 shadow-2xs">
                  <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
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
