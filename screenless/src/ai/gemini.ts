import type { Language } from '../i18n/types';
import type { ChatMessage, ChildProfile, Mission, TaskCategory, TaskContent } from '../state/types';
import { GEMINI_API_KEY, GEMINI_PROXY_URL, geminiEndpoint, isGeminiConfigured, REQUEST_TIMEOUT_MS } from './config';
import {
  buddySystemPrompt,
  coachSystemPrompt,
  taskGenerationPrompt,
  taskResponseSchema,
} from './prompts';
import { clampReply, isReplySafeForChild } from './safety';

export type AiFailure = 'network' | 'blocked' | 'unsafe' | 'unconfigured' | 'error';

export type AiResult<T> = { ok: true; value: T } | { ok: false; failure: AiFailure };

type GeminiPart = { text: string };
type GeminiContent = { role: 'user' | 'model'; parts: GeminiPart[] };

type GeminiRequest = {
  systemInstruction?: { parts: GeminiPart[] };
  contents: GeminiContent[];
  generationConfig?: Record<string, unknown>;
  safetySettings?: { category: string; threshold: string }[];
};

/** Strict thresholds: this content is read by children. */
const SAFETY_SETTINGS = [
  { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_LOW_AND_ABOVE' },
  { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_LOW_AND_ABOVE' },
  { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_LOW_AND_ABOVE' },
  { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_LOW_AND_ABOVE' },
];

async function callGemini(body: GeminiRequest): Promise<AiResult<string>> {
  if (!isGeminiConfigured) return { ok: false, failure: 'unconfigured' };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    // A proxy holds the key server side, so it is never attached here.
    if (!GEMINI_PROXY_URL) headers['x-goog-api-key'] = GEMINI_API_KEY;

    const response = await fetch(geminiEndpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!response.ok) {
      if (__DEV__) console.warn('[gemini] http', response.status, await response.text());
      return { ok: false, failure: response.status === 429 ? 'network' : 'error' };
    }

    const json = (await response.json()) as {
      candidates?: { content?: { parts?: GeminiPart[] }; finishReason?: string }[];
      promptFeedback?: { blockReason?: string };
    };

    if (json.promptFeedback?.blockReason) return { ok: false, failure: 'blocked' };

    const candidate = json.candidates?.[0];
    if (!candidate || candidate.finishReason === 'SAFETY') {
      return { ok: false, failure: 'blocked' };
    }

    const text = (candidate.content?.parts ?? []).map((p) => p.text ?? '').join('').trim();
    if (!text) return { ok: false, failure: 'error' };

    return { ok: true, value: text };
  } catch (error) {
    if (__DEV__) console.warn('[gemini] request failed', error);
    return { ok: false, failure: 'network' };
  } finally {
    clearTimeout(timeout);
  }
}

/** Recent turns, oldest first, capped so the request stays small and cheap. */
function toHistory(messages: ChatMessage[], limit = 8): GeminiContent[] {
  return messages.slice(-limit).map((message) => ({
    role: message.role === 'user' ? ('user' as const) : ('model' as const),
    parts: [{ text: message.text }],
  }));
}

export async function chatWithBuddy(params: {
  profile: ChildProfile;
  language: Language;
  mission: Mission | null;
  history: ChatMessage[];
  message: string;
}): Promise<AiResult<string>> {
  const result = await callGemini({
    systemInstruction: {
      parts: [{ text: buddySystemPrompt(params.profile, params.language, params.mission) }],
    },
    contents: [...toHistory(params.history), { role: 'user', parts: [{ text: params.message }] }],
    generationConfig: {
      temperature: 0.9,
      topP: 0.95,
      maxOutputTokens: 220,
      // Thinking adds seconds a child will not wait through.
      thinkingConfig: { thinkingBudget: 0 },
    },
    safetySettings: SAFETY_SETTINGS,
  });

  if (!result.ok) return result;
  if (!isReplySafeForChild(result.value)) return { ok: false, failure: 'unsafe' };
  return { ok: true, value: clampReply(result.value) };
}

export async function askParentCoach(params: {
  profile: ChildProfile | null;
  language: Language;
  history: ChatMessage[];
  question: string;
}): Promise<AiResult<string>> {
  const result = await callGemini({
    systemInstruction: {
      parts: [{ text: coachSystemPrompt(params.profile, params.language) }],
    },
    contents: [...toHistory(params.history, 6), { role: 'user', parts: [{ text: params.question }] }],
    generationConfig: {
      temperature: 0.5,
      maxOutputTokens: 500,
      thinkingConfig: { thinkingBudget: 0 },
    },
    safetySettings: SAFETY_SETTINGS,
  });

  if (!result.ok) return result;
  return { ok: true, value: clampReply(result.value, 900) };
}

const VALID_CATEGORIES: TaskCategory[] = ['move', 'outdoor', 'create', 'social', 'calm'];

/**
 * A generated mission is a bonus on top of the library, never a replacement.
 * Anything malformed, unsafe or out of range is thrown away and the caller
 * falls back to a curated task.
 */
export async function generateSurpriseTask(params: {
  profile: ChildProfile;
  language: Language;
  avoidTitles: string[];
}): Promise<AiResult<TaskContent>> {
  const result = await callGemini({
    contents: [
      {
        role: 'user',
        parts: [
          { text: taskGenerationPrompt(params.profile, params.language, params.avoidTitles) },
        ],
      },
    ],
    generationConfig: {
      temperature: 1.1,
      maxOutputTokens: 500,
      thinkingConfig: { thinkingBudget: 0 },
      responseMimeType: 'application/json',
      responseSchema: taskResponseSchema,
    },
    safetySettings: SAFETY_SETTINGS,
  });

  if (!result.ok) return result;

  try {
    const parsed = JSON.parse(result.value) as {
      title?: string;
      body?: string;
      minutes?: number;
      category?: string;
      emoji?: string;
    };

    const title = (parsed.title ?? '').trim();
    const body = (parsed.body ?? '').trim();
    if (!title || !body || title.length > 60 || body.length > 260) {
      return { ok: false, failure: 'unsafe' };
    }
    if (!isReplySafeForChild(title) || !isReplySafeForChild(body)) {
      return { ok: false, failure: 'unsafe' };
    }

    const minutes = Math.min(20, Math.max(5, Math.round(parsed.minutes ?? 10)));
    const category = VALID_CATEGORIES.includes(parsed.category as TaskCategory)
      ? (parsed.category as TaskCategory)
      : 'create';
    const emoji = (parsed.emoji ?? '✨').slice(0, 4);

    const lang = params.language;
    return {
      ok: true,
      value: {
        id: `ai-${Date.now()}`,
        category,
        minutes,
        stars: minutes,
        emoji,
        interests: params.profile.interests,
        ageBands: [params.profile.ageBand],
        // Generated in one language; the same text stands in for the others so
        // history still renders if the family switches language later.
        title: { tr: title, en: title, az: title, [lang]: title },
        body: { tr: body, en: body, az: body, [lang]: body },
        source: 'ai',
      },
    };
  } catch {
    return { ok: false, failure: 'error' };
  }
}
