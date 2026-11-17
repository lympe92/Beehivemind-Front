import { effect, inject, signal, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';

/**
 * The pages' deep links: `?add=1` (or `?add=type`, `?add=session`, …) opens
 * the page's own add dialog, as `/user/ai-chat?beehive=ID` opens the chat on
 * a hive. Read once, the parameters are taken off the URL at once (a reload
 * does not reopen the form), and the page's handler runs as soon as the data
 * it needs has loaded.
 */
export type DeepLink = Record<string, string>;

/** The first key triggers; the others only travel with it (`?add=1&apiary=4`). */
export function readDeepLink(params: ParamMap, keys: readonly string[]): DeepLink | null {
  if (!keys.length || !params.has(keys[0])) return null;
  const link: DeepLink = {};
  for (const key of keys) {
    const value = params.get(key);
    if (value !== null) link[key] = value;
  }
  return link;
}

/** What `queryParamsHandling: 'merge'` needs to drop the keys and keep every other parameter. */
export function clearedParams(keys: readonly string[]): Record<string, null> {
  return Object.fromEntries(keys.map(k => [k, null]));
}

/**
 * Call in an injection context (a field initializer). `ready` is the page's
 * "loaded" signal read; `open` is its own handler. A page already on screen
 * reacts too: the step's button can point at the page the user is on.
 */
export function onDeepLink(keys: readonly string[], ready: () => boolean, open: (link: DeepLink) => void): void {
  const route  = inject(ActivatedRoute);
  const router = inject(Router);
  const pending = signal<DeepLink | null>(null);

  route.queryParamMap.pipe(takeUntilDestroyed()).subscribe(params => {
    const link = readDeepLink(params, keys);
    if (!link) return;
    pending.set(link);
    router.navigate([], {
      relativeTo: route,
      queryParams: clearedParams(keys),
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  });

  effect(() => {
    const link = pending();
    if (!link || !ready()) return;
    untracked(() => {
      pending.set(null);
      open(link);
    });
  });
}
