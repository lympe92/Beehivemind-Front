import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  DOCUMENT,
  effect,
  HostListener,
  inject,
  OnInit,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ActivatedRouteSnapshot, NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import { AuthActions } from '../../store/auth/auth.actions';
import { selectCurrentUser } from '../../store/auth/auth.selectors';
import { NotificationBellComponent } from '../../shared/components/ui/notification-bell/notification-bell';
import { TooltipDirective } from '../../shared/components/ui/tooltip/tooltip.directive';
import { teamName } from '../../core/models/team.model';
import { AiAssistantStatusService } from '../../core/services/ai-assistant-status.service';
import { OnboardingActions } from '../../store/onboarding/onboarding.actions';
import { selectGuideVisible } from '../../store/onboarding/onboarding.selectors';
import { GettingStartedComponent } from '../../shared/components/ui/getting-started/getting-started';
import { ModalService } from '../../core/modal/modal.service';
import type { PageHelpId } from '../../core/help/page-help';
import type { PageHelpModalData, PageHelpModalResult } from '../../shared/components/ui/modal/page-help-modal/page-help-modal';

/** Below this width the sidebar is an overlay rather than a column. */
const OVERLAY_BREAKPOINT = 992;

/**
 * The logged-in app shell: a collapsing sidebar beside a header and scrolling
 * content. Styles: styles/components/layout/user-layout.css.
 *
 * Above 992 the sidebar is a persistent column that collapses to a 64px rail.
 * Below 992 it is an overlay with a scrim: it starts closed, closes when you
 * navigate, and Escape closes it — the same contract as the public header's
 * menu. Focus is not trapped; it is navigation, not a dialog.
 */
@Component({
  selector: 'app-user-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NotificationBellComponent, TooltipDirective, GettingStartedComponent],
  templateUrl: './user-layout.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserLayoutComponent implements OnInit {
  private store = inject(Store);
  private router = inject(Router);
  private modal = inject(ModalService);
  private document = inject(DOCUMENT);
  private destroyRef = inject(DestroyRef);
  private isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  readonly user = this.store.selectSignal(selectCurrentUser);
  /** The assistant's link shows only where the API takes messages. */
  readonly assistant = inject(AiAssistantStatusService);
  readonly teamName = teamName;
  /** The "Getting started" popup is fetched (`@defer`) only once the guide is active. */
  readonly guideVisible = this.store.selectSignal(selectGuideVisible);
  /** The help entry the page on screen names in its route (`data: { help }`); null hides the button. */
  readonly helpId = signal<PageHelpId | null>(this.routeHelp());
  sidebarOpen = signal(true);
  openGroups = signal<Set<string>>(new Set());

  constructor() {
    // Selecting a destination closes the overlay — the page you navigated to
    // is behind the panel. On desktop the column stays put.
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.helpId.set(this.routeHelp());
        if (this.isOverlay()) this.sidebarOpen.set(false);
      });

    effect(() => {
      if (!this.isBrowser) return;
      const lock = this.sidebarOpen() && this.isOverlay();
      this.document.body.style.overflow = lock ? 'hidden' : '';
    });

    this.destroyRef.onDestroy(() => {
      if (this.isBrowser) this.document.body.style.overflow = '';
    });
  }

  ngOnInit(): void {
    this.assistant.load();
    // The guide's counts; a no-op when the /user guard already read them.
    this.store.dispatch(OnboardingActions.load());

    // Below 992 the sidebar is an overlay, so it must start closed.
    if (this.isOverlay()) this.sidebarOpen.set(false);

    // Auto-open the group that contains the current route
    const url = this.router.url;
    if (url.startsWith('/user/apiary'))      this.openGroup('apiaries');
    if (url.startsWith('/user/treatments'))  this.openGroup('treatments');
    if (url.startsWith('/user/todo') || url.startsWith('/user/calendar')) this.openGroup('todo');
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.isOverlay() && this.sidebarOpen()) this.sidebarOpen.set(false);
  }

  toggleSidebar(): void {
    this.sidebarOpen.update(v => !v);
  }

  closeSidebar(): void {
    this.sidebarOpen.set(false);
  }

  toggleGroup(key: string): void {
    // Opening a group from the collapsed rail expands the sidebar first.
    if (!this.sidebarOpen()) {
      this.sidebarOpen.set(true);
    }
    this.openGroups.update(s => {
      const next = new Set(s);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  isGroupOpen(key: string): boolean {
    return this.openGroups().has(key);
  }

  /** The tooltip label for a rail icon: only when the labels are hidden. */
  tip(label: string): string {
    return this.sidebarOpen() || this.isOverlay() ? '' : label;
  }

  initials(): string {
    const u = this.user();
    if (!u) return '';
    return (u.name || ' ').charAt(0) + (u.surname || ' ').charAt(0);
  }

  private openGroup(key: string): void {
    this.openGroups.update(s => new Set([...s, key]));
  }

  private isOverlay(): boolean {
    return this.isBrowser && window.innerWidth < OVERLAY_BREAKPOINT;
  }

  /** The sidebar's "Getting started": back to active and open, whatever the guide's state. */
  openGuide(): void {
    this.store.dispatch(OnboardingActions.reopen());
  }

  /**
   * "How this page works". The panel and its copy are fetched on the first
   * press, so neither is in any page's bundle; its footer button hands over
   * to the page's tutorial in the "Getting started" guide.
   */
  async openHelp(id: PageHelpId): Promise<void> {
    const [{ PageHelpModalComponent }, { pageHelp }] = await Promise.all([
      import('../../shared/components/ui/modal/page-help-modal/page-help-modal'),
      import('../../core/help/page-help'),
    ]);
    const result = await this.modal.open<PageHelpModalResult, PageHelpModalData>(PageHelpModalComponent, {
      type: 'drawer',
      data: { id },
    });
    const tutorial = pageHelp(id)?.tutorial;
    if (result === 'tutorial' && tutorial) this.store.dispatch(OnboardingActions.openTutorial({ id: tutorial }));
  }

  /** The deepest active route's `data.help`. */
  private routeHelp(): PageHelpId | null {
    let route: ActivatedRouteSnapshot = this.router.routerState.snapshot.root;
    while (route.firstChild) route = route.firstChild;
    return (route.data['help'] as PageHelpId | undefined) ?? null;
  }

  logout(): void {
    this.store.dispatch(AuthActions.logout());
  }
}
