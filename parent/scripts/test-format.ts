/**
 * The formatting, under plain Node.
 *
 * Everything the dashboard shows passes through `src/lib/format.ts`, and most
 * of it has an edge case that only appears on the day it matters: an hour that
 * is not there, a curfew that crosses midnight, a change of three percent that
 * should not be called progress.
 *
 * Run with: npm run test:format
 */
import {
  dayOfMonth,
  describeChange,
  formatClock,
  formatDayShort,
  formatSpan,
  niceMax,
  relativeTime,
  splitSpan,
  weekdayLong,
  weekdayOf,
  weekdayShort,
} from '../src/lib/format';

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

const MIN = 60;

section('spans');
{
  ok('under an hour is minutes', formatSpan(25 * MIN) === '25m');
  ok('a round hour drops the minutes', formatSpan(60 * MIN) === '1h');
  ok('an hour and change reads as both', formatSpan(80 * MIN) === '1h 20m');
  ok('nothing is zero minutes, not zero hours', formatSpan(0) === '0m');
  ok('a negative reading is not shown as negative', formatSpan(-500) === '0m');
  ok('seconds round to the nearest minute', formatSpan(89) === '1m');
}

section('the big number on a card');
{
  ok('minutes stay minutes', JSON.stringify(splitSpan(45 * MIN)) === '{"value":"45","unit":"m"}');
  ok('a round hour is bare', JSON.stringify(splitSpan(120 * MIN)) === '{"value":"2","unit":"h"}');
  ok('otherwise it is a clock', JSON.stringify(splitSpan(135 * MIN)) === '{"value":"2:15","unit":"h"}');
  ok('a single digit minute is padded', splitSpan(125 * MIN).value === '2:05');
}

section('the clock');
{
  ok('nine in the evening', formatClock(21 * 60) === '21:00');
  ok('midnight', formatClock(0) === '00:00');
  ok('a wrap past midnight comes back round', formatClock(1440 + 30) === '00:30');
  ok('a negative minute wraps too', formatClock(-30) === '23:30');
  ok('half past seven', formatClock(7 * 60 + 30) === '07:30');
}

section('whether a change is worth calling a change');
{
  const quiet = describeChange(3, true);
  ok('three percent is about the same', quiet?.direction === 'flat');
  ok('and is neither good nor bad', quiet?.good === null);

  const better = describeChange(-22, true);
  ok('screen time down is down', better?.direction === 'down');
  ok('and it is good', better?.good === true);
  ok('the percentage loses its sign', better?.percent === 22);

  const worse = describeChange(31, true);
  ok('screen time up is not good', worse?.good === false);

  // The same arrow means the opposite thing for active minutes.
  ok('active minutes up is good', describeChange(31, false)?.good === true);
  ok('active minutes down is not', describeChange(-31, false)?.good === false);

  ok('nothing to compare is nothing to say', describeChange(null, true) === null);
  ok('an infinity is refused', describeChange(Infinity, true) === null);
  ok('exactly five percent counts', describeChange(5, true)?.direction === 'up');
}

section('weekdays start on Monday');
{
  // 21 September 2026 is a Monday; the 19th is a Saturday.
  ok('Monday is zero', weekdayOf('2026-09-21') === 0);
  ok('Saturday is five', weekdayOf('2026-09-19') === 5);
  ok('Sunday is six', weekdayOf('2026-09-20') === 6);
  ok('English short', weekdayShort(0, 'en') === 'Mon');
  ok('Turkish short', weekdayShort(0, 'tr') === 'Pzt');
  ok('Azerbaijani long', weekdayLong(4, 'az') === 'Cümə');
  ok('an index past the week wraps', weekdayShort(7, 'en') === 'Mon');
}

section('dates');
{
  ok('a day key reads as a date', formatDayShort('2026-09-19', 'en').includes('19'));
  ok('a broken key comes back as itself', formatDayShort('not-a-date', 'en') === 'not-a-date');
  ok('the day of the month drops the padding', dayOfMonth('2026-09-05') === '5');
  ok('and keeps two digits when there are two', dayOfMonth('2026-09-19') === '19');
}

section('how long ago');
{
  const now = Date.UTC(2026, 8, 19, 12, 0, 0);
  const ago = (ms: number) => relativeTime(new Date(now - ms).toISOString(), 'en', now);
  ok('a minute ago is just now', ago(60_000) === 'just now');
  ok('twenty minutes', ago(20 * 60_000) === '20 min ago');
  ok('three hours', ago(3 * 3_600_000) === '3h ago');
  ok('yesterday', ago(26 * 3_600_000) === 'yesterday');
  ok('three days', ago(3 * 86_400_000) === '3 days ago');
  ok('two weeks', ago(14 * 86_400_000) === '2w ago');
  ok('longer than that is vague on purpose', ago(200 * 86_400_000) === 'a while ago');
  ok('nothing is null', relativeTime(null, 'en', now) === null);
  ok('a broken timestamp is null', relativeTime('yesterday-ish', 'en', now) === null);
  ok('the future does not read as negative', ago(-60_000) === 'just now');
}

section('chart axes land on round numbers');
{
  ok('rounded up to the step', niceMax([61, 42, 10], 30) === 90);
  ok('an exact multiple is left alone', niceMax([60], 30) === 60);
  ok('an empty chart still has a frame', niceMax([], 30) === 30);
  ok('all zeros still have a frame', niceMax([0, 0], 30) === 30);
}

console.log(
  failures === 0
    ? `\n  the numbers read properly (${checks} checks)\n`
    : `\n  ${failures} of ${checks} checks FAILED\n`,
);
process.exit(failures === 0 ? 0 : 1);
