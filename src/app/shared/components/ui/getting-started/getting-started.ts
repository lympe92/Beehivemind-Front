import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  Injector,
  OnInit,
  PLATFORM_ID,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { isPlatformBrowser, NgTemplateOutlet } from '@angular/common';
import { Router } from '@angular/router';
import { Dialog } from '@angular/cdk/dialog';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import { OnboardingActions } from '../../../../store/onboarding/onboarding.actions';
import {
  selectAskedTutorial,
  selectGuideListAsked,
  selectGuidePanel,
  selectLastDiagnosisLevel,
  selectOnboardingSummary,
} from '../../../../store/onboarding/onboarding.selectors';
import { selectCurrentUser } from '../../../../store/auth/auth.selectors';
import { selectAllApiaries } from '../../../../store/apiaries/apiaries.selectors';
import { AiAssistantStatusService } from '../../../../core/services/ai-assistant-status.service';
import { APP_STORE_URL, PLAY_STORE_URL } from '../../../../core/data/app-stores';
import {
  ALL_DONE_TEXT,
  ALL_DONE_TITLE,
  FORM_HINT,
  guideView,
  StepView,
  stepCount,
  TutorialId,
  TutorialView,
  UNKNOWN_DIAGNOSIS_CLOSING,
} from '../../../../core/onboarding/tutorials';

/** The layout's phone width (`--bp-md`): below it the popup is a bar along the bottom (frame 2d). */
const PHONE_QUERY = '(max-width: 767px)';
const OPEN_TUTORIAL_KEY = 'bhm_guide_tutorial';

type Mode = 'hidden' | 'hint' | 'folded' | 'all-done' | 'finished' | 'tutorial' | 'hub' | 'bar';

/**
 * The "Getting started" hub (Onboarding design, frames 2a to 2i): a popup in
 * the corner of the signed-in app, no backdrop, the page behind it usable.
 * Not a modal: nothing traps focus, Escape inside it folds it. Mounted by
 * user-layout with `@defer` only while the guide is active, so none of it is
 * paid for by anyone else. The tutorials and their state are pure
 * (core/onboarding/tutorials.ts); this component only draws them and turns
 * the buttons into navigation.
 */
@Component({
  selector: 'app-getting-started',
  standalone: true,
  imports: [NgTemplateOutlet],
  templateUrl: './getting-started.html',
  styleUrl: './getting-started.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(keydown.escape)': 'onEscape()' },
})
export class GettingStartedComponent implements OnInit {
  private store      = inject(Store);
  private router     = inject(Router);
  private dialog     = inject(Dialog);
  private injector   = inject(Injector);
  private destroyRef = inject(DestroyRef);
  private isBrowser  = isPlatformBrowser(inject(PLATFORM_ID));
  private assistant  = inject(AiAssistantStatusService);

  readonly appStoreUrl  = APP_STORE_URL;
  readonly playStoreUrl = PLAY_STORE_URL;
  readonly allDoneTitle = ALL_DONE_TITLE;
  readonly allDoneText  = ALL_DONE_TEXT;
  readonly stepCount    = stepCount;

  private readonly summary   = this.store.selectSignal(selectOnboardingSummary);
  private readonly panel     = this.store.selectSignal(selectGuidePanel);
  private readonly lastLevel = this.store.selectSignal(selectLastDiagnosisLevel);
  private readonly listAsked = this.store.selectSignal(selectGuideListAsked);
  private readonly asked     = this.store.selectSignal(selectAskedTutorial);
  private readonly user      = this.store.selectSignal(selectCurrentUser);
  private readonly apiaries  = this.store.selectSignal(selectAllApiaries);

  /** Which tutorial is open. The API stores only open/folded, so this lives in the tab. */
  readonly openId = signal<TutorialId | null>(this.readOpenTutorial());
  /** On a phone the hub is a bar with the next tutorial; "See all tutorials" opens the list. */
  readonly listOpen = signal(false);
  /** The open tutorial was asked for from a page's help: it shows even when every tutorial is done. */
  private readonly askedOpen = signal(false);
  readonly isPhone  = signal(false);
  /** A CDK dialog is open: the guide becomes one line above its backdrop (frame 2g), or steps aside. */
  readonly dialogOpen = signal(false);

  private readonly panelEl = viewChild<ElementRef<HTMLElement>>('panel');

  readonly guide = computed(() => {
    const s = this.summary();
    if (!s) return null;
    return guideView(s, {
      isEditor: this.user()?.team?.role === 'editor',
      assistant: this.assistant.enabled(),
    });
  });

  readonly open = computed<TutorialView | null>(() => {
    const id = this.openId();
    return this.guide()?.tutorials.find(t => t.def.id === id) ?? null;
  });

  /** The suggestion after the open one is finished: the hub's own, unless it is the one just done. */
  readonly next = computed(() => {
    const g = this.guide();
    if (!g) return null;
    return g.next && g.next.def.id !== this.openId() ? g.next : null;
  });

  readonly mode = computed<Mode>(() => {
    const g = this.guide();
    if (!g) return 'hidden';
    const t = this.open();

    if (this.dialogOpen()) {
      // One line only while the open tutorial's current step is the form now on screen.
      const step = t?.current;
      return t && step?.def.form && !t.blockedBy && this.panel() === 'open' ? 'hint' : 'hidden';
    }
    if (this.panel() === 'folded') return 'folded';
    // The closing card is for the moment the last tutorial is finished. Asked for
    // from the sidebar afterwards, the guide is the list, as that card promises.
    const list = g.allDone && this.listAsked() && !t;
    if (g.allDone && !list && !(t && this.askedOpen())) return 'all-done';
    if (t) return t.status === 'done' ? 'finished' : 'tutorial';
    return this.isPhone() && !this.listOpen() && !list ? 'bar' : 'hub';
  });

  readonly hint = computed(() => {
    const t = this.open();
    const step = t?.current;
    if (!t || !step) return null;
    return { step: `Step ${step.number} of ${t.total}`, text: step.def.hint ?? FORM_HINT };
  });

  /** The finished tutorial's line: an `unknown` first diagnosis has its own (brief 5.4). */
  readonly closing = computed(() => {
    const t = this.open();
    if (!t) return '';
    if (t.def.id === 'inspection' && this.lastLevel() === 'unknown') return UNKNOWN_DIAGNOSIS_CLOSING;
    return t.def.closing;
  });

  constructor() {
    if (!this.isBrowser) return;

    const media = window.matchMedia(PHONE_QUERY);
    this.isPhone.set(media.matches);
    const onChange = (e: MediaQueryListEvent) => this.isPhone.set(e.matches);
    media.addEventListener('change', onChange);
    this.destroyRef.onDestroy(() => media.removeEventListener('change', onChange));

    this.dialogOpen.set(this.dialog.openDialogs.length > 0);
    this.dialog.afterOpened.pipe(takeUntilDestroyed()).subscribe(() => this.dialogOpen.set(true));
    this.dialog.afterAllClosed.pipe(takeUntilDestroyed()).subscribe(() => this.dialogOpen.set(false));
  }

  ngOnInit(): void {
    this.store.dispatch(OnboardingActions.load());
  }

  /** A page's help asked for a tutorial (`OnboardingActions.openTutorial`): open it, also when this mounts after the request. */
  private readonly openAsked = effect(() => {
    const asked = this.asked();
    if (!asked) return;
    untracked(() => {
      this.setOpen(asked.id, true);
      this.focusPanel();
    });
  });

  /**
   * The panel's height, as `--gs-clear` on the document: the page behind adds
   * it under its content (`_app-page.scss`), so whatever the panel covers can
   * be scrolled out from under it. Gone when the panel is folded or closed.
   */
  private readonly clearance = effect(onCleanup => {
    const el = this.isBrowser ? this.panelEl()?.nativeElement : null;
    if (!el) return;
    const root = document.documentElement;
    const set = () => root.style.setProperty('--gs-clear', `${el.offsetHeight + 24}px`);
    const observer = new ResizeObserver(set);
    observer.observe(el);
    set();
    onCleanup(() => {
      observer.disconnect();
      root.style.removeProperty('--gs-clear');
    });
  });

  // ── Panel ────────────────────────────────────────────────

  fold(): void {
    this.listOpen.set(false);
    this.store.dispatch(OnboardingActions.setPanel({ panel: 'folded' }));
  }

  unfold(): void {
    this.store.dispatch(OnboardingActions.setPanel({ panel: 'open' }));
    this.focusPanel();
  }

  /** The hub's Close: the guide is dismissed, and comes back from the sidebar. With nothing left to do it is finished. */
  dismiss(): void {
    if (this.guide()?.allDone) return this.finish();
    this.store.dispatch(OnboardingActions.setState({ states: ['dismissed'] }));
  }

  /** The all-done Close (frame 2c): done, then closed, so nothing shows until it is asked for. */
  finish(): void {
    this.setOpen(null);
    this.store.dispatch(OnboardingActions.setState({ states: ['done', 'closed'] }));
  }

  onEscape(): void {
    if (['hub', 'bar', 'tutorial', 'finished', 'all-done'].includes(this.mode())) this.fold();
  }

  // ── Tutorials ────────────────────────────────────────────

  openTutorial(id: TutorialId): void {
    this.setOpen(id);
    this.focusPanel();
  }

  backToList(): void {
    this.setOpen(null);
    this.listOpen.set(true);
    this.focusPanel();
  }

  showList(): void {
    this.setOpen(null);
    this.listOpen.set(true);
    this.focusPanel();
  }

  /** A step's button: to the page where the thing lives, its form open (`?add=…`). */
  go(step: StepView): void {
    const def = step.def;
    if (def.marksSeen) this.store.dispatch(OnboardingActions.markSeen({ key: def.marksSeen }));

    const queryParams: Record<string, string | number> = { ...def.link.queryParams };
    // Beehives has no add dialog: the apiary is chosen in its filter and the count field waits.
    if (def.id === 'apiary.hive' && this.apiaries().length) queryParams['apiary'] = this.apiaries()[0].id;

    this.router.navigate([def.link.path], { queryParams });
  }

  rowLabel(t: TutorialView): string {
    if (t.status === 'done') return 'Done';
    if (t.status === 'in-progress') return `${t.doneCount} of ${t.total}`;
    return stepCount(t.total);
  }

  rowAction(t: TutorialView): string {
    return t.status === 'in-progress' ? 'Continue' : 'Start';
  }

  // ── Private ──────────────────────────────────────────────

  private setOpen(id: TutorialId | null, asked = false): void {
    this.openId.set(id);
    this.askedOpen.set(asked);
    if (!this.isBrowser) return;
    try {
      if (id) sessionStorage.setItem(OPEN_TUTORIAL_KEY, id);
      else sessionStorage.removeItem(OPEN_TUTORIAL_KEY);
    } catch {}
  }

  private readOpenTutorial(): TutorialId | null {
    if (!this.isBrowser) return null;
    try {
      return (sessionStorage.getItem(OPEN_TUTORIAL_KEY) as TutorialId | null) ?? null;
    } catch {
      return null;
    }
  }

  /** A view swap removes the button that was pressed: focus goes to the new view's heading, not to <body>. */
  private focusPanel(): void {
    afterNextRender(() => this.panelEl()?.nativeElement.focus({ preventScroll: true }), { injector: this.injector });
  }
}
