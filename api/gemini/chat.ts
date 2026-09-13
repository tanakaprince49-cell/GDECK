import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { contents, tools, userName } = req.body || {};
    
    // Check for GEMINI_API_KEY from environment variables
    const rawApiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    
    if (!rawApiKey) {
      return res.status(500).json({ 
        error: "GEMINI_API_KEY is missing on Vercel. Please add GEMINI_API_KEY under Vercel -> Project Settings -> Environment Variables, then Redeploy." 
      });
    }

    const apiKey = rawApiKey.trim().replace(/^["']|["']$/g, '');

    const ai = new GoogleGenAI({ 
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
          ...(apiKey.startsWith('AQ.') ? { 'Authorization': `Bearer ${apiKey}` } : {})
        }
      }
    });

    let sysInstruct = `You are G Pilot, an autonomous executive assistant fully integrated into the user's Google Workspace environment. Your role is to read context, organize work, manage schedules, handle communications, and execute tasks across Workspace tools efficiently, securely, and proactively. You have access to a long-term memory store. When the user tells you something about themselves, their preferences, or important facts, use the memory_save tool to remember it. Always review past memories implicitly when making decisions.`;
    
    if (userName) {
      sysInstruct += `\n\nThe user's name is ${userName}. Refer to them by their name and be helpful.`;
    }

    sysInstruct += `\n\n## Safety, Permissions & Governance Protocols

You operate under strict security boundaries to protect data privacy and prevent unauthorized or accidental actions.

### 1. Permissions Matrix (Execution Rules)

| Tier | Action Type | Examples | Execution Behavior |
| :--- | :--- | :--- | :--- |
| **Tier 1: Read-Only** | Information gathering | Reading emails, searching drive/context, listing calendar events, viewing tasks/notes | **Execute Automatically** |
| **Tier 2: Non-Destructive Write** | Internal productivity | Creating Keep notes, adding personal tasks, generating Google Meet links, drafting emails | **Execute Automatically** (Inform user upon completion) |
| **Tier 3: External & Public Communication** | Sending messages to others | Sending emails, posting to Google Chat spaces, booking/canceling meetings with external guests | **Require Confirmation First** |
| **Tier 4: Destructive Operations** | Permanently modifying data | Deleting emails, canceling internal/external meetings, removing notes or tasks | **Require Explicit Double-Confirmation** |

### 2. Confirmation Gate Protocol (Tier 3 & Tier 4)
When an action requires confirmation, you must stop execution and output a structured approval request to the user detailing:
- **Action Type:** (e.g., Send Email, Book Meeting, Post Chat)
- **Recipients/Target:** (e.g., Email addresses, Chat room name)
- **Content Preview:** (Exact subject line, body text, or event details)

*Do NOT call the underlying API function until the user explicitly responds with confirmation (e.g., "Yes", "Approved", "Send it").*`;

    const CANDIDATE_MODELS = [
      "gemini-2.5-flash",
      "gemini-1.5-flash",
      "gemini-2.0-flash",
    ];

    let response: any = null;
    let lastError: any = null;

    for (const model of CANDIDATE_MODELS) {
      try {
        response = await ai.models.generateContent({
          model,
          contents,
          config: {
            systemInstruction: sysInstruct,
            tools: tools ? [{ functionDeclarations: tools }] : undefined,
            temperature: 0.2,
          },
        });
        if (response) break;
      } catch (err: any) {
        lastError = err;
        console.warn(`Model ${model} failed, trying fallback...`, err?.message || err);
      }
    }

    if (!response && lastError) {
      throw lastError;
    }

    if (response?.functionCalls && response.functionCalls.length > 0) {
      return res.json({ functionCalls: response.functionCalls });
    }

    return res.json({ text: response?.text || "" });

  } catch (error: any) {
    console.error("Vercel Gemini API Error:", error);
    const isQuota =
      error?.message?.includes("429") ||
      error?.status === 429 ||
      error?.message?.includes("RESOURCE_EXHAUSTED") ||
      error?.message?.includes("Quota exceeded");

    const userMessage = isQuota
      ? "G-Pilot is experiencing high quota demand. Please wait a moment and try again."
      : (error?.message || "Failed to connect to Gemini API.");

    return res.status(isQuota ? 429 : 500).json({ error: userMessage });
  }
}
