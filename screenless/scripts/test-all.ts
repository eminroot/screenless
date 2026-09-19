/**
 * Every pure-logic suite, in one go.
 *
 * There are ten of them now and running them by hand is how one of them stops
 * being run. Each is a separate process so a crash in one does not take the
 * rest with it, and the exit code is the worst of them.
 *
 * Run with: npm run test:all
 */
import { spawnSync } from 'node:child_process';

const SUITES = [
  'test-tasks.ts',
  'test-verify.ts',
  'test-guard.ts',
  'test-nudge.ts',
  'test-sync.ts',
  'test-wardrobe.ts',
  'test-integrity.ts',
  'test-walk.ts',
  'test-social.ts',
  'test-spark.ts',
];

let failed = 0;
const lines: string[] = [];

for (const suite of SUITES) {
  const run = spawnSync(
    process.execPath,
    ['-r', 'sucrase/register', `scripts/${suite}`],
    { encoding: 'utf8' },
  );

  const output = `${run.stdout ?? ''}${run.stderr ?? ''}`.trim().split('\n');
  // The last meaningful line of each suite is its own summary.
  const summary = output.filter((line) => line.trim().length > 0).pop() ?? '(no output)';
  const ok = run.status === 0;
  if (!ok) failed += 1;

  lines.push(`  ${ok ? 'ok  ' : 'FAIL'}  ${suite.padEnd(20)} ${summary.trim()}`);

  // A failing suite is worth reading in full, right here, rather than being
  // reduced to one line and re-run by hand to find out what broke.
  if (!ok) {
    lines.push(...output.filter((line) => line.includes('FAIL')).map((line) => `        ${line.trim()}`));
  }
}

console.log(`\n${lines.join('\n')}\n`);
console.log(
  failed === 0
    ? `  all ${SUITES.length} suites pass\n`
    : `  ${failed} of ${SUITES.length} suites FAILED\n`,
);
process.exit(failed === 0 ? 0 : 1);
