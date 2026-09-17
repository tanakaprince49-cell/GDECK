import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

function hasFunctionCall(turn: any): boolean {
  return turn?.role === 'model' && Array.isArray(turn?.parts) && turn.parts.some((p: any) => p && (p.functionCall || p.function_call));
}

function hasFunctionResponse(turn: any): boolean {
  return turn?.role === 'user' && Array.isArray(turn?.parts) && turn.parts.some((p: any) => p && (p.functionResponse || p.function_response));
}

function isRegularUserPrompt(turn: any): boolean {
  return turn?.role === 'user' && !hasFunctionResponse(turn);
}

// Helper to keep token consumption low, ensure valid multi-turn sequencing, and prevent 429 quota exhaustion
function pruneAndSanitizeContents(rawContents: any[]) {
  if (!Array.isArray(rawContents) || rawContents.length === 0) {
    return [];
  }

  // 1. Filter out malformed turns
  const validTurns = rawContents.filter((turn: any) => {
    return turn && (turn.role === 'user' || turn.role === 'model') && Array.isArray(turn.parts) && turn.parts.length > 0;
  });

  if (validTurns.length === 0) return [];

  // 2. Find valid conversation starting points (user turns with no functionResponse)
  const validStartIndices: number[] = [];
  for (let i = 0; i < validTurns.length; i++) {
    if (isRegularUserPrompt(validTurns[i])) {
      validStartIndices.push(i);
    }
  }

  if (validStartIndices.length === 0) {
    return [];
  }

  // Choose the closest start point that keeps within the last 4-6 turns (optimal token economy)
  let startIndex = validStartIndices[0];
  for (const idx of validStartIndices) {
    if (validTurns.length - idx <= 6) {
      startIndex = idx;
      break;
    }
  }

  const slice = validTurns.slice(startIndex);

  // 3. Build a strictly valid conversational chain ensuring paired function calls/responses
  const verified: any[] = [];
  for (let i = 0; i < slice.length; i++) {
    const turn = slice[i];

    if (hasFunctionResponse(turn)) {
      const prevTurn = verified[verified.length - 1];
      if (!prevTurn || !hasFunctionCall(prevTurn)) {
        // Orphaned response, omit to prevent Gemini API schema error
        continue;
      }
    }

    if (hasFunctionCall(turn)) {
      const nextTurn = slice[i + 1];
      if (!nextTurn || !hasFunctionResponse(nextTurn)) {
        // Dangling function call with no response, omit
        continue;
      }
    }

    verified.push(turn);
  }

  // Ensure first turn is still a regular user prompt
  while (verified.length > 0 && !isRegularUserPrompt(verified[0])) {
    verified.shift();
  }

  if (verified.length === 0) {
    const lastPrompt = validTurns.slice().reverse().find(isRegularUserPrompt);
    if (lastPrompt) verified.push(lastPrompt);
    else return [];
  }

  // 4. Sanitize and compact payloads to prevent token quota issues
  return verified.map((turn: any) => {
    const cleanParts = turn.parts.map((part: any) => {
      // Compact large function responses to save significant input tokens
      if (part.functionResponse?.response) {
        const resp = part.functionResponse.response;
        try {
          const serialized = JSON.stringify(resp);
          if (serialized.length > 600) {
            const compact: any = {};
            for (const [k, v] of Object.entries(resp)) {
              if (Array.isArray(v)) {
                compact[k] = v.slice(0, 3).map((item: any) => {
                  if (typeof item === 'object' && item !== null) {
                    const cleanItem: any = {};
                    for (const [ik, iv] of Object.entries(item)) {
                      if (typeof iv === 'string') {
                        cleanItem[ik] = iv.length > 120 ? iv.slice(0, 120) + '...' : iv;
                      } else {
                        cleanItem[ik] = iv;
                      }
                    }
                    return cleanItem;
                  }
                  return item;
                });
              } else if (typeof v === 'string' && v.length > 150) {
                compact[k] = v.slice(0, 150) + '...';
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

      // Compact large user text
      if (typeof part.text === 'string' && part.text.length > 2000) {
        return { ...part, text: part.text.slice(0, 2000) + '...[truncated]' };
      }

      return part;
    });

    return { ...turn, parts: cleanParts };
  });
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Security Headers Middleware
  app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    next();
  });

  // Strict request body size limit for JSON payload protection
  app.use(express.json({ limit: "2mb" }));

  // In-memory sliding rate limiter for AI endpoints (protect against abuse & denial of service)
  const ipRequestCounts = new Map<string, { count: number; resetTime: number }>();
  const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
  const RATE_LIMIT_MAX = 40; // max 40 AI queries per minute per IP

  const rateLimitMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const rawIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown";
    const clientIp = Array.isArray(rawIp) ? rawIp[0] : String(rawIp).split(",")[0].trim();
    const now = Date.now();

    const record = ipRequestCounts.get(clientIp);
    if (!record || now > record.resetTime) {
      ipRequestCounts.set(clientIp, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
      return next();
    }

    if (record.count >= RATE_LIMIT_MAX) {
      return res.status(429).json({
        error: "Too many AI requests. Please wait a moment before sending more queries.",
      });
    }

    record.count++;
    next();
  };

  // SEO & Google Search Console routes
  app.get("/sitemap.xml", (req, res) => {
    const sitemapPath = path.join(process.cwd(), "public", "sitemap.xml");
    res.header("Content-Type", "application/xml");
    res.sendFile(sitemapPath);
  });

  app.get("/robots.txt", (req, res) => {
    const robotsPath = path.join(process.cwd(), "public", "robots.txt");
    res.header("Content-Type", "text/plain");
    res.sendFile(robotsPath);
  });

  // Gemini API Proxy with rate limiting
  app.post("/api/gemini/chat", rateLimitMiddleware, async (req, res) => {
    try {
      const {
        contents,
        tools,
        userName,
        memories,
        currentDateTime,
        currentDateFormatted,
        userTimeZone,
      } = req.body || {};
      
      const rawApiKey = process.env.GEMINI_API_KEY;
      if (!rawApiKey) {
        return res.status(500).json({ error: "Gemini API key is not configured" });
      }

      const apiKey = rawApiKey.trim().replace(/^["']|["']$/g, '');

      // Prune contents to save tokens and avoid quota depletion
      const sanitizedContents = pruneAndSanitizeContents(contents);

      const effectiveDateFormatted =
        currentDateFormatted ||
        new Date().toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
      const effectiveDateTime = currentDateTime || new Date().toISOString();
      const effectiveTimeZone = userTimeZone || 'UTC';

      // Concise, high-density system instruction for token efficiency and rapid response
      let sysInstruct = `You are G-Pilot, executive AI assistant in G-Deck for Google Workspace (Gmail, Calendar, Meet, Tasks, Drive).
User: ${userName || 'User'}. Real-World Date: ${effectiveDateFormatted} (${effectiveDateTime}, ${effectiveTimeZone}).
RULES:
- Today is strictly ${effectiveDateFormatted}. Anchor all relative queries ("today", "tomorrow", "this week") to this date.
- For read requests (calendar, emails, tasks, drive files), invoke the appropriate tool immediately.
- If calendar has no events today, state clearly that none are scheduled for today (${effectiveDateFormatted}).
- Actions that send emails, book calendar events, or create tasks require human confirmation.
- Output style: Direct, concise, natural, professional. Never invent fake dates or events.`;

      if (Array.isArray(memories) && memories.length > 0) {
        const memorySnippet = memories
          .slice(-5)
          .map((m: any) => `- ${m.fact || m}`)
          .join('\n');
        sysInstruct += `\nSaved Memories:\n${memorySnippet}`;
      }

      // Modern active Gemini models with gemini-3.8-flash as primary
      const CANDIDATE_MODELS = [
        "gemini-3.8-flash",
        "gemini-flash-latest",
        "gemini-3.1-flash-lite",
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
        // Attempt with short retry for transient 503/429 spikes
        let succeeded = false;
        for (let attempt = 0; attempt < 2; attempt++) {
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
              succeeded = true;
              break; // Succeeded!
            }
          } catch (err: any) {
            lastError = err;
            const errMsg = err?.message || String(err || '');
            const isTransient =
              err?.status === 429 ||
              err?.status === 503 ||
              errMsg.includes("429") ||
              errMsg.includes("503") ||
              errMsg.includes("RESOURCE_EXHAUSTED") ||
              errMsg.includes("UNAVAILABLE") ||
              errMsg.includes("high demand");

            if (isTransient && attempt === 0) {
              await new Promise((r) => setTimeout(r, 500));
            }
          }
        }
        if (succeeded) break;
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
