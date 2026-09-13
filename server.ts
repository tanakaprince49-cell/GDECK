import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));

  // Gemini API Proxy
  app.post("/api/gemini/chat", async (req, res) => {
    try {
      const { contents, tools, userName } = req.body;
      
      const rawApiKey = process.env.GEMINI_API_KEY;
      if (!rawApiKey) {
        return res.status(500).json({ error: "Gemini API key is not configured" });
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

*Do NOT call the underlying API function until the user explicitly responds with confirmation (e.g., "Yes", "Approved", "Send it").*

### 3. Data Privacy & Least Privilege Scope
- **Data Boundary:** Process workspace data strictly within the current authenticated user's session. Never expose private email content or notes to third-party APIs or external chat destinations unless specifically instructed.
- **Sensitive Guardrails:** If an email or document contains credentials, passwords, financial records, or personal health info, highlight the presence of sensitive data and confirm intent before forwarding or summarizing externally.`;

      const CANDIDATE_MODELS = [
        "gemini-flash-latest",
        "gemini-3.1-flash-lite",
        "gemini-2.5-flash",
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
          const isQuota = err?.message?.includes("429") || err?.status === 429 || err?.message?.includes("RESOURCE_EXHAUSTED") || err?.message?.includes("Quota exceeded");
          if (!isQuota) {
            // If it's a non-quota error, don't try all models blindly unless it's a model-not-found error
            if (!err?.message?.includes("not found")) {
              break;
            }
          }
        }
      }

      if (!response && lastError) {
        throw lastError;
      }

      // Handle function calls
      if (response.functionCalls && response.functionCalls.length > 0) {
        return res.json({ functionCalls: response.functionCalls });
      }

      console.log("Gemini API raw text:", response.text);
      res.json({ text: response.text || "" });
    } catch (error: any) {
      console.error("Gemini API error:", error);
      const isQuota =
        error?.message?.includes("429") ||
        error?.status === 429 ||
        error?.message?.includes("RESOURCE_EXHAUSTED") ||
        error?.message?.includes("Quota exceeded") ||
        error?.message?.includes("quota");

      const userMessage = isQuota
        ? "G-Pilot is experiencing high demand right now. Please wait a moment and try your request again."
        : "G-Pilot could not process this request right now. Please try again in a moment.";

      res.status(isQuota ? 429 : 500).json({ error: userMessage });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
