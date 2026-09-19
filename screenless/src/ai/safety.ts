/**
 * Guards around everything a child types and everything the model says back.
 * These run before and after every call, independently of Gemini's own filters.
 */

const MAX_CHILD_INPUT = 300;
const MAX_PARENT_INPUT = 600;

/** Digit runs long enough to be a phone number or an ID. */
const LONG_DIGITS = /\d[\d\s().-]{6,}\d/;
const EMAIL = /[\w.+-]+@[\w-]+\.[\w.]{2,}/;
const URL = /(https?:\/\/|www\.)\S+|\b[\w-]+\.(com|net|org|az|tr|io|co|ru)\b/i;

/** Words that mean the conversation has moved past what a task app should handle. */
const ESCALATION_TERMS = [
  // english
  'kill myself', 'suicide', 'hurt myself', 'want to die', 'abuse', 'hits me', 'hit me',
  // turkish
  'kendimi öldür', 'intihar', 'ölmek istiyorum', 'canıma kıy', 'dövüyor', 'bana vuruyor', 'istismar',
  // azerbaijani
  'özümü öldür', 'intihar', 'ölmək istəyirəm', 'döyür', 'mənə vurur',
];

export type InputVerdict =
  | { ok: true; text: string }
  | { ok: false; reason: 'personal' | 'empty' | 'escalate' };

export function checkChildInput(raw: string): InputVerdict {
  const text = raw.trim().slice(0, MAX_CHILD_INPUT);
  if (!text) return { ok: false, reason: 'empty' };
  if (containsEscalation(text)) return { ok: false, reason: 'escalate' };
  if (LONG_DIGITS.test(text) || EMAIL.test(text) || URL.test(text)) {
    return { ok: false, reason: 'personal' };
  }
  return { ok: true, text };
}

export function checkParentInput(raw: string): InputVerdict {
  const text = raw.trim().slice(0, MAX_PARENT_INPUT);
  if (!text) return { ok: false, reason: 'empty' };
  if (EMAIL.test(text) || LONG_DIGITS.test(text)) return { ok: false, reason: 'personal' };
  return { ok: true, text };
}

export function containsEscalation(text: string): boolean {
  const lower = text.toLocaleLowerCase('tr');
  return ESCALATION_TERMS.some((term) => lower.includes(term));
}

/**
 * Last line of defence on the model's answer. A reply that leaks a link, an
 * address or a contact detail is dropped rather than shown to a child.
 */
export function isReplySafeForChild(text: string): boolean {
  if (!text.trim()) return false;
  if (URL.test(text) || EMAIL.test(text) || LONG_DIGITS.test(text)) return false;
  return true;
}

/** Trims a reply to a length a young child will actually read. */
export function clampReply(text: string, maxChars = 320): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= maxChars) return clean;
  const cut = clean.slice(0, maxChars);
  const lastStop = Math.max(cut.lastIndexOf('.'), cut.lastIndexOf('!'), cut.lastIndexOf('?'));
  return lastStop > maxChars * 0.5 ? cut.slice(0, lastStop + 1) : `${cut.trimEnd()}…`;
}
