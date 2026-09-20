import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import dotenv from "dotenv";
import { payonifyRouter } from "./src/lib/payonify-routes";

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

  // Strict request body size limit for JSON payload protection with rawBody verification support for Webhooks
  app.use(
    express.json({
      limit: "2mb",
      verify: (req: any, _res, buf) => {
        req.rawBody = buf.toString("utf8");
      },
    })
  );

  // Payonify Payment & Webhook Routes
  app.use("/api/payonify", payonifyRouter);

  // Silent Google access-token refresh (stay signed in across refresh / hour expiry)
  app.post("/api/auth/google-refresh", async (req, res) => {
    try {
      const refreshToken = req.body?.refreshToken || req.body?.refresh_token;
      if (!refreshToken || typeof refreshToken !== "string") {
        return res.status(400).json({ error: "refreshToken is required" });
      }

      let clientId =
        process.env.GOOGLE_OAUTH_CLIENT_ID ||
        process.env.VITE_GOOGLE_OAUTH_CLIENT_ID ||
        "";
      const clientSecret =
        process.env.GOOGLE_OAUTH_CLIENT_SECRET ||
        process.env.VITE_GOOGLE_OAUTH_CLIENT_SECRET ||
        "";

      if (!clientId) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          const cfg = require("./firebase-applet-config.json");
          clientId = cfg?.oAuthClientId || "";
        } catch {
          /* ignore */
        }
      }

      if (!clientId) {
        return res.status(500).json({
          error: "GOOGLE_OAUTH_CLIENT_ID is not configured",
          code: "missing_client_id",
        });
      }

      const params = new URLSearchParams({
        client_id: clientId,
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      });
      if (clientSecret) params.set("client_secret", clientSecret);

      const googleRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params,
      });
      const data: any = await googleRes.json().catch(() => ({}));
      if (!googleRes.ok || !data.access_token) {
        // Preserve Google's error code so the client only treats invalid_grant as fatal.
        const code = String(data?.error || "refresh_failed");
        const status = code === "invalid_grant" ? 400 : googleRes.status === 400 ? 400 : 502;
        return res.status(status).json({
          error: data?.error_description || data?.error || "Failed to refresh Google access token",
          code,
        });
      }
      return res.json({
        accessToken: data.access_token,
        expiresIn: Number(data.expires_in) || 3600,
        tokenType: data.token_type || "Bearer",
        scope: data.scope,
        refreshToken: data.refresh_token || undefined,
      });
    } catch (err: any) {
      console.error("[google-refresh]", err?.message || err);
      return res.status(500).json({ error: err?.message || "Refresh failed" });
    }
  });


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
        systemInstruction,
      } = req.body || {};
      
      const rawApiKey = process.env.GEMINI_API_KEY;
      if (!rawApiKey) {
        return res.status(500).json({ error: "Gemini API key is not configured" });
      }

      const apiKey = rawApiKey.trim().replace(/^["']|["']$/g, '');

      // Prune contents to save tokens and avoid quota depletion
      const sanitizedContents = pruneAndSanitizeContents(contents);

      // Cost controls (mirror of api/gemini/chat.ts). Output tokens bill at ~6x the
      // input rate, so every request gets a hard cap (client-provided per flow, sane
      // default otherwise, hard ceiling at 8192).
      const rawMaxOut = Number((req.body || {}).maxOutputTokens);
      const maxOutputTokens =
        Number.isFinite(rawMaxOut) && rawMaxOut > 0 ? Math.min(Math.round(rawMaxOut), 8192) : 2048;
      const tag =
        typeof (req.body || {}).tag === 'string' && (req.body || {}).tag
          ? (req.body || {}).tag
          : 'default';

      // Gemini 3.6+ Flash models think by default, and thought tokens bill at the OUTPUT
      // rate. Cap thinking at "low" for those models only — Flash-Lite does not accept
      // a thinking config and sending one would fail the primary model.
      const isThinkingFlash = (model: string) => /gemini-3\.(?:[6-9]|1[0-9])-flash\b/.test(model);

      let usedModel = '';
      let usageMeta: any = null;
      const logUsage = (model: string, um: any) => {
        if (!um) return;
        console.log(
          `[ai-usage] tag=${tag} model=${model} prompt=${um.promptTokenCount ?? '?'} output=${um.candidatesTokenCount ?? '?'} thoughts=${um.thoughtsTokenCount ?? 0} cached=${um.cachedContentTokenCount ?? 0}`
        );
      };

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
      let sysInstruct = systemInstruction || `You are G-Pilot, executive AI assistant in G-Deck for Google Workspace (Gmail, Calendar, Meet, Tasks, Drive).
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

      // Match production (api/gemini/chat.ts): cheapest model first. 3.8 Flash is 3x
      // the token price of Flash-Lite and only belongs in the fallback position.
      const CANDIDATE_MODELS = [
        "gemini-3.1-flash-lite",
        "gemini-3.8-flash",
        "gemini-flash-latest",
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
                maxOutputTokens,
                ...(isThinkingFlash(model) ? { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } } : {}),
              },
            });
            if (sdkRes) {
              const candidate = sdkRes.candidates?.[0];
              const parts = candidate?.content?.parts || [];
              usedModel = model;
              usageMeta = sdkRes.usageMetadata || null;
              logUsage(model, usageMeta);
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
                generationConfig: {
                  temperature: 0.2,
                  maxOutputTokens,
                  ...(isThinkingFlash(model) ? { thinkingConfig: { thinkingLevel: 'low' } } : {}),
                },
              })
            });

            const data = await apiRes.json();
            if (!apiRes.ok) {
              throw new Error(data?.error?.message || `HTTP ${apiRes.status}`);
            }

            const candidate = data?.candidates?.[0];
            const parts = candidate?.content?.parts || [];
            const functionCalls = parts.filter((p: any) => p.functionCall).map((p: any) => p.functionCall);
            usedModel = model;
            usageMeta = data.usageMetadata || null;
            logUsage(model, usageMeta);

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

      // Token counts back to the client (harmless extra field) and into the logs above.
      const usage = usageMeta
        ? {
            model: usedModel,
            promptTokens: usageMeta.promptTokenCount,
            outputTokens: usageMeta.candidatesTokenCount,
            thoughtTokens: usageMeta.thoughtsTokenCount || 0,
            cachedTokens: usageMeta.cachedContentTokenCount || 0,
          }
        : undefined;

      if (responseFunctionCalls && responseFunctionCalls.length > 0) {
        return res.json({ functionCalls: responseFunctionCalls, modelParts: rawModelParts, ...(usage ? { usage } : {}) });
      }

      return res.json({ text: responseText || "I'm G-Pilot! I can help you search emails, view calendar schedules, manage tasks, and organize Google Workspace.", ...(usage ? { usage } : {}) });
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

  // Explicit route for Privacy Policy page to ensure compliance crawlers and reviewers get immediate HTML
  app.get("/privacy.html", (req, res) => {
    const privacyPath = process.env.NODE_ENV !== "production"
      ? path.join(process.cwd(), "public", "privacy.html")
      : path.join(process.cwd(), "dist", "privacy.html");
    res.sendFile(privacyPath);
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
