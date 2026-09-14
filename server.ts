import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

// Helper to keep token consumption as low as possible and prevent 429 quota exhaustion
function pruneAndSanitizeContents(rawContents: any[]) {
  if (!Array.isArray(rawContents) || rawContents.length === 0) {
    return [];
  }

  // Keep at most the last 4-6 conversational turns
  let trimmed = rawContents.slice(-6);

  // Gemini requires the first turn to have role 'user'
  while (trimmed.length > 0 && trimmed[0].role !== 'user') {
    trimmed.shift();
  }

  if (trimmed.length === 0) {
    trimmed = rawContents.slice(-2);
  }

  // Sanitize parts to prevent giant JSON dumps from eating up tokens
  return trimmed.map((turn: any) => {
    if (!turn || !Array.isArray(turn.parts)) return turn;

    const cleanParts = turn.parts.map((part: any) => {
      // If function response has huge data, compact it
      if (part.functionResponse?.response) {
        const resp = part.functionResponse.response;
        try {
          const serialized = JSON.stringify(resp);
          if (serialized.length > 1000) {
            // Trim arrays inside response to 3 items
            const compact: any = {};
            for (const [k, v] of Object.entries(resp)) {
              if (Array.isArray(v)) {
                compact[k] = v.slice(0, 3);
              } else if (typeof v === 'string' && v.length > 200) {
                compact[k] = v.slice(0, 200) + '...';
              } else {
                compact[k] = v;
              }
            }
            return {
              ...part,
              functionResponse: {
                ...part.functionResponse,
                response: compact,
              },
            };
          }
        } catch {
          // ignore
        }
      }

      // If user text is huge, clamp
      if (typeof part.text === 'string' && part.text.length > 2500) {
        return { ...part, text: part.text.slice(0, 2500) + '...[truncated]' };
      }

      return part;
    });

    return { ...turn, parts: cleanParts };
  });
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));

  // Gemini API Proxy
  app.post("/api/gemini/chat", async (req, res) => {
    try {
      const { contents, tools, userName, memories } = req.body || {};
      
      const rawApiKey = process.env.GEMINI_API_KEY;
      if (!rawApiKey) {
        return res.status(500).json({ error: "Gemini API key is not configured" });
      }

      const apiKey = rawApiKey.trim().replace(/^["']|["']$/g, '');

      // Prune contents to save tokens and avoid quota depletion
      const sanitizedContents = pruneAndSanitizeContents(contents);

      // Ultra-lean, token-efficient system instruction (< 100 tokens)
      let sysInstruct = `You are G-Pilot, an autonomous executive assistant for Google Workspace.
User: ${userName || 'User'}.
Role: Read context, organize schedules, read emails, manage Drive/Tasks/Meet.
Rules:
- Read actions (reading emails, searching Drive, calendar, tasks): Execute automatically.
- Destructive or external actions (sending emails, posting to chat, booking external meetings): Request confirmation first.
- Style: Concise, clear, natural conversation. No redundant symbols.
- Memory: Call memory_save if user asks you to remember a fact.`;

      if (Array.isArray(memories) && memories.length > 0) {
        const memorySnippet = memories
          .slice(-5)
          .map((m: any) => `- ${m.fact || m}`)
          .join('\n');
        sysInstruct += `\nSaved Memories:\n${memorySnippet}`;
      }

      // Failover model pool: Try multiple models if one hits 429 quota
      const CANDIDATE_MODELS = [
        "gemini-3.5-flash-lite",
        "gemini-2.5-flash",
        "gemini-3.6-flash",
      ];

      let responseText = '';
      let responseFunctionCalls: any[] | null = null;
      let rawModelParts: any[] | null = null;
      let lastError: any = null;

      // Method 1: Official @google/genai SDK
      const ai = new GoogleGenAI({ 
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      for (const model of CANDIDATE_MODELS) {
        try {
          const sdkRes: any = await ai.models.generateContent({
            model,
            contents: sanitizedContents,
            config: {
              systemInstruction: sysInstruct,
              tools: tools ? [{ functionDeclarations: tools }] : undefined,
              temperature: 0.2,
            },
          });
          if (sdkRes) {
            const candidate = sdkRes.candidates?.[0];
            const parts = candidate?.content?.parts || [];
            if (sdkRes.functionCalls && sdkRes.functionCalls.length > 0) {
              responseFunctionCalls = sdkRes.functionCalls;
              rawModelParts = parts;
            } else {
              responseText = sdkRes.text || '';
            }
            lastError = null;
            break; // Succeeded!
          }
        } catch (err: any) {
          lastError = err;
          const isQuota =
            err?.status === 429 ||
            err?.message?.includes("429") ||
            err?.message?.includes("RESOURCE_EXHAUSTED");
          console.warn(`SDK Model ${model} failed (Quota: ${isQuota}):`, err?.message || err);
          if (isQuota) {
            await new Promise((r) => setTimeout(r, 400));
            continue;
          }
        }
      }

      // Method 2: Fallback REST with x-goog-api-key header
      if (lastError && !responseText && !responseFunctionCalls) {
        for (const model of CANDIDATE_MODELS) {
          try {
            const apiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': apiKey,
              },
              body: JSON.stringify({
                contents: sanitizedContents,
                systemInstruction: { parts: [{ text: sysInstruct }] },
                tools: tools ? [{ functionDeclarations: tools }] : undefined,
                generationConfig: { temperature: 0.2 },
              })
            });

            const data = await apiRes.json();
            if (!apiRes.ok) {
              throw new Error(data?.error?.message || `HTTP ${apiRes.status}`);
            }

            const candidate = data?.candidates?.[0];
            const parts = candidate?.content?.parts || [];
            const functionCalls = parts.filter((p: any) => p.functionCall).map((p: any) => p.functionCall);
            
            if (functionCalls.length > 0) {
              responseFunctionCalls = functionCalls;
              rawModelParts = parts;
            } else {
              responseText = parts.map((p: any) => p.text || '').join('');
            }
            lastError = null;
            break;
          } catch (err: any) {
            lastError = err;
          }
        }
      }

      if (lastError && !responseText && !responseFunctionCalls) {
        throw lastError;
      }

      if (responseFunctionCalls && responseFunctionCalls.length > 0) {
        return res.json({ functionCalls: responseFunctionCalls, modelParts: rawModelParts });
      }

      return res.json({ text: responseText || "I'm G-Pilot! I can help you search emails, view calendar schedules, manage tasks, and organize Google Workspace." });
    } catch (error: any) {
      console.error("Gemini API error (handled gracefully):", error?.message || error);
      const isQuota =
        error?.message?.includes("429") ||
        error?.message?.includes("RESOURCE_EXHAUSTED") ||
        error?.message?.includes("Quota exceeded") ||
        error?.message?.includes("quota");

      const userMessage = isQuota
        ? "G-Pilot reached current rate limit. Your conversation has been pruned to save tokens. Please retry in a few seconds."
        : "G-Pilot could not process this request right now. Please try again in a moment.";

      return res.status(isQuota ? 429 : 500).json({ error: userMessage });
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
