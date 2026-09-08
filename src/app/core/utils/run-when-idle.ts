/**
 * Runs `task` once the page has finished loading and the main thread is idle.
 *
 * Third-party scripts (analytics, tag manager) go through this so they never
 * compete with the first paint for bandwidth or main-thread time. Browser-only:
 * callers guard with `isPlatformBrowser` before reaching for `window`.
 */
export function runWhenIdle(task: () => void, timeoutMs = 4000): void {
  const schedule = (): void => {
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(() => task(), { timeout: timeoutMs });
    } else {
      setTimeout(task, 1000);
    }
  };

  if (document.readyState === 'complete') {
    schedule();
  } else {
    window.addEventListener('load', schedule, { once: true });
  }
}
