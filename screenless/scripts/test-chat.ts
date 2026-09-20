/**
 * Drives the buddy chat under plain Node.
 *
 * Two jobs, and the first one matters more than the second.
 *
 * The first is the promise: nothing a child types in the chat leaves the
 * phone. That used to be enforced by a model's safety settings on somebody
 * else's server; now it is enforced by there being nowhere for the text to go.
 * The last section reads the chat screens' own source and fails if any of them
 * imports the network client again, because that is the one regression that
 * would be invisible in the running app — a chat that talks to Gemini looks
 * exactly like a chat that does not.
 *
 * The second is that the scripted buddy is actually good enough to replace
 * what it replaced: it answers the three starter buttons sensibly, it does not
 * repeat itself inside a conversation, and every line is filled in for all
 * three languages.
 *
 * Run with: npm run test:chat
 */
import { readFileSync } from 'node:fs';

import { allReplyLines, buddyReply, intentOf, type Intent } from '../src/chat/buddy-replies';
import { LANGUAGES, type Language } from '../src/i18n/types';
import { checkChildInput } from '../src/ai/safety';
import type { ChatMessage, ChildProfile, Mission } from '../src/state/types';

let failures = 0;
let checks = 0;

function ok(label: string, condition: boolean): void {
  checks += 1;
  if (condition) {
    console.log(`  ok    ${label}`);
  } else {
    failures += 1;
    console.log(`  FAIL  ${label}`);
  }
}

function section(title: string): void {
  console.log(`\n${title}`);
}

const profile: ChildProfile = {
  nickname: 'Test',
  ageBand: '6-9',
  interests: ['animals'],
  buddyId: 'fox',
  buddyName: 'Pako',
  createdAt: '2026-09-01T00:00:00.000Z',
};

const mission = {
  id: 'm1',
  status: 'active',
  assignedAt: '2026-09-20T09:00:00.000Z',
  task: {
    id: 't1',
    category: 'move',
    minutes: 12,
    stars: 12,
    emoji: '🏃',
    interests: ['animals'],
    ageBands: ['6-9'],
    title: { en: 'When you were small', tr: 'Sen küçükken', az: 'Sən balaca olanda' },
    body: { en: 'Ask for a story.', tr: 'Bir hikâye iste.', az: 'Bir hekayə istə.' },
    source: 'library',
  },
} as unknown as Mission;

function buddyTurns(count: number): ChatMessage[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `b${i}`,
    role: 'buddy' as const,
    text: 'x',
    at: '2026-09-20T09:00:00.000Z',
  }));
}

function reply(text: string, opts: { mission?: Mission | null; turns?: number; language?: Language } = {}) {
  return buddyReply({
    text,
    profile,
    language: opts.language ?? 'en',
    mission: opts.mission === undefined ? mission : opts.mission,
    history: buddyTurns(opts.turns ?? 0),
  });
}

/* -------------------------------------------------------------- intents */

section('reading what the child meant');
{
  const cases: [string, Intent][] = [
    // The three starter buttons, which are the most-pressed inputs in the app.
    ['What should I do today?', 'mission'],
    ['Tell me something fun', 'fun'],
    ['I am bored', 'mission'],
    // The same three in the other two languages.
    ['Ne yapayım?', 'mission'],
    ['Bana eğlenceli bir şey anlat', 'fun'],
    ['Sıkıldım', 'mission'],
    ['Nə edim?', 'mission'],
    ['Mənə maraqlı bir şey danış', 'fun'],
    ['Darıxmışam', 'mission'],
    // Everything else.
    ['hello', 'greeting'],
    ['Merhaba', 'greeting'],
    ['Salam', 'greeting'],
    ['who are you', 'aboutYou'],
    ['nasılsın', 'aboutYou'],
    ['how long is it', 'missionDetail'],
    ['kaç dakika', 'missionDetail'],
    ['I am sad', 'feelingLow'],
    ['I am so happy', 'feelingGood'],
    ['thank you', 'thanks'],
    ['teşekkürler', 'thanks'],
  ];
  for (const [text, want] of cases) {
    ok(`"${text}" reads as ${want}`, intentOf(text) === want);
  }

  // The specific bank has to beat the general one, or every question about the
  // current mission is answered with "here is a mission".
  ok('a question about the mission is not read as asking for one', intentOf('how long is this mission') === 'missionDetail');

  ok('something unmatched falls back', intentOf('purple elephant bicycle') === 'fallback');
  // The two lowercasings, one after the other. Turkish rules are needed for the
  // first and would break the second: they turn an English I into a dotless ı.
  ok('a Turkish capital İ still matches', intentOf('İyi akşamlar') === 'greeting');
  ok('an English capital I still matches', intentOf('What should I do?') === 'mission');
  ok('and so does a shouted one', intentOf('WHAT SHOULD I DO') === 'mission');
}

/* -------------------------------------------------------------- answers */

section('what it answers');
{
  ok('asking what to do names the open mission', reply('what should I do').includes('When you were small'));
  ok('and gives the minutes', reply('how long is it').includes('12'));

  const none = reply('what should I do', { mission: null });
  ok('with no mission it does not leave a hole in the sentence', !none.includes('{{'));
  ok('with no mission it sends them to pick one', /Today/i.test(none));

  ok('the buddy name is filled in', reply('who are you').includes('Pako'));
  ok('no line ever ships an unfilled placeholder', !reply('purple elephant').includes('{{'));

  // A child who taps the same starter twice should not get the same sentence,
  // which is the whole reason the pick is counted off the turn rather than fixed.
  const first = reply('tell me something fun', { turns: 0 });
  const second = reply('tell me something fun', { turns: 1 });
  const third = reply('tell me something fun', { turns: 2 });
  ok('the same question twice gives two different answers', first !== second);
  ok('and three times gives three', new Set([first, second, third]).size === 3);

  // Same inputs, same output: the reply path reaches nothing outside itself.
  ok('the same state always gives the same answer', reply('hello', { turns: 3 }) === reply('hello', { turns: 3 }));

  // A low mood must point at a person, not at a mission.
  const low = reply('I feel sad');
  ok('a sad message points at a grown up', /grown up|someone at home|home/i.test(low));
}

/* ------------------------------------------------------------ languages */

section('all three languages');
{
  const lines = allReplyLines();
  ok(`there are ${lines.length} lines in the bank`, lines.length >= 40);

  let missing = 0;
  let untranslated = 0;
  for (const line of lines) {
    for (const language of LANGUAGES) {
      if (!line[language] || !line[language].trim()) missing += 1;
    }
    // A line that is byte-identical in Turkish and English is almost always a
    // copy-paste that never got written, not a word the two languages share.
    if (line.tr === line.en || line.az === line.en) untranslated += 1;
  }
  ok('every line is filled in for tr, en and az', missing === 0);
  ok('no line was left in English in another language slot', untranslated === 0);

  for (const language of LANGUAGES) {
    const answer = buddyReply({ text: 'what should I do', profile, language, mission, history: [] });
    ok(`${language} answers in ${language}`, answer.length > 0 && !answer.includes('{{'));
  }
}

/* --------------------------------------------------------------- safety */

section('what still gets refused before any of this runs');
{
  // These never reach `buddyReply` at all: the screens check first and answer
  // from the i18n strings. Re-asserted here because the guarantee moved.
  ok('a phone number is refused', checkChildInput('call me on 0555 123 45 67').ok === false);
  ok('an email is refused', checkChildInput('my email is a@b.com').ok === false);
  ok('a link is refused', checkChildInput('go to youtube.com').ok === false);
  const escalate = checkChildInput('he hits me');
  ok('something that needs a grown up is escalated', !escalate.ok && escalate.reason === 'escalate');
}

/* ------------------------------------------------------- the whole point */

section('nothing the child types leaves the phone');
{
  const screens = [
    'src/app/(tabs)/chat.tsx',
    'src/little/screens/LittleChat.tsx',
    'src/junior/screens/JuniorChat.tsx',
    'src/teen/screens/TeenChat.tsx',
  ];

  for (const path of screens) {
    const source = readFileSync(path, 'utf8');
    ok(`${path} does not import the network client`, !/from '.*ai\/gemini'/.test(source));
    ok(`${path} does not call chatWithBuddy`, !source.includes('chatWithBuddy'));
    ok(`${path} answers from the local bank`, source.includes('thinkThenReply'));
  }

  const bank = readFileSync('src/chat/buddy-replies.ts', 'utf8');
  ok('the reply bank itself fetches nothing', !/\bfetch\s*\(|XMLHttpRequest|WebSocket/.test(bank));
  ok('and imports nothing from the ai folder', !/from '\.\.\/ai\//.test(bank));

  // `chatWithBuddy` is gone for good rather than left lying around for the
  // next person to reach for.
  const gemini = readFileSync('src/ai/gemini.ts', 'utf8');
  ok('there is no child chat function left in the ai folder', !gemini.includes('chatWithBuddy'));
  ok('and no buddy persona prompt', !readFileSync('src/ai/prompts.ts', 'utf8').includes('buddySystemPrompt'));
}

console.log(
  failures === 0
    ? `\n  the buddy keeps to itself (${checks} checks)\n`
    : `\n  ${failures} of ${checks} checks FAILED\n`,
);
process.exit(failures === 0 ? 0 : 1);
