import { useGuard } from './useGuard';

/**
 * Keeps the screen limit running wherever the child is in the app.
 *
 * Renders nothing. It exists because `useGuard` does four things that have to
 * happen all the time rather than on one screen:
 *
 *   - rolls the day over at midnight, which is what puts yesterday into the
 *     queue for the hub instead of overwriting it
 *   - banks the time spent inside ScreenLess, the one screen time figure that
 *     works on every platform
 *   - folds in what the native watcher measured while the app was closed
 *   - pushes the plan, including the day's reminders, back down
 *
 * Before this, all of it only ran while a parent had the screen time settings
 * open. A limit that is only compiled when somebody looks at the settings page
 * is not a limit, and reminders written by a hook that is not mounted are not
 * reminders.
 *
 * Safe to mount alongside the parent's own `useGuard()`: two callers share one
 * state and the plan is only pushed down when it has actually changed.
 */
export function GuardWatch() {
  useGuard();
  return null;
}
