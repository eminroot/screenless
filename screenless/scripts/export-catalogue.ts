/**
 * Writes the parent app's copy of the mission list.
 *
 * The parent app has to show a family what they are about to send, which means
 * it needs the titles. It must not need anything else: the body, the steps,
 * the tip and the parent brief all stay in the child app, because the only
 * thing that travels when a parent picks a mission is the key.
 *
 * Generated rather than copied, and checked in rather than built at install
 * time. Generated because a hand-kept second list drifts, and the first time
 * it drifts a parent sends a mission that does not exist on the phone. Checked
 * in because the parent app is a separate package that should build without
 * reaching into its sibling.
 *
 * Re-run it after adding a mission: `npm run export:catalogue`.
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

import { taskLibrary } from '../src/data/tasks';
import { LANGUAGES } from '../src/i18n/types';

const OUT = resolve(__dirname, '../../parent/src/data/catalogue.json');

type Entry = {
  id: string;
  emoji: string;
  category: string;
  minutes: number;
  stars: number;
  ageBands: string[];
  /** `duo` missions need a grown up in the room; the parent app says so. */
  duo: boolean;
  title: Record<string, string>;
};

const entries: Entry[] = taskLibrary.map((task) => ({
  id: task.id,
  emoji: task.emoji,
  category: task.category,
  minutes: task.minutes,
  stars: task.stars,
  ageBands: [...task.ageBands],
  duo: task.mode === 'duo',
  title: Object.fromEntries(LANGUAGES.map((language) => [language, task.title[language]])),
}));

entries.sort((a, b) => a.id.localeCompare(b.id));

const ids = new Set<string>();
for (const entry of entries) {
  if (ids.has(entry.id)) throw new Error(`two missions share the id ${entry.id}`);
  ids.add(entry.id);
  for (const language of LANGUAGES) {
    if (!entry.title[language]) throw new Error(`${entry.id} has no ${language} title`);
  }
}

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, `${JSON.stringify(entries, null, 2)}\n`, 'utf8');

console.log(`\n  wrote ${entries.length} missions to parent/src/data/catalogue.json\n`);
