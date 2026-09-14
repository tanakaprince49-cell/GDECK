import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';

// Helper to keep token consumption as low as possible
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { contents, tools, userName, memories } = req.body || {};

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

    let responseText = '';
    let responseFunctionCalls: any[] | null = null;
    let rawModelParts: any[] | null = null;
    let lastError: any = null;

    // Failover model pool: Try fastest/cheapest models first; if one hits 429 quota, fallback immediately
    const CANDIDATE_MODELS = [
      'gemini-3.5-flash-lite',
      'gemini-2.5-flash',
      'gemini-3.6-flash',
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
          break; // Success! Exit loop
        }
      } catch (err: any) {
        lastError = err;
        const isQuota =
          err?.status === 429 ||
          err?.message?.includes('429') ||
          err?.message?.includes('RESOURCE_EXHAUSTED');

        console.warn(`Model ${model} failed (Quota: ${isQuota}):`, err?.message || err);

        // If quota was exhausted on this model, continue loop to fallback model
        if (isQuota) {
          await new Promise((r) => setTimeout(r, 400));
          continue;
        } else {
          // If other error, also attempt next model
          continue;
        }
      }
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
                generationConfig: { temperature: 0.2 },
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

    return res.json({ text: responseText });
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
