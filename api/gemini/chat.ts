import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';

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

  // Choose the closest start point that keeps within the last 8-10 turns
  let startIndex = validStartIndices[0];
  for (const idx of validStartIndices) {
    if (validTurns.length - idx <= 8) {
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
      // Compact large function responses
      if (part.functionResponse?.response) {
        const resp = part.functionResponse.response;
        try {
          const serialized = JSON.stringify(resp);
          if (serialized.length > 1500) {
            const compact: any = {};
            for (const [k, v] of Object.entries(resp)) {
              if (Array.isArray(v)) {
                compact[k] = v.slice(0, 4);
              } else if (typeof v === 'string' && v.length > 250) {
                compact[k] = v.slice(0, 250) + '...';
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
      if (typeof part.text === 'string' && part.text.length > 3000) {
        return { ...part, text: part.text.slice(0, 3000) + '...[truncated]' };
      }

      return part;
    });

    return { ...turn, parts: cleanParts };
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { contents, tools, userName, memories, systemInstruction } = req.body || {};

    // Cost controls. Output tokens bill at ~6x the input rate, so every request gets a
    // hard cap (client-provided per flow, sane default otherwise, hard ceiling at 8192).
    const rawMaxOut = Number((req.body || {}).maxOutputTokens);
    const maxOutputTokens =
      Number.isFinite(rawMaxOut) && rawMaxOut > 0 ? Math.min(Math.round(rawMaxOut), 8192) : 2048;
    const tag =
      typeof (req.body || {}).tag === 'string' && (req.body || {}).tag
        ? (req.body || {}).tag
        : 'default';

    // Gemini 3.6+ Flash models think by default, and thought tokens bill at the OUTPUT
    // rate. G-Deck's tasks (JSON extraction, short drafts) don't need deep deliberation,
    // so cap thinking at "low" for those models. Flash-Lite is left untouched: it does
    // not accept a thinking config, and sending one would fail the primary model and
    // silently escalate every request to the more expensive fallback.
    const isThinkingFlash = (model: string) => /gemini-3\.(?:[6-9]|1[0-9])-flash\b/.test(model);

    let usedModel = '';
    let usageMeta: any = null;
    const logUsage = (model: string, um: any) => {
      if (!um) return;
      console.log(
        `[ai-usage] tag=${tag} model=${model} prompt=${um.promptTokenCount ?? '?'} output=${um.candidatesTokenCount ?? '?'} thoughts=${um.thoughtsTokenCount ?? 0} cached=${um.cachedContentTokenCount ?? 0}`
      );
    };

    const rawApiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

    if (!rawApiKey) {
      return res.status(500).json({
        error:
          'GEMINI_API_KEY is missing. Please check your environment variables.',
      });
    }

    const apiKey = rawApiKey.trim().replace(/^["']|["']$/g, '');

    // Prune contents to save tokens and prevent 429 quota exhaustion
    const sanitizedContents = pruneAndSanitizeContents(contents);

    // Callers that generate a document rather than a conversation (meeting prep pack,
    // follow-up drafter) pass their own instruction; G-Pilot's persona is deliberately not
    // applied to them, because it invites chatty preamble instead of clean output.
    let sysInstruct = systemInstruction || `You are G-Pilot, an autonomous executive assistant for Google Workspace.
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

    let responseText = '';
    let responseFunctionCalls: any[] | null = null;
    let rawModelParts: any[] | null = null;
    let lastError: any = null;

    // Modern active Gemini models (gemini-3.1-flash-lite as primary)
    const CANDIDATE_MODELS = [
      'gemini-3.1-flash-lite',
      'gemini-3.8-flash',
      'gemini-flash-latest',
    ];

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    for (const model of CANDIDATE_MODELS) {
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
            break; // Success! Exit loop
          }
        } catch (err: any) {
          lastError = err;
          const isTransient =
            err?.status === 429 ||
            err?.status === 503 ||
            err?.message?.includes('429') ||
            err?.message?.includes('503') ||
            err?.message?.includes('RESOURCE_EXHAUSTED') ||
            err?.message?.includes('high demand');

          console.warn(`Model ${model} attempt ${attempt + 1} failed (Transient: ${isTransient}):`, err?.message || err);

          if (isTransient && attempt === 0) {
            await new Promise((r) => setTimeout(r, 600));
          }
        }
      }
      if (succeeded) break;
    }

    // Method 2: REST fallback if SDK attempt did not succeed
    if (lastError && !responseText && !responseFunctionCalls) {
      for (const model of CANDIDATE_MODELS) {
        try {
          const apiRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
            {
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
              }),
            }
          );

          const data = await apiRes.json();
          if (!apiRes.ok) {
            throw new Error(data?.error?.message || `HTTP ${apiRes.status}`);
          }

          const candidate = data?.candidates?.[0];
          const parts = candidate?.content?.parts || [];
          const functionCalls = parts
            .filter((p: any) => p.functionCall)
            .map((p: any) => p.functionCall);

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

    // Token counts back to the client (harmless extra field) and into the logs above,
    // so real cost per flow is visible without digging into provider dashboards.
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

    return res.json({ text: responseText, ...(usage ? { usage } : {}) });
  } catch (error: any) {
    console.error('Gemini API Error:', error);
    const errMsg = error?.message || '';

    const isQuota =
      errMsg.includes('429') ||
      error?.status === 429 ||
      errMsg.includes('RESOURCE_EXHAUSTED') ||
      errMsg.includes('Quota exceeded');

    const userMessage = isQuota
      ? "G-Pilot reached current rate limit. Your conversation has been pruned to save tokens. Please retry in a few seconds."
      : errMsg || 'Failed to connect to Gemini API.';

    return res.status(isQuota ? 429 : 500).json({ error: userMessage });
  }
}
