/**
 * The three Core Web Vitals, measured with the platform's own observers.
 *
 * A library would be more thorough (it handles bfcache restores, soft
 * navigations and every reporting edge case), but this is 60 lines, no
 * dependency and no extra bytes in the bundle, and the numbers it reports are
 * the ones Search Console grades: the largest paint, the layout shift of the
 * worst one-second window, and the slowest interaction.
 *
 * Each metric is reported once, when the page is hidden, because that is the
 * first moment any of them is final.
 */

export interface WebVital {
  name: 'LCP' | 'CLS' | 'INP';
  value: number;
  rating: 'good' | 'needs improvement' | 'poor';
}

const THRESHOLDS: Record<WebVital['name'], [number, number]> = {
  LCP: [2500, 4000],
  CLS: [0.1, 0.25],
  INP: [200, 500],
};

const rate = (name: WebVital['name'], value: number): WebVital['rating'] => {
  const [good, poor] = THRESHOLDS[name];
  return value <= good ? 'good' : value <= poor ? 'needs improvement' : 'poor';
};

interface LayoutShift extends PerformanceEntry {
  value: number;
  hadRecentInput: boolean;
}

export function reportWebVitals(report: (vital: WebVital) => void): void {
  if (typeof PerformanceObserver === 'undefined') return;

  let lcp = 0;
  let clsWorstWindow = 0;
  let clsWindow = 0;
  let windowStart = 0;
  let windowLast = 0;
  let inp = 0;

  const observe = (type: string, handle: (entries: PerformanceEntryList) => void, extra: PerformanceObserverInit = {}) => {
    try {
      new PerformanceObserver((list) => handle(list.getEntries())).observe({ type, buffered: true, ...extra });
    } catch {
      // A browser without this entry type reports nothing for it, which is
      // better than an exception on a page the visitor came to read.
    }
  };

  observe('largest-contentful-paint', (entries) => {
    lcp = entries[entries.length - 1]?.startTime ?? lcp;
  });

  // The session window Google grades: shifts less than a second apart and
  // within five seconds of each other count together; the worst window wins.
  observe('layout-shift', (entries) => {
    for (const entry of entries as LayoutShift[]) {
      if (entry.hadRecentInput) continue;
      if (clsWindow && (entry.startTime - windowLast > 1000 || entry.startTime - windowStart > 5000)) {
        clsWorstWindow = Math.max(clsWorstWindow, clsWindow);
        clsWindow = 0;
      }
      if (!clsWindow) windowStart = entry.startTime;
      windowLast = entry.startTime;
      clsWindow += entry.value;
    }
    clsWorstWindow = Math.max(clsWorstWindow, clsWindow);
  });

  observe('event', (entries) => {
    for (const entry of entries) {
      inp = Math.max(inp, entry.duration);
    }
  }, { durationThreshold: 40 } as PerformanceObserverInit);

  let reported = false;
  const finish = () => {
    if (reported || document.visibilityState !== 'hidden') return;
    reported = true;
    if (lcp) report({ name: 'LCP', value: Math.round(lcp), rating: rate('LCP', lcp) });
    report({ name: 'CLS', value: Math.round(clsWorstWindow * 1000) / 1000, rating: rate('CLS', clsWorstWindow) });
    if (inp) report({ name: 'INP', value: Math.round(inp), rating: rate('INP', inp) });
  };

  document.addEventListener('visibilitychange', finish, { capture: true });
  window.addEventListener('pagehide', finish, { capture: true });
}
