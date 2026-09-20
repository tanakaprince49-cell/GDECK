/**
 * Shared helper for one-shot document generation from the same Gemini proxy that powers
 * G-Pilot. Deliberately separate from the chat client: these flows want plain text back,
 * with no function calling and no assistant persona.
 */

export interface GenerateOptions {
  /** Task instruction. When omitted, the endpoint's G-Pilot persona is used. */
  systemInstruction?: string;
  userName?: string;
  signal?: AbortSignal;
  temperature?: number;
}

export class AiDraftError extends Error {
  status: number;
  constructor(message: string, status = 500) {
    super(message);
    this.name = 'AiDraftError';
    this.status = status;
  }
}

export async function generateDraftText(prompt: string, options: GenerateOptions = {}): Promise<string> {
  const { systemInstruction, userName, signal } = options;

  let res: Response;
  try {
    res = await fetch('/api/gemini/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal,
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        // No tools: a drafter should write, not call Workspace functions.
        tools: undefined,
        userName,
        ...(systemInstruction ? { systemInstruction } : {}),
      }),
    });
  } catch (err: any) {
    if (err?.name === 'AbortError') throw err;
    throw new AiDraftError('Could not reach the AI service. Check your connection and try again.', 0);
  }

  let data: any = {};
  try {
    data = await res.json();
  } catch {
    throw new AiDraftError(
      res.status === 429 ? 'The AI is rate-limited right now. Try again in a moment.' : 'The AI service returned an unreadable response.',
      res.status
    );
  }

  if (res.status === 429) {
    throw new AiDraftError('The AI is busy handling other requests. Try again in a few seconds.', 429);
  }

  if (!res.ok || data?.error) {
    throw new AiDraftError(data?.error || `The AI service responded with status ${res.status}.`, res.status);
  }

  const text = typeof data.text === 'string' ? data.text.trim() : '';
  if (!text) {
    throw new AiDraftError('The AI returned no text. Try regenerating.', res.status);
  }
  return text;
}

/** Sums a meeting's time range into a human label the model can reason about. */
export function describeEventWindow(event: {
  summary?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
  location?: string;
  description?: string;
  attendees?: { email?: string; displayName?: string; responseStatus?: string }[];
}): string {
  const fmt = (iso?: string) => (iso ? new Date(iso).toLocaleString() : '');
  const who = (event.attendees || [])
    .map((a) => `${a.displayName || a.email || 'Unknown'}${a.responseStatus ? ` (${a.responseStatus})` : ''}`)
    .join(', ');

  return [
    `Meeting: ${event.summary || '(untitled)'}`,
    `Starts: ${fmt(event.start?.dateTime || event.start?.date) || 'unspecified'}`,
    `Ends: ${fmt(event.end?.dateTime || event.end?.date) || 'unspecified'}`,
    `Location: ${event.location || 'not specified'}`,
    `Attendees: ${who || 'none listed on the invite'}`,
    `Description on the invite:\n${(event.description || '(none)').slice(0, 1500)}`,
  ].join('\n');
}
